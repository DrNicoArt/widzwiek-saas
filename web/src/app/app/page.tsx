"use client";
// /app — Przegląd: pulpit. Statystyki, wartość, skrót raportu WCAG i ostatnie projekty
// liczone z REALNYCH materiałów (listJobs); przykłady tylko jako fallback, gdy brak materiałów.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SAMPLE_PROJECTS, SAMPLE_STATS, type SampleProject } from "@/lib/sampleData";
import { SAMPLE_DOC } from "@/lib/sampleDoc";
import { listJobs } from "@/lib/api";
import { BRAND } from "@/lib/brand";
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

const sampleScore = Math.max(0, 100 - SAMPLE_DOC.wcag.stats.error_count * 15 - SAMPLE_DOC.wcag.stats.warning_count * 4);
const byUpdatedDesc = (a: Job, b: Job) => +new Date(b.updated_at) - +new Date(a.updated_at);
function dur(ms: number): string { const t = Math.round(ms / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`; }
function scoreOf(j: Job): number { if (!j.result) return 0; const s = j.result.wcag.stats; return Math.max(0, 100 - s.error_count * 15 - s.warning_count * 4); }
function jobToCard(j: Job): SampleProject {
  const status: SampleProject["status"] = j.status === "done" ? "done" : j.status === "error" ? "review" : "processing";
  return { id: j.id, title: j.filename || "Materiał", durationLabel: j.result ? dur(j.result.media.duration_ms) : "—", status, wcag: scoreOf(j), updated: new Date(j.updated_at).toLocaleDateString("pl-PL"), accent: "#0057A8" };
}

export default function Przeglad() {
  const [jobs, setJobs] = useState<Job[]>([]);
  useEffect(() => { listJobs().then((j: Job[]) => setJobs(j ?? [])).catch(() => {}); }, []);

  const hasReal = jobs.length > 0;

  const stats = useMemo(() => {
    if (!hasReal) return SAMPLE_STATS as { label: string; value: number; icon: string }[];
    const inProgress = jobs.filter((j) => j.status === "processing" || j.status === "queued").length;
    const ok = jobs.filter((j) => j.result?.wcag.compliant).length;
    const review = jobs.filter((j) => j.status === "done" && j.result && !j.result.wcag.compliant).length;
    return [
      { label: "Wszystkie materiały", value: jobs.length, icon: "folder" },
      { label: "W toku", value: inProgress, icon: "clock" },
      { label: "Zgodne z WCAG", value: ok, icon: "checkCircle" },
      { label: "Do poprawy", value: review, icon: "alert" },
    ];
  }, [jobs, hasReal]);

  const value = useMemo(() => {
    if (!hasReal) return null;
    const done = jobs.filter((j) => j.result);
    const minutes = done.reduce((a, j) => a + Math.max(1, Math.ceil((j.result!.media.duration_ms || 0) / 60000)), 0);
    const issues = done.reduce((a, j) => a + j.result!.wcag.stats.error_count + j.result!.wcag.stats.warning_count, 0);
    return { minutes, projects: jobs.length, issues, savings: minutes * 10 };
  }, [jobs, hasReal]);

  const recent = useMemo(() => (hasReal ? [...jobs].sort(byUpdatedDesc).slice(0, 3).map(jobToCard) : SAMPLE_PROJECTS.slice(0, 3)), [jobs, hasReal]);

  // Najnowszy materiał z gotowym raportem WCAG (fallback: przykład).
  const report = useMemo(() => {
    const latest = [...jobs].filter((j) => j.result).sort(byUpdatedDesc)[0];
    if (latest?.result) {
      const w = latest.result.wcag;
      return { real: true, id: latest.id, score: scoreOf(latest), compliant: w.compliant, errors: w.stats.error_count, warnings: w.stats.warning_count, cues: w.stats.cue_count };
    }
    const w = SAMPLE_DOC.wcag;
    return { real: false, id: "p1", score: sampleScore, compliant: w.compliant, errors: w.stats.error_count, warnings: w.stats.warning_count, cues: w.stats.cue_count };
  }, [jobs]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader icon="grid" title="Przegląd" desc={`Pulpit Pracowni ${BRAND.name} — szybki start, statystyki i ostatnie projekty.`} />

      {/* Szybki start */}
      <Tilt className="mb-8" max={4}>
        <motion.div initial="hidden" animate="show" variants={fadeUp}
          className="border-aurora glass-premium relative overflow-hidden rounded-3xl p-8">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-70"><WaveformField baseOpacity={0.10} accentColor="#FB5E26" height={150} /></div>
          <img src={BRAND.assets.sygnet} alt="" aria-hidden draggable={false} className="pointer-events-none absolute -right-8 -top-8 w-[30%] max-w-[320px] opacity-[0.06]" />
          <div className="relative grid items-center gap-6 md:grid-cols-[1.4fr_1fr]">
            <div>
              <Badge tone="info" icon="sparkles">WCAG 2.1 AA</Badge>
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
            <h3 className="inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="shield" size={18} className={report.compliant ? "text-ok" : "text-warn"} /> Ostatni raport WCAG</h3>
            <Badge tone={report.compliant ? "ok" : "warn"}>{report.compliant ? "TAK" : "DO POPRAWY"}</Badge>
          </div>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-4xl font-medium tnum text-graphite">{report.score}%</span>
            <span className="pb-1 text-xs text-muted">WCAG 2.1 AA</span>
          </div>
          <p className="mt-2 text-sm text-muted">{report.errors} błędów · {report.warnings} ostrzeżeń · {report.cues} napisów.</p>
          <Link href={`/app/projekty/${report.id}/raport`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">Zobacz raport <Icon name="chevron" size={15} /></Link>
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={inView} variants={stagger}>
          <motion.div variants={fadeUp} className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-graphite">Ostatnie projekty</h3>
            <Link href="/app/projekty" className="text-xs font-medium text-brand-700 hover:underline">Wszystkie →</Link>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recent.map((p) => <ProjectCard key={p.id} p={p} />)}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
