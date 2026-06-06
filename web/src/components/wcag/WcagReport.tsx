"use client";
// Raport WCAG — ekran "certyfikacji": gauge z count-up + animowany pierścień, werdykt, kafle, reguły.
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { WcagReport as Report } from "@/lib/contract";
import { Badge, type Tone } from "@/components/ui/Badge";
import Icon, { type IconName } from "@/components/ui/Icon";
import { fadeUp, stagger, easeOut } from "@/lib/motion";

function scoreOf(r: Report): number {
  return Math.max(0, Math.min(100, 100 - r.stats.error_count * 15 - r.stats.warning_count * 4));
}

const RULES: { code: string; label: string; icon: IconName }[] = [
  { code: "LINE_TOO_LONG", label: "Długość linii (≤ 42 znaki)", icon: "captions" },
  { code: "TOO_MANY_LINES", label: "Maksymalnie 2 linie", icon: "captions" },
  { code: "DURATION_TOO_SHORT", label: "Timing i czas wyświetlania", icon: "clock" },
  { code: "GAP_TOO_SHORT", label: "Przerwy między napisami", icon: "clock" },
  { code: "NO_SPEAKER_ID", label: "Identyfikacja mówców", icon: "users" },
  { code: "NO_SOUND_DESCRIPTION", label: "Opisy dźwięków niewerbalnych", icon: "wave" },
];

export default function WcagReport({ report }: { report: Report }) {
  const score = scoreOf(report);
  const ok = report.compliant;
  const C = 2 * Math.PI * 52;
  const offset = C * (1 - score / 100);
  const ring = ok ? "#1F7A4D" : "#B42318";
  const reduce = useReducedMotion();

  const [shown, setShown] = useState(reduce ? score : 0);
  useEffect(() => {
    if (reduce) { setShown(score); return; }
    let raf = 0; const start = performance.now(); const D = 900;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / D);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(eased * score));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, reduce]);

  const byCode = new Map<string, Tone>();
  for (const it of report.issues) {
    const t: Tone = it.severity === "error" ? "err" : it.severity === "warning" ? "warn" : "info";
    if (!byCode.has(it.code) || t === "err") byCode.set(it.code, t);
  }

  return (
    <motion.div variants={fadeUp} className="overflow-hidden rounded-2xl border border-hair bg-white/90 shadow-card">
      <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
        <div className="grid shrink-0 place-items-center">
          <svg width="148" height="148" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#E6EEF7" strokeWidth="11" />
            <motion.circle cx="60" cy="60" r="52" fill="none" stroke={ring} strokeWidth="11" strokeLinecap="round"
              strokeDasharray={C} transform="rotate(-90 60 60)"
              initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: offset }}
              transition={{ duration: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }} />
            <text x="60" y="56" textAnchor="middle" fontSize="30" fontWeight="500" fill="#151515" className="tnum">{shown}%</text>
            <text x="60" y="76" textAnchor="middle" fontSize="11" fill="#5F6670">WCAG 2.1 AA</text>
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...easeOut, delay: 0.2 }}>
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${ok ? "bg-ok/10 text-ok" : "bg-err/10 text-err"}`}>
              <Icon name={ok ? "checkCircle" : "alert"} size={18} />
              {ok ? "Materiał spełnia WCAG 2.1 AA: TAK" : "Materiał spełnia WCAG 2.1 AA: NIE"}
            </span>
          </motion.div>
          <h2 className="mt-3 text-xl font-medium text-graphite">Raport zgodności</h2>
          <p className="mt-1 text-sm text-muted">Cel: {report.target}. Gotowe do publikacji jako materiał dostępny cyfrowo.</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "Napisy", value: report.stats.cue_count, tone: "info" as const },
              { label: "Ostrzeżenia", value: report.stats.warning_count, tone: "warn" as const },
              { label: "Błędy", value: report.stats.error_count, tone: report.stats.error_count ? "err" as const : "ok" as const },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-brand-50/50 px-3 py-2">
                <div className="text-xs text-muted">{s.label}</div>
                <div className={`tnum text-2xl font-medium ${s.tone === "err" ? "text-err" : s.tone === "warn" ? "text-warn" : s.tone === "ok" ? "text-ok" : "text-brand-700"}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <motion.ul variants={stagger} initial="hidden" animate="show" className="grid gap-px bg-hair md:grid-cols-2">
        {RULES.map((rule) => {
          const tone = byCode.get(rule.code);
          const failed = tone === "err";
          const warn = tone === "warn";
          const t: Tone = failed ? "err" : warn ? "warn" : "ok";
          return (
            <motion.li key={rule.code} variants={fadeUp} className="flex items-center gap-3 bg-white px-5 py-3.5">
              <span className={`grid h-9 w-9 place-items-center rounded-lg ${t === "ok" ? "bg-ok/10 text-ok" : t === "warn" ? "bg-warn/10 text-warn" : "bg-err/10 text-err"}`}>
                <Icon name={rule.icon} size={18} />
              </span>
              <span className="flex-1 text-sm text-graphite">{rule.label}</span>
              <Badge tone={t} icon={t === "ok" ? "check" : "alert"}>
                {t === "ok" ? "zgodne" : t === "warn" ? "ostrzeżenie" : "błąd"}
              </Badge>
            </motion.li>
          );
        })}
      </motion.ul>
    </motion.div>
  );
}
