"use client";
import { motion } from "framer-motion";
import type { DemoProject } from "@/lib/mockData";
import { Badge, type Tone } from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import { fadeUp, cardHover } from "@/lib/motion";

const STATUS: Record<DemoProject["status"], { tone: Tone; label: string }> = {
  done: { tone: "ok", label: "gotowe" },
  processing: { tone: "info", label: "przetwarzanie" },
  review: { tone: "warn", label: "do poprawy" },
};

export default function ProjectCard({ p }: { p: DemoProject }) {
  const s = STATUS[p.status];
  return (
    <motion.button variants={fadeUp} whileHover={cardHover} whileTap={{ scale: 0.99 }}
      className="focusring group overflow-hidden rounded-2xl border border-hair/70 bg-white/70 text-left shadow-card backdrop-blur-sm">
      <div className="relative h-24 overflow-hidden" style={{ background: `linear-gradient(135deg, ${p.accent}14, ${p.accent}05)` }}>
        <svg viewBox="0 0 400 96" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-50" aria-hidden>
          <path d="M0 48 Q50 20 100 48 T200 48 T300 48 T400 48" fill="none" stroke={p.accent} strokeWidth="2" />
        </svg>
        <span className="absolute right-3 top-3"><Badge tone={s.tone}>{s.label}</Badge></span>
        <span className="absolute bottom-2 left-3 rounded bg-white/70 px-1.5 py-0.5 text-[11px] font-medium text-graphite tnum">{p.durationLabel}</span>
      </div>
      <div className="p-4">
        <p className="line-clamp-1 text-sm font-medium text-graphite">{p.title}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted">{p.updated}</span>
          <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: p.status === "processing" ? "#5F6670" : p.wcag >= 90 ? "#1F7A4D" : "#B7791F" }}>
            <Icon name="shield" size={14} /> {p.status === "processing" ? "—" : `${p.wcag}%`}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
