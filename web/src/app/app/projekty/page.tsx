"use client";
// Projekty — realne, trwałe materiały z workera (jeśli online) + materiały przykładowe (demo).
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { listJobs } from "@/lib/api";
import type { Job } from "@/lib/contract";
import { DEMO_PROJECTS, type DemoProject } from "@/lib/mockData";
import PageHeader from "@/components/shell/PageHeader";
import ProjectCard from "@/components/dashboard/ProjectCard";
import Icon from "@/components/ui/Icon";
import { stagger, inView } from "@/lib/motion";

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

export default function Projekty() {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  useEffect(() => { listJobs().then(setJobs).catch(() => setJobs([])); }, []);

  const real = (jobs ?? []).map(jobToCard);
  const hasReal = real.length > 0;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader icon="folder" title="Projekty"
        desc="Twoje materiały. Wgrane pliki są trwałe (przetrwają restart silnika). Poniżej także przykłady demo." />

      {hasReal && (
        <motion.div initial="hidden" whileInView="show" viewport={inView} variants={stagger} className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {real.map((p) => <ProjectCard key={p.id} p={p} />)}
        </motion.div>
      )}

      <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
        <Icon name="sparkles" size={14} /> {hasReal ? "Przykłady (demo)" : "Materiały przykładowe (demo)"}
      </div>
      <motion.div initial="hidden" whileInView="show" viewport={inView} variants={stagger} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_PROJECTS.map((p) => <ProjectCard key={p.id} p={p} />)}
      </motion.div>
    </div>
  );
}
