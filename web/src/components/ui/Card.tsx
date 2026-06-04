"use client";
// Karta premium: fade-up przy wejściu + hover-lift. Gotowa pod scroll reveal.
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp, cardHover } from "@/lib/motion";

export default function Card({
  children, className = "", hover = true, as = "div", padded = true,
}: { children: ReactNode; className?: string; hover?: boolean; as?: "div" | "section" | "article"; padded?: boolean }) {
  const MZ = motion[as];
  return (
    <MZ
      variants={fadeUp}
      whileHover={hover ? cardHover : undefined}
      className={[
        "rounded-2xl border border-hair bg-white/90 shadow-card backdrop-blur-sm",
        padded ? "p-5" : "",
        className,
      ].join(" ")}
    >
      {children}
    </MZ>
  );
}
