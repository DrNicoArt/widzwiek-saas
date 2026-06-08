// DEMO DATA (UI) — przykładowy CaptionDocument zgodny z kontraktem, lustrzany do wyniku
// mock pipeline workera. Pozwala podstronom (Napisy, Mówcy, Eksporty, Raport) działać
// nawet gdy worker jest offline. Wyraźnie oznaczone jako dane demonstracyjne.
import type { CaptionDocument } from "./contract";

export const IS_DEMO_DATA = true;

export const DEMO_DOC: CaptionDocument = {
  schema_version: "1.0",
  media: { filename: "konferencja_dostepnosc_2024.mp4", source_kind: "video", duration_ms: 30000, language: "pl" },
  speakers: [
    { id: "S1", label: "Lektor", color: "white" },
    { id: "S2", label: "Ekspertka", color: "yellow" },
  ],
  cues: [
    { id: "c1", index: 1, start_ms: 0, end_ms: 2000, kind: "sound", speaker_id: null, lines: ["[muzyka spokojna w tle]"], text: "[muzyka spokojna w tle]" },
    { id: "c2", index: 2, start_ms: 3500, end_ms: 7500, kind: "speech", speaker_id: "S1", lines: ["Dzień dobry, witam w naszym kursie online."], text: "Dzień dobry, witam w naszym kursie online." },
    { id: "c3", index: 3, start_ms: 9000, end_ms: 13000, kind: "speech", speaker_id: "S1", lines: ["Dziś wyjaśnimy, czym są napisy", "zgodne z WCAG."], text: "Dziś wyjaśnimy, czym są napisy zgodne z WCAG." },
    { id: "c4", index: 4, start_ms: 14500, end_ms: 16000, kind: "sound", speaker_id: null, lines: ["[oklaski]"], text: "[oklaski]" },
    { id: "c5", index: 5, start_ms: 17500, end_ms: 19000, kind: "sound", speaker_id: null, lines: ["[pukanie do drzwi]"], text: "[pukanie do drzwi]" },
    { id: "c6", index: 6, start_ms: 20500, end_ms: 24500, kind: "speech", speaker_id: "S2", lines: ["Napisy to nie tylko tekst. To też", "opis dźwięków otoczenia."], text: "Napisy to nie tylko tekst. To też opis dźwięków otoczenia." },
    { id: "c7", index: 7, start_ms: 26000, end_ms: 29500, kind: "speech", speaker_id: "S2", lines: ["Dzięki temu materiał jest dostępny", "dla każdego widza."], text: "Dzięki temu materiał jest dostępny dla każdego widza." },
  ],
  wcag: {
    target: "WCAG 2.1 AA",
    compliant: true,
    generated_at: "2024-06-02T10:00:00Z",
    stats: { cue_count: 7, error_count: 0, warning_count: 1 },
    issues: [
      { code: "LINE_TOO_LONG", severity: "warning", cue_id: "c2", field: "lines",
        message: 'Linia ma 42 znaków — zalecane ≤37: "Dzień dobry, witam w naszym kursie online."' },
    ],
  },
  meta: {
    generated_at: "2024-06-02T10:00:00Z",
    pipeline: { asr: "mock", diarization: "mock", sound_events: "mock" },
    decision: { strategy: "automatic", transcript_source: "demo", no_api_first: true, fallback_used: true, fallbacks: ["faster-whisper-local -> demo-transcript"], notes: ["Demo: przykładowy transkrypt, bez pliku i bez kluczy API."] },
    quality: { transcription: 0.74, diarization: 0.62, sound_events: 0.55, segmentation: 0.9, wcag: 0.94, completeness: 0.9, overall: 0.78 },
  },
};
