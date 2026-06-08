// Transkrypcja CAŁKOWICIE bez API — Whisper uruchamiany w przeglądarce przez transformers.js
// (WebGPU jeśli dostępne, inaczej WASM). Model pobiera się raz z CDN do cache przeglądarki.
// Audio dekodujemy do 16 kHz mono (wymóg Whisper). Dźwięki niewerbalne: istniejąca heurystyka audio.
// Uwaga: pierwszy przebieg pobiera ~150 MB (whisper-base) i jest wolniejszy niż API — to cena braku API.
import type { CaptionDocument, Cue } from "./contract";
import { finalizeDoc } from "./wcagClient";
import { heuristicTurns } from "./enrich";
import { analyzeSounds } from "./soundScan";

// transformers.js v3 z CDN. Function(import) omija bundler Next i typowanie TS (zwraca any).
const TRANSFORMERS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2";
export const LOCAL_ASR_MODEL = "Xenova/whisper-tiny"; // multilingual; lekki (~75 MB), szybki start
const TARGET_SR = 16000;

export interface LocalProgress { pct: number; label: string }
export type ProgressFn = (p: LocalProgress) => void;

interface Seg { start: number; end: number; text: string } // ms

let _pipe: any = null;

async function loadPipeline(onProgress?: ProgressFn): Promise<any> {
  if (_pipe) return _pipe;
  const mod: any = await (Function("u", "return import(u)")(TRANSFORMERS_URL));
  const { pipeline } = mod;
  _pipe = await pipeline("automatic-speech-recognition", LOCAL_ASR_MODEL, {
    progress_callback: (p: any) => {
      if (!onProgress) return;
      if (p?.status === "progress" && typeof p.progress === "number") {
        onProgress({ pct: Math.round(p.progress), label: `Pobieranie modelu (${p.file ?? "Whisper"})…` });
      } else if (p?.status === "ready") {
        onProgress({ pct: 100, label: "Model gotowy." });
      }
    },
  });
  return _pipe;
}

async function decodeTo16kMono(file: File): Promise<Float32Array> {
  const buf = await file.arrayBuffer();
  const AC: typeof AudioContext = (window.AudioContext || (window as any).webkitAudioContext);
  const tmp = new AC();
  const decoded = await tmp.decodeAudioData(buf.slice(0));
  tmp.close().catch(() => {});
  const frames = Math.ceil(decoded.duration * TARGET_SR);
  const off = new OfflineAudioContext(1, Math.max(1, frames), TARGET_SR);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start();
  const rendered = await off.startRendering();
  return rendered.getChannelData(0);
}

export async function transcribeLocally(file: File, onProgress?: ProgressFn): Promise<CaptionDocument> {
  onProgress?.({ pct: 0, label: "Ładowanie silnika transkrypcji w przeglądarce…" });
  const transcriber = await loadPipeline(onProgress);

  onProgress?.({ pct: 100, label: "Dekodowanie audio…" });
  const audio = await decodeTo16kMono(file);

  onProgress?.({ pct: 0, label: "Transkrypcja w toku (lokalnie, bez API)…" });
  const out: any = await transcriber(audio, {
    language: "polish",
    task: "transcribe",
    return_timestamps: true,
    chunk_length_s: 30,
    stride_length_s: 5,
  });

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

  onProgress?.({ pct: 100, label: "Wykrywanie dźwięków niewerbalnych…" });
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
    media: { filename: file.name, source_kind: file.type.startsWith("video") ? "video" : "audio", duration_ms: duration, language: "pl" },
    speakers: [], cues,
    wcag: { target: "WCAG 2.1 AA", compliant: false, generated_at: new Date().toISOString(), stats: { cue_count: cues.length, error_count: 0, warning_count: 0 }, issues: [] },
    meta: {
      generated_at: new Date().toISOString(),
      pipeline: { asr: `local:${LOCAL_ASR_MODEL}`, diarization: "heuristic", sound_events: soundProvider },
      decision: { strategy: "automatic", transcript_source: "local-browser-asr", no_api_first: true, fallback_used: false, fallbacks: [], notes: ["Transkrypcja w przeglądarce (Whisper/transformers.js), bez API i bez wysyłania pliku na serwer."] },
    },
  };
  onProgress?.({ pct: 100, label: "Gotowe." });
  return finalizeDoc(heuristicTurns(doc));
}
