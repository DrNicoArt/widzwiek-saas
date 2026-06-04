// Klient API workera. Frontend NIE liczy WCAG ani nie formatuje napisów —
// tylko wywołuje worker i renderuje wynik (rozdział UI / pipeline).

import type { Job } from "./contract";

export const WORKER_URL =
  process.env.NEXT_PUBLIC_WORKER_URL?.replace(/\/$/, "") || "http://localhost:8000";

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

export function exportUrl(id: string, fmt: "srt" | "vtt"): string {
  return `${WORKER_URL}/api/jobs/${id}/export/${fmt}`;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${WORKER_URL}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}
