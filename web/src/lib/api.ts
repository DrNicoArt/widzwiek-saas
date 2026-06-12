// Klient API workera. Frontend NIE liczy WCAG ani nie formatuje napisów — tylko wywołuje worker.
import type { Job, CaptionDocument } from "./contract";
import { finalizeDoc } from "./wcagClient";
import { buildSampleJob } from "./sampleJob";

export const WORKER_URL =
  process.env.NEXT_PUBLIC_WORKER_URL?.replace(/\/$/, "") || "http://localhost:8000";
export const IS_BROWSER_MODE = process.env.NEXT_PUBLIC_BROWSER_MODE === "1" || process.env.NEXT_PUBLIC_STATIC_DEMO === "1";

// Token organizacji do workera (tryb serwerowy z auth). Z env albo localStorage; pusty = brak naglowka.
export function getApiToken(): string {
  const env = process.env.NEXT_PUBLIC_WORKER_TOKEN as string | undefined;
  if (env) return env;
  try { return (typeof window !== "undefined" && window.localStorage?.getItem("widzwiek.api_token")) || ""; } catch { return ""; }
}
function authHeaders(): Record<string, string> {
  const t = getApiToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

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

// Biblioteka materialow w trybie przeglądarkowym (bez workera): trwala w localStorage przegladarki.
const LS_KEY = "widzwiek.jobs";
function lsJobs(): Job[] {
  try { return JSON.parse((typeof window !== "undefined" && window.localStorage.getItem(LS_KEY)) || "[]"); } catch { return []; }
}
function lsSave(jobs: Job[]): void {
  try { if (typeof window !== "undefined") window.localStorage.setItem(LS_KEY, JSON.stringify(jobs.slice(0, 60))); } catch { /* ignore */ }
}
function lsUpsert(job: Job): void {
  const all = lsJobs().filter((j) => j.id !== job.id);
  all.unshift(job);
  lsSave(all);
}
function newId(): string { return Math.random().toString(36).slice(2, 10); }

function staticHealth(): HealthInfo {
  return {
    status: "ok",
    mode: "client",
    ready: true,
    api_key_present: false,
    openai_installed: false,
    ffmpeg_present: false,
    transcription_model: "whisper-1",
    providers: { asr: "client", diarization: "client", sound_events: "client" },
    notes: ["Przetwarzanie w przeglądarce — bez serwera i bez kluczy API."],
  };
}

function makeStaticJob(filename?: string, document?: CaptionDocument): Job {
  const job = buildSampleJob();
  staticJob = {
    ...job,
    id: "sample",
    filename: filename || job.filename,
    result: document ? finalizeDoc(document) : job.result,
  };
  return staticJob;
}

export async function createJob(file: File): Promise<Job> {
  if (IS_BROWSER_MODE) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    return makeStaticJob(file.name);
  }
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${WORKER_URL}/api/jobs`, { method: "POST", body: form, headers: authHeaders() });
  if (!res.ok) throw new Error(`Worker zwrócił błąd ${res.status} przy tworzeniu joba.`);
  return res.json();
}

// URL -> worker: najpierw napisy z platformy, a jeśli ich brak, worker pobiera audio i transkrybuje (ASR).
// W trybie przeglądarkowym niewykonalne (brak yt-dlp / nie pobieramy z YouTube w kliencie).
export async function createUrlJob(url: string): Promise<Job> {
  if (IS_BROWSER_MODE) {
    throw new Error("Przetwarzanie z linku wymaga uruchomionego workera (pobranie audio + transkrypcja). W przeglądarce wgraj plik audio/wideo albo zaimportuj SRT/VTT.");
  }
  const res = await fetch(`${WORKER_URL}/api/jobs/url`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(`Worker zwrócił błąd ${res.status} przy przetwarzaniu linku.`);
  return res.json();
}

export async function getJob(id: string): Promise<Job> {
  if (IS_BROWSER_MODE) {
    const found = lsJobs().find((j) => j.id === id);
    if (found) return found;
    return staticJob && staticJob.id === id ? staticJob : makeStaticJob();
  }
  const res = await fetch(`${WORKER_URL}/api/jobs/${id}`, { cache: "no-store", headers: authHeaders() });
  if (!res.ok) throw new Error(`Nie udało się pobrać joba ${id} (${res.status}).`);
  return res.json();
}

export interface StorageInfo { count: number; used_bytes: number; limit_bytes: number; over_limit: boolean; }

export interface UsageInfo { org_id: string; events: number; wcag_minutes: number; credits: number; }

export async function getUsage(): Promise<UsageInfo | null> {
  if (IS_BROWSER_MODE) return null;
  try {
    const res = await fetch(`${WORKER_URL}/api/usage`, { cache: "no-store", headers: authHeaders() });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export async function getStorage(): Promise<StorageInfo | null> {
  if (IS_BROWSER_MODE) return { count: 0, used_bytes: 0, limit_bytes: 200 * 1024 * 1024, over_limit: false };
  try {
    const res = await fetch(`${WORKER_URL}/api/storage`, { cache: "no-store", headers: authHeaders() });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export async function listJobs(): Promise<Job[]> {
  if (IS_BROWSER_MODE) return lsJobs();
  const res = await fetch(`${WORKER_URL}/api/jobs`, { cache: "no-store", headers: authHeaders() });
  if (!res.ok) throw new Error(`Nie udało się pobrać listy materiałów (${res.status}).`);
  return res.json();
}

export async function deleteJob(id: string): Promise<void> {
  if (IS_BROWSER_MODE) { lsSave(lsJobs().filter((j) => j.id !== id)); return; }
  const res = await fetch(`${WORKER_URL}/api/jobs/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error(`Nie udało się usunąć materiału (${res.status}).`);
}

