"use client";
// Edytor napisow prowadzony przez WCAG (offline): sticky pasek akcji + status zapisu, panel Problemow
// z linkami do cue, nawigacja aktywnego cue, presety stylu, mowcy (pelna paleta + kontrast),
// dzwieki (wykryte vs do dodania), styl per-slowo, undo/redo. Zapis -> worker normalizuje + waliduje.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { CaptionDocument, CaptionStyle, CueKind, Speaker } from "@/lib/contract";
import { DEFAULT_STYLE, FONTS, SIZE_PRESETS, fontCss, contrastRatio, msToTimecode } from "@/lib/contract";
import { updateDocument, IS_STATIC_DEMO } from "@/lib/api";
import { autoFix } from "@/lib/autofix";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { Badge, type Tone } from "@/components/ui/Badge";
import { fadeUp } from "@/lib/motion";

type Tok = { text: string; color?: string | null; bold?: boolean };
type Row = { id: string; start_ms: number; end_ms: number; text: string; kind: CueKind; speaker_id: string | null; tokens?: Tok[] };

const NAMED_HEX: Record<string, string> = { white: "#f5f5f5", yellow: "#ffd400", cyan: "#22d3ee", green: "#4ade80" };
const PRESETS = ["#f5f5f5", "#ffd400", "#22d3ee", "#4ade80", "#ff8a5b", "#ff5d6c", "#c084fc", "#60a5fa"];
const SOUNDS = ["[muzyka]", "[wesoła muzyka]", "[muzyka dramatyczna]", "[oklaski]", "[brawa]", "[śmiech]", "[płacz]", "[pukanie do drzwi]", "[otwieranie drzwi]", "[kroki]", "[telefon dzwoni]", "[szczekanie psa]", "[wybuch]", "[wiatr]", "[deszcz]", "[cisza]", "[szum tłumu]"];
const STYLE_PRESETS: { key: string; label: string; style: CaptionStyle }[] = [
  { key: "wcag", label: "WCAG czytelny", style: { font_family: "atkinson", font_size: 22, position: "bottom", background: true, max_chars_per_line: 42, max_lines: 2 } },
  { key: "kino", label: "Kinowy", style: { font_family: "arial", font_size: 26, position: "bottom", background: false, max_chars_per_line: 40, max_lines: 2 } },
  { key: "min", label: "Minimalny", style: { font_family: "system", font_size: 18, position: "bottom", background: false, max_chars_per_line: 42, max_lines: 2 } },
];

const MAX_CPS = 21, MIN_DUR = 1000, MAX_DUR = 7000, MIN_GAP = 1500;
const sec = (ms: number) => (ms / 1000).toFixed(1);
const cpsOf = (text: string, ms: number) => (ms > 0 ? text.replace(/\s/g, "").length / (ms / 1000) : 0);
const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
const toHex = (c: string) => (NAMED_HEX[c] ?? (c?.startsWith("#") ? c : "#f5f5f5"));
const sameStyle = (a: CaptionStyle, b: CaptionStyle) => a.font_family === b.font_family && a.font_size === b.font_size && a.position === b.position && a.background === b.background && a.max_chars_per_line === b.max_chars_per_line && a.max_lines === b.max_lines;

function wrapPreview(text: string, max: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = []; let cur = "";
  for (const w of words) { if (!cur) cur = w; else if (cur.length + 1 + w.length <= max) cur += " " + w; else { lines.push(cur); cur = w; } }
  if (cur) lines.push(cur);
  if (lines.length <= maxLines) return lines;
  return [...lines.slice(0, maxLines - 1), lines.slice(maxLines - 1).join(" ")];
}
function contrastBadge(hex: string): { tone: Tone; label: string } {
  const r = contrastRatio(hex, "#000000");
  if (r >= 4.5) return { tone: "ok", label: `kontrast ${r}:1` };
  if (r >= 3) return { tone: "warn", label: `kontrast ${r}:1 (duży tekst)` };
  return { tone: "err", label: `kontrast ${r}:1 — za niski` };
}
function Seg<T extends string>({ value, options, onChange }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-hair p-0.5">
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)}
          className={`focusring rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${value === o.v ? "bg-brand-600 text-white" : "text-graphite hover:bg-brand-50"}`}>{o.label}</button>
      ))}
    </div>
  );
}

