// Provider-agnostic transkrypcja po stronie przeglądarki z kluczem użytkownika.
// Obsługiwani dostawcy z synchronicznym, przeglądarkowym API: OpenAI (Whisper/gpt-4o-transcribe),
// ElevenLabs (Scribe), Deepgram (Nova). Każdy adapter zwraca znormalizowane segmenty -> wspólny
// CaptionDocument -> klientowy silnik WCAG. Klucz nie opuszcza urządzenia poza wywołaniem do dostawcy.
import type { CaptionDocument, Cue } from "./contract";
import { getAsrLang } from "@/lib/lang";
import { finalizeDoc } from "./wcagClient";
import { heuristicTurns, ensureDefaultSpeaker } from "./enrich";
import { analyzeSounds } from "./soundScan";

export type AsrProvider = "openai" | "elevenlabs" | "deepgram";
export interface AsrChoice { provider: AsrProvider; key: string }

export const ASR_PROVIDERS: { id: AsrProvider; label: string; keyHint: string }[] = [
  { id: "openai", label: "OpenAI (Whisper)", keyHint: "sk-..." },
  { id: "elevenlabs", label: "ElevenLabs (Scribe)", keyHint: "klucz xi-api-key" },
  { id: "deepgram", label: "Deepgram (Nova)", keyHint: "klucz Deepgram" },
];

interface Seg { start: number; end: number; text: string } // ms

function err(status: number, body: string): never {
  if (status === 401 || status === 403) throw new Error("Klucz API odrzucony — sprawdź, czy jest poprawny i aktywny.");
  if (status === 429) throw new Error("Limit dostawcy przekroczony (429). Spróbuj później.");
  throw new Error(`Dostawca zwrócił błąd ${status}. ${body.slice(0, 140)}`);
}

function segmentsFromWords(words: { text: string; start: number; end: number }[]): Seg[] {
  const out: Seg[] = []; let cur: { start: number; end: number; text: string } | null = null;
  for (const w of words) {
    const t = (w.text || "").trim(); if (!t) continue;
    if (!cur) cur = { start: w.start, end: w.end, text: t };
    else {
      const gap = w.start - cur.end;
      if (cur.text.length + 1 + t.length > 80 || gap > 0.8 || /[.!?]$/.test(cur.text)) { out.push(cur); cur = { start: w.start, end: w.end, text: t }; }
      else { cur.text += " " + t; cur.end = w.end; }
    }
  }
  if (cur) out.push(cur);
  return out.map((s) => ({ start: Math.round(s.start * 1000), end: Math.round(s.end * 1000), text: s.text }));
}

