"use client";
// Studio Widźwięk — flow: upload → przetwarzanie (pipeline) → raport WCAG → eksport.
// Zachowany kontrakt API (createJob/getJob/exportUrl). Animacje etapu 1: reveal sekcji,
// hover-lift kart, press buttonów, status transition. Ciężkie animacje = TODO(motion).
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { createJob, getJob } from "@/lib/api";
import type { Job } from "@/lib/contract";
import { useWorkerUp } from "@/components/shell/AppShell";
import Section from "@/components/ui/Section";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import ProcessingPipeline from "@/components/pipeline/ProcessingPipeline";
import WcagReport from "@/components/wcag/WcagReport";
import ExportTiles from "@/components/ExportTiles";
import CaptionTable from "@/components/CaptionTable";
import { fadeUp } from "@/lib/motion";

type Phase = "idle" | "uploading" | "processing" | "done" | "error";

const pipelineState = (phase: Phase): { active: number; progress: number; error: boolean } => {
  switch (phase) {
    case "uploading": return { active: 0, progress: 12, error: false };
    case "processing": return { active: 3, progress: 64, error: false };
    case "done": return { active: 6, progress: 100, error: false };
    case "error": return { active: 3, progress: 100, error: true };
    default: return { active: -1, progress: 0, error: false };
  }
};

export default function Studio() {
  const workerUp = useWorkerUp();
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = phase === "uploading" || phase === "processing";

  async function handleRun() {
    if (!file) return;
    setError(null); setJob(null); setPhase("uploading");
    try {
      const created = await createJob(file);
      setPhase("processing");
      let current = created;
      let tries = 0;
      while (current.status !== "done" && current.status !== "error" && tries < 60) {
        await new Promise((r) => setTimeout(r, 600));
        current = await getJob(created.id);
        tries += 1;
      }
      setJob(current);
      if (current.status === "error") { setError(current.error || "Przetwarzanie zakończone błędem."); setPhase("error"); }
      else setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nieznany błąd."); setPhase("error");
    }
  }

  const ps = pipelineState(phase);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Hero */}
      <Section className="mb-6">
        <motion.div variants={fadeUp} className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge tone="info" icon="sparkles">Tryb demo · mock</Badge>
              <Badge tone="ok" icon="shield">WCAG 2.1 AA</Badge>
            </div>
            <h2 className="text-2xl font-medium tracking-tight text-graphite">Nowy materiał</h2>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Wgraj plik audio lub wideo. Widźwięk zobaczy dźwięk: transkrypcja, mówcy, opisy dźwięków,
              napisy SRT/VTT i raport zgodności WCAG.
            </p>
          </div>
        </motion.div>
      </Section>

      {/* Upload */}
      <Section className="mb-6">
        <Card hover={false}>
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}
            onClick={() => inputRef.current?.click()}
            className={[
              "focusring cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all",
              drag ? "border-brand-500 bg-brand-50 shadow-ring" : "border-hair bg-ice/60 hover:border-brand-300 hover:bg-brand-50/50",
            ].join(" ")}
            role="button" tabIndex={0}
          >
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white">
              <Icon name="upload" size={26} />
            </span>
            <p className="mt-3 text-sm font-medium text-graphite">Przeciągnij plik lub kliknij, aby wybrać</p>
            <p className="mt-1 text-xs text-muted">MP4, MOV, MP3, WAV, M4A — audio lub wideo</p>
            <input ref={inputRef} type="file" accept="audio/*,video/*" className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>

          {file && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-3 rounded-xl border border-hair bg-white px-4 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-700"><Icon name="file" size={18} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-graphite">{file.name}</p>
                <p className="text-xs text-muted tnum">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
              <button onClick={() => setFile(null)} aria-label="Usuń plik" className="focusring rounded-lg p-1.5 text-muted hover:bg-slate-100"><Icon name="x" size={18} /></button>
            </motion.div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <Button onClick={handleRun} disabled={!file || busy || workerUp === false} loading={busy} icon={busy ? undefined : "play"}>
              {busy ? "Przetwarzanie…" : "Przetwórz"}
            </Button>
            {workerUp === false && <span className="text-xs text-warn">Worker offline — uruchom backend, aby przetwarzać.</span>}
          </div>
        </Card>
      </Section>

      {/* Processing */}
      {phase !== "idle" && (
        <Section className="mb-6">
          <motion.div variants={fadeUp}>
            <ProcessingPipeline activeIndex={ps.active} progress={ps.progress} error={ps.error} />
          </motion.div>
        </Section>
      )}

      {/* Error */}
      {error && (
        <Section className="mb-6">
          <motion.div variants={fadeUp} className="flex items-start gap-3 rounded-2xl border border-err/30 bg-err/5 p-5">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-err/10 text-err"><Icon name="alert" size={20} /></span>
            <div className="flex-1">
              <p className="text-sm font-medium text-graphite">Przetwarzanie nie powiodło się</p>
              <p className="mt-0.5 text-sm text-muted">{error}</p>
            </div>
            <Button variant="secondary" icon="refresh" onClick={handleRun}>Ponów</Button>
          </motion.div>
        </Section>
      )}

      {/* Result */}
      {job?.result && (
        <div className="space-y-6">
          <Section>
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 rounded-2xl border border-hair bg-white/90 px-5 py-4 shadow-card">
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

          <Section>
            <motion.div variants={fadeUp}><CaptionTable doc={job.result} /></motion.div>
          </Section>
        </div>
      )}
    </div>
  );
}
