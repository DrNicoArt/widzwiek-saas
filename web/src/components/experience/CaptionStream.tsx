"use client";
// "Porządek" — chaos fali zamienia się w segmenty napisów. Staggered reveal, timestampy,
// dźwięki niewerbalne w nawiasach. Motyw powtarzalny: captions + timestamps.
import { motion } from "framer-motion";

type Line = { t: string; spk?: string; txt: string; sound?: boolean };
const LINES: Line[] = [
  { t: "00:00", txt: "[muzyka spokojna w tle]", sound: true },
  { t: "00:02", spk: "Lektor", txt: "Dzień dobry, witam w kursie" },
  { t: "00:05", txt: "o dostępności cyfrowej." },
  { t: "00:09", txt: "[oklaski]", sound: true },
  { t: "00:11", spk: "Ekspertka", txt: "Napisy widzą dźwięk." },
];

export default function CaptionStream({ show }: { show: boolean }) {
  return (
    <motion.ul
      initial="hidden" animate={show ? "show" : "hidden"}
      variants={{ show: { transition: { staggerChildren: 0.09 } } }}
      className="w-full max-w-md space-y-2"
    >
      {LINES.map((l, i) => (
        <motion.li key={i}
          variants={{ hidden: { opacity: 0, x: 18, filter: "blur(4px)" }, show: { opacity: 1, x: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 260, damping: 26 } } }}
          className="flex items-center gap-2.5 rounded-xl border border-hair/70 bg-white/70 px-3 py-2 backdrop-blur-sm">
          <span className="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-brand-700">{l.t}</span>
          <span className={l.sound ? "text-sm italic text-muted" : "text-sm text-graphite"}>
            {l.spk && <span className="mr-1 font-medium text-brand-700">{l.spk}:</span>}
            {l.txt}
          </span>
        </motion.li>
      ))}
    </motion.ul>
  );
}
