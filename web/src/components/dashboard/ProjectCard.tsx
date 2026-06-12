"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { SampleProject } from "@/lib/sampleData";
import { Badge, type Tone } from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import { fadeUp, cardHover } from "@/lib/motion";

const STATUS: Record<SampleProject["status"], { tone: Tone; label: string }> = {
  done: { tone: "ok", label: "gotowe" },
  processing: { tone: "info", label: "przetwarzanie" },
  review: { tone: "warn", label: "do poprawy" },
};

export default function ProjectCard({ p, onDelete }: { p: SampleProject; onDelete?: (id: string) => void }) {
  const s = STATUS[p.status];
  const base = `/app/projekty/${p.id}`;
  const processing = p.status === "processing";
  const [confirm, setConfirm] = useState(false);

  return (
    <motion.div variants={fadeUp} whileHover={cardHover} whileTap={{ scale: 0.985 }}
      className="spotlight group flex flex-col overflow-hidden rounded-2xl border border-hair/70 bg-white/70 shadow-card backdrop-blur-sm transition-shadow hover:shadow-lift">
      <Link href={base} className="focusring block text-left">
        <div className="relative h-24 overflow-hidden" style={{ background: `linear-gradient(135deg, ${p.accent}14, ${p.accent}05)` }}>
          <svg viewBox="0 0 400 96" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-50" aria-hidden>
            <path d="M0 48 Q50 20 100 48 T200 48 T300 48 T400 48" fill="none" stroke={p.accent} strokeWidth="2" />
          </svg>
          <span className="absolute right-3 top-3"><Badge tone={s.tone}>{s.label}</Badge></span>
          <span className="absolute bottom-2 left-3 rounded bg-white/70 px-1.5 py-0.5 text-[11px] font-medium text-graphite tnum">{p.durationLabel}</span>
        </div>
        <div className="px-4 pt-4">
          <p className="line-clamp-1 text-sm font-medium text-graphite">{p.title}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-muted">{p.updated}</span>
            <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: processing ? "#5F6670" : p.wcag >= 90 ? "#1F7A4D" : "#B7791F" }}>
              <Icon name="shield" size={14} /> {processing ? "—" : `${p.wcag}%`}
            </span>
          </div>
        </div>
      </Link>

      <div className="mt-3 flex items-center gap-1.5 border-t border-hair/50 px-4 py-2.5">
        {confirm ? (
          <>
            <span className="flex-1 text-xs text-graphite">Usunąć materiał?</span>
            <button onClick={() => { onDelete?.(p.id); setConfirm(false); }} className="focusring rounded-lg bg-err px-2.5 py-1.5 text-xs font-medium text-white hover:bg-err/90">Usuń</button>
            <button onClick={() => setConfirm(false)} className="focusring rounded-lg border border-hair px-2.5 py-1.5 text-xs font-medium text-graphite hover:bg-slate-50">Anuluj</button>
          </>
        ) : processing ? (
          <Link href={base} className="focusring inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50">
            <Icon name="clock" size={14} /> Zobacz postęp
          </Link>
        ) : (
          <>
            <Link href={base} className="focusring inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-50 px-2 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100">
              <Icon name="external" size={14} /> Otwórz
            </Link>
            <Link href={`${base}/raport`} aria-label="Raport WCAG" title="Raport WCAG" className="focusring grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-slate-100 hover:text-brand-700"><Icon name="shield" size={16} /></Link>
            <Link href={`${base}/eksporty`} aria-label="Eksporty" title="Eksporty" className="focusring grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-slate-100 hover:text-brand-700"><Icon name="download" size={16} /></Link>
            {onDelete && <button onClick={() => setConfirm(true)} aria-label="Usuń materiał" title="Usuń" className="focusring grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-err/10 hover:text-err"><Icon name="trash" size={16} /></button>}
          </>
        )}
      </div>
    </motion.div>
  );
}
