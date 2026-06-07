"use client";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useProject } from "@/lib/useProject";
import TranscriptTable from "@/components/result/TranscriptTable";
import CaptionsTable from "@/components/result/CaptionsTable";
import CaptionsEditor from "@/components/result/CaptionsEditor";
import Icon from "@/components/ui/Icon";
import { fadeUp, inView } from "@/lib/motion";

function Note({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-hair/70 bg-white/80 p-6 text-center shadow-card">
      <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name="clock" size={24} /></span>
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}

export default function ProjectNapisy() {
  const { id } = useParams<{ id: string }>();
  const { loading, doc, real, setDoc } = useProject(id);
  if (loading) return <Note text="Wczytywanie napisów…" />;
  if (!doc) return <Note text="Napisy pojawią się po zakończeniu przetwarzania." />;

  if (real) return <CaptionsEditor jobId={id} doc={doc} onSaved={setDoc} />;
  return (
    <motion.div initial="hidden" whileInView="show" viewport={inView} variants={fadeUp} className="space-y-6">
      <p className="text-sm text-muted">Podgląd i walidacja (materiał demo). Edycja dostępna dla wgranych materiałów.</p>
      <TranscriptTable doc={doc} />
      <CaptionsTable doc={doc} report={doc.wcag} />
    </motion.div>
  );
}
