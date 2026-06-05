"use client";
// Eksport SRT/VTT generowany po stronie klienta z dowolnego CaptionDocument (działa bez workera).
// Duże, jednoznaczne CTA + opis formatów. Używane na /app/eksporty oraz w sample flow Studio.
import { useState } from "react";
import { motion } from "framer-motion";
import type { CaptionDocument } from "@/lib/contract";
import { toSrt, toVtt, downloadText } from "@/lib/exportClient";
import Icon from "@/components/ui/Icon";
import { fadeUp, stagger, inView, cardHover } from "@/lib/motion";

export default function ExportButtons({ doc }: { doc: CaptionDocument }) {
  const base = doc.media.filename.replace(/\.[^.]+$/, "");
  const [done, setDone] = useState<string | null>(null);
  const FORMATS = [
    { fmt: "srt", title: "Pobierz SRT", desc: "Najszersza kompatybilność — YouTube, Vimeo, VLC, większość odtwarzaczy i LMS. Sam tekst z timingiem.", make: () => toSrt(doc), mime: "application/x-subrip" },
    { fmt: "vtt", title: "Pobierz VTT", desc: "Lepszy dla webu i dostępności (HTML5 <track>) — pozwala na kolory mówców, pozycjonowanie i rozdziały.", make: () => toVtt(doc), mime: "text/vtt" },
  ] as const;

  return (
    <motion.div initial="hidden" whileInView="show" viewport={inView} variants={stagger} className="grid gap-4 sm:grid-cols-2">
      {FORMATS.map((f) => (
        <motion.div key={f.fmt} variants={fadeUp} whileHover={cardHover}
          className="flex flex-col rounded-2xl border border-hair/70 bg-white/85 p-5 shadow-card backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name="file" size={20} /></span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-graphite">.{f.fmt}</span>
          </div>
          <p className="flex-1 text-sm text-muted">{f.desc}</p>
          <button
            onClick={() => { downloadText(`${base}.${f.fmt}`, f.make(), f.mime); setDone(f.fmt); setTimeout(() => setDone(null), 1800); }}
            className="focusring mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700">
            {done === f.fmt ? <><Icon name="check" size={18} /> Pobrano</> : <><Icon name="download" size={18} /> {f.title}</>}
          </button>
        </motion.div>
      ))}
    </motion.div>
  );
}
