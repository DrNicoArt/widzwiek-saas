"use client";
// Pipeline przetwarzania — 6 etapów. Etap 1: statyczny + status transition + pulse aktywnego.
// TODO(motion): animowany "drawing" linii, żywy waveform w tle, płynny progress count-up.
import { motion } from "framer-motion";
import Icon, { type IconName } from "@/components/ui/Icon";
import { stagger, fadeUp, spring } from "@/lib/motion";

export type StageStatus = "pending" | "active" | "done" | "error";
const STAGES: { key: string; label: string; icon: IconName }[] = [
  { key: "audio", label: "Audio", icon: "file" },
  { key: "asr", label: "Transkrypcja", icon: "captions" },
  { key: "spk", label: "Mówcy", icon: "users" },
  { key: "snd", label: "Dźwięki", icon: "wave" },
  { key: "wcag", label: "WCAG", icon: "shield" },
  { key: "exp", label: "Eksport", icon: "download" },
];

function statusOf(i: number, active: number, error: boolean): StageStatus {
  if (error && i === active) return "error";
  if (i < active) return "done";
  if (i === active) return "active";
  return "pending";
}

export default function ProcessingPipeline({
  activeIndex, progress, error = false,
}: { activeIndex: number; progress: number; error?: boolean }) {
  return (
    <div className="rounded-2xl border border-hair bg-white/90 p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-graphite">
          <Icon name="wave" size={18} className="text-brand-600" /> Przetwarzanie
        </span>
        <span className="tnum text-sm font-medium text-brand-700">{Math.round(progress)}%</span>
      </div>

      <motion.ol variants={stagger} initial="hidden" animate="show" className="flex items-stretch gap-2">
        {STAGES.map((s, i) => {
          const st = statusOf(i, activeIndex, error);
          const ring = {
            pending: "border-hair text-muted bg-white",
            active: "border-brand-600 text-brand-700 bg-brand-50",
            done: "border-ok/40 text-ok bg-ok/10",
            error: "border-err/40 text-err bg-err/10",
          }[st];
          return (
            <motion.li key={s.key} variants={fadeUp} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <span className={`h-0.5 flex-1 rounded ${i === 0 ? "opacity-0" : i <= activeIndex ? "bg-brand-300" : "bg-hair"}`} />
                <motion.span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${ring}`}
                  animate={st === "active" ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                  transition={st === "active" ? { duration: 1.6, repeat: Infinity } : spring}>
                  <Icon name={st === "done" ? "check" : st === "error" ? "alert" : s.icon} size={20} />
                </motion.span>
                <span className={`h-0.5 flex-1 rounded ${i === STAGES.length - 1 ? "opacity-0" : i < activeIndex ? "bg-brand-300" : "bg-hair"}`} />
              </div>
              <span className={`mt-2 text-xs ${st === "pending" ? "text-muted" : "font-medium text-graphite"}`}>{s.label}</span>
            </motion.li>
          );
        })}
      </motion.ol>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-brand-100">
        <motion.div className={`h-full rounded-full ${error ? "bg-err" : "bg-brand-600"}`}
          initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
      </div>
    </div>
  );
}
