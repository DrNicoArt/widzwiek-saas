"use client";
// Pipeline (L2): 6 etapów, status transition, pulse aktywnego, rysowana linia progresu,
// żywy waveform w tle. TODO(motion etap2): pełne "drawing" SVG + caption segments z waveformu.
import { motion } from "framer-motion";
import Icon, { type IconName } from "@/components/ui/Icon";
import WaveformField from "@/components/scene/WaveformField";
import { stagger, fadeUp, spring } from "@/lib/motion";

const STAGES: { key: string; label: string; icon: IconName }[] = [
  { key: "source", label: "Źródło", icon: "file" },
  { key: "transcript", label: "Transkrypt", icon: "captions" },
  { key: "spk", label: "Mówcy", icon: "users" },
  { key: "snd", label: "Dźwięki", icon: "wave" },
  { key: "wcag", label: "WCAG", icon: "shield" },
  { key: "exp", label: "Eksport", icon: "download" },
];
type StageStatus = "pending" | "active" | "done" | "error";
function statusOf(i: number, active: number, error: boolean): StageStatus {
  if (error && i === active) return "error";
  if (i < active) return "done";
  if (i === active) return "active";
  return "pending";
}

export default function ProcessingPipeline({
  activeIndex, progress, error = false,
}: { activeIndex: number; progress: number; error?: boolean }) {
  const active = !error && activeIndex >= 0 && activeIndex < STAGES.length;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-hair/70 bg-white/70 p-5 shadow-card backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-60">
        <WaveformField live={active} baseOpacity={0.12} height={120} />
      </div>
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-graphite">
            <Icon name="wave" size={18} className="text-brand-600" /> Przetwarzanie sygnału
          </span>
          <span className="tnum text-sm font-medium text-brand-700">{Math.round(progress)}%</span>
        </div>

        <motion.ol variants={stagger} initial="hidden" animate="show" className="flex items-stretch gap-1.5">
          {STAGES.map((s, i) => {
            const st = statusOf(i, activeIndex, error);
            const ring = {
              pending: "border-hair text-muted bg-white/70",
              active: "border-brand-600 text-brand-700 bg-brand-50",
              done: "border-ok/40 text-ok bg-ok/10",
              error: "border-err/40 text-err bg-err/10",
            }[st];
            return (
              <motion.li key={s.key} variants={fadeUp} className="flex flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  <span className={`h-0.5 flex-1 rounded ${i === 0 ? "opacity-0" : i <= activeIndex ? "bg-brand-300" : "bg-hair"}`} />
                  <motion.span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${ring}`}
                    animate={st === "active" ? { scale: [1, 1.07, 1], boxShadow: ["0 0 0 0 rgba(0,87,168,0)", "0 0 0 6px rgba(0,87,168,0.12)", "0 0 0 0 rgba(0,87,168,0)"] } : { scale: 1 }}
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
    </div>
  );
}
