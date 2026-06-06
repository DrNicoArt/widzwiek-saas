"use client";
// Template = remount przy KAŻDEJ zmianie route w /app → animacja wejścia podstrony.
// 1) treść strony wjeżdża (blur+slide+fade), 2) cienki pasek-akcent „przeciąga" się u góry.
// Respektuje prefers-reduced-motion (wtedy bez animacji).
import { motion, useReducedMotion } from "framer-motion";
import { pageEnter } from "@/lib/motion";

export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <div className="relative">
      {/* pasek-sweep akcentu przy wejściu na podstronę */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-8 left-0 right-0 h-0.5 origin-left rounded-full"
        style={{ background: "linear-gradient(90deg, rgba(0,87,168,0), #0057A8 35%, #FB5E26 75%, rgba(251,94,38,0))" }}
        initial={{ scaleX: 0, opacity: 0.9 }}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div variants={pageEnter} initial="hidden" animate="show">
        {children}
      </motion.div>
    </div>
  );
}
