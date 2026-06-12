"use client";
// /app/studio — flow: upload → przetwarzanie → wynik (transkrypcja, napisy, mówcy/dźwięki, raport
// WCAG, eksport). Działa z workerem; ma też tryb PRZYKŁADOWY (sample) — pełny wynik bez backendu.
import { Suspense, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createJob, getJob, importJob, listJobs, IS_BROWSER_MODE } from "@/lib/api";
import type { Job } from "@/lib/contract";
import { buildSampleJob, estimateCredits } from "@/lib/sampleJob";
import { SAMPLE_DOC } from "@/lib/sampleDoc";
import { probeAudioPresence } from "@/lib/audioProbe";
import { parseSubtitles } from "@/lib/importSubs";
import { transcribeWithProvider } from "@/lib/cloudAsr";
import { transcribeLocally, type LocalProgress } from "@/lib/localAsr";
import { getAsrModel } from "@/lib/asrModel";
import { ENGINE_MODES, getEngineMode, setEngineMode, type EngineMode } from "@/lib/engineMode";
import { getUserAsr } from "@/lib/userKey";
import { DEFAULT_PROCESSING_DECISION } from "@/lib/orchestration";
import { useWorkerUp } from "@/components/shell/AppShell";
import PageHeader from "@/components/shell/PageHeader";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import ProcessingPipeline from "@/components/pipeline/ProcessingPipeline";
import WcagReport from "@/components/wcag/WcagReport";
import ExportTiles from "@/components/ExportTiles";
import ExportButtons from "@/components/ExportButtons";
import TranscriptTable from "@/components/result/TranscriptTable";
import CaptionsTable from "@/components/result/CaptionsTable";
import SpeakersSounds from "@/components/result/SpeakersSounds";
import ProjectCard from "@/components/dashboard/ProjectCard";
import { SAMPLE_PROJECTS, type SampleProject } from "@/lib/sampleData";
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

function UsageEstimate({ durationMs }: { durationMs: number }) {
  const minutes = Math.max(1, Math.ceil(durationMs / 60000));
  const credits = estimateCredits(durationMs, { speakers: true, sounds: true, wcag: true });
  const feats = ["Sprawdzenie istniejących napisów", "Transkrypcja tylko gdy potrzebna", "Mówcy", "Dźwięki niewerbalne", "Walidacja WCAG", "Eksport SRT/VTT"];
  return (
    <motion.div variants={fadeUp} className="mt-4 rounded-xl border border-hair/70 bg-brand-50/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="sparkles" size={16} className="text-brand-600" /> Szacunek kosztu</h4>
        <span className="text-xs text-muted">~{minutes} min materiału</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {feats.map((f) => <span key={f} className="rounded-full bg-white px-2 py-0.5 text-[11px] text-graphite ring-1 ring-hair/60">{f}</span>)}
      </div>
      <p className="mt-2 text-sm text-graphite">Szacowany koszt: <strong className="tnum">≈ {credits} kredytów</strong>. <span className="text-muted">Na tym etapie nic nie jest pobierane.</span></p>
      <p className="mt-1 text-xs text-muted">Ścieżka automatyczna: {DEFAULT_PROCESSING_DECISION.path.slice(0, 4).join(" → ")}.</p>
    </motion.div>
  );
}

function jobToCard(j: Job): SampleProject {
  const w = j.result?.wcag;
  const score = w ? Math.max(0, 100 - w.stats.error_count * 15 - w.stats.warning_count * 4) : 0;
  const t = j.result ? Math.round(j.result.media.duration_ms / 1000) : 0;
  return {
    id: j.id, title: j.filename || "Materiał",
    durationLabel: j.result ? `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}` : "—",
    status: j.result ? (w?.compliant ? "done" : "review") : "processing",
    wcag: score, updated: "Twój materiał", accent: "#0057A8",
  };
}

