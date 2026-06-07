"use client";
// Mówcy i dźwięki — Widźwięk robi captions, nie tylko subtitles. Dane z CaptionDocument.
// Jasne oznaczenie: w demo to dane mock; realne providery (diaryzacja, detekcja dźwięków) = placeholder.
import { motion } from "framer-motion";
import type { CaptionDocument } from "@/lib/contract";
import { SPEAKER_CSS_COLOR, msToTimecode } from "@/lib/contract";
import Icon from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { fadeUp, stagger } from "@/lib/motion";

export default function SpeakersSounds({ doc }: { doc: CaptionDocument }) {
  const sounds = doc.cues.filter((c) => c.kind === "sound");
  const speechCount = (id: string) => doc.cues.filter((c) => c.kind === "speech" && c.speaker_id === id).length;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <motion.div variants={fadeUp} className="rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="users" size={18} className="text-brand-600" /> Mówcy</h3>
          <Badge tone="info">demo · diaryzacja TBD</Badge>
        </div>
        <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-2">
          {doc.speakers.map((s) => (
            <motion.li key={s.id} variants={fadeUp} className="flex items-center gap-3 rounded-xl border border-hair/60 bg-white px-3 py-2">
              <span className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ background: SPEAKER_CSS_COLOR[s.color] ?? "#999" }} />
              <span className="flex-1 text-sm font-medium text-graphite">{s.label}</span>
              <span className="text-xs text-muted tnum">{speechCount(s.id)} wypowiedzi</span>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>

      <motion.div variants={fadeUp} className="rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="wave" size={18} className="text-brand-600" /> Dźwięki niewerbalne</h3>
          <Badge tone="info">demo · detekcja TBD</Badge>
        </div>
        {sounds.length === 0 ? (
          <p className="text-sm text-muted">Brak wykrytych dźwięków (tryb api: detekcja to placeholder).</p>
        ) : (
          <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-2">
            {sounds.map((c) => (
              <motion.li key={c.id} variants={fadeUp} className="flex items-center gap-3 rounded-xl border border-hair/60 bg-white px-3 py-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-700"><Icon name="wave" size={15} /></span>
                <span className="flex-1 text-sm italic text-graphite">{c.text}</span>
                <span className="font-mono text-[11px] tabular-nums text-muted">{msToTimecode(c.start_ms)}</span>
              </motion.li>
            ))}
          </motion.ul>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          To odróżnia <strong>captions</strong> od zwykłych subtitles (WCAG 1.2.2). W demo dane są mock;
          realne providery diaryzacji i detekcji dźwięków to placeholdery — patrz <code>docs/EXTERNAL_APIS.md</code>.
        </p>
      </motion.div>
    </div>
  );
}
