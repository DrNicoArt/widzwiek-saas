// Transkrypcja CAŁKOWICIE bez API — Whisper w przeglądarce (transformers.js, WebGPU/WASM).
// Model wybierany przez użytkownika (tiny/base/small), pobierany raz z CDN do cache przeglądarki.
// Audio dekodowane do 16 kHz mono. Dźwięki niewerbalne: AST/AudioSet (real), fallback do heurystyki.
import type { CaptionDocument, Cue } from "./contract";
import { finalizeDoc } from "./wcagClient";
import { heuristicTurns } from "./enrich";
import { analyzeSounds } from "./soundScan";
import { detectSounds } from "./localSound";
import { loadTransformers, decodeTo16kMono } from "./transformersClient";
import { getAsrModel } from "./asrModel";

export interface LocalProgress { pct: number; label: string }
export type ProgressFn = (p: LocalProgress) => void;

interface Seg { start: number; end: number; text: string } // ms

// eslint-disable-next-line
const _pipes: Record<string, any> = {};

// eslint-disable-next-line
async function loadPipeline(model: string, onProgress?: ProgressFn): Promise<any> {
  if (_pipes[model]) return _pipes[model];
  const mod = await loadTransformers();
  _pipes[model] = await mod.pipeline("automatic-speech-recognition", model, {
    // eslint-disable-next-line
    progress_callback: (p: any) => {
      if (!onProgress) return;
      if (p?.status === "progress" && typeof p.progress === "number") {
        onProgress({ pct: Math.round(p.progress), label: `Pobieranie modelu (${p.file ?? "Whisper"})…` });
      } else if (p?.status === "ready") {
        onProgress({ pct: 100, label: "Model gotowy." });
      }
    },
  });
  return _pipes[model];
}

export async function transcribeLocally(file: File, onProgress?: ProgressFn): Promise<CaptionDocument> {
  const model = getAsrModel();
  onProgress?.({ pct: 0, label: "Ładowanie silnika transkrypcji w przeglądarce…" });
  const transcriber = await loadPipeline(model, onProgress);

  onProgress?.({ pct: 100, label: "Dekodowanie audio…" });
  const audio = await decodeTo16kMono(file);

  onProgress?.({ pct: 0, label: "Transkrypcja w toku (lokalnie, bez API)…" });
  // eslint-disable-next-line
  const out: any = await transcriber(audio, {
    language: "polish",
    task: "transcribe",
    return_timestamps: true,
    chunk_length_s: 30,
    stride_length_s: 5,
  });

  // eslint-disable-next-line
  const chunks: any[] = Array.isArray(out?.chunks) ? out.chunks : [];
  let segs: Seg[] = chunks
    .map((c) => {
      const ts = Array.isArray(c.timestamp) ? c.timestamp : [0, 0];
      const start = Math.round((ts[0] ?? 0) * 1000);
      const end = Math.round((ts[1] ?? ts[0] ?? 0) * 1000);
      return { start, end: end > start ? end : start + 1500, text: String(c.text ?? "").trim() };
    })
    .filter((s) => s.text);
  if (!segs.length && out?.text) segs = [{ start: 0, end: Math.max(2000, String(out.text).length * 60), text: String(out.text).trim() }];

  let cues: Cue[] = segs.map((s, i): Cue => ({
    id: `c${i + 1}`, index: i + 1, start_ms: s.start, end_ms: s.end, kind: "speech", speaker_id: null, lines: [s.text], text: s.text,
  }));

  // Dźwięki niewerbalne: najpierw realny model (AST/AudioSet), w razie błędu — heurystyka audio.
  onProgress?.({ pct: 100, label: "Rozpoznawanie dźwięków niewerbalnych…" });
  let soundProvider = "none";
  let sounds: Cue[] = [];
  try {
    sounds = await detectSounds(file);
    if (sounds.length) soundProvider = "ast-audioset";
  } catch { /* model dźwięków niedostępny — spróbuj heurystyki */ }
  if (!sounds.length) {
    try {
      sounds = await analyzeSounds(file, cues.map((c) => ({ start_ms: c.start_ms, end_ms: c.end_ms })));
      if (sounds.length) soundProvider = "heuristic-audio";
    } catch { /* best-effort */ }
  }
  if (sounds.length) {
    cues = [...cues, ...sounds].sort((a, b) => a.start_ms - b.start_ms).map((c, i) => ({ ...c, index: i + 1 }));
  }

  const duration = cues.length ? Math.max(...cues.map((c) => c.end_ms)) : 0;
  const doc: CaptionDocument = {
    schema_version: "1.0",
    media: { filename: file.name, source_kind: file.type.startsWith("video") ? "video" : "audio", duration_ms: duration, language: "pl" },
    speakers: [], cues,
    wcag: { target: "WCAG 2.1 AA", compliant: false, generated_at: new Date().toISOString(), stats: { cue_count: cues.length, error_count: 0, warning_count: 0 }, issues: [] },
    meta: {
      generated_at: new Date().toISOString(),
      pipeline: { asr: `local:${model}`, diarization: "heuristic", sound_events: soundProvider },
      decision: { strategy: "automatic", transcript_source: "local-browser-asr", no_api_first: true, fallback_used: false, fallbacks: [], notes: ["Transkrypcja i dźwięki w przeglądarce (transformers.js), bez API i bez wysyłania pliku na serwer."] },
    },
  };
  onProgress?.({ pct: 100, label: "Gotowe." });
  return finalizeDoc(heuristicTurns(doc));
}
