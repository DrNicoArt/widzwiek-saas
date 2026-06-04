"use client";
// Animowany sygnet "oka" (inline SVG) — motyw 'Widźwięk widzi dźwięk'.
// Używany w splash, sidebarze i loaderach. Oficjalne logo/sygnet pozostają w /public/brand.
// Etap 1: delikatny pulse + glow. TODO(motion): blink/wink, scan-line, parallax.
import { motion, useReducedMotion } from "framer-motion";

export default function EyeMark({
  size = 40, glow = false, pulse = true,
}: { size?: number; glow?: boolean; pulse?: boolean }) {
  const reduce = useReducedMotion();
  const animate = pulse && !reduce ? { scale: [1, 1.03, 1] } : undefined;
  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size }}>
      {glow && (
        <span aria-hidden style={{
          position: "absolute", inset: "-30%", borderRadius: "9999px",
          background: "radial-gradient(closest-side, rgba(0,87,168,0.22), rgba(0,87,168,0))",
        }} />
      )}
      <motion.svg
        width={size} height={size} viewBox="0 0 100 78" role="img" aria-label="Widźwięk"
        animate={animate} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "relative", transformOrigin: "50% 58%" }}>
        <path d="M8 44 Q50 4 92 44" fill="none" stroke="#0057A8" strokeWidth="8" strokeLinecap="round" />
        <circle cx="50" cy="46" r="18" fill="#0057A8" />
        <circle cx="57" cy="40" r="6.5" fill="#EAF2FB" />
      </motion.svg>
    </span>
  );
}
