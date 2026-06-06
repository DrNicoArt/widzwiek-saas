"use client";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getProjectDoc } from "@/lib/projects";
import ExportButtons from "@/components/ExportButtons";
import Icon from "@/components/ui/Icon";
import { fadeUp, inView } from "@/lib/motion";

export default function ProjectEksporty() {
  const { id } = useParams<{ id: string }>();
  const doc = getProjectDoc(id);
  if (!doc) return (
    <div className="rounded-2xl border border-hair/70 bg-white/80 p-6 text-center shadow-card">
      <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name="clock" size={24} /></span>
      <p className="text-sm text-muted">Eksporty będą dostępne po zakończeniu przetwarzania.</p>
    </div>
  );
  return (
    <motion.div initial="hidden" whileInView="show" viewport={inView} variants={fadeUp} className="space-y-4">
      <ExportButtons doc={doc} />
      <div className="flex items-center gap-3 rounded-2xl border border-hair/60 bg-white/60 p-4 opacity-80">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-muted"><Icon name="file" size={18} /></span>
        <div className="flex-1"><p className="text-sm font-medium text-graphite">Raport PDF (wkrótce)</p><p className="text-xs text-muted">Certyfikat zgodności WCAG do pobrania — ważny dla instytucji i B2B. Później też TXT/JSON.</p></div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-muted">planowane</span>
      </div>
    </motion.div>
  );
}
