"use client";
// Splash — oficjalny sygnet (oddech + glow) + logotyp + waveform-loader. Premium reveal.
import { motion } from "framer-motion";
import BrandEye from "@/components/brand/BrandEye";
import BrandLogo from "@/components/brand/BrandLogo";
import { dur } from "@/lib/motion";

export default function Splash() {
  return (
    <motion.div
      initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
      className="fixed inset-0 z-50 grid place-items-center bg-ice"
    >
      <div className="flex flex-col items-center">
        <motion.div initial={{ opacity: 0, scale: 0.86 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: dur.slow, ease: [0.22, 1, 0.36, 1] }} className="relative">
          <div className="absolute -inset-16 rounded-full"
            style={{ background: "radial-gradient(closest-side, rgba(0,87,168,0.18), rgba(0,87,168,0))" }} />
          <div className="absolute -inset-12 rounded-full animate-huepulse"
            style={{ background: "radial-gradient(closest-side, rgba(251,94,38,0.16), rgba(251,94,38,0))" }} />
          <BrandEye width={150} breathe />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }} className="mt-8">
          <BrandLogo height={26} />
        </motion.div>
        <div className="mt-7 h-[3px] w-52 overflow-hidden rounded-full bg-brand-100">
          <motion.div className="h-full w-1/3 rounded-full bg-gradient-to-r from-brand-600 to-accent-500"
            animate={{ x: ["-130%", "330%"] }} transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }} />
        </div>
        <p className="mt-3 text-xs tracking-wide text-muted">Widźwięk ładuje się…</p>
      </div>
    </motion.div>
  );
}
