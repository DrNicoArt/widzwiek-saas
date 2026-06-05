"use client";
import { motion } from "framer-motion";
import { DEMO_DOC } from "@/lib/demoDoc";
import PageHeader from "@/components/shell/PageHeader";
import SpeakersSounds from "@/components/result/SpeakersSounds";
import { fadeUp, inView } from "@/lib/motion";

export default function Mowcy() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader icon="users" title="Mówcy i dźwięki" demo desc="To odróżnia captions od subtitles: identyfikacja mówców i opisy dźwięków niewerbalnych (WCAG 1.2.2). W demo dane mock; realne providery to placeholdery." />
      <motion.div initial="hidden" whileInView="show" viewport={inView} variants={fadeUp}><SpeakersSounds doc={DEMO_DOC} /></motion.div>
    </div>
  );
}
