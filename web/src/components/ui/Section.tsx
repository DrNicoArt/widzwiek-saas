"use client";
// Sekcja z wejściem fade/slide przy pojawieniu w viewport (scroll reveal — wersja bezpieczna).
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { stagger, inView } from "@/lib/motion";

export default function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.section
      variants={stagger} initial="hidden" whileInView="show" viewport={inView}
      className={className}
    >
      {children}
    </motion.section>
  );
}
