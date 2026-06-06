"use client";
// Bogaty edytor napisow (offline, bez AI): mowcy (nazwa/kolor/dodaj/usun), styl (font/rozmiar/
// pozycja/tlo/limity linii), cue (tekst/czas/mowca/typ/podzial/dodaj/usun) + podglad na zywo.
// Zapis przez worker (PUT) -> normalizacja + ponowna walidacja WCAG.
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { CaptionDocument, CaptionStyle, Cue, CueKind, Speaker } from "@/lib/contract";
import { DEFAULT_STYLE, FONT_CSS, FONT_SIZE_PX, SPEAKER_CSS_COLOR, msToTimecode } from "@/lib/contract";
import { updateDocument } from "@/lib/api";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { Badge, type Tone } from "@/components/ui/Badge";
import { fadeUp } from "@/lib/motion";

type Row = { id: string; start_ms: number; end_ms: number; text: string; kind: CueKind; speaker_id: string | null };
const PALETTE = ["white", "yellow", "cyan", "green"];
const sec = (ms: number) => (ms / 1000).toFixed(1);
const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

function wrapPreview(text: string, max: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = []; let cur = "";
  for (const w of words) {
    if (!cur) cur = w;
    else if (cur.length + 1 + w.length <= max) cur += " " + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length <= maxLines) return lines;
  return [...lines.slice(0, maxLines - 1), lines.slice(maxLines - 1).join(" ")];
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
  const [speakers, setSpeakers] = useState<Speaker[]>(doc.speakers.map((s) => ({ ...s })));
  const [rows, setRows] = useState<Row[]>(doc.cues.map((c) => ({ id: c.id, start_ms: c.start_ms, end_ms: c.end_ms, text: c.text, kind: c.kind, speaker_id: c.speaker_id })));
  const [style, setStyle] = useState<CaptionStyle>(doc.style ?? DEFAULT_STYLE);
  const [sel, setSel] = useState(0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: Tone; text: string } | null>(null);

  const patch = (id: string, p: Partial<Row>) => setRows((r) => r.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const setStyleK = <K extends keyof CaptionStyle>(k: K, v: CaptionStyle[K]) => setStyle((s) => ({ ...s, [k]: v }));

  function addCue() {
    const last = rows[rows.length - 1];
    const start = last ? last.end_ms + 500 : 0;
    setRows((r) => [...r, { id: uid("e"), start_ms: start, end_ms: start + 2000, text: "Nowy napis", kind: "speech", speaker_id: speakers[0]?.id ?? null }]);
  }
  function splitCue(id: string) {
    setRows((r) => {
      const i = r.findIndex((x) => x.id === id); if (i < 0) return r;
      const c = r[i]; const mid = Math.round((c.start_ms + c.end_ms) / 2);
      const words = c.text.split(/\s+/); const h = Math.ceil(words.length / 2);
      const a = { ...c, end_ms: mid, text: words.slice(0, h).join(" ") };
      const b = { ...c, id: uid("e"), start_ms: mid, text: words.slice(h).join(" ") || "..." };
      return [...r.slice(0, i), a, b, ...r.slice(i + 1)];
    });
  }
  function addSpeaker() {
    const used = new Set(speakers.map((s) => s.color));
    const color = PALETTE.find((c) => !used.has(c)) ?? "white";
    setSpeakers((s) => [...s, { id: uid("S"), label: `Mowca ${s.length + 1}`, color }]);
  }
  function removeSpeaker(id: string) {
    setSpeakers((s) => s.filter((x) => x.id !== id));
    setRows((r) => r.map((x) => (x.speaker_id === id ? { ...x, speaker_id: null } : x)));
  }

  const preview = useMemo(() => {
    const c = rows[Math.min(sel, rows.length - 1)] ?? null;
    if (!c) return null;
    const sp = speakers.find((s) => s.id === c.speaker_id) || null;
    return { lines: wrapPreview(c.text, style.max_chars_per_line, style.max_lines), color: sp ? SPEAKER_CSS_COLOR[sp.color] ?? "#f5f5f5" : "#f5f5f5", label: c.kind === "sound" ? null : sp?.label ?? null };
  }, [rows, sel, speakers, style]);

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const next: CaptionDocument = {
        ...doc, speakers, style,
        cues: rows.map((r, i) => ({ id: r.id, index: i + 1, start_ms: Math.round(r.start_ms), end_ms: Math.round(r.end_ms), kind: r.kind, speaker_id: r.kind === "sound" ? null : r.speaker_id, text: r.text, lines: [r.text] })),
      };
      const job = await updateDocument(jobId, next);
      if (job.result) {
        onSaved(job.result);
        setRows(job.result.cues.map((c) => ({ id: c.id, start_ms: c.start_ms, end_ms: c.end_ms, text: c.text, kind: c.kind, speaker_id: c.speaker_id })));
        if (job.result.style) setStyle(job.result.style);
        const ok = job.result.wcag.compliant;
        setMsg({ tone: ok ? "ok" : "warn", text: ok ? "Zapisano. Material spelnia WCAG 2.1 AA." : `Zapisano. WCAG: ${job.result.wcag.stats.error_count} bledow, ${job.result.wcag.stats.warning_count} ostrzezen.` });
      }
    } catch (e) {
      setMsg({ tone: "err", text: e instanceof Error ? e.message : "Nie udalo sie zapisac." });
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-5">
      {/* Podglad + styl */}
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl border border-hair/70 bg-white/85 p-4 shadow-card backdrop-blur-sm">
          <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="play" size={16} /> Podglad napisow</h3>
          <div className={`relative grid h-44 overflow-hidden rounded-xl bg-graphite ${style.position === "top" ? "items-start pt-4" : "items-end pb-4"} justify-items-center`}
            style={{ backgroundImage: "linear-gradient(160deg,#1b2430,#0c1118)" }}>
            {preview && (
              <div className="px-4 text-center" style={{ fontFamily: FONT_CSS[style.font_family], fontSize: FONT_SIZE_PX[style.font_size], lineHeight: 1.35 }}>
                {preview.label && <span className="mr-1 font-semibold" style={{ color: preview.color }}>{preview.label}:</span>}
                <span className="rounded px-1.5 py-0.5" style={{ color: preview.color, background: style.background ? "rgba(0,0,0,0.72)" : "transparent" }}>
                  {preview.lines.map((l, i) => <span key={i} className="block">{l}</span>)}
                </span>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-muted">Podglad cue #{Math.min(sel + 1, rows.length)} — kliknij wiersz nizej, aby zmienic.</p>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl border border-hair/70 bg-white/85 p-4 shadow-card backdrop-blur-sm">
          <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="settings" size={16} /> Styl napisow</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <label className="flex flex-col gap-1.5 text-muted">Czcionka<Seg value={style.font_family} onChange={(v) => setStyleK("font_family", v)} options={[{ v: "sans", label: "Sans" }, { v: "serif", label: "Serif" }, { v: "mono", label: "Mono" }]} /></label>
            <label className="flex flex-col gap-1.5 text-muted">Rozmiar<Seg value={style.font_size} onChange={(v) => setStyleK("font_size", v)} options={[{ v: "sm", label: "S" }, { v: "md", label: "M" }, { v: "lg", label: "L" }]} /></label>
            <label className="flex flex-col gap-1.5 text-muted">Pozycja<Seg value={style.position} onChange={(v) => setStyleK("position", v)} options={[{ v: "bottom", label: "Dol" }, { v: "top", label: "Gora" }]} /></label>
            <label className="flex flex-col gap-1.5 text-muted">Maks. linie<Seg value={String(style.max_lines)} onChange={(v) => setStyleK("max_lines", Number(v))} options={[{ v: "1", label: "1" }, { v: "2", label: "2" }, { v: "3", label: "3" }]} /></label>
            <label className="flex items-center justify-between gap-2 text-muted">Znaki / linia
              <input type="number" min={10} max={80} value={style.max_chars_per_line} onChange={(e) => setStyleK("max_chars_per_line", Number(e.target.value) || 42)} className="focusring w-16 rounded-lg border border-hair bg-white px-2 py-1 text-xs tabular-nums" /></label>
            <label className="flex items-center justify-between gap-2 text-muted">Tlo pod tekstem
              <button type="button" onClick={() => setStyleK("background", !style.background)} className={`focusring relative h-5 w-9 rounded-full transition-colors ${style.background ? "bg-brand-600" : "bg-slate-300"}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${style.background ? "left-4" : "left-0.5"}`} /></button></label>
          </div>
        </motion.div>
      </div>

      {/* Mowcy */}
      <div className="rounded-2xl border border-hair/70 bg-white/85 p-4 shadow-card backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="users" size={16} /> Mowcy</h3>
          <Button variant="secondary" icon="users" onClick={addSpeaker}>Dodaj mowce</Button>
        </div>
        <div className="space-y-2">
          {speakers.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-hair/60 bg-white px-3 py-2">
              <input value={s.label} onChange={(e) => setSpeakers((all) => all.map((x) => (x.id === s.id ? { ...x, label: e.target.value } : x)))}
                className="focusring min-w-[140px] flex-1 rounded-lg border border-hair px-2.5 py-1.5 text-sm text-graphite" />
              <div className="flex items-center gap-1.5">
                {PALETTE.map((c) => (
                  <button key={c} type="button" aria-label={`kolor ${c}`} onClick={() => setSpeakers((all) => all.map((x) => (x.id === s.id ? { ...x, color: c } : x)))}
                    className={`h-6 w-6 rounded-full ring-2 ${s.color === c ? "ring-brand-600" : "ring-transparent"}`} style={{ background: SPEAKER_CSS_COLOR[c], border: "1px solid #ccc" }} />
                ))}
              </div>
              <button onClick={() => removeSpeaker(s.id)} aria-label="Usun mowce" className="focusring rounded-lg p-1.5 text-muted hover:bg-err/10 hover:text-err"><Icon name="trash" size={16} /></button>
            </div>
          ))}
          {speakers.length === 0 && <p className="text-xs text-muted">Brak mowcow. Dodaj, aby przypisac wypowiedzi.</p>}
        </div>
      </div>

      {/* Cue */}
      <div className="rounded-2xl border border-hair/70 bg-white/85 shadow-card backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hair/70 px-4 py-3">
          <h3 className="inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="captions" size={16} /> Napisy ({rows.length})</h3>
          <div className="flex items-center gap-3">
            {msg && <span className={`text-xs ${msg.tone === "ok" ? "text-ok" : msg.tone === "err" ? "text-err" : "text-warn"}`}>{msg.text}</span>}
            <Button variant="secondary" icon="captions" onClick={addCue}>Dodaj napis</Button>
            <Button onClick={save} loading={saving} icon="check">Zapisz</Button>
          </div>
        </div>
        <ul className="divide-y divide-hair/40">
          {rows.map((r, i) => (
            <li key={r.id} onClick={() => setSel(i)} className={`cursor-pointer px-4 py-3 ${sel === i ? "bg-brand-50/50" : "hover:bg-slate-50/60"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-12 shrink-0 font-mono text-[11px] tabular-nums text-muted">{msToTimecode(r.start_ms)}</span>
                <input value={r.text} onClick={(e) => e.stopPropagation()} onChange={(e) => patch(r.id, { text: e.target.value })}
                  className={`focusring min-w-[180px] flex-1 rounded-lg border border-hair bg-white px-2.5 py-1.5 text-sm text-graphite ${r.kind === "sound" ? "italic text-muted" : ""}`} />
                <button onClick={(e) => { e.stopPropagation(); splitCue(r.id); }} aria-label="Podziel" title="Podziel napis" className="focusring rounded-lg p-1.5 text-muted hover:bg-brand-50 hover:text-brand-700"><Icon name="chevron" size={16} /></button>
                <button onClick={(e) => { e.stopPropagation(); setRows((all) => all.filter((x) => x.id !== r.id)); }} aria-label="Usun" className="focusring rounded-lg p-1.5 text-muted hover:bg-err/10 hover:text-err"><Icon name="trash" size={16} /></button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 pl-14 text-[11px] text-muted" onClick={(e) => e.stopPropagation()}>
                <label className="flex items-center gap-1">start<input type="number" step={0.1} value={sec(r.start_ms)} onChange={(e) => patch(r.id, { start_ms: parseFloat(e.target.value || "0") * 1000 })} className="focusring w-16 rounded border border-hair px-1.5 py-0.5 tabular-nums" /></label>
                <label className="flex items-center gap-1">end<input type="number" step={0.1} value={sec(r.end_ms)} onChange={(e) => patch(r.id, { end_ms: parseFloat(e.target.value || "0") * 1000 })} className="focusring w-16 rounded border border-hair px-1.5 py-0.5 tabular-nums" /></label>
                <Seg value={r.kind} onChange={(v) => patch(r.id, { kind: v })} options={[{ v: "speech" as CueKind, label: "Mowa" }, { v: "sound" as CueKind, label: "Dzwiek" }]} />
                {r.kind === "speech" && (
                  <select value={r.speaker_id ?? ""} onChange={(e) => patch(r.id, { speaker_id: e.target.value || null })}
                    className="focusring rounded-lg border border-hair bg-white px-2 py-1 text-[11px] text-graphite">
                    <option value="">(bez mowcy)</option>
                    {speakers.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                )}
              </div>
            </li>
          ))}
        </ul>
        <p className="border-t border-hair/40 px-4 py-2.5 text-xs text-muted">Po zapisie worker prze-zawija linie wg stylu i ponownie liczy raport WCAG. <Badge tone="info">offline</Badge></p>
      </div>
    </div>
  );
}
