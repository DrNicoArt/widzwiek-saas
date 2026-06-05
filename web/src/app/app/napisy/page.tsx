"use client";
import { motion } from "framer-motion";
import { DEMO_DOC } from "@/lib/demoDoc";
import PageHeader from "@/components/shell/PageHeader";
import TranscriptTable from "@/components/result/TranscriptTable";
import CaptionsTable from "@/components/result/CaptionsTable";
import WcagReport from "@/components/wcag/WcagReport";
import { fadeUp, inView } from "@/lib/motion";

export default function Napisy() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader icon="captions" title="Napisy" demo
        desc={`Przykładowy materiał: ${DEMO_DOC.media.filename}. Captions (nie zwykłe subtitles): mowa + mówcy + dźwięki niewerbalne + timing + status zgodności.`} />
      <motion.div initial="hidden" whileInView="show" viewport={inView} variants={fadeUp} className="space-y-6">
        <TranscriptTable doc={DEMO_DOC} />
        <CaptionsTable doc={DEMO_DOC} report={DEMO_DOC.wcag} />
        <div id="raport" className="scroll-mt-24">
          <WcagReport report={DEMO_DOC.wcag} />
        </div>
      </motion.div>
    </div>
  );
}
