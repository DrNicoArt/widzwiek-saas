"use client";
// /app — Przegląd: pulpit z szybkim startem, statystykami, skrótem raportu WCAG i ostatnimi projektami.
import Link from "next/link";
import { motion } from "framer-motion";
import { DEMO_PROJECTS, DEMO_STATS, type DemoProject } from "@/lib/mockData";
import { DEMO_DOC } from "@/lib/demoDoc";
import PageHeader from "@/components/shell/PageHeader";
import StatTile from "@/components/ui/StatTile";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Icon, { type IconName } from "@/components/ui/Icon";
import BrandEye from "@/components/brand/BrandEye";
import WaveformField from "@/components/scene/WaveformField";
import ProjectCard from "@/components/dashboard/ProjectCard";
import { fadeUp, stagger, inView } from "@/lib/motion";

const score = Math.max(0, 100 - DEMO_DOC.wcag.stats.error_count * 15 - DEMO_DOC.wcag.stats.warning_count * 4);

export default function Przeglad() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader icon="grid" title="Przegląd" desc="Pulpit Pracowni Widźwięk — szybki start, statystyki i ostatnie projekty." />

      {/* Szybki start */}
      <motion.div initial="hidden" animate="show" variants={fadeUp}
        className="relative mb-8 overflow-hidden rounded-3xl border border-hair/70 bg-white/55 p-8 shadow-card backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-70"><WaveformField baseOpacity={0.10} height={150} /></div>
        <img src="/brand/sygnet.svg" alt="" aria-hidden draggable={false} className="pointer-events-none absolute -right-8 -top-8 w-[30%] max-w-[320px] opacity-[0.06]" />
        <div className="relative grid items-center gap-6 md:grid-cols-[1.4fr_1fr]">
          <div>
            <Badge tone="info" icon="sparkles">Tryb demo · mock</Badge>
            <h2 className="mt-3 text-2xl font-medium tracking-tight text-graphite md:text-3xl">Napisy zgodne z WCAG — gotowe do publikacji</h2>
            <p className="mt-1 max-w-lg text-sm text-muted">Captions, nie zwykłe subtitles: mowa, mówcy i dźwięki niewerbalne, raport zgodności i eksport SRT/VTT — z jednego pliku audio lub wideo.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/app/studio"><Button icon="upload">Nowy materiał</Button></Link>
              <Link href="/app/studio?sample=1"><Button variant="secondary" icon="play">Użyj przykładowego materiału</Button></Link>
            </div>
          </div>
          <div className="hidden justify-self-center md:block">
            <div className="relative grid h-36 w-36 place-items-center">
              <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(closest-side, rgba(0,87,168,0.12), rgba(0,87,168,0))" }} />
              <BrandEye width={130} breathe />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Statystyki */}
      <motion.div initial="hidden" whileInView="show" viewport={inView} variants={stagger} className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {DEMO_STATS.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} icon={s.icon as IconName}
            tone={s.label.includes("poprawy") ? "warn" : s.label.includes("Zgodne") ? "ok" : "info"} />
        ))}
      </motion.div>

      {/* Skrót raportu WCAG + ostatnie projekty */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <motion.div initial="hidden" whileInView="show" viewport={inView} variants={fadeUp}
          className="rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="shield" size={18} className="text-ok" /> Ostatni raport WCAG</h3>
            <Badge tone="ok">TAK</Badge>
          </div>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-4xl font-medium tnum text-graphite">{score}%</span>
            <span className="pb-1 text-xs text-muted">WCAG 2.1 AA</span>
          </div>
          <p className="mt-2 text-sm text-muted">{DEMO_DOC.wcag.stats.error_count} błędów · {DEMO_DOC.wcag.stats.warning_count} ostrzeżenie · {DEMO_DOC.wcag.stats.cue_count} napisów.</p>
          <Link href="/app/projekty/p1/raport" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">Zobacz raport <Icon name="chevron" size={15} /></Link>
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={inView} variants={stagger}>
          <motion.div variants={fadeUp} className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-graphite">Ostatnie projekty</h3>
            <Link href="/app/projekty" className="text-xs font-medium text-brand-700 hover:underline">Wszystkie →</Link>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {DEMO_PROJECTS.slice(0, 3).map((p: DemoProject) => <ProjectCard key={p.id} p={p} />)}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
