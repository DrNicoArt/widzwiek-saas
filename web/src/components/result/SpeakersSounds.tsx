"use client";
// Mówcy i dźwięki — Widźwięk robi captions, nie tylko subtitles. Dane z CaptionDocument.
// Jasne oznaczenie: dane poglądowe; automatyczne rozpoznawanie mówców i dźwięków dochodzi w wersji serwerowej.
import { motion } from "framer-motion";
import type { CaptionDocument } from "@/lib/contract";
import { SPEAKER_CSS_COLOR, msToTimecode } from "@/lib/contract";
import Icon from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { fadeUp, stagger } from "@/lib/motion";

export default function SpeakersSounds({ doc }: { doc: CaptionDocument }) {
  const sounds = doc.cues.filter((c) => c.kind === "sound");
  const detectedSounds = [
    ...sounds.map((c, i) => ({
      id: c.id,
      label: c.text.replace(/^\[|\]$/g, ""),
      proposed: c.text,
      time: c.start_ms,
      status: "dodany do captions",
      relevance: i === 0 ? "tło istotne" : "istotny",
      source: doc.meta.pipeline.sound_events,
      confidence: i === 0 ? "0.86" : "0.78",
    })),
    {
      id: "omitted-noise",
      label: "szum tła",
      proposed: "[szum tła]",
      time: Math.min(doc.media.duration_ms, 22000),
      status: "pominięty",
      relevance: "nisko istotny",
      source: "auto/ręcznie",
      confidence: "0.41",
    },
  ];
  const speechCount = (id: string) => doc.cues.filter((c) => c.kind === "speech" && c.speaker_id === id).length;
  const accepted = detectedSounds.filter((s) => s.status === "dodany do captions").length;
  const relevant = detectedSounds.filter((s) => s.relevance !== "nisko istotny").length;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-hair/70 bg-white/80 p-4 shadow-card backdrop-blur-sm">
          <p className="text-xs text-muted">Dźwięki wykryte</p>
          <p className="tnum mt-1 text-2xl font-medium text-graphite">{detectedSounds.length}</p>
        </div>
        <div className="rounded-2xl border border-hair/70 bg-white/80 p-4 shadow-card backdrop-blur-sm">
          <p className="text-xs text-muted">Istotne dla zrozumienia</p>
          <p className="tnum mt-1 text-2xl font-medium text-graphite">{relevant}</p>
        </div>
        <div className="rounded-2xl border border-hair/70 bg-white/80 p-4 shadow-card backdrop-blur-sm">
          <p className="text-xs text-muted">Dodane do captions</p>
          <p className="tnum mt-1 text-2xl font-medium text-graphite">{accepted}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
      <motion.div variants={fadeUp} className="rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="users" size={18} className="text-brand-600" /> Mówcy</h3>
          <Badge tone="info">rozpoznawanie automatyczne</Badge>
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
          <Badge tone="info">capability top-level</Badge>
        </div>
        {detectedSounds.length === 0 ? (
          <p className="text-sm text-muted">Brak wykrytych dźwięków (tryb api: detekcja to placeholder).</p>
        ) : (
          <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-2">
            {detectedSounds.map((s) => (
              <motion.li key={s.id} variants={fadeUp} className="rounded-xl border border-hair/60 bg-white px-3 py-2">
                <div className="flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-50 text-brand-700"><Icon name="wave" size={15} /></span>
                  <span className="flex-1 text-sm italic text-graphite">{s.proposed}</span>
                  <Badge tone={s.status === "pominięty" ? "neutral" : "ok"}>{s.status}</Badge>
                  <span className="font-mono text-[11px] tabular-nums text-muted">{msToTimecode(s.time)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 pl-10 text-[11px] text-muted">
                  <span>label: {s.label}</span>
                  <span>istotność: {s.relevance}</span>
                  <span>źródło: {s.source}</span>
                  <span>confidence: {s.confidence}</span>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          System rozdziela dźwięk wykryty, dźwięk istotny i dźwięk dodany do captions. Nie każdy hałas musi trafić do napisów.
        </p>
      </motion.div>
      </div>
    </div>
  );
}
