"use client";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getProjectDoc } from "@/lib/projects";
import SpeakersSounds from "@/components/result/SpeakersSounds";
import Icon from "@/components/ui/Icon";
import { fadeUp, inView } from "@/lib/motion";

export default function ProjectMowcy() {
  const { id } = useParams<{ id: string }>();
  const doc = getProjectDoc(id);
  if (!doc) return (
    <div className="rounded-2xl border border-hair/70 bg-white/80 p-6 text-center shadow-card">
      <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name="clock" size={24} /></span>
      <p className="text-sm text-muted">Mówcy i dźwięki pojawią się po zakończeniu przetwarzania.</p>
    </div>
  );
  return (
    <motion.div initial="hidden" whileInView="show" viewport={inView} variants={fadeUp} className="space-y-4">
      <p className="text-sm text-muted">To odróżnia captions od subtitles (WCAG 1.2.2): identyfikacja mówców i opisy dźwięków niewerbalnych. System wykrywa je per materiał; w demo dane mock, realne providery to placeholdery.</p>
      <SpeakersSounds doc={doc} />
    </motion.div>
  );
}
