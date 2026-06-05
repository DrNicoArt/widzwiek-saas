"use client";
// Napisy (captions) — różnica vs transkrypcja: cue index, start→end, tekst, długość linii, zgodność.
// Legenda działa jako FILTR (OK / uwaga / błąd) z licznikami.
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { CaptionDocument, WcagReport } from "@/lib/contract";
import { msToTimecode } from "@/lib/contract";
import { Badge, type Tone } from "@/components/ui/Badge";
import { fadeUp, stagger } from "@/lib/motion";

const MAX_LINE = 42, REC_LINE = 37;
type Filter = "all" | "ok" | "warn" | "err";

export default function CaptionsTable({ doc, report }: { doc: CaptionDocument; report: WcagReport }) {
  const byCue = useMemo(() => {
    const m = new Map<string, Tone>();
    for (const it of report.issues) {
      if (!it.cue_id) continue;
      const t: Tone = it.severity === "error" ? "err" : it.severity === "warning" ? "warn" : "info";
      const cur = m.get(it.cue_id);
      if (cur !== "err") m.set(it.cue_id, t === "err" ? "err" : cur === "warn" ? "warn" : t);
    }
    return m;
  }, [report]);

  const toneOf = (id: string): Tone => byCue.get(id) ?? "ok";
  const counts = useMemo(() => {
    const c = { ok: 0, warn: 0, err: 0 };
    for (const cue of doc.cues) { const t = toneOf(cue.id); if (t === "err") c.err++; else if (t === "warn") c.warn++; else c.ok++; }
    return c;
  }, [doc, byCue]); // eslint-disable-line react-hooks/exhaustive-deps

  const [filter, setFilter] = useState<Filter>("all");
  const rows = doc.cues.filter((c) => filter === "all" || toneOf(c.id) === filter);

  const FILTERS: { key: Filter; label: string; tone: Tone; n: number }[] = [
    { key: "all", label: "wszystkie", tone: "neutral", n: doc.cues.length },
    { key: "ok", label: "zgodne", tone: "ok", n: counts.ok },
    { key: "warn", label: "ostrzeżenie", tone: "warn", n: counts.warn },
    { key: "err", label: "błąd", tone: "err", n: counts.err },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-hair/70 bg-white/80 shadow-card backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hair/70 px-5 py-3">
        <h3 className="text-sm font-medium text-graphite">Napisy (captions)</h3>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const toneCls = f.tone === "ok" ? "text-ok" : f.tone === "warn" ? "text-warn" : f.tone === "err" ? "text-err" : "text-muted";
            return (
              <button key={f.key} onClick={() => setFilter(f.key)}
                aria-pressed={active}
                className={`focusring inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  active ? "border-brand-300 bg-brand-50 text-brand-700" : "border-hair bg-white hover:bg-slate-50"
                }`}>
                <span className={active ? "text-brand-700" : toneCls}>{f.label}</span>
                <span className={`tnum rounded-full px-1.5 ${active ? "bg-white/70 text-brand-700" : "bg-slate-100 text-muted"}`}>{f.n}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hair/60 text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="px-5 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Start → End</th>
              <th className="px-3 py-2 font-medium">Tekst</th>
              <th className="px-3 py-2 font-medium">Linia</th>
              <th className="px-5 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <motion.tbody key={filter} variants={stagger} initial="hidden" animate="show">
            {rows.map((c) => {
              const maxLen = Math.max(0, ...c.lines.map((l) => l.length));
              const tone = toneOf(c.id);
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
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-muted">Brak napisów w tej kategorii.</td></tr>
            )}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}
