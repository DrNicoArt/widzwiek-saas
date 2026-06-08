"use client";
// Audyt biblioteki: wrzuć wiele plików napisów (SRT/VTT) naraz albo wklej — jeden werdykt
// dla całej organizacji + ranking najczęstszych naruszeń. Wszystko klientowo, bez API.
import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { auditCaptions, summarize, type AuditItem } from "@/lib/audit";
import PageHeader from "@/components/shell/PageHeader";
import Button from "@/components/ui/Button";
import { Badge, type Tone } from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import { fadeUp, stagger, inView } from "@/lib/motion";

const scoreTone = (s: number): Tone => (s >= 80 ? "ok" : s >= 60 ? "warn" : "err");

export default function AudytBiblioteki() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: Tone; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const sum = useMemo(() => summarize(items), [items]);
  const add = (next: AuditItem[]) => setItems((cur) => [...cur, ...next]);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setNote(null);
    const next: AuditItem[] = [];
    for (const f of Array.from(files)) {
      try { next.push(auditCaptions(await f.text(), f.name)); }
      catch { setNote({ tone: "warn", text: `Pominięto „${f.name}" — nie rozpoznano jako SRT/VTT.` }); }
    }
    add(next); setBusy(false);
    if (next.length) setNote({ tone: "ok", text: `Dodano ${next.length} materiał(y) do skanowania.` });
  }

  function onPaste() {
    if (!paste.trim()) return;
    try { add([auditCaptions(paste, `Wklejone napisy ${items.length + 1}`)]); setPaste(""); setNote({ tone: "ok", text: "Dodano wklejone napisy." }); }
    catch { setNote({ tone: "err", text: "Nie rozpoznano wklejonej treści jako SRT/VTT." }); }
  }

  async function onUrl() {
    const u = url.trim();
    if (!u) return;
    setBusy(true); setNote(null);
    try {
      const res = await fetch(u);
      if (!res.ok) throw new Error(String(res.status));
      const name = u.split("/").pop() || "napisy-z-url";
      add([auditCaptions(await res.text(), name)]); setUrl("");
      setNote({ tone: "ok", text: "Pobrano i dodano napisy z adresu." });
    } catch {
      setNote({ tone: "warn", text: "Nie udało się pobrać z tego adresu (działają bezpośrednie linki do plików .srt/.vtt z dozwolonym CORS). Pobieranie z całych kanałów/bibliotek robi hostowany worker — tu wrzuć pliki albo wklej napisy." });
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader icon="search" title="Skaner WCAG" desc="Sprawdź wiele materiałów naraz i otrzymaj jeden werdykt zgodności WCAG dla całej organizacji — z rankingiem najczęstszych problemów." />

      {/* Wsad */}
      <motion.div initial="hidden" animate="show" variants={fadeUp} className="mb-6 rounded-2xl border border-hair/70 bg-white/85 p-5 shadow-card backdrop-blur-sm">
        <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-hair bg-brand-50/30 p-6 text-center">
            <span className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name="upload" size={22} /></span>
            <p className="text-sm font-medium text-graphite">Przeciągnij wiele plików SRT / VTT</p>
            <p className="mt-0.5 text-xs text-muted">albo wybierz je z dysku — skaner policzy całą bibliotekę naraz</p>
            <Button variant="secondary" icon="folder" className="mt-3" onClick={() => fileRef.current?.click()}>Wybierz pliki</Button>
            <input ref={fileRef} type="file" accept=".srt,.vtt" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">Wklej napisy</label>
              <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={3} placeholder="1&#10;00:00:01,000 --> 00:00:04,000&#10;Treść napisu…" className="focusring w-full rounded-lg border border-hair bg-white px-3 py-2 text-xs text-graphite" />
              <Button variant="secondary" icon="captions" className="mt-2" onClick={onPaste}>Dodaj wklejone</Button>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">Adres pliku napisów (.srt / .vtt)</label>
              <div className="flex gap-2">
                <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/napisy.vtt" className="focusring min-w-0 flex-1 rounded-lg border border-hair bg-white px-3 py-2 text-xs text-graphite" />
                <Button variant="secondary" icon="download" loading={busy} onClick={onUrl}>Pobierz</Button>
              </div>
            </div>
          </div>
        </div>
        {note && <p className={`mt-3 text-xs ${note.tone === "ok" ? "text-ok" : note.tone === "err" ? "text-err" : "text-warn"}`}>{note.text}</p>}
      </motion.div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-hair/70 bg-white/80 p-8 text-center text-sm text-muted shadow-card">
          Dodaj materiały powyżej, aby zobaczyć jeden werdykt zgodności dla całej biblioteki.
        </div>
      ) : (
        <motion.div initial="hidden" whileInView="show" viewport={inView} variants={stagger} className="space-y-5">
          {/* Werdykt organizacji */}
          <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-4">
            {[
              { label: "Materiały", value: sum.total, tone: "info" as Tone },
              { label: "Zgodne z WCAG", value: `${sum.compliant}/${sum.total}`, tone: sum.compliant === sum.total ? "ok" as Tone : "warn" as Tone },
              { label: "Średni wynik", value: `${sum.avgScore}%`, tone: scoreTone(sum.avgScore) },
              { label: "Problemy", value: `${sum.totalErrors} bł. · ${sum.totalWarnings} ostrz.`, tone: sum.totalErrors ? "err" as Tone : "ok" as Tone },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-hair/70 bg-white/85 p-4 shadow-card">
                <div className="text-xs text-muted">{s.label}</div>
                <div className={`mt-1 text-2xl font-medium ${s.tone === "err" ? "text-err" : s.tone === "warn" ? "text-warn" : s.tone === "ok" ? "text-ok" : "text-graphite"}`}>{s.value}</div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className={`flex items-center gap-3 rounded-2xl border p-4 ${sum.pctCompliant === 100 ? "border-ok/30 bg-ok/5" : "border-warn/30 bg-warn/5"}`}>
            <span className={`grid h-10 w-10 place-items-center rounded-lg ${sum.pctCompliant === 100 ? "bg-ok/10 text-ok" : "bg-warn/10 text-warn"}`}><Icon name={sum.pctCompliant === 100 ? "checkCircle" : "alert"} size={20} /></span>
            <p className="text-sm text-graphite">
              {sum.pctCompliant === 100
                ? "Cała biblioteka spełnia WCAG 2.1 AA — gotowa do publikacji jako dostępna cyfrowo."
                : `${sum.pctCompliant}% biblioteki jest gotowe. ${sum.total - sum.compliant} materiał(y) wymaga(ją) poprawek — najczęstsze przyczyny poniżej.`}
            </p>
          </motion.div>

          {/* Ranking najczęstszych naruszeń — wgląd poziomu organizacji */}
          {sum.byCode.length > 0 && (
            <motion.div variants={fadeUp} className="rounded-2xl border border-hair/70 bg-white/85 p-5 shadow-card">
              <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="wave" size={17} className="text-brand-600" /> Najczęstsze problemy w bibliotece</h3>
              <ul className="space-y-2">
                {sum.byCode.slice(0, 8).map((c) => (
                  <li key={c.code} className="flex items-center gap-3 text-sm">
                    <span className="flex-1 text-graphite">{c.label}</span>
                    <span className="text-xs text-muted">w {c.materials} z {sum.total} materiałów</span>
                    <span className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-brand-500" style={{ width: `${Math.round((c.materials / sum.total) * 100)}%` }} /></span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Materiały */}
          <motion.div variants={fadeUp} className="rounded-2xl border border-hair/70 bg-white/85 shadow-card">
            <div className="border-b border-hair/70 px-5 py-3 text-sm font-medium text-graphite">Materiały ({items.length})</div>
            <ul className="divide-y divide-hair/40">
              {items.map((it) => (
                <li key={it.id} className="px-5 py-3">
                  <button onClick={() => setOpen(open === it.id ? null : it.id)} className="flex w-full items-center gap-3 text-left">
                    <Badge tone={scoreTone(it.score)}>{it.score}%</Badge>
                    <span className="min-w-0 flex-1 truncate text-sm text-graphite">{it.name}</span>
                    <span className="shrink-0 text-xs text-muted">{it.errors} bł. · {it.warnings} ostrz.</span>
                    <Badge tone={it.compliant ? "ok" : "warn"}>{it.compliant ? "spełnia" : "do poprawy"}</Badge>
                    <Icon name="chevron" size={16} className={`shrink-0 text-muted transition-transform ${open === it.id ? "rotate-90" : ""}`} />
                  </button>
                  {open === it.id && (
                    <ul className="mt-2 space-y-1 pl-1">
                      {it.issues.length === 0 ? <li className="text-xs text-ok">Brak problemów.</li> :
                        it.issues.slice(0, 10).map((is, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${is.severity === "error" ? "bg-err" : is.severity === "warning" ? "bg-warn" : "bg-brand-400"}`} />
                            <span className="text-muted">{is.message}</span>
                          </li>
                        ))}
                      {it.issues.length > 10 && <li className="text-xs text-muted">…i {it.issues.length - 10} więcej.</li>}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <p className="border-t border-hair/40 px-5 py-2.5 text-xs text-muted">Każdy materiał poprawisz w edytorze przyciskiem „Napraw wszystko”. <Badge tone="info">offline · bez API</Badge></p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