export async function importJob(filename: string, document: CaptionDocument): Promise<Job> {
  if (IS_BROWSER_MODE) {
    const now = new Date().toISOString();
    const job: Job = { id: newId(), org_id: "local", status: "done" as Job["status"], filename, created_at: now, updated_at: now, result: finalizeDoc(document) };
    lsUpsert(job);
    return job;
  }
  const res = await fetch(`${WORKER_URL}/api/jobs/import`, {
    method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ filename, document }),
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => null);
    throw new Error(msg?.detail || `Nie udało się zaimportować napisów (${res.status}).`);
  }
  return res.json();
}

export async function updateDocument(id: string, doc: CaptionDocument): Promise<Job> {
  if (IS_BROWSER_MODE) {
    const all = lsJobs();
    const ex = all.find((j) => j.id === id);
    const now = new Date().toISOString();
    const job: Job = {
      id, org_id: "local", status: "done" as Job["status"],
      filename: ex?.filename ?? "material",
      created_at: ex?.created_at ?? now, updated_at: now,
      result: finalizeDoc(doc),
    };
    lsUpsert(job);
    return job;
  }
  const res = await fetch(`${WORKER_URL}/api/jobs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(doc),
  });
  if (!res.ok) throw new Error(`Nie udało się zapisać zmian (${res.status}).`);
  return res.json();
}

export function exportUrl(id: string, fmt: ExportFmt): string {
  return `${WORKER_URL}/api/jobs/${id}/export/${fmt}`;
}

export async function getHealth(): Promise<HealthInfo | null> {
  if (IS_BROWSER_MODE) return staticHealth();
  try {
    const res = await fetch(`${WORKER_URL}/health`, { cache: "no-store", headers: authHeaders() });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export async function checkHealth(): Promise<boolean> {
  if (IS_BROWSER_MODE) return true;
  return (await getHealth()) !== null;
}

export async function setConfig(body: ConfigUpdate): Promise<HealthInfo> {
  if (IS_BROWSER_MODE) return staticHealth();
  const res = await fetch(`${WORKER_URL}/api/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => null);
    throw new Error(msg?.detail || `Worker zwrócił błąd ${res.status}.`);
  }
  return res.json();
}
