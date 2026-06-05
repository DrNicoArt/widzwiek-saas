"use client";
// Eksporty — pobranie SRT/VTT generowane po stronie klienta z przykładowego CaptionDocument
// (działa bez workera). Realny eksport joba jest też w /app/studio po przetworzeniu.
import { useState } from "react";
import { motion } from "framer-motion";
import { DEMO_DOC } from "@/lib/demoDoc";
import { toSrt, toVtt, downloadText } from "@/lib/exportClient";
import PageHeader from "@/components/shell/PageHeader";
import Icon from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { fadeUp, stagger, inView, cardHover } from "@/lib/motion";

const base = DEMO_DOC.media.filename.replace(/\.[^.]+$/, "");
const FORMATS = [
  { fmt: "srt", title: "SRT", desc: "Kompatybilność: YouTube i większość platform. Bez kolorów mówców.", make: () => toSrt(DEMO_DOC), mime: "application/x-subrip" },
  { fmt: "vtt", title: "VTT", desc: "Pełniejsza zgodność WCAG: kolory mówców i pozycjonowanie (HTML5).", make: () => toVtt(DEMO_DOC), mime: "text/vtt" },
] as const;

export default function Eksporty() {
  const [done, setDone] = useState<string | null>(null);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader icon="download" title="Eksporty" demo desc={`Pobierz napisy z przykładu „${DEMO_DOC.media.filename}". Pliki generowane lokalnie z kontraktu CaptionDocument.`} />
      <motion.div initial="hidden" whileInView="show" viewport={inView} variants={stagger} className="grid gap-4 sm:grid-cols-2">
        {FORMATS.map((f) => (
          <motion.button key={f.fmt} variants={fadeUp} whileHover={cardHover} whileTap={{ scale: 0.99 }}
            onClick={() => { downloadText(`${base}.${f.fmt}`, f.make(), f.mime); setDone(f.fmt); setTimeout(() => setDone(null), 1800); }}
            className="focusring group flex items-center gap-4 rounded-2xl border border-hair/70 bg-white/80 p-5 text-left shadow-card backdrop-blur-sm">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name="file" size={22} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-graphite">Pobierz {f.title}</span>
                {done === f.fmt && <span className="inline-flex items-center gap-1 text-xs font-medium text-ok"><Icon name="check" size={14} /> pobrano</span>}
              </div>
              <p className="mt-0.5 text-xs text-muted">{f.desc}</p>
            </div>
            <Icon name="download" size={20} className="text-muted transition-colors group-hover:text-brand-600" />
          </motion.button>
        ))}
      </motion.div>

      <motion.div initial="hidden" whileInView="show" viewport={inView} variants={fadeUp}
        className="mt-6 flex items-center gap-3 rounded-2xl border border-ok/30 bg-ok/5 p-4">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-ok/10 text-ok"><Icon name="checkCircle" size={18} /></span>
        <p className="text-sm text-graphite">Materiał gotowy do publikacji jako dostępny cyfrowo — <strong>spełnia WCAG 2.1 AA</strong>.
          <span className="text-muted"> EBU-TT i PDF raportu: kolejny etap (patrz <code>docs/EXTERNAL_APIS.md</code>).</span></p>
      </motion.div>
    </div>
  );
}
