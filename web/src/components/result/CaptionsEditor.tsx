"use client";
// Edytor napisów (offline, bez AI): edycja tekstu i czasu cue, usuwanie, zapis do workera.
// Po zapisie worker normalizuje linie i PONOWNIE waliduje WCAG — wynik wraca tu od razu.
import { useState } from "react";
import { motion } from "framer-motion";
import type { CaptionDocument, Cue } from "@/lib/contract";
import { msToTimecode } from "@/lib/contract";
import { updateDocument } from "@/lib/api";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import { Badge, type Tone } from "@/components/ui/Badge";
import { fadeUp, stagger } from "@/lib/motion";

type Row = Pick<Cue, "id" | "start_ms" | "end_ms" | "text" | "kind" | "speaker_id">;
const sec = (ms: number) => (ms / 1000).toFixed(1);

export default function CaptionsEditor({ jobId, doc, onSaved }: { jobId: string; doc: CaptionDocument; onSaved: (d: CaptionDocument) => void }) {
  const [rows, setRows] = useState<Row[]>(doc.cues.map((c) => ({ id: c.id, start_ms: c.start_ms, end_ms: c.end_ms, text: c.text, kind: c.kind, speaker_id: c.speaker_id })));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tone: Tone; text: string } | null>(null);

  const patch = (id: string, p: Partial<Row>) => setRows((r) => r.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const remove = (id: string) => setRows((r) => r.filter((x) => x.id !== id));

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const next: CaptionDocument = {
        ...doc,
        cues: rows.map((r, i) => ({
          id: r.id, index: i + 1, start_ms: Math.round(r.start_ms), end_ms: Math.round(r.end_ms),
          kind: r.kind, speaker_id: r.speaker_id, text: r.text, lines: [r.text],
        })),
      };
      const job = await updateDocument(jobId, next);
      if (job.result) {
        onSaved(job.result);
        setRows(job.result.cues.map((c) => ({ id: c.id, start_ms: c.start_ms, end_ms: c.end_ms, text: c.text, kind: c.kind, speaker_id: c.speaker_id })));
        const ok = job.result.wcag.compliant;
        setMsg({ tone: ok ? "ok" : "warn", text: ok ? "Zapisano. Materiał spełnia WCAG 2.1 AA." : `Zapisano. WCAG: ${job.result.wcag.stats.error_count} błędów, ${job.result.wcag.stats.warning_count} ostrzeżeń.` });
      }
    } catch (e) {
      setMsg({ tone: "err", text: e instanceof Error ? e.message : "Nie udało się zapisać." });
    } finally { setSaving(false); }
  }

  return (
    <div className="rounded-2xl border border-hair/70 bg-white/85 shadow-card backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hair/70 px-5 py-3">
        <h3 className="inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="captions" size={16} /> Edytor napisów</h3>
        <div className="flex items-center gap-3">
          {msg && <span className={`text-xs ${msg.tone === "ok" ? "text-ok" : msg.tone === "err" ? "text-err" : "text-warn"}`}>{msg.text}</span>}
          <Button onClick={save} loading={saving} icon="check">Zapisz zmiany</Button>
        </div>
      </div>
      <motion.ul variants={stagger} initial="hidden" animate="show" className="divide-y divide-hair/40">
        {rows.map((r) => (
          <motion.li key={r.id} variants={fadeUp} className="flex flex-wrap items-center gap-3 px-5 py-3">
            <span className="w-14 shrink-0 font-mono text-[11px] tabular-nums text-muted">{msToTimecode(r.start_ms)}</span>
            <input value={r.text} onChange={(e) => patch(r.id, { text: e.target.value })}
              className={`focusring min-w-[200px] flex-1 rounded-lg border border-hair bg-white px-3 py-2 text-sm text-graphite ${r.kind === "sound" ? "italic text-muted" : ""}`} />
            <label className="flex items-center gap-1 text-[11px] text-muted">start
              <input type="number" step={0.1} value={sec(r.start_ms)} onChange={(e) => patch(r.id, { start_ms: parseFloat(e.target.value || "0") * 1000 })}
                className="focusring w-16 rounded-lg border border-hair bg-white px-2 py-1 text-xs tabular-nums" /></label>
            <label className="flex items-center gap-1 text-[11px] text-muted">end
              <input type="number" step={0.1} value={sec(r.end_ms)} onChange={(e) => patch(r.id, { end_ms: parseFloat(e.target.value || "0") * 1000 })}
                className="focusring w-16 rounded-lg border border-hair bg-white px-2 py-1 text-xs tabular-nums" /></label>
            <button onClick={() => remove(r.id)} aria-label="Usuń napis" className="focusring rounded-lg p-1.5 text-muted hover:bg-err/10 hover:text-err"><Icon name="x" size={16} /></button>
          </motion.li>
        ))}
      </motion.ul>
      <p className="border-t border-hair/40 px-5 py-2.5 text-xs text-muted">Po zapisie worker prze-zawija linie (≤2, limit znaków) i ponownie liczy raport WCAG.</p>
    </div>
  );
}
