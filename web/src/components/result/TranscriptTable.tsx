"use client";
// Wynik transkrypcji — segmenty mowy: index, timestamp, mówca, tekst. Dane z CaptionDocument.
import { motion } from "framer-motion";
import type { CaptionDocument } from "@/lib/contract";
import { SPEAKER_CSS_COLOR, msToTimecode } from "@/lib/contract";
import { fadeUp, stagger } from "@/lib/motion";

export default function TranscriptTable({ doc }: { doc: CaptionDocument }) {
  const speakerById = Object.fromEntries(doc.speakers.map((s) => [s.id, s]));
  const speech = doc.cues.filter((c) => c.kind === "speech");
  return (
    <div className="overflow-hidden rounded-2xl border border-hair/70 bg-white/80 shadow-card backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-hair/70 px-5 py-3">
        <h3 className="text-sm font-medium text-graphite">Transkrypcja</h3>
        <span className="text-xs text-muted">{speech.length} wypowiedzi</span>
      </div>
      <motion.ul variants={stagger} initial="hidden" animate="show" className="divide-y divide-hair/60">
        {speech.map((c) => {
          const sp = c.speaker_id ? speakerById[c.speaker_id] : undefined;
          return (
            <motion.li key={c.id} variants={fadeUp} className="flex gap-3 px-5 py-3">
              <span className="w-16 shrink-0 font-mono text-[11px] tabular-nums text-muted">{msToTimecode(c.start_ms)}</span>
              {sp && (
                <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium" style={{ color: SPEAKER_CSS_COLOR[sp.color] ?? "#0B3E70" }}>
                  <span className="h-2 w-2 rounded-full ring-1 ring-black/10" style={{ background: SPEAKER_CSS_COLOR[sp.color] ?? "#999" }} />
                  {sp.label}
                </span>
              )}
              <span className="text-sm text-graphite">{c.text}</span>
            </motion.li>
          );
        })}
      </motion.ul>
    </div>
  );
}
