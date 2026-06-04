"use client";
// Pracownia Widźwięk — scena produktowa: hero "Rozpocznij analizę" → upload (signal intake)
// → processing (pipeline + żywy waveform) → raport WCAG → eksport → biblioteka.
// Zachowany kontrakt API (createJob/getJob/exportUrl). Motion L1/L2 + reveal sekcji.
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { createJob, getJob } from "@/lib/api";
import type { Job } from "@/lib/contract";
import { DEMO_PROJECTS, DEMO_STATS, type DemoProject } from "@/lib/mockData";
import { useWorkerUp } from "@/components/shell/AppShell";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import StatTile from "@/components/ui/StatTile";
import Icon, { type IconName } from "@/components/ui/Icon";
import BrandEye from "@/components/brand/BrandEye";
import WaveformField from "@/components/scene/WaveformField";
import ProcessingPipeline from "@/components/pipeline/ProcessingPipeline";
import WcagReport from "@/components/wcag/WcagReport";
import ExportTiles from "@/components/ExportTiles";
import CaptionTable from "@/components/CaptionTable";
import ProjectCard from "@/components/dashboard/ProjectCard";
import { fadeUp, stagger, inView } from "@/lib/motion";

type Phase = "idle" | "uploading" | "processing" | "done" | "error";
const pipe = (p: Phase) =>
  p === "uploading" ? { active: 0, progress: 12, error: false } :
  p === "processing" ? { active: 3, progress: 64, error: false } :
  p === "done" ? { active: 6, progress: 100, error: false } :
  p === "error" ? { active: 3, progress: 100, error: true } :
  { active: -1, progress: 0, error: false };

