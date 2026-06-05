"use client";
// Eksporty — pobranie SRT/VTT generowane po stronie klienta z przykładowego CaptionDocument
// (działa bez workera). Realny eksport joba jest też w /app/studio po przetworzeniu.
import { motion } from "framer-motion";
import { DEMO_DOC } from "@/lib/demoDoc";
import PageHeader from "@/components/shell/PageHeader";
import ExportButtons from "@/components/ExportButtons";
import Icon from "@/components/ui/Icon";
import { fadeUp, inView } from "@/lib/motion";

export default function Eksporty() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader icon="download" title="Eksporty" demo
        desc={`Pobierz napisy z przykładu „${DEMO_DOC.media.filename}". Pliki generowane lokalnie z kontraktu CaptionDocument — bez workera.`} />

      <ExportButtons doc={DEMO_DOC} />

      <motion.div initial="hidden" whileInView="show" viewport={inView} variants={fadeUp}
        className="mt-6 flex items-center gap-3 rounded-2xl border border-ok/30 bg-ok/5 p-4">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-ok/10 text-ok"><Icon name="checkCircle" size={18} /></span>
        <p className="text-sm text-graphite">Materiał gotowy do publikacji jako dostępny cyfrowo — <strong>spełnia WCAG 2.1 AA</strong>.
          <span className="text-muted"> Gotowe do YouTube, Vimeo, LMS i stron instytucji. EBU-TT i PDF raportu: kolejny etap (patrz <code>docs/EXTERNAL_APIS.md</code>).</span></p>
      </motion.div>
    </div>
  );
}
