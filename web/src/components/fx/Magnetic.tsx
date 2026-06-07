"use client";
// Magnetic — element lekko "przyciaga sie" do kursora (translate + spring). Dla glownych CTA.
import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

export default function Magnetic({
  children, className = "", strength = 0.35,
}: { children: ReactNode; className?: string; strength?: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 18, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 250, damping: 18, mass: 0.6 });

  if (reduce) return <div className={className}>{children}</div>;

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    x.set(((e.clientX - r.left) / r.width - 0.5) * r.width * strength);
    y.set(((e.clientY - r.top) / r.height - 0.5) * r.height * strength);
  };
  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={reset} style={{ x: sx, y: sy }}
      className={`inline-flex ${className}`}>
      {children}
    </motion.div>
  );
}
