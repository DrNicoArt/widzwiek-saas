"use client";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useProject } from "@/lib/useProject";
import { exportUrl } from "@/lib/api";
import ExportButtons from "@/components/ExportButtons";
import Icon from "@/components/ui/Icon";
import { fadeUp, stagger, inView } from "@/lib/motion";

const REAL = [
  { fmt: "srt" as const, label: "Pobierz SRT", desc: "YouTube, Vimeo, VLC, LMS." },
  { fmt: "vtt" as const, label: "Pobierz VTT", desc: "Web/HTML5: kolory mówców, pozycje." },
  { fmt: "txt" as const, label: "Pobierz TXT", desc: "Czysty transkrypt do copy/paste." },
  { fmt: "json" as const, label: "Pobierz JSON", desc: "Pełny CaptionDocument (integracje)." },
];

export default function ProjectEksporty() {
  const { id } = useParams<{ id: string }>();
  const { loading, doc, real } = useProject(id);
  if (loading || !doc) return (
    <div className="rounded-2xl border border-hair/70 bg-white/80 p-6 text-center shadow-card">
      <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name="clock" size={24} /></span>
      <p className="text-sm text-muted">{loading ? "Wczytywanie…" : "Eksporty po przetwarzaniu."}</p>
    </div>
  );

  return (
    <motion.div initial="hidden" whileInView="show" viewport={inView} variants={fadeUp} className="space-y-4">
      {real ? (
        <motion.div variants={stagger} className="grid gap-4 sm:grid-cols-2">
          {REAL.map((f) => (
            <motion.a key={f.fmt} variants={fadeUp} href={exportUrl(id, f.fmt)} download
              className="spotlight focusring group flex items-center gap-4 rounded-2xl border border-hair/70 bg-white/85 p-5 shadow-card backdrop-blur-sm transition-shadow hover:shadow-lift">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name="download" size={20} /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-medium text-graphite">{f.label}</p><p className="mt-0.5 text-xs text-muted">{f.desc}</p></div>
            </motion.a>
          ))}
        </motion.div>
      ) : (
        <ExportButtons doc={doc} />
      )}
      <div className="flex items-center gap-3 rounded-2xl border border-hair/60 bg-white/60 p-4 opacity-80">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-muted"><Icon name="file" size={18} /></span>
        <div className="flex-1"><p className="text-sm font-medium text-graphite">Raport PDF (wkrótce)</p><p className="text-xs text-muted">Certyfikat zgodności WCAG do pobrania — ważny dla instytucji i B2B.</p></div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-muted">planowane</span>
      </div>
    </motion.div>
  );
}