async function callOpenai(file: File, key: string): Promise<Seg[]> {
  const form = new FormData();
  form.append("file", file); form.append("model", "whisper-1"); { const l = getAsrLang(); if (l.code !== "auto") form.append("language", l.code); } form.append("response_format", "verbose_json");
  const r = await fetch("https://api.openai.com/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form });
  if (!r.ok) err(r.status, await r.text().catch(() => ""));
  const d = await r.json();
  const segs = Array.isArray(d.segments) ? d.segments : [];
  const out: Seg[] = segs.map((s: { start?: number; end?: number; text?: string }) => ({ start: Math.round((s.start ?? 0) * 1000), end: Math.round((s.end ?? 0) * 1000), text: (s.text || "").trim() })).filter((s: Seg) => s.text);
  if (!out.length && d.text) out.push({ start: 0, end: Math.max(2000, String(d.text).length * 60), text: String(d.text).trim() });
  return out;
}

async function callEleven(file: File, key: string): Promise<Seg[]> {
  const form = new FormData();
  form.append("file", file); form.append("model_id", "scribe_v1"); { const l = getAsrLang(); if (l.iso3) form.append("language_code", l.iso3); }
  const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": key }, body: form });
  if (!r.ok) err(r.status, await r.text().catch(() => ""));
  const d = await r.json();
  const words = Array.isArray(d.words) ? d.words.filter((w: { type?: string }) => w.type !== "spacing").map((w: { text?: string; word?: string; start?: number; end?: number }) => ({ text: w.text ?? w.word ?? "", start: w.start ?? 0, end: w.end ?? 0 })) : [];
  if (words.length) return segmentsFromWords(words);
  const text = (d.text || "").trim();
  return text ? [{ start: 0, end: Math.max(2000, text.length * 60), text }] : [];
}

async function callDeepgram(file: File, key: string): Promise<Seg[]> {
  const _l = getAsrLang();
  const url = `https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&utterances=true&${_l.code === "auto" ? "detect_language=true" : "language=" + _l.code}`;
  const r = await fetch(url, { method: "POST", headers: { Authorization: `Token ${key}`, "Content-Type": file.type || "application/octet-stream" }, body: file });
  if (!r.ok) err(r.status, await r.text().catch(() => ""));
  const d = await r.json();
  const utts = d?.results?.utterances;
  if (Array.isArray(utts) && utts.length)
    return utts.map((u: { start?: number; end?: number; transcript?: string }) => ({ start: Math.round((u.start ?? 0) * 1000), end: Math.round((u.end ?? 0) * 1000), text: (u.transcript || "").trim() })).filter((s: Seg) => s.text);
  const words = d?.results?.channels?.[0]?.alternatives?.[0]?.words;
  if (Array.isArray(words) && words.length)
    return segmentsFromWords(words.map((w: { word?: string; punctuated_word?: string; start?: number; end?: number }) => ({ text: w.punctuated_word ?? w.word ?? "", start: w.start ?? 0, end: w.end ?? 0 })));
  const text = (d?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "").trim();
  return text ? [{ start: 0, end: Math.max(2000, text.length * 60), text }] : [];
}

function wrap(text: string, max = 42, maxLines = 2): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [text];
  const lines: string[] = []; let cur = "";
  for (const w of words) { if (!cur) cur = w; else if (cur.length + 1 + w.length <= max) cur += " " + w; else { lines.push(cur); cur = w; } }
  if (cur) lines.push(cur);
  return lines.length <= maxLines ? lines : [...lines.slice(0, maxLines - 1), lines.slice(maxLines - 1).join(" ")];
}

export async function transcribeWithProvider(file: File, choice: AsrChoice): Promise<CaptionDocument> {
  let segs: Seg[];
  try {
    segs = choice.provider === "elevenlabs" ? await callEleven(file, choice.key)
      : choice.provider === "deepgram" ? await callDeepgram(file, choice.key)
      : await callOpenai(file, choice.key);
  } catch (e) {
    if (e instanceof TypeError) throw new Error("Nie udało się połączyć z dostawcą (sieć lub CORS). Sprawdź klucz i spróbuj ponownie.");
    throw e;
  }
  let cues: Cue[] = segs.map((s, i): Cue => {
    let end = s.end; if (end <= s.start) end = s.start + 1200;
    return { id: `c${i + 1}`, index: i + 1, start_ms: s.start, end_ms: end, kind: "speech", speaker_id: null, lines: wrap(s.text), text: s.text };
  });
  let soundProvider = "none";
  try {
    const sounds = await analyzeSounds(file, cues.map((c) => ({ start_ms: c.start_ms, end_ms: c.end_ms })));
    if (sounds.length) {
      cues = [...cues, ...sounds].sort((a, b) => a.start_ms - b.start_ms).map((c, i) => ({ ...c, index: i + 1 }));
      soundProvider = "heuristic-audio";
    }
  } catch { /* best-effort */ }
  const duration = cues.length ? Math.max(...cues.map((c) => c.end_ms)) : 0;
  const doc: CaptionDocument = {
    schema_version: "1.0",
    media: { filename: file.name, source_kind: file.type.startsWith("video") ? "video" : "audio", duration_ms: duration, language: getAsrLang().code },
    speakers: [], cues,
    wcag: { target: "WCAG 2.1 AA", compliant: false, generated_at: new Date().toISOString(), stats: { cue_count: cues.length, error_count: 0, warning_count: 0 }, issues: [] },
    meta: { generated_at: new Date().toISOString(), pipeline: { asr: choice.provider, diarization: "none", sound_events: soundProvider }, decision: { strategy: "automatic", transcript_source: "cloud-asr", no_api_first: false, fallback_used: false, fallbacks: [], notes: [`Transkrypcja w przeglądarce (${choice.provider}), klucz użytkownika.`] } },
  };
  return finalizeDoc(ensureDefaultSpeaker(heuristicTurns(doc)));
}