export default function Pracownia() {
  const workerUp = useWorkerUp();
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const studioRef = useRef<HTMLDivElement>(null);
  const busy = phase === "uploading" || phase === "processing";

  function pick() { inputRef.current?.click(); }
  function goStudio() { studioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }

  async function handleRun() {
    if (!file) return;
    setError(null); setJob(null); setPhase("uploading");
    try {
      const created = await createJob(file);
      setPhase("processing");
      let cur = created, tries = 0;
      while (cur.status !== "done" && cur.status !== "error" && tries < 60) {
        await new Promise((r) => setTimeout(r, 600));
        cur = await getJob(created.id); tries++;
      }
      setJob(cur);
      if (cur.status === "error") { setError(cur.error || "Przetwarzanie zakończone błędem."); setPhase("error"); }
      else setPhase("done");
    } catch (e) { setError(e instanceof Error ? e.message : "Nieznany błąd."); setPhase("error"); }
  }
  const ps = pipe(phase);

  return (
    <div className="mx-auto max-w-6xl">
      {/* HERO — scena "widzimy dźwięk" */}
      <Section className="mb-10">
        <div className="relative overflow-hidden rounded-3xl border border-hair/70 bg-white/55 p-8 shadow-card backdrop-blur-xl md:p-10">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-70">
            <WaveformField live={workerUp !== false} baseOpacity={0.10} height={180} />
          </div>
          <img src="/brand/sygnet.svg" alt="" aria-hidden draggable={false}
            className="pointer-events-none absolute -right-10 -top-10 w-[40%] max-w-[420px] opacity-[0.06]" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1.3fr_1fr]">
            <motion.div variants={stagger} initial="hidden" animate="show">
              <motion.div variants={fadeUp} className="mb-3 flex flex-wrap gap-2">
                <Badge tone="info" icon="sparkles">Tryb demo · mock</Badge>
                <Badge tone="ok" icon="shield">WCAG 2.1 AA</Badge>
              </motion.div>
              <motion.h2 variants={fadeUp} className="text-3xl font-medium leading-tight tracking-tight text-graphite md:text-4xl">
                Zobacz to,<br /><span className="text-brand-600">co inni słyszą.</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
                Wgraj audio lub wideo. Widźwięk przeprowadzi sygnał przez transkrypcję, rozpoznanie mówców
                i opis dźwięków — aż do napisów zgodnych z WCAG i gotowego eksportu.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center gap-3">
                <Button icon="upload" onClick={() => { goStudio(); setTimeout(pick, 350); }}>Rozpocznij analizę</Button>
                <Button variant="secondary" icon="play" onClick={goStudio}>Zobacz przepływ</Button>
              </motion.div>
            </motion.div>
            <motion.div variants={fadeUp} initial="hidden" animate="show" className="hidden justify-self-center md:block">
              <div className="relative grid h-44 w-44 place-items-center">
                <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(closest-side, rgba(0,87,168,0.12), rgba(0,87,168,0))" }} />
                <BrandEye width={150} breathe />
              </div>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* STATYSTYKI systemu */}
      <Section className="mb-10">
        <motion.div variants={stagger} className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {DEMO_STATS.map((s) => (
            <StatTile key={s.label} label={s.label} value={s.value} icon={s.icon as IconName}
              tone={s.label.includes("poprawy") ? "warn" : s.label.includes("Zgodne") ? "ok" : "info"} />
          ))}
        </motion.div>
      </Section>

      {/* STUDIO: upload → processing → wynik */}
      <div ref={studioRef} className="scroll-mt-24 space-y-6">
        <Section>
          <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl border border-hair/70 bg-white/65 p-6 shadow-card backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2">
              <Icon name="upload" size={18} className="text-brand-600" />
              <h3 className="text-sm font-medium uppercase tracking-wide text-muted">Strefa odbioru sygnału</h3>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}
              onClick={pick} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } }}
              className={[
                "focusring relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200",
                drag ? "border-brand-500 bg-brand-50 shadow-ring scale-[1.01]" : "border-hair bg-ice/50 hover:border-brand-300 hover:bg-brand-50/50",
              ].join(" ")}
            >
              {drag && <div className="pointer-events-none absolute inset-x-0 bottom-0 opacity-80"><WaveformField live baseOpacity={0.16} height={90} /></div>}
              <motion.span animate={drag ? { scale: 1.08 } : { scale: 1 }} className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-600 text-white shadow-lift">
                <Icon name="upload" size={28} />
              </motion.span>
              <p className="relative mt-4 text-[15px] font-medium text-graphite">Przeciągnij plik do systemu lub kliknij, aby wybrać</p>
              <p className="relative mt-1 text-xs text-muted">MP4, MOV, MP3, WAV, M4A — audio lub wideo</p>
              <input ref={inputRef} type="file" accept="audio/*,video/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>

            {file && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-3 rounded-xl border border-hair bg-white px-4 py-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-700"><Icon name="file" size={18} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-graphite">{file.name}</p>
                  <p className="text-xs text-muted tnum">{(file.size / 1024 / 1024).toFixed(1)} MB · gotowy do analizy</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); }} aria-label="Usuń plik" className="focusring rounded-lg p-2 text-muted hover:bg-slate-100"><Icon name="x" size={18} /></button>
              </motion.div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button onClick={handleRun} disabled={!file || busy || workerUp === false} loading={busy} icon={busy ? undefined : "play"}>
                {busy ? "Przetwarzanie…" : "Przetwórz materiał"}
              </Button>
              {workerUp === false && <span className="text-xs text-warn">Worker offline — uruchom backend, aby przetwarzać.</span>}
              {workerUp !== false && !file && <span className="text-xs text-muted">Wynik to spójny przykład PL (tryb mock).</span>}
            </div>
          </motion.div>
        </Section>

        {phase !== "idle" && (
          <Section>
            <motion.div variants={fadeUp}><ProcessingPipeline activeIndex={ps.active} progress={ps.progress} error={ps.error} /></motion.div>
          </Section>
        )}

        {error && (
          <Section>
            <motion.div variants={fadeUp} className="flex items-start gap-3 rounded-2xl border border-err/30 bg-err/5 p-5">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-err/10 text-err"><Icon name="alert" size={20} /></span>
              <div className="flex-1"><p className="text-sm font-medium text-graphite">Przetwarzanie nie powiodło się</p><p className="mt-0.5 text-sm text-muted">{error}</p></div>
              <Button variant="secondary" icon="refresh" onClick={handleRun}>Ponów</Button>
            </motion.div>
          </Section>
        )}

        {job?.result && (
          <>
            <Section>
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 rounded-2xl border border-hair/70 bg-white/70 px-5 py-4 shadow-card backdrop-blur-sm">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-700"><Icon name="file" size={20} /></span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-graphite">{job.result.media.filename}</p>
                  <p className="text-xs text-muted tnum">{(job.result.media.duration_ms / 1000).toFixed(1)} s · {job.result.cues.length} napisów</p>
                </div>
                <div className="ml-auto flex flex-wrap gap-2">
                  <Badge tone="neutral" icon="mic">ASR: {job.result.meta.pipeline.asr}</Badge>
                  <Badge tone="neutral" icon="users">{job.result.meta.pipeline.diarization}</Badge>
                  <Badge tone="neutral" icon="wave">{job.result.meta.pipeline.sound_events}</Badge>
                </div>
              </motion.div>
            </Section>
            <Section><WcagReport report={job.result.wcag} /></Section>
            <Section>
              <motion.h3 variants={fadeUp} className="mb-3 text-sm font-medium uppercase tracking-wide text-muted">Eksport</motion.h3>
              <ExportTiles jobId={job.id} />
            </Section>
            <Section><motion.div variants={fadeUp}><CaptionTable doc={job.result} /></motion.div></Section>
          </>
        )}
      </div>

      {/* BIBLIOTEKA projektów (demo) */}
      <motion.section variants={stagger} initial="hidden" whileInView="show" viewport={inView} className="mt-12">
        <motion.div variants={fadeUp} className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-graphite">Biblioteka projektów</h3>
          <span className="text-xs text-muted">dane demo</span>
        </motion.div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_PROJECTS.map((p: DemoProject) => <ProjectCard key={p.id} p={p} />)}
        </div>
      </motion.section>

      <footer className="mt-12 pb-4 text-center text-xs text-muted">SubrosAI · Widźwięk · Pracownia (PoC)</footer>
    </div>
  );
}
