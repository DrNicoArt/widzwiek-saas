"use client";
// Projekty — realne, trwałe materiały z workera (limit magazynu + usuwanie) + przykłady demo.
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { listJobs, deleteJob, getStorage, type StorageInfo } from "@/lib/api";
import type { Job } from "@/lib/contract";
import { DEMO_PROJECTS, type DemoProject } from "@/lib/mockData";
import PageHeader from "@/components/shell/PageHeader";
import ProjectCard from "@/components/dashboard/ProjectCard";
import Icon from "@/components/ui/Icon";
import { stagger, inView } from "@/lib/motion";

const MB = 1024 * 1024;
function scoreOf(j: Job): number {
  if (!j.result) return 0;
  const s = j.result.wcag.stats;
  return Math.max(0, 100 - s.error_count * 15 - s.warning_count * 4);
}
function dur(ms: number): string {
  const t = Math.round(ms / 1000); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}
function jobToCard(j: Job): DemoProject {
  const status: DemoProject["status"] = j.status === "done" ? "done" : j.status === "error" ? "review" : "processing";
  return {
    id: j.id, title: j.filename || "Materiał", durationLabel: j.result ? dur(j.result.media.duration_ms) : "—",
    status, wcag: scoreOf(j), updated: new Date(j.updated_at).toLocaleDateString("pl-PL"), accent: "#0057A8",
  };
}

function StorageBar({ s }: { s: StorageInfo }) {
  const pct = Math.min(100, Math.round((s.used_bytes / s.limit_bytes) * 100));
  const tone = s.over_limit ? "bg-err" : pct > 80 ? "bg-warn" : "bg-brand-500";
  return (
    <div className="mb-6 rounded-2xl border border-hair/70 bg-white/80 p-4 shadow-card backdrop-blur-sm">
      <div className="flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-2 font-medium text-graphite"><Icon name="database" size={16} className="text-brand-600" /> Magazyn materiałów</span>
        <span className="tnum text-muted">{(s.used_bytes / MB).toFixed(1)} / {(s.limit_bytes / MB).toFixed(0)} MB · {s.count} szt.</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      {s.over_limit && <p className="mt-2 text-xs text-err">Limit przekroczony — usuń materiały, aby dodać nowe.</p>}
    </div>
  );
}

function ProjektyInner() {
  const params = useSearchParams();
  const q = (params.get("q") || "").toLowerCase();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [storage, setStorage] = useState<StorageInfo | null>(null);

  const refresh = useCallback(() => {
    listJobs().then(setJobs).catch(() => setJobs([]));
    getStorage().then(setStorage).catch(() => setStorage(null));
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  async function onDelete(id: string) {
    try { await deleteJob(id); } catch { /* ignore */ }
    refresh();
  }

  const match = (t: string) => !q || t.toLowerCase().includes(q);
  const real = (jobs ?? []).map(jobToCard).filter((p) => match(p.title));
  const demo = DEMO_PROJECTS.filter((p) => match(p.title));
  const hasReal = real.length > 0;
  const workerOnline = jobs !== null && jobs !== undefined && storage !== null;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader icon="folder" title="Projekty"
        desc="Twoje materiały są trwałe (przetrwają restart silnika). Możesz je usuwać; magazyn ma limit. Poniżej także przykłady demo." />

      {storage && <StorageBar s={storage} />}
      {q && <p className="mb-4 text-sm text-muted">Wyniki dla: <strong className="text-graphite">{q}</strong></p>}

      {workerOnline && !hasReal && !q && (
        <div className="mb-8 rounded-2xl border border-dashed border-hair bg-white/50 p-8 text-center">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon name="upload" size={24} /></span>
          <p className="text-sm font-medium text-graphite">Brak wgranych materiałów</p>
          <p className="mt-1 text-sm text-muted">Wgraj pierwszy plik w „Nowy materiał” — pojawi się tutaj i będzie trwały.</p>
        </div>
      )}

      {hasReal && (
        <motion.div initial="hidden" whileInView="show" viewport={inView} variants={stagger} className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {real.map((p) => <ProjectCard key={p.id} p={p} onDelete={onDelete} />)}
        </motion.div>
      )}

      <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
        <Icon name="sparkles" size={14} /> {hasReal ? "Przykłady (demo)" : "Materiały przykładowe (demo)"}
      </div>
      <motion.div initial="hidden" whileInView="show" viewport={inView} variants={stagger} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {demo.map((p) => <ProjectCard key={p.id} p={p} />)}
      </motion.div>
    </div>
  );
}

export default function Projekty() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl py-10 text-sm text-muted">Wczytywanie projektow...</div>}>
      <ProjektyInner />
    </Suspense>
  );
}
