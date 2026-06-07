"use client";
// "Zgodność" — ring WCAG z count-upem + werdykt. Reveal po wejściu fazy.
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function ComplianceRing({ show, target = 98 }: { show: boolean; target?: number }) {
  const reduce = useReducedMotion();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!show) return;
    if (reduce) { setV(target); return; }
    let raf = 0; const start = performance.now(); const dur = 1100;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setV(Math.round(eased * target));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [show, target, reduce]);

  const C = 2 * Math.PI * 52;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={show ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 200, damping: 24 }}
      className="flex items-center gap-4 rounded-2xl border border-hair/70 bg-white/75 px-5 py-4 shadow-card backdrop-blur-md">
      <svg width="96" height="96" viewBox="0 0 120 120" className="shrink-0">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#E6EEF7" strokeWidth="10" />
        <circle cx="60" cy="60" r="52" fill="none" stroke="#1F7A4D" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - v / 100)} transform="rotate(-90 60 60)" />
        <text x="60" y="66" textAnchor="middle" fontSize="26" fontWeight="500" fill="#151515" className="tabular-nums">{v}%</text>
      </svg>
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-ok/10 px-2.5 py-1 text-xs font-medium text-ok">Spełnia WCAG 2.1 AA: TAK</div>
        <p className="mt-1.5 text-sm text-muted">Materiał gotowy do publikacji jako dostępny cyfrowo.</p>
      </div>
    </motion.div>
  );
}