export default function CaptionsEditor({ jobId, doc, onSaved }: { jobId: string; doc: CaptionDocument; onSaved: (d: CaptionDocument) => void }) {
  const [speakers, setSpeakers] = useState<Speaker[]>(doc.speakers.map((s) => ({ ...s, color: toHex(s.color) })));
  const [rows, setRows] = useState<Row[]>(doc.cues.map((c) => ({ id: c.id, start_ms: c.start_ms, end_ms: c.end_ms, text: c.text, kind: c.kind, speaker_id: c.speaker_id, tokens: c.tokens ?? undefined })));
  const [style, setStyle] = useState<CaptionStyle>(doc.style ?? DEFAULT_STYLE);
  const [issues, setIssues] = useState(doc.wcag?.issues ?? []);
  const [sel, setSel] = useState(0);
  const [activeWord, setActiveWord] = useState(0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: Tone; text: string } | null>(null);

  type Snap = { speakers: Speaker[]; rows: Row[]; style: CaptionStyle };
  const [past, setPast] = useState<Snap[]>([]);
  const [future, setFuture] = useState<Snap[]>([]);

  const stateKey = useMemo(() => JSON.stringify({ speakers, rows, style }), [speakers, rows, style]);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  useEffect(() => {
    setSavedKey(JSON.stringify({ speakers, rows, style }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const dirty = savedKey !== null && savedKey !== stateKey;

  // FLUSH przy wyjsciu z edytora: jesli sa niezapisane zmiany, zapisz je do localStorage zanim
  // komponent zniknie (np. powrot do Studia). Statyczna galaz updateDocument jest synchroniczna
  // wewnetrznie (finalizeDoc + zapis LS), wiec write wykona sie przed odmontowaniem.
  const flushRef = useRef<() => void>(() => {});
  flushRef.current = () => {
    if (!IS_STATIC_DEMO) return;
    if (savedKey === null || savedKey === stateKey) return;
    try {
      const next: CaptionDocument = {
        ...doc, speakers, style,
        cues: rows.map((r, i) => { const speech = r.kind === "speech"; const text = r.tokens && r.tokens.length ? r.tokens.map((tk) => tk.text).join(" ") : r.text; return { id: r.id, index: i + 1, start_ms: Math.round(r.start_ms), end_ms: Math.round(r.end_ms), kind: r.kind, speaker_id: speech ? r.speaker_id : null, text, lines: [text], tokens: speech ? r.tokens ?? undefined : undefined }; }),
      };
      void updateDocument(jobId, next);
    } catch { /* flush best-effort */ }
  };
  useEffect(() => () => { flushRef.current(); }, []);

  const current = rows[Math.min(sel, rows.length - 1)] ?? null;
  const issueByCue = useMemo(() => {
    const m = new Map<string, "err" | "warn">();
    for (const it of issues) { if (!it.cue_id) continue; const t: "err" | "warn" = it.severity === "error" ? "err" : "warn"; if (m.get(it.cue_id) !== "err") m.set(it.cue_id, t === "err" ? "err" : m.get(it.cue_id) || t); }
    return m;
  }, [issues]);
  const errCount = issues.filter((i) => i.severity === "error").length;
  const warnCount = issues.filter((i) => i.severity === "warning").length;
  const activePreset = STYLE_PRESETS.find((p) => sameStyle(p.style, style))?.key ?? "custom";
  const soundRows = rows.filter((r) => r.kind === "sound");

  const patch = (id: string, p: Partial<Row>) => setRows((r) => r.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const setStyleK = <K extends keyof CaptionStyle>(k: K, v: CaptionStyle[K]) => setStyle((s) => ({ ...s, [k]: v }));

  const snapshot = useCallback(() => { setPast((p) => [...p.slice(-60), { speakers, rows, style }]); setFuture([]); }, [speakers, rows, style]);
  const undo = useCallback(() => { setPast((p) => { if (!p.length) return p; const prev = p[p.length - 1]; setFuture((fz) => [{ speakers, rows, style }, ...fz].slice(0, 60)); setSpeakers(prev.speakers); setRows(prev.rows); setStyle(prev.style); return p.slice(0, -1); }); }, [speakers, rows, style]);
  const redo = useCallback(() => { setFuture((fz) => { if (!fz.length) return fz; const nx = fz[0]; setPast((p) => [...p, { speakers, rows, style }].slice(-60)); setSpeakers(nx.speakers); setRows(nx.rows); setStyle(nx.style); return fz.slice(1); }); }, [speakers, rows, style]);

  function jumpToCue(cueId?: string | null) { if (!cueId) return; const i = rows.findIndex((r) => r.id === cueId); if (i >= 0) { setSel(i); setActiveWord(0); } }
  function addCue() { snapshot(); const last = rows[rows.length - 1]; const start = last ? last.end_ms + 500 : 0; setRows((r) => [...r, { id: uid("e"), start_ms: start, end_ms: start + 2000, text: "Nowy napis", kind: "speech", speaker_id: speakers[0]?.id ?? null }]); }
  function addSound(label: string) { snapshot(); const last = rows[rows.length - 1]; const start = last ? last.end_ms + 300 : 0; setRows((r) => [...r, { id: uid("e"), start_ms: start, end_ms: start + 1500, text: label, kind: "sound", speaker_id: null }]); }
  function splitCue(id: string) { snapshot(); setRows((r) => { const i = r.findIndex((x) => x.id === id); if (i < 0) return r; const c = r[i]; const mid = Math.round((c.start_ms + c.end_ms) / 2); const w = c.text.split(/\s+/); const h = Math.ceil(w.length / 2); return [...r.slice(0, i), { ...c, end_ms: mid, text: w.slice(0, h).join(" "), tokens: undefined }, { ...c, id: uid("e"), start_ms: mid, text: w.slice(h).join(" ") || "...", tokens: undefined }, ...r.slice(i + 1)]; }); }
  function mergeWithNext(id: string) { snapshot(); setRows((r) => { const i = r.findIndex((x) => x.id === id); if (i < 0 || i >= r.length - 1) return r; const a = r[i], b = r[i + 1]; return [...r.slice(0, i), { ...a, end_ms: Math.max(a.end_ms, b.end_ms), text: `${a.text} ${b.text}`.trim(), tokens: undefined }, ...r.slice(i + 2)]; }); }
  function removeRow(id: string) { snapshot(); setRows((all) => all.filter((x) => x.id !== id)); }
  function autofixTiming() {
    snapshot();
    setRows((r) => { const sorted = [...r].sort((a, b) => a.start_ms - b.start_ms); let prevEnd = -Infinity; return sorted.map((c) => { let start = c.start_ms; let end = c.end_ms; if (start < prevEnd) start = prevEnd; if (end - start < MIN_DUR) end = start + MIN_DUR; prevEnd = end + MIN_GAP; return { ...c, start_ms: start, end_ms: end }; }); });
  }
  function addSpeaker() { snapshot(); setSpeakers((s) => [...s, { id: uid("S"), label: `Mówca ${s.length + 1}`, color: PRESETS[s.length % PRESETS.length] }]); }
  function removeSpeaker(id: string) { snapshot(); setSpeakers((s) => s.filter((x) => x.id !== id)); setRows((r) => r.map((x) => (x.speaker_id === id ? { ...x, speaker_id: null } : x))); }
  function mergeSpeaker(fromId: string, toId: string) { if (!toId || fromId === toId) return; snapshot(); setRows((r) => r.map((x) => (x.speaker_id === fromId ? { ...x, speaker_id: toId } : x))); setSpeakers((s) => s.filter((x) => x.id !== fromId)); }
  function applyPreset(p: CaptionStyle) { snapshot(); setStyle({ ...p }); }

  const tokensOf = (r: Row): Tok[] => (r.tokens && r.tokens.length ? r.tokens : r.text.split(/\s+/).filter(Boolean).map((t) => ({ text: t })));
  function setWord(idx: number, p: Partial<Tok>) { if (!current) return; const toks = tokensOf(current).map((t, i) => (i === idx ? { ...t, ...p } : t)); patch(current.id, { tokens: toks, text: toks.map((t) => t.text).join(" ") }); }

  const preview = useMemo(() => {
    if (!current) return null;
    const sp = speakers.find((s) => s.id === current.speaker_id) || null;
    const base = current.kind === "sound" ? "#e5e7eb" : sp ? sp.color : "#f5f5f5";
    return { toks: tokensOf(current), base, label: current.kind === "sound" ? null : sp?.label ?? null, sound: current.kind === "sound" };
  }, [current, speakers]);

  const save = useCallback(async () => {
    setSaving(true); setMsg(null);
    try {
      const nstyle = style;
      const next: CaptionDocument = {
        ...doc, speakers, style: nstyle,
        cues: rows.map((r, i) => { const speech = r.kind === "speech"; const text = r.tokens && r.tokens.length ? r.tokens.map((t) => t.text).join(" ") : r.text; return { id: r.id, index: i + 1, start_ms: Math.round(r.start_ms), end_ms: Math.round(r.end_ms), kind: r.kind, speaker_id: speech ? r.speaker_id : null, text, lines: [text], tokens: speech ? r.tokens ?? undefined : undefined }; }),
      };
      const job = await updateDocument(jobId, next);
      if (job.result) {
        onSaved(job.result);
        const nrows = job.result.cues.map((c) => ({ id: c.id, start_ms: c.start_ms, end_ms: c.end_ms, text: c.text, kind: c.kind, speaker_id: c.speaker_id, tokens: c.tokens ?? undefined }));
        const rstyle = job.result.style ?? nstyle;
        setRows(nrows); setStyle(rstyle); setIssues(job.result.wcag?.issues ?? []);
        setSavedKey(JSON.stringify({ speakers, rows: nrows, style: rstyle }));
        const ok = job.result.wcag.compliant;
        setMsg({ tone: ok ? "ok" : "warn", text: ok ? "Zapisano. Materiał spełnia WCAG 2.1 AA." : `Zapisano. ${job.result.wcag.stats.error_count} błędów, ${job.result.wcag.stats.warning_count} ostrzeżeń.` });
      }
    } catch (e) { setMsg({ tone: "err", text: e instanceof Error ? e.message : "Nie udało się zapisać." }); }
    finally { setSaving(false); }
  }, [doc, jobId, onSaved, rows, speakers, style]);

  // Autozapis (tryb demo): edycje trafiaja do localStorage ~0.9 s po zmianie, bez klikania
  // przycisku. Dzieki temu wyjscie z projektu nie gubi poprawek transkrypcji.
  useEffect(() => {
    if (!IS_STATIC_DEMO) return;
    if (savedKey === null || savedKey === stateKey) return; // brak niezapisanych zmian
    const t = setTimeout(async () => {
      try {
        const next: CaptionDocument = {
          ...doc, speakers, style,
          cues: rows.map((r, i) => { const speech = r.kind === "speech"; const text = r.tokens && r.tokens.length ? r.tokens.map((tk) => tk.text).join(" ") : r.text; return { id: r.id, index: i + 1, start_ms: Math.round(r.start_ms), end_ms: Math.round(r.end_ms), kind: r.kind, speaker_id: speech ? r.speaker_id : null, text, lines: [text], tokens: speech ? r.tokens ?? undefined : undefined }; }),
        };
        await updateDocument(jobId, next);
        setSavedKey(stateKey);
        setMsg({ tone: "ok", text: "Zapisano automatycznie (w tej przeglądarce)." });
      } catch { /* cichy autozapis */ }
    }, 900);
    return () => clearTimeout(t);
  }, [stateKey, savedKey, doc, jobId, rows, speakers, style]);

  const fixAll = useCallback(async () => {
    snapshot();
    setSaving(true); setMsg(null);
    try {
      const base: CaptionDocument = {
        ...doc, speakers, style,
        cues: rows.map((r, i) => { const speech = r.kind === "speech"; const text = r.tokens && r.tokens.length ? r.tokens.map((t) => t.text).join(" ") : r.text; return { id: r.id, index: i + 1, start_ms: Math.round(r.start_ms), end_ms: Math.round(r.end_ms), kind: r.kind, speaker_id: speech ? r.speaker_id : null, text, lines: [text], tokens: speech ? r.tokens ?? undefined : undefined }; }),
      };
      const { doc: fixedDoc, report } = autoFix(base);
      const job = await updateDocument(jobId, fixedDoc);
      if (job.result) {
        onSaved(job.result);
        const nrows = job.result.cues.map((c) => ({ id: c.id, start_ms: c.start_ms, end_ms: c.end_ms, text: c.text, kind: c.kind, speaker_id: c.speaker_id, tokens: c.tokens ?? undefined }));
        const rstyle = job.result.style ?? style;
        setRows(nrows); setStyle(rstyle); setIssues(job.result.wcag?.issues ?? []);
        setSavedKey(JSON.stringify({ speakers, rows: nrows, style: rstyle }));
        const ok = job.result.wcag.compliant;
        setMsg({ tone: ok ? "ok" : "warn", text: `Naprawiono automatycznie: ${report.timing} czasów, ${report.condensed} skróconych linii, zawijanie wg stylu. ${ok ? "Materiał spełnia WCAG 2.1 AA." : `Zostało ${job.result.wcag.stats.error_count} bł. / ${job.result.wcag.stats.warning_count} ostrz. do podpisu człowieka.`}` });
      }
    } catch (e) { setMsg({ tone: "err", text: e instanceof Error ? e.message : "Nie udało się naprawić." }); }
    finally { setSaving(false); }
  }, [doc, jobId, onSaved, rows, speakers, style, snapshot]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "s") { e.preventDefault(); save(); }
      else if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((k === "z" && e.shiftKey) || k === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save, undo, redo]);

  return (
    <div className="space-y-5">
      {/* Sticky pasek akcji */}
      <div className="sticky top-2 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-hair/70 bg-white/85 px-3 py-2 shadow-card backdrop-blur-md">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${dirty ? "text-warn" : "text-muted"}`}>
          <span className={`h-2 w-2 rounded-full ${dirty ? "bg-warn" : "bg-ok"}`} /> {dirty ? "Niezapisane zmiany" : "Zapisano"}
        </span>
        {msg && <span className={`text-xs ${msg.tone === "ok" ? "text-ok" : msg.tone === "err" ? "text-err" : "text-warn"}`}>{msg.text}</span>}
        <div className="ml-auto flex items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-lg border border-hair">
            <button onClick={undo} disabled={!past.length} aria-label="Cofnij (Ctrl+Z)" title="Cofnij (Ctrl+Z)" className="focusring px-2 py-1.5 text-graphite hover:bg-slate-50 disabled:opacity-40"><Icon name="refresh" size={15} className="-scale-x-100" /></button>
            <button onClick={redo} disabled={!future.length} aria-label="Ponów (Ctrl+Y)" title="Ponów (Ctrl+Y)" className="focusring border-l border-hair px-2 py-1.5 text-graphite hover:bg-slate-50 disabled:opacity-40"><Icon name="refresh" size={15} /></button>
          </div>
          <Button variant="secondary" icon="clock" onClick={autofixTiming}>Auto-popraw timing</Button>
          <Button onClick={fixAll} loading={saving} icon="sparkles" title="Naprawia timing, zawijanie i tempo czytania jednym kliknięciem">Napraw wszystko</Button>
          <Button variant="secondary" onClick={save} loading={saving} icon="check">Zapisz zmiany</Button>
        </div>
      </div>

      {/* Podglad + nawigacja, Styl */}
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl border border-hair/70 bg-white/85 p-4 shadow-card backdrop-blur-sm">
          <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="play" size={16} /> Podgląd</h3>
          <div className={`relative grid h-44 overflow-hidden rounded-xl ${style.position === "top" ? "items-start pt-4" : "items-end pb-4"} justify-items-center`} style={{ backgroundImage: "linear-gradient(160deg,#1b2430,#0c1118)" }}>
            {preview && (
              <div className="px-4 text-center" style={{ fontFamily: fontCss(style.font_family), fontSize: style.font_size, lineHeight: 1.35 }}>
                {preview.label && <span className="mr-1 font-semibold" style={{ color: preview.base }}>{preview.label}:</span>}
                <span className="rounded px-1.5 py-0.5" style={{ background: style.background ? "rgba(0,0,0,0.72)" : "transparent" }}>
                  {preview.toks.map((t, i) => <span key={i} style={{ color: t.color || preview.base, fontWeight: t.bold ? 700 : 400, fontStyle: preview.sound ? "italic" : "normal" }}>{t.text}{i < preview.toks.length - 1 ? " " : ""}</span>)}
                </span>
              </div>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted">
            <span>{current ? `Cue ${Math.min(sel + 1, rows.length)} / ${rows.length} · ${msToTimecode(current.start_ms)}–${msToTimecode(current.end_ms)}` : "Brak napisów"}</span>
            <span className="flex items-center gap-1">
              <button onClick={() => setSel((i) => Math.max(0, i - 1))} disabled={sel <= 0} className="focusring rounded-md border border-hair px-2 py-1 hover:bg-slate-50 disabled:opacity-40">Poprzedni</button>
              <button onClick={() => setSel((i) => Math.min(rows.length - 1, i + 1))} disabled={sel >= rows.length - 1} className="focusring rounded-md border border-hair px-2 py-1 hover:bg-slate-50 disabled:opacity-40">Następny</button>
            </span>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl border border-hair/70 bg-white/85 p-4 shadow-card backdrop-blur-sm">
          <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="settings" size={16} /> Styl napisów</h3>
          <div className="mb-3">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">Preset</p>
            <div className="flex flex-wrap gap-1.5">
              {STYLE_PRESETS.map((p) => (
                <button key={p.key} type="button" onClick={() => applyPreset(p.style)} className={`focusring rounded-full border px-3 py-1 text-xs font-medium transition-colors ${activePreset === p.key ? "border-brand-500 bg-brand-50 text-brand-700" : "border-hair text-graphite hover:bg-slate-50"}`}>{p.label}</button>
              ))}
              {activePreset === "custom" && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-muted">Własny</span>}
            </div>
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-muted hover:text-graphite">Ustawienia zaawansowane</summary>
            <div className="mt-3 space-y-3">
              <label className="flex items-center justify-between gap-2 text-muted">Czcionka
                <select value={style.font_family} onChange={(e) => setStyleK("font_family", e.target.value)} className="focusring rounded-lg border border-hair bg-white px-2 py-1.5 text-xs text-graphite">
                  {FONTS.map((f) => <option key={f.key} value={f.key}>{f.label}{f.legible ? " • czytelny" : ""}</option>)}
                </select>
              </label>
              <label className="flex items-center justify-between gap-2 text-muted">Rozmiar (px)
                <span className="flex items-center gap-2">
                  <select value={SIZE_PRESETS.includes(style.font_size) ? style.font_size : 0} onChange={(e) => Number(e.target.value) && setStyleK("font_size", Number(e.target.value))} className="focusring rounded-lg border border-hair bg-white px-2 py-1.5 text-xs">
                    {SIZE_PRESETS.map((n) => <option key={n} value={n}>{n}</option>)}
                    {!SIZE_PRESETS.includes(style.font_size) && <option value={0}>{style.font_size} (własny)</option>}
                  </select>
                  <input type="number" min={10} max={64} value={style.font_size} onChange={(e) => setStyleK("font_size", Math.min(64, Math.max(10, Number(e.target.value) || 20)))} className="focusring w-14 rounded-lg border border-hair bg-white px-2 py-1.5 text-xs tabular-nums" />
                </span>
              </label>
              <div className="flex items-center justify-between gap-2 text-muted">Pozycja<Seg value={style.position} onChange={(v) => setStyleK("position", v)} options={[{ v: "bottom", label: "Dół" }, { v: "top", label: "Góra" }]} /></div>
              <div className="flex items-center justify-between gap-2 text-muted">Maks. linie<Seg value={String(style.max_lines)} onChange={(v) => setStyleK("max_lines", Number(v))} options={[{ v: "1", label: "1" }, { v: "2", label: "2" }, { v: "3", label: "3" }]} /></div>
              <label className="flex items-center justify-between gap-2 text-muted">Znaki / linia (zalecane ≤42)
                <input type="number" min={10} max={80} value={style.max_chars_per_line} onChange={(e) => setStyleK("max_chars_per_line", Number(e.target.value) || 42)} className="focusring w-16 rounded-lg border border-hair bg-white px-2 py-1 text-xs tabular-nums" /></label>
              <label className="flex items-center justify-between gap-2 text-muted">Tło pod tekstem
                <button type="button" onClick={() => setStyleK("background", !style.background)} className={`focusring relative h-5 w-9 rounded-full transition-colors ${style.background ? "bg-brand-600" : "bg-slate-300"}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${style.background ? "left-4" : "left-0.5"}`} /></button></label>
            </div>
          </details>
        </motion.div>
      </div>

      {/* Problemy WCAG */}
      <div className="rounded-2xl border border-hair/70 bg-white/85 p-4 shadow-card backdrop-blur-sm">
        <h3 className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-graphite">
          <Icon name="shield" size={16} /> Problemy WCAG
          <Badge tone={errCount ? "err" : warnCount ? "warn" : "ok"}>{errCount} bł. · {warnCount} ostrz.</Badge>
        </h3>
        {issues.length === 0 ? (
          <p className="text-xs text-muted">Brak problemów po ostatnim zapisie. Edytuj i kliknij „Zapisz zmiany”, aby przeliczyć.</p>
        ) : (
          <ul className="space-y-1.5">
            {issues.slice(0, 12).map((it, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${it.severity === "error" ? "bg-err" : it.severity === "warning" ? "bg-warn" : "bg-brand-400"}`} />
                <span className="flex-1 text-graphite">{it.message}</span>
                {it.cue_id && <button onClick={() => jumpToCue(it.cue_id)} className="focusring shrink-0 rounded-md border border-hair px-2 py-0.5 text-xs text-brand-700 hover:bg-brand-50">przejdź</button>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Styl per-slowo */}
      {current && current.kind === "speech" && (
        <div className="rounded-2xl border border-hair/70 bg-white/85 p-4 shadow-card backdrop-blur-sm">
          <h3 className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="sparkles" size={16} /> Styl słów (cue #{Math.min(sel + 1, rows.length)})</h3>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {tokensOf(current).map((t, i) => (
              <button key={i} type="button" onClick={() => setActiveWord(i)} className={`rounded-md border px-2 py-1 text-sm transition-colors ${activeWord === i ? "border-brand-500 bg-brand-50" : "border-hair bg-white hover:bg-slate-50"}`} style={{ color: t.color || undefined, fontWeight: t.bold ? 700 : 400 }}>{t.text}</button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            <label className="flex items-center gap-2">Kolor słowa<input type="color" value={tokensOf(current)[activeWord]?.color || "#f5f5f5"} onChange={(e) => setWord(activeWord, { color: e.target.value })} className="h-7 w-10 cursor-pointer rounded border border-hair" /></label>
            <button type="button" onClick={() => setWord(activeWord, { bold: !tokensOf(current)[activeWord]?.bold })} className={`focusring rounded-lg border px-2.5 py-1 font-bold ${tokensOf(current)[activeWord]?.bold ? "border-brand-500 bg-brand-50 text-brand-700" : "border-hair text-graphite"}`}>B</button>
            <button type="button" onClick={() => setWord(activeWord, { color: null, bold: false })} className="focusring rounded-lg border border-hair px-2.5 py-1 text-graphite hover:bg-slate-50">Wyczyść słowo</button>
          </div>
        </div>
      )}

      {/* Mowcy */}
      <div className="rounded-2xl border border-hair/70 bg-white/85 p-4 shadow-card backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="users" size={16} /> Mówcy</h3>
          <Button variant="secondary" icon="users" onClick={addSpeaker}>Dodaj mówcę</Button>
        </div>
        <div className="space-y-2">
          {speakers.map((s) => {
            const cb = contrastBadge(s.color);
            return (
              <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-hair/60 bg-white px-3 py-2">
                <input value={s.label} onChange={(e) => setSpeakers((all) => all.map((x) => (x.id === s.id ? { ...x, label: e.target.value } : x)))} className="focusring min-w-[130px] flex-1 rounded-lg border border-hair px-2.5 py-1.5 text-sm text-graphite" />
                <input type="color" value={toHex(s.color)} onChange={(e) => setSpeakers((all) => all.map((x) => (x.id === s.id ? { ...x, color: e.target.value } : x)))} aria-label="Kolor mówcy" title="Kolor mówcy" className="h-8 w-9 cursor-pointer rounded border border-hair" />
                <div className="hidden items-center gap-1 sm:flex">
                  {PRESETS.slice(0, 6).map((c) => <button key={c} type="button" aria-label={`kolor ${c}`} onClick={() => setSpeakers((all) => all.map((x) => (x.id === s.id ? { ...x, color: c } : x)))} className={`h-5 w-5 rounded-full ring-2 ${toHex(s.color) === c ? "ring-brand-600" : "ring-transparent"}`} style={{ background: c, border: "1px solid #ccc" }} />)}
                </div>
                <Badge tone={cb.tone} icon={cb.tone === "ok" ? "check" : "alert"}>{cb.label}</Badge>
                {speakers.length > 1 && (
                  <select defaultValue="" onChange={(e) => { mergeSpeaker(s.id, e.target.value); e.currentTarget.value = ""; }} aria-label="Scal w innego mówcę" title="Scal w innego mówcę" className="focusring rounded-lg border border-hair bg-white px-2 py-1 text-[11px] text-muted">
                    <option value="">scal w…</option>
                    {speakers.filter((x) => x.id !== s.id).map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                  </select>
                )}
                <button onClick={() => removeSpeaker(s.id)} aria-label="Usuń mówcę" className="focusring rounded-lg p-1.5 text-muted hover:bg-err/10 hover:text-err"><Icon name="trash" size={16} /></button>
              </div>
            );
          })}
          {speakers.length === 0 && <p className="text-xs text-muted">Brak mówców. Dodaj, aby przypisać wypowiedzi.</p>}
        </div>
        <p className="mt-2 text-xs text-muted">Kolory mówców są sprawdzane pod kątem kontrastu — niski kontrast utrudnia odbiór osobom niedowidzącym. <span className="text-muted/70">(WCAG 1.4.3, min. 4.5:1)</span></p>
      </div>

      {/* Dzwieki: wykryte vs do dodania */}
      <div className="rounded-2xl border border-hair/70 bg-white/85 p-4 shadow-card backdrop-blur-sm">
        <h3 className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="wave" size={16} /> Opisy dźwięków (WCAG 1.2.2)</h3>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Wykryte w materiale ({soundRows.length})</p>
        {soundRows.length ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {soundRows.map((r) => {
              const i = rows.findIndex((x) => x.id === r.id);
              return <button key={r.id} onClick={() => setSel(i)} className="focusring inline-flex items-center gap-1.5 rounded-full border border-hair bg-white px-2.5 py-1 text-xs italic text-muted hover:border-brand-300 hover:bg-brand-50">{r.text} <span className="not-italic tabular-nums text-muted/70">{msToTimecode(r.start_ms)}</span></button>;
            })}
          </div>
        ) : <p className="mb-3 text-xs text-muted">Brak opisów dźwięków w materiale.</p>}
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Szybkie do dodania</p>
        <div className="flex flex-wrap gap-1.5">
          {SOUNDS.map((s) => <button key={s} type="button" onClick={() => addSound(s)} className="focusring rounded-full border border-hair bg-white px-2.5 py-1 text-xs italic text-muted hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">{s}</button>)}
        </div>
      </div>

      {/* Cue */}
      <div className="rounded-2xl border border-hair/70 bg-white/85 shadow-card backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hair/70 px-4 py-3">
          <h3 className="inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="captions" size={16} /> Wypowiedzi i napisy ({rows.length})</h3>
          <Button variant="secondary" icon="captions" onClick={addCue}>Dodaj napis</Button>
        </div>
        <ul className="divide-y divide-hair/40">
          {rows.map((r, i) => (
            <li key={r.id} onClick={() => { setSel(i); setActiveWord(0); }} className={`cursor-pointer px-4 py-3 ${sel === i ? "bg-brand-50/50" : "hover:bg-slate-50/60"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${issueByCue.get(r.id) === "err" ? "bg-err" : issueByCue.get(r.id) === "warn" ? "bg-warn" : "bg-ok/60"}`} title={issueByCue.get(r.id) ? "Ten napis ma uwagi WCAG (po ostatnim zapisie)" : "OK po ostatnim zapisie"} />
                <span className="w-12 shrink-0 font-mono text-[11px] tabular-nums text-muted">{msToTimecode(r.start_ms)}</span>
                <input value={r.text} onClick={(e) => e.stopPropagation()} onChange={(e) => patch(r.id, { text: e.target.value, tokens: undefined })} className={`focusring min-w-[180px] flex-1 rounded-lg border border-hair bg-white px-2.5 py-1.5 text-sm text-graphite ${r.kind === "sound" ? "italic text-muted" : ""}`} />
                <button onClick={(e) => { e.stopPropagation(); splitCue(r.id); }} aria-label="Podziel" title="Podziel napis" className="focusring rounded-lg p-1.5 text-muted hover:bg-brand-50 hover:text-brand-700"><Icon name="chevron" size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); mergeWithNext(r.id); }} aria-label="Scal z następnym" title="Scal z następnym" className="focusring rounded-lg p-1.5 text-muted hover:bg-brand-50 hover:text-brand-700"><Icon name="check" size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); removeRow(r.id); }} aria-label="Usuń" className="focusring rounded-lg p-1.5 text-muted hover:bg-err/10 hover:text-err"><Icon name="trash" size={16} /></button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 pl-16 text-[11px] text-muted" onClick={(e) => e.stopPropagation()}>
                <label className="flex items-center gap-1">start<input type="number" step={0.1} value={sec(r.start_ms)} onChange={(e) => patch(r.id, { start_ms: parseFloat(e.target.value || "0") * 1000 })} className="focusring w-16 rounded border border-hair px-1.5 py-0.5 tabular-nums" /></label>
                <label className="flex items-center gap-1">end<input type="number" step={0.1} value={sec(r.end_ms)} onChange={(e) => patch(r.id, { end_ms: parseFloat(e.target.value || "0") * 1000 })} className="focusring w-16 rounded border border-hair px-1.5 py-0.5 tabular-nums" /></label>
                <Seg value={r.kind} onChange={(v) => patch(r.id, { kind: v })} options={[{ v: "speech" as CueKind, label: "Mowa" }, { v: "sound" as CueKind, label: "Dźwięk" }]} />
                {r.kind === "speech" && (
                  <select value={r.speaker_id ?? ""} onChange={(e) => patch(r.id, { speaker_id: e.target.value || null })} className="focusring rounded-lg border border-hair bg-white px-2 py-1 text-[11px] text-graphite">
                    <option value="">(bez mówcy)</option>
                    {speakers.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                )}
                {(() => {
                  const dur = r.end_ms - r.start_ms; const cps = r.kind === "speech" ? cpsOf(r.text, dur) : 0;
                  const durTone = dur < MIN_DUR ? "text-err" : dur > MAX_DUR ? "text-warn" : "text-muted";
                  const cpsTone = cps > MAX_CPS ? "text-err" : cps > MAX_CPS * 0.85 ? "text-warn" : "text-muted";
                  return (<span className="ml-auto flex items-center gap-3 font-mono tabular-nums"><span className={durTone} title="czas wyświetlania">{(dur / 1000).toFixed(1)}s</span>{r.kind === "speech" && <span className={cpsTone} title="tempo czytania (zn/s, zalecane ≤21)">{cps.toFixed(0)} zn/s</span>}</span>);
                })()}
              </div>
            </li>
          ))}
        </ul>
        <p className="border-t border-hair/40 px-4 py-2.5 text-xs text-muted">Po zapisie worker prze-zawija linie wg stylu i ponownie liczy raport WCAG. <Badge tone="info">offline</Badge></p>
      </div>
    </div>
  );
}
