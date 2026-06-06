"use client";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getProjectDoc } from "@/lib/projects";
import TranscriptTable from "@/components/result/TranscriptTable";
import CaptionsTable from "@/components/result/CaptionsTable";
import Icon from "@/components/ui/Icon";
import { fadeUp, inView } from "@/lib/motion";

export default function ProjectNapisy() {
  const { id } = useParams<{ id: string }>();
  const doc = getProjectDoc(id);
  if (!doc) return <ProcessingNote />;
  return (
    <motion.div initial="hidden" whileInView="show" viewport={inView} variants={fadeUp} className="space-y-6">
      <p className="text-sm text-muted">Podgląd i walidacja napisów (nie edytor). Captions: mowa + mówcy + dźwięki + timing + status zgodności.</p>
      <TranscriptTable doc={doc} />
      <CaptionsTable doc={doc} report={doc.wcag} />
    </motion.div>
  );
}
function ProcessingNote() {
  return (
    <div className="rounded-2xl border border-hair/70 bg-white/80 p-6 text-center shadow-card">
      <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name="clock" size={24} /></span>
      <p className="text-sm text-muted">Napisy pojawią się po zakończeniu przetwarzania.</p>
    </div>
  );
}
