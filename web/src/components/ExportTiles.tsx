"use client";
// Kafle eksportu SRT/VTT z krótką informacją na hover + confirmation po pobraniu.
import { useState } from "react";
import { motion } from "framer-motion";
import { exportUrl } from "@/lib/api";
import Icon from "@/components/ui/Icon";
import { cardHover, spring } from "@/lib/motion";

const FORMATS = [
  { fmt: "srt" as const, title: "SRT", desc: "Kompatybilność: YouTube i większość platform." },
  { fmt: "vtt" as const, title: "VTT", desc: "Pełniejsza zgodność WCAG: kolory mówców i pozycje." },
];

export default function ExportTiles({ jobId }: { jobId: string }) {
  const [done, setDone] = useState<string | null>(null);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {FORMATS.map((f) => (
        <motion.a key={f.fmt} href={exportUrl(jobId, f.fmt)} download
          whileHover={cardHover} whileTap={{ scale: 0.99 }} onClick={() => { setDone(f.fmt); setTimeout(() => setDone(null), 1800); }}
          className="focusring group flex items-center gap-4 rounded-2xl border border-hair bg-white/90 p-5 shadow-card">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <Icon name="file" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-medium text-graphite">Pobierz {f.title}</span>
              {done === f.fmt && (
                <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring}
                  className="inline-flex items-center gap-1 text-xs font-medium text-ok"><Icon name="check" size={14} /> gotowe</motion.span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted">{f.desc}</p>
          </div>
          <Icon name="download" size={20} className="text-muted transition-colors group-hover:text-brand-600" />
        </motion.a>
      ))}
    </div>
  );
}
