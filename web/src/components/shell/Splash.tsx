"use client";
// Splash/loading z sygnetem oka: pulse + glow + cienki waveform-loader. Fade-out po starcie.
import { motion } from "framer-motion";
import EyeMark from "@/components/brand/EyeMark";
import Wordmark from "@/components/brand/Wordmark";
import { dur } from "@/lib/motion";

export default function Splash() {
  return (
    <motion.div
      initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="fixed inset-0 z-50 grid place-items-center bg-ice"
    >
      <div className="flex flex-col items-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: dur.slow, ease: [0.22, 1, 0.36, 1] }}>
          <EyeMark size={96} glow pulse />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }} className="mt-6">
          <Wordmark className="text-2xl" />
        </motion.div>
        <div className="mt-6 h-1 w-44 overflow-hidden rounded-full bg-brand-100">
          <motion.div className="h-full w-1/3 rounded-full bg-brand-600"
            animate={{ x: ["-120%", "320%"] }} transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }} />
        </div>
        <p className="mt-3 text-xs text-muted">Widźwięk ładuje się…</p>
      </div>
    </motion.div>
  );
}
