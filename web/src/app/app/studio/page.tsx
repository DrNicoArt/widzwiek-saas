"use client";
// /app/studio — działający flow: upload → przetwarzanie (worker mock) → wynik (transkrypcja,
// napisy, mówcy/dźwięki, raport WCAG, eksport). Wymaga uruchomionego workera.
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { createJob, getJob } from "@/lib/api";
import type { Job } from "@/lib/contract";
import { useWorkerUp } from "@/components/shell/AppShell";
import PageHeader from "@/components/shell/PageHeader";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import ProcessingPipeline from "@/components/pipeline/ProcessingPipeline";
import WcagReport from "@/components/wcag/WcagReport";
import ExportTiles from "@/components/ExportTiles";
import TranscriptTable from "@/components/result/TranscriptTable";
import CaptionsTable from "@/components/result/CaptionsTable";
import SpeakersSounds from "@/components/result/SpeakersSounds";
import { fadeUp } from "@/lib/motion";

type Phase = "idle" | "uploading" | "processing" | "done" | "error";
const pipe = (p: Phase) =>
  p === "uploading" ? { active: 0, progress: 12, error: false } :
  p === "processing" ? { active: 3, progress: 64, error: false } :
  p === "done" ? { active: 6, progress: 100, error: false } :
  p === "error" ? { active: 3, progress: 100, error: true } :
  { active: -1, progress: 0, error: false };

function L({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <motion.div variants={fadeUp} className="mb-3 flex items-center gap-2">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-50 text-[11px] font-medium text-brand-700">{n}</span>
      <h3 className="text-sm font-medium uppercase tracking-wide text-muted">{children}</h3>
    </motion.div>
  );
}

export default function Studio() {
  const workerUp = useWorkerUp();
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = phase === "uploading" || phase === "processing";
  const pick = () => inputRef.current?.click();

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
    <div className="mx-auto max-w-5xl">
      <PageHeader icon="upload" title="Nowy materiał"
        desc="Wgraj plik audio/wideo i uruchom przetwarzanie. W trybie mock zobaczysz pełny przepływ bez zewnętrznych API (wynik to spójny przykład PL)." />

      <div className="space-y-8">
        <Section>
          <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl border border-hair/70 bg-white/70 p-6 shadow-card backdrop-blur-sm">
            <L n={1}>Materiał</L>
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) setFile(f); }}
              onClick={pick} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } }}
              className={["focusring relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200",
                drag ? "border-brand-500 bg-brand-50 shadow-ring scale-[1.01]" : "border-hair bg-ice/50 hover:border-brand-300 hover:bg-brand-50/50"].join(" ")}>
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-600 text-white shadow-lift"><Icon name="upload" size={28} /></span>
              <p className="mt-4 text-[15px] font-medium text-graphite">Przeciągnij plik lub kliknij, aby wybrać</p>
              <p className="mt-1 text-xs text-muted">MP4, MOV, MP3, WAV, M4A — audio lub wideo</p>
              <input ref={inputRef} type="file" accept="audio/*,video/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            {file && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-hair bg-white px-4 py-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-700"><Icon name="file" size={18} /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-graphite">{file.name}</p><p className="text-xs text-muted tnum">{(file.size / 1024 / 1024).toFixed(1)} MB · gotowy</p></div>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); }} aria-label="Usuń plik" className="focusring rounded-lg p-2 text-muted hover:bg-slate-100"><Icon name="x" size={18} /></button>
              </div>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button onClick={handleRun} disabled={!file || busy || workerUp === false} loading={busy} icon={busy ? undefined : "play"}>{busy ? "Przetwarzanie…" : "Przetwórz materiał"}</Button>
              {workerUp === false && <span className="text-xs text-warn">Worker offline — uruchom: <code>uvicorn widzwiek.main:app --port 8000</code></span>}
            </div>
          </motion.div>
        </Section>

        {phase !== "idle" && (
          <Section><motion.div variants={fadeUp}><L n={2}>Przetwarzanie</L><ProcessingPipeline activeIndex={ps.active} progress={ps.progress} error={ps.error} /></motion.div></Section>
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
            <Section><L n={3}>Transkrypcja</L><motion.div variants={fadeUp}><TranscriptTable doc={job.result} /></motion.div></Section>
            <Section><L n={4}>Napisy</L><motion.div variants={fadeUp}><CaptionsTable doc={job.result} report={job.result.wcag} /></motion.div></Section>
            <Section><L n={5}>Mówcy i dźwięki</L><SpeakersSounds doc={job.result} /></Section>
            <Section><L n={6}>Raport WCAG</L><WcagReport report={job.result.wcag} /></Section>
            <Section><L n={7}>Eksport</L><ExportTiles jobId={job.id} /></Section>
            <Section>
              <motion.p variants={fadeUp} className="text-center text-xs text-muted">
                Chcesz zobaczyć gotowe sekcje bez workera? Sprawdź <Link href="/app/napisy" className="text-brand-700 underline">Napisy</Link>,{" "}
                <Link href="/app/mowcy" className="text-brand-700 underline">Mówcy i dźwięki</Link>,{" "}
                <Link href="/app/eksporty" className="text-brand-700 underline">Eksporty</Link> (dane demo).
              </motion.p>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
