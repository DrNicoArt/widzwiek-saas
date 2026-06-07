"use client";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useProject } from "@/lib/useProject";
import WcagReport from "@/components/wcag/WcagReport";
import Icon from "@/components/ui/Icon";
import { fadeUp, inView } from "@/lib/motion";

export default function ProjectRaport() {
  const { id } = useParams<{ id: string }>();
  const { loading, doc } = useProject(id);
  if (loading || !doc) return (
    <div className="rounded-2xl border border-hair/70 bg-white/80 p-6 text-center shadow-card">
      <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name="clock" size={24} /></span>
      <p className="text-sm text-muted">{loading ? "Wczytywanie…" : "Raport pojawi się po przetwarzaniu."}</p>
    </div>
  );
  return (
    <motion.div initial="hidden" whileInView="show" viewport={inView} variants={fadeUp}>
      <WcagReport report={doc.wcag} />
    </motion.div>
  );
}
