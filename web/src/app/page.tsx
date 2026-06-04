"use client";

import { useEffect, useState } from "react";
import { checkHealth, createJob, getJob } from "@/lib/api";
import type { Job } from "@/lib/contract";
import CaptionTable from "@/components/CaptionTable";
import ExportButtons from "@/components/ExportButtons";
import WcagReportView from "@/components/WcagReportView";

type Phase = "idle" | "uploading" | "processing" | "done" | "error";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workerUp, setWorkerUp] = useState<boolean | null>(null);

  useEffect(() => {
    checkHealth().then(setWorkerUp);
  }, []);

  async function handleRun() {
    if (!file) return;
    setError(null);
    setJob(null);
    setPhase("uploading");
    try {
      const created = await createJob(file);
      setPhase("processing");
      // Worker (mock) kończy synchronicznie, ale odpytujemy dla realnego, długiego AI.
      let current = created;
      let tries = 0;
      while (current.status !== "done" && current.status !== "error" && tries < 60) {
        await new Promise((r) => setTimeout(r, 600));
        current = await getJob(created.id);
        tries += 1;
      }
      setJob(current);
      if (current.status === "error") {
        setError(current.error || "Przetwarzanie zakończone błędem.");
        setPhase("error");
      } else {
        setPhase("done");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nieznany błąd.");
      setPhase("error");
    }
  }

  const busy = phase === "uploading" || phase === "processing";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Widźwięk <span className="text-brand">·</span>{" "}
          <span className="text-base font-normal text-slate-500">napisy zgodne z WCAG</span>
        </h1>
        <p className="mt-1 text-slate-600">
          Wgraj audio lub wideo, a otrzymasz transkrypcję, mówców, opisy dźwięków, napisy SRT/VTT
          i raport zgodności WCAG 2.1 AA.
        </p>
        {workerUp === false && (
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Worker nie odpowiada. Uruchom backend: <code>uvicorn widzwiek.main:app --port 8000</code>.
          </p>
        )}
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">Plik audio / wideo</label>
        <input
          type="file"
          accept="audio/*,video/*"
          disabled={busy}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
        />
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleRun}
            disabled={!file || busy}
            className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Przetwarzanie…" : "Przetwórz"}
          </button>
          {phase !== "idle" && (
            <span className="text-sm text-slate-500">
              Status: <strong>{job?.status ?? phase}</strong>
            </span>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          PoC: pipeline działa na mocku — zwróci przykładowy materiał PL, by pokazać pełny przepływ.
        </p>
      </section>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {job?.result && (
        <div className="mt-6 space-y-6">
          <WcagReportView report={job.result.wcag} />
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {job.result.media.filename} · {(job.result.media.duration_ms / 1000).toFixed(1)} s ·
              silniki: {job.result.meta.pipeline.asr}/{job.result.meta.pipeline.diarization}/
              {job.result.meta.pipeline.sound_events}
            </p>
            <ExportButtons jobId={job.id} />
          </div>
          <CaptionTable doc={job.result} />
        </div>
      )}

      <footer className="mt-12 text-center text-xs text-slate-400">
        SubrosAI · Widźwięk · demo PoC
      </footer>
    </main>
  );
}
