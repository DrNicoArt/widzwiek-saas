"use client";
// Oficjalny sygnet-oko (web/public/brand/sygnet.svg) — "system presence".
// breathe = subtelny oddech (L3). Asset, nie rysowane oko.
import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { BRAND } from "@/lib/brand";

export default function BrandEye({
  width = 40, className, style, breathe = false, decorative = true,
}: { width?: number; className?: string; style?: CSSProperties; breathe?: boolean; decorative?: boolean }) {
  const reduce = useReducedMotion();
  const animate = breathe && !reduce ? { scale: [1, 1.035, 1], opacity: [1, 0.9, 1] } : undefined;
  return (
    <motion.img
      src={BRAND.assets.sygnet} alt={decorative ? "" : BRAND.name} aria-hidden={decorative || undefined}
      draggable={false} className={className} style={{ width, height: "auto", ...style }}
      animate={animate} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