function StudioInner() {
  const workerUp = useWorkerUp();
  const params = useSearchParams();
  const router = useRouter();
  const importRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [drag, setDrag] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [job, setJob] = useState<Job | null>(null);
  const [sample, setSample] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioWarn, setAudioWarn] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [localProg, setLocalProg] = useState<LocalProgress | null>(null);
  const [asrModel, setAsrModelState] = useState<string>("");
  const [engineMode, setEngineModeState] = useState<EngineMode>("auto");
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = phase === "uploading" || phase === "processing";
  const pick = () => inputRef.current?.click();
  const MAX_MB = 200;
  function pickFile(f: File | null) {
    setSample(false);
    setSourceUrl("");
    if (!f) { setFile(null); return; }
    const okType = f.type.startsWith("audio/") || f.type.startsWith("video/") || /\.(mp3|wav|m4a|mp4|mov|mkv|aac|ogg|flac|webm)$/i.test(f.name);
    if (!okType) { setFile(null); setError("Nieobsługiwany format. Wgraj audio lub wideo (MP3, WAV, M4A, MP4, MOV...)."); return; }
    if (f.size > MAX_MB * 1024 * 1024) { setFile(null); setError(`Plik za duży (limit ${MAX_MB} MB).`); return; }
    setError(null); setFile(f); setAudioWarn(null);
    probeAudioPresence(f).then((r) => {
      if (r.ok && !r.hasAudio) setAudioWarn("Wygląda na to, że materiał nie ma słyszalnego dźwięku — napisy mogą nie powstać. Sprawdź, czy plik ma ścieżkę audio.");
    });
  }

  function runSample() {
    setError(null); setFile(null); setSourceUrl(""); setSample(true); setPhase("processing");
    setTimeout(() => { setJob(buildSampleJob()); setPhase("done"); }, 900);
  }

  async function onImport(file: File | null) {
    if (!file) return;
    setError(null); setImporting(true);
    try {
      const doc = parseSubtitles(await file.text(), file.name);
      if (!doc.cues.length) throw new Error("Nie znaleziono napisów w pliku (oczekiwano SRT lub VTT).");
      const job = await importJob(file.name, doc);
      router.push(`/app/projekty/${job.id}/napisy`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import nie powiódł się.");
    } finally { setImporting(false); }
  }

  // wejście z ?sample=1 (np. z banera offline / dashboardu)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setHasKey(!!getUserAsr()); setAsrModelState(getAsrModel()); setEngineModeState(getEngineMode()); listJobs().then(setMyJobs).catch(() => {}); if (params.get("sample") === "1") runSample(); }, []);

  async function runCloud(f: File) {
    setError(null); setSample(false); setPhase("processing");
    try {
      const asr = getUserAsr(); if (!asr) return;
      const doc = await transcribeWithProvider(f, asr);
      if (!doc.cues.length) throw new Error("Dostawca nie zwrócił transkrypcji (brak mowy w pliku?).");
      const created = await importJob(f.name, doc);
      router.push(`/app/projekty/${created.id}/napisy`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transkrypcja nie powiodła się."); setPhase("error");
    }
  }

  async function runLocal(f: File) {
    setError(null); setSample(false); setPhase("processing"); setLocalProg({ pct: 0, label: "Start…" });
    try {
      const doc = await transcribeLocally(f, (p) => setLocalProg(p));
      if (!doc.cues.length) throw new Error("Nie rozpoznano mowy w pliku.");
      const created = await importJob(f.name, doc);
      router.push(`/app/projekty/${created.id}/napisy`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transkrypcja w przeglądarce nie powiodła się.");
      setPhase("error");
    } finally { setLocalProg(null); }
  }

  async function handleRun() {
    if (!file && sourceUrl.trim()) {
      setError("Pobieranie napisów z linku wymaga wersji serwerowej. W przeglądarce wgraj plik audio/wideo albo zaimportuj SRT/VTT.");
      return;
    }
    if (!file) return;
    // Klucz usera -> realna transkrypcja w przeglądarce (działa też w trybie przeglądarkowym).
    if (getUserAsr()) { await runCloud(file); return; }
    // Tryb przeglądarkowy (Vercel, bez workera): przetwórz REALNIE wybrany plik w przeglądarce (Whisper),
    // a nie podstawiaj przykładu. Przykład jest pod osobnym przyciskiem „Wypróbuj na przykładzie".
    if (IS_BROWSER_MODE) { await runLocal(file); return; }
    setError(null); setJob(null); setSample(false); setPhase("uploading");
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
  const estMs = sample ? SAMPLE_DOC.media.duration_ms : file ? (file.size / (1024 * 1024)) * 60000 : 0;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader icon="captions" title="Studio"
        desc="Twoje miejsce pracy: wgraj nowy materiał i pracuj nad swoimi napisami — transkrypcja, mówcy, dźwięki, raport WCAG i eksport w jednym." />

      <div className="space-y-8">
        <Section>
          <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl border border-hair/70 bg-white/70 p-6 shadow-card backdrop-blur-sm">
            <L n={1}>Materiał</L>
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files?.[0] ?? null); }}
              onClick={pick} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } }}
              className={["focusring relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200",
                drag ? "border-brand-500 bg-brand-50 shadow-ring scale-[1.01]" : "border-hair bg-ice/50 hover:border-brand-300 hover:bg-brand-50/50"].join(" ")}>
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-600 text-white shadow-lift"><Icon name="upload" size={28} /></span>
              <p className="mt-4 text-[15px] font-medium text-graphite">Przeciągnij plik lub kliknij, aby wybrać</p>
              <p className="mt-1 text-xs text-muted">MP4, MOV, MP3, WAV, M4A — audio lub wideo</p>
              <input ref={inputRef} type="file" accept="audio/*,video/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
            </div>

            {!sample && !file && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-graphite"><Icon name="sparkles" size={18} className="text-brand-600" /> Nie masz pliku? Wypróbuj na przykładowym materiale.</div>
                <Button variant="secondary" icon="play" onClick={runSample} disabled={busy}>Wypróbuj na przykładzie</Button>
              </div>
            )}
            <details open className="mt-3 rounded-xl border border-hair/70 bg-white/50">
              <summary className="focusring cursor-pointer list-none px-4 py-2.5 text-sm font-medium text-graphite">Inne sposoby dodania materiału — link albo import SRT/VTT</summary>
              <div className="px-3 pb-3">
            <div className="mt-1 rounded-xl border border-hair/70 bg-white/60 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <Icon name="external" size={18} className="text-brand-600" />
                <label htmlFor="sourceUrl" className="text-sm font-medium text-graphite">Link do materiału</label>
                <Badge tone="warn">placeholder</Badge>
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input id="sourceUrl" value={sourceUrl} onChange={(e) => { setSourceUrl(e.target.value); setFile(null); setSample(false); }}
                  placeholder="YouTube, TikTok, Vimeo albo publiczny URL — orkiestrator najpierw sprawdzi dostępne napisy"
                  className="focusring min-w-0 flex-1 rounded-xl border border-hair bg-white px-3 py-2.5 text-sm text-graphite placeholder:text-muted/70" />
                <Button variant="secondary" icon="external" onClick={handleRun} disabled={!sourceUrl.trim() || busy}>Pobierz napisy z linku</Button>
              </div>
              <p className="mt-2 text-xs text-muted">Kolejność przetwarzania: sprawdzenie istniejących napisów → import transkryptu → transkrypcja tylko gdy potrzebna. Aplikacja nie pobiera materiałów z platform i nie obchodzi regulaminów.</p>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hair/70 bg-white/60 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-graphite"><Icon name="captions" size={18} className="text-brand-600" /> Masz gotowe napisy? Zaimportuj i dopracuj pod WCAG.</div>
              <Button variant="secondary" icon="upload" loading={importing} disabled={workerUp === false} onClick={() => importRef.current?.click()}>Importuj SRT / VTT</Button>
              <input ref={importRef} type="file" accept=".srt,.vtt,text/vtt,application/x-subrip" className="hidden" onChange={(e) => onImport(e.target.files?.[0] ?? null)} />
            </div>
              </div>
            </details>

            {sample && !file && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-100 text-brand-700"><Icon name="sparkles" size={18} /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-graphite">{SAMPLE_DOC.media.filename}</p><p className="text-xs text-muted">materiał przykładowy</p></div>
                <Badge tone="info">przykład</Badge>
              </div>
            )}
            {file && (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-hair bg-white px-4 py-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-700"><Icon name="file" size={18} /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-graphite">{file.name}</p><p className="text-xs text-muted tnum">{(file.size / 1024 / 1024).toFixed(1)} MB · gotowy</p></div>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); setAudioWarn(null); }} aria-label="Usuń plik" className="focusring rounded-lg p-2 text-muted hover:bg-slate-100"><Icon name="x" size={18} /></button>
              </div>
            )}

            {(file || sample || sourceUrl.trim()) && <UsageEstimate durationMs={estMs || SAMPLE_DOC.media.duration_ms} />}
            {audioWarn && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-warn/30 bg-warn/5 px-3 py-2.5">
                <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-warn" />
                <p className="text-xs text-graphite">{audioWarn}</p>
              </div>
            )}

            {(file || sample) && (<>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button onClick={handleRun} disabled={(!file && !sourceUrl.trim()) || busy || (workerUp === false && !IS_BROWSER_MODE && !hasKey)} loading={busy && !sample} icon={busy ? undefined : "play"}>{busy && !sample ? "Przetwarzanie…" : "Przetwórz materiał"}</Button>
              <Button variant="secondary" onClick={() => file && runLocal(file)} disabled={!file || busy} icon="sparkles" title="Transkrypcja Whisper w Twojej przeglądarce — bez API, bez wysyłania pliku na serwer. Model wybierasz obok; pobiera się raz.">Transkrybuj bez API (w przeglądarce)</Button>
              <div className="inline-flex flex-wrap items-center gap-1.5 rounded-xl border border-hair bg-white p-1" role="group" aria-label="Silnik AI — tryb">
                {ENGINE_MODES.map((m) => (
                  <button key={m.id} type="button" title={m.desc}
                    onClick={() => { setEngineMode(m.id); setEngineModeState(m.id); setAsrModelState(getAsrModel()); }}
                    className={`focusring rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${engineMode === m.id ? "bg-brand-600 text-white" : "text-graphite hover:bg-brand-50"}`}>
                    {m.label}
                  </button>
                ))}
              </div>
              {workerUp === false && <span className="text-xs text-muted">Silnik przetwarzania jest offline — użyj <button onClick={runSample} className="font-medium text-brand-700 underline">przykładowego materiału</button> albo uruchom worker w środowisku dev.</span>}
              <span className="text-xs text-muted">Transkrypcja liczy się w Twojej przeglądarce — plik nie opuszcza urządzenia. Model i orientacyjny cennik ustawisz w <Link href="/app/ustawienia" className="font-medium text-brand-700 underline">Ustawieniach → Silnik AI</Link>.</span>
            </div>
            {localProg && (
              <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/50 px-4 py-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-brand-700">{localProg.label}</span>
                  <span className="tabular-nums text-muted">{localProg.pct}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${localProg.pct}%` }} />
                </div>
                <p className="mt-2 text-[11px] text-muted">Działa lokalnie w przeglądarce — plik nie opuszcza Twojego urządzenia. Dłuższe materiały mogą zająć kilka minut.</p>
              </div>
            )}
            </>)}
          </motion.div>
        </Section>

        {phase === "idle" && !sample && (
          <Section>
            <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2">
              <Link href="/app/skaner" className="spotlight focusring group flex items-center gap-4 rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm transition-all hover:border-brand-200 hover:shadow-lift">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name="search" size={20} /></span>
                <div className="min-w-0 flex-1"><p className="text-sm font-medium text-graphite">Sprawdź wiele materiałów naraz</p><p className="mt-0.5 text-xs text-muted">Jeden werdykt WCAG dla całej biblioteki</p></div>
                <Icon name="chevron" size={18} className="text-muted transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/app/projekty" className="spotlight focusring group flex items-center gap-4 rounded-2xl border border-hair/70 bg-white/80 p-5 shadow-card backdrop-blur-sm transition-all hover:border-brand-200 hover:shadow-lift">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name="folder" size={20} /></span>
                <div className="min-w-0 flex-1"><p className="text-sm font-medium text-graphite">Wszystkie materiały</p><p className="mt-0.5 text-xs text-muted">Biblioteka projektów i ich status WCAG</p></div>
                <Icon name="chevron" size={18} className="text-muted transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </Section>
        )}
        {phase === "idle" && !sample && (
          <Section>
            <motion.div variants={fadeUp}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="inline-flex items-center gap-2 text-sm font-medium text-graphite"><Icon name="folder" size={16} className="text-brand-600" /> Twoje materiały</h3>
                <Link href="/app/projekty" className="text-xs font-medium text-brand-700 hover:underline">Wszystkie →</Link>
              </div>
              {myJobs.length > 0 && (
                <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {myJobs.map((j) => <ProjectCard key={j.id} p={jobToCard(j)} />)}
                </div>
              )}
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{myJobs.length > 0 ? "Przykłady" : ""}</p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {SAMPLE_PROJECTS.map((pr) => <ProjectCard key={pr.id} p={pr} />)}
              </div>
            </motion.div>
          </Section>
        )}
        {phase !== "idle" && (
          <Section><motion.div variants={fadeUp}><L n={2}>Przetwarzanie {sample && <span className="ml-1 text-[11px] normal-case text-brand-700">· tryb przykładowy</span>}</L><ProcessingPipeline activeIndex={ps.active} progress={ps.progress} error={ps.error} /></motion.div></Section>
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
            <Section><L n={7}>Eksport</L>{sample ? <ExportButtons doc={job.result} /> : <ExportTiles jobId={job.id} />}</Section>
          </>
        )}
      </div>
    </div>
  );
}

export default function Studio() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl py-10 text-sm text-muted">Wczytywanie…</div>}>
      <StudioInner />
    </Suspense>
  );
}
