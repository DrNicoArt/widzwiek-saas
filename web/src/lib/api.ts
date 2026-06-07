// Klient API workera. Frontend NIE liczy WCAG ani nie formatuje napisów — tylko wywołuje worker.
import type { Job, CaptionDocument } from "./contract";
import { buildSampleJob } from "./sampleJob";

export const WORKER_URL =
  process.env.NEXT_PUBLIC_WORKER_URL?.replace(/\/$/, "") || "http://localhost:8000";
export const IS_STATIC_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";

export type ExportFmt = "srt" | "vtt" | "txt" | "json";

export interface HealthInfo {
  status: string;
  mode: string;
  ready: boolean;
  api_key_present: boolean;
  openai_installed: boolean;
  ffmpeg_present: boolean;
  transcription_model?: string;
  providers: { asr: string; diarization: string; sound_events: string };
  notes: string[];
}

export interface ConfigUpdate {
  pipeline_mode?: string;
  openai_api_key?: string;
  openai_transcription_model?: string;
}

let staticJob: Job | null = null;

function staticHealth(): HealthInfo {
  return {
    status: "ok",
    mode: "mock",
    ready: true,
    api_key_present: false,
    openai_installed: false,
    ffmpeg_present: false,
    transcription_model: "whisper-1",
    providers: { asr: "static-demo", diarization: "static-demo", sound_events: "static-demo" },
    notes: ["Statyczna paczka demo - bez workera i bez kluczy API."],
  };
}

function makeStaticJob(filename?: string, document?: CaptionDocument): Job {
  const job = buildSampleJob();
  staticJob = {
    ...job,
    id: "sample-demo",
    filename: filename || job.filename,
    result: document ?? job.result,
  };
  return staticJob;
}

export async function createJob(file: File): Promise<Job> {
  if (IS_STATIC_DEMO) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    return makeStaticJob(file.name);
  }
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${WORKER_URL}/api/jobs`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Worker zwrócił błąd ${res.status} przy tworzeniu joba.`);
  return res.json();
}

export async function getJob(id: string): Promise<Job> {
  if (IS_STATIC_DEMO) return staticJob ?? makeStaticJob();
  const res = await fetch(`${WORKER_URL}/api/jobs/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Nie udało się pobrać joba ${id} (${res.status}).`);
  return res.json();
}

export interface StorageInfo { count: number; used_bytes: number; limit_bytes: number; over_limit: boolean; }

export async function getStorage(): Promise<StorageInfo | null> {
  if (IS_STATIC_DEMO) return { count: 0, used_bytes: 0, limit_bytes: 200 * 1024 * 1024, over_limit: false };
  try {
    const res = await fetch(`${WORKER_URL}/api/storage`, { cache: "no-store" });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export async function listJobs(): Promise<Job[]> {
  if (IS_STATIC_DEMO) return [];
  const res = await fetch(`${WORKER_URL}/api/jobs`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Nie udało się pobrać listy materiałów (${res.status}).`);
  return res.json();
}

export async function deleteJob(id: string): Promise<void> {
  if (IS_STATIC_DEMO) return;
  const res = await fetch(`${WORKER_URL}/api/jobs/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Nie udało się usunąć materiału (${res.status}).`);
}

export async function importJob(filename: string, document: CaptionDocument): Promise<Job> {
  if (IS_STATIC_DEMO) return makeStaticJob(filename, document);
  const res = await fetch(`${WORKER_URL}/api/jobs/import`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, document }),
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => null);
    throw new Error(msg?.detail || `Nie udało się zaimportować napisów (${res.status}).`);
  }
  return res.json();
}

export async function updateDocument(id: string, doc: CaptionDocument): Promise<Job> {
  if (IS_STATIC_DEMO) return makeStaticJob(staticJob?.filename ?? "material-demo", doc);
  const res = await fetch(`${WORKER_URL}/api/jobs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
  });
  if (!res.ok) throw new Error(`Nie udało się zapisać zmian (${res.status}).`);
  return res.json();
}

export function exportUrl(id: string, fmt: ExportFmt): string {
  return `${WORKER_URL}/api/jobs/${id}/export/${fmt}`;
}

export async function getHealth(): Promise<HealthInfo | null> {
  if (IS_STATIC_DEMO) return staticHealth();
  try {
    const res = await fetch(`${WORKER_URL}/health`, { cache: "no-store" });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export async function checkHealth(): Promise<boolean> {
  if (IS_STATIC_DEMO) return true;
  return (await getHealth()) !== null;
}

export async function setConfig(body: ConfigUpdate): Promise<HealthInfo> {
  if (IS_STATIC_DEMO) return staticHealth();
  const res = await fetch(`${WORKER_URL}/api/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => null);
    throw new Error(msg?.detail || `Worker zwrócił błąd ${res.status}.`);
  }
  return res.json();
}
