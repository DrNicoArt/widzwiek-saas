"use client";
// /app — Przegląd: pulpit z szybkim startem, statystykami, skrótem raportu WCAG i ostatnimi projektami.
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DEMO_PROJECTS, DEMO_STATS, type DemoProject } from "@/lib/mockData";
import { DEMO_DOC } from "@/lib/demoDoc";
import { listJobs } from "@/lib/api";
import type { Job } from "@/lib/contract";
import PageHeader from "@/components/shell/PageHeader";
import StatTile from "@/components/ui/StatTile";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Icon, { type IconName } from "@/components/ui/Icon";
import BrandEye from "@/components/brand/BrandEye";
import WaveformField from "@/components/scene/WaveformField";
import ProjectCard from "@/components/dashboard/ProjectCard";
import Tilt from "@/components/fx/Tilt";
import Magnetic from "@/components/fx/Magnetic";
import { fadeUp, stagger, inView } from "@/lib/motion";

const score = Math.max(0, 100 - DEMO_DOC.wcag.stats.error_count * 15 - DEMO_DOC.wcag.stats.warning_count * 4);

export default function Przeglad() {
  const [stats, setStats] = useState(DEMO_STATS);
  const [value, setValue] = useState<{ minutes: number; projects: number; issues: number; savings: number } | null>(null);
  useEffect(() => {
    listJobs().then((jobs: Job[]) => {
      if (!jobs || jobs.length === 0) return;
      const inProgress = jobs.filter((j) => j.status === "processing" || j.status === "queued").length;
      const ok = jobs.filter((j) => j.result?.wcag.compliant).length;
      const review = jobs.filter((j) => j.status === "done" && j.result && !j.result.wcag.compliant).length;
      setStats([
        { label: "Wszystkie materiały", value: jobs.length, icon: "folder" },
        { label: "W toku", value: inProgress, icon: "clock" },
        { label: "Zgodne z WCAG", value: ok, icon: "checkCircle" },
        { label: "Do poprawy", value: review, icon: "alert" },
      ]);
      const done = jobs.filter((j) => j.result);
      const minutes = done.reduce((a, j) => a + Math.max(1, Math.ceil((j.result!.media.duration_ms || 0) / 60000)), 0);
      const issues = done.reduce((a, j) => a + j.result!.wcag.stats.error_count + j.result!.wcag.stats.warning_count, 0);
      setValue({ minutes, projects: jobs.length, issues, savings: minutes * 10 });
    }).catch(() => {});
  }, []);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader icon="grid" title="Przegląd" desc="Pulpit Pracowni Widźwięk — szybki start, statystyki i ostatnie projekty." />

      {/* Szybki start */}
      <Tilt className="mb-8" max={4}>
        <motion.div initial="hidden" animate="show" variants={fadeUp}
          className="border-aurora glass-premium relative overflow-hidden rounded-3xl p-8">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-70"><WaveformField baseOpacity={0.10} accentColor="#FB5E26" height={150} /></div>
          <img src="/brand/sygnet.svg" alt="" aria-hidden draggable={false} className="pointer-events-none absolute -right-8 -top-8 w-[30%] max-w-[320px] opacity-[0.06]" />
          <div className="relative grid items-center gap-6 md:grid-cols-[1.4fr_1fr]">
            <div>
              <Badge tone="info" icon="sparkles">Tryb demo · mock</Badge>
              <h2 className="mt-3 text-2xl font-medium tracking-tight md:text-3xl"><span className="text-shimmer">Napisy zgodne z WCAG</span> <span className="text-graphite">— gotowe do publikacji</span></h2>
              <p className="mt-1 max-w-lg text-sm text-muted">Captions, nie zwykłe subtitles: mowa, mówcy i dźwięki niewerbalne, raport zgodności i eksport SRT/VTT — z jednego pliku audio lub wideo.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Magnetic><Link href="/app/studio"><Button icon="upload">Nowy materiał</Button></Link></Magnetic>
                <Magnetic><Link href="/app/studio?sample=1"><Button variant="secondary" icon="play">Użyj przykładowego materiału</Button></Link></Magnetic>
              </div>
            </div>
            <div className="hidden justify-self-center md:block">
              <div className="relative grid h-36 w-36 place-items-center animate-floatY">
                <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(closest-side, rgba(0,87,168,0.12), rgba(0,87,168,0))" }} />
                <div className="absolute -inset-3 rounded-full animate-huepulse" style={{ background: "radial-gradient(closest-side, rgba(251,94,38,0.14), rgba(251,94,38,0))" }} />
                <BrandEye width={130} breathe />
              </div>
            </div>
          </div>
        </motion.div>
      </Tilt>

      {/* Statystyki */}
      <motion.div initial="hidden" whileInView="show" viewport={inView} variants={stagger} className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} icon={s.icon as IconName}
            tone={s.label.includes("poprawy") ? "warn" : s.label.includes("Zgodne") ? "ok" : "info"} />
        ))}
      </motion.div>

      {value && value.projects > 0 && (
        <motion.div initial="hidden" whileInView="show" viewport={inView} variants={fadeUp}
          className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ok/30 bg-ok/5 p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Wartość, którą już uzyskałeś</p>
            <p className="mt-1 text-2xl font-medium text-graphite tnum">≈ {value.savings} zł zaoszczędzone</p>
            <p className="text-xs text-muted">vs ręczne napisy ~10 zł/min · {value.minutes} min przetworzonego materiału</p>
          </div>
          <div className="flex gap-6 text-center">
            <div><div className="tnum text-xl font-medium text-graphite">{value.projects}</div><div className="text-xs text-muted">projekty</div></div>
            <div><div className="tnum text-xl font-medium text-graphite">{value.minutes}</div><div className="text-xs text-muted">minuty</div></div>
            <div><div className="tnum text-xl font-medium text-graphite">{value.issues}</div><div className="text-xs text-muted">problemy WCAG</div></div>
          </div>
        </motion.div>
      )}

      {/* Skrót raportu WCAG + ostatnie projekty */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <motion.div initial="hidden" whileInView="show" viewport={inView} variants={fadeUp}
          className="spotlight rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm transition-shadow hover:shadow-lift">
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
