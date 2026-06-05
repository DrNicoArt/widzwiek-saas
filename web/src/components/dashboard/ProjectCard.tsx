"use client";
import Link from "next/link";
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

// W demo akcje prowadzą do reprezentatywnych widoków wyniku (brak jeszcze /app/projects/[id]).
const ACTIONS: { label: string; href: string; icon: Parameters<typeof Icon>[0]["name"] }[] = [
  { label: "Otwórz", href: "/app/napisy", icon: "external" },
  { label: "Raport", href: "/app/napisy#raport", icon: "shield" },
  { label: "Eksport", href: "/app/eksporty", icon: "download" },
];

export default function ProjectCard({ p }: { p: DemoProject }) {
  const s = STATUS[p.status];
  const disabled = p.status === "processing";
  return (
    <motion.div variants={fadeUp} whileHover={cardHover}
      className="group overflow-hidden rounded-2xl border border-hair/70 bg-white/70 shadow-card backdrop-blur-sm">
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
        <div className="mt-3 flex gap-1.5 border-t border-hair/50 pt-3">
          {ACTIONS.map((a) =>
            disabled ? (
              <span key={a.label} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted/50">
                <Icon name={a.icon} size={13} /> {a.label}
              </span>
            ) : (
              <Link key={a.label} href={a.href}
                className="focusring inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50">
                <Icon name={a.icon} size={13} /> {a.label}
              </Link>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}
