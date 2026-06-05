"use client";
// Napisy (captions) — różnica vs transkrypcja: cue index, start→end, tekst, długość linii, zgodność.
import { motion } from "framer-motion";
import type { CaptionDocument, WcagReport } from "@/lib/contract";
import { msToTimecode } from "@/lib/contract";
import { Badge, type Tone } from "@/components/ui/Badge";
import { fadeUp, stagger } from "@/lib/motion";

const MAX_LINE = 42, REC_LINE = 37;

export default function CaptionsTable({ doc, report }: { doc: CaptionDocument; report: WcagReport }) {
  const byCue = new Map<string, Tone>();
  for (const it of report.issues) {
    if (!it.cue_id) continue;
    const t: Tone = it.severity === "error" ? "err" : it.severity === "warning" ? "warn" : "info";
    const cur = byCue.get(it.cue_id);
    if (cur !== "err") byCue.set(it.cue_id, t === "err" ? "err" : cur === "warn" ? "warn" : t);
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-hair/70 bg-white/80 shadow-card backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hair/70 px-5 py-3">
        <h3 className="text-sm font-medium text-graphite">Napisy (captions)</h3>
        <div className="flex gap-2 text-[11px]">
          <Badge tone="ok">zgodne</Badge><Badge tone="warn">ostrzeżenie</Badge><Badge tone="err">błąd</Badge>
        </div>
      </div>
      <div className="overflow-x-auto">
        <motion.table variants={stagger} initial="hidden" animate="show" className="w-full text-sm">
          <thead>
            <tr className="border-b border-hair/60 text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="px-5 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Start → End</th>
              <th className="px-3 py-2 font-medium">Tekst</th>
              <th className="px-3 py-2 font-medium">Linia</th>
              <th className="px-5 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {doc.cues.map((c) => {
              const maxLen = Math.max(0, ...c.lines.map((l) => l.length));
              const tone = byCue.get(c.id) ?? "ok";
              const lenColor = maxLen > MAX_LINE ? "text-err" : maxLen > REC_LINE ? "text-warn" : "text-muted";
              return (
                <motion.tr key={c.id} variants={fadeUp} className="border-b border-hair/40 align-top">
                  <td className="px-5 py-2.5 font-mono text-xs tabular-nums text-muted">{c.index}</td>
                  <td className="px-3 py-2.5 font-mono text-[11px] tabular-nums text-muted whitespace-nowrap">{msToTimecode(c.start_ms)} → {msToTimecode(c.end_ms)}</td>
                  <td className="px-3 py-2.5 text-graphite">
                    {c.kind === "sound" ? <span className="italic text-muted">{c.text}</span>
                      : c.lines.map((l, i) => <span key={i} className="block">{l}</span>)}
                  </td>
                  <td className={`px-3 py-2.5 font-mono text-xs tabular-nums ${lenColor}`}>{maxLen}</td>
                  <td className="px-5 py-2.5"><Badge tone={tone} icon={tone === "ok" ? "check" : "alert"}>{tone === "ok" ? "OK" : tone === "warn" ? "uwaga" : "błąd"}</Badge></td>
                </motion.tr>
              );
            })}
          </tbody>
        </motion.table>
      </div>
    </div>
  );
}
