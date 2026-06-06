// Klient API workera. Frontend NIE liczy WCAG ani nie formatuje napisów — tylko wywołuje worker.
import type { Job, CaptionDocument } from "./contract";

export const WORKER_URL =
  process.env.NEXT_PUBLIC_WORKER_URL?.replace(/\/$/, "") || "http://localhost:8000";

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

export async function createJob(file: File): Promise<Job> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${WORKER_URL}/api/jobs`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Worker zwrócił błąd ${res.status} przy tworzeniu joba.`);
  return res.json();
}

export async function getJob(id: string): Promise<Job> {
  const res = await fetch(`${WORKER_URL}/api/jobs/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Nie udało się pobrać joba ${id} (${res.status}).`);
  return res.json();
}

export interface StorageInfo { count: number; used_bytes: number; limit_bytes: number; over_limit: boolean; }

export async function getStorage(): Promise<StorageInfo | null> {
  try {
    const res = await fetch(`${WORKER_URL}/api/storage`, { cache: "no-store" });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export async function listJobs(): Promise<Job[]> {
  const res = await fetch(`${WORKER_URL}/api/jobs`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Nie udało się pobrać listy materiałów (${res.status}).`);
  return res.json();
}

export async function deleteJob(id: string): Promise<void> {
  const res = await fetch(`${WORKER_URL}/api/jobs/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Nie udało się usunąć materiału (${res.status}).`);
}

export async function updateDocument(id: string, doc: CaptionDocument): Promise<Job> {
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
  try {
    const res = await fetch(`${WORKER_URL}/health`, { cache: "no-store" });
    return res.ok ? res.json() : null;
  } catch {
    return null;
  }
}

export async function checkHealth(): Promise<boolean> {
  return (await getHealth()) !== null;
}

export async function setConfig(body: ConfigUpdate): Promise<HealthInfo> {
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
