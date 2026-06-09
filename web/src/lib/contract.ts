// Lustro kontraktu danych CaptionDocument (źródło prawdy: worker/widzwiek/contracts.py).
// Patrz docs/DATA_CONTRACT.md. Trzymaj w zgodzie z modelami pydantic.

export type SourceKind = "audio" | "video";
export type CueKind = "speech" | "sound";
export type Severity = "error" | "warning" | "info";
export type JobStatusValue = "queued" | "processing" | "done" | "error";

export interface MediaInfo {
  filename: string;
  source_kind: SourceKind;
  duration_ms: number;
  language: string;
}

export interface Speaker {
  id: string;
  label: string;
  color: string; // dowolny CSS/hex (np. #ffd400)
}

export interface CueToken { text: string; color?: string | null; bold?: boolean }

export interface Cue {
  id: string;
  index: number;
  start_ms: number;
  end_ms: number;
  kind: CueKind;
  speaker_id: string | null;
  lines: string[];
  text: string;
  tokens?: CueToken[];
}

export interface WcagIssue {
  code: string;
  severity: Severity;
  message: string;
  cue_id?: string | null;
  field?: string | null;
}

export interface WcagReport {
  target: string;
  ruleset_version?: string;
  compliant: boolean;
  generated_at: string;
  stats: { cue_count: number; error_count: number; warning_count: number };
  issues: WcagIssue[];
}

export interface CaptionStyle {
  font_family: string;   // klucz z FONTS lub stack CSS
  font_size: number;     // px
  position: "bottom" | "top";
  background: boolean;
  max_chars_per_line: number;
  max_lines: number;
}

export const DEFAULT_STYLE: CaptionStyle = {
  font_family: "system", font_size: 20, position: "bottom", background: true, max_chars_per_line: 42, max_lines: 2,
};

export interface CaptionDocument {
  schema_version: string;
  media: MediaInfo;
  speakers: Speaker[];
  cues: Cue[];
  wcag: WcagReport;
  style?: CaptionStyle;
  meta: {
    generated_at: string;
    pipeline: { asr: string; diarization: string; sound_events: string };
    decision?: {
      strategy: string;
      transcript_source: string;
      no_api_first: boolean;
      fallback_used: boolean;
      fallbacks: string[];
      notes: string[];
    };
    quality?: {
      transcription: number;
      diarization: number;
      sound_events: number;
      segmentation: number;
      wcag: number;
      completeness: number;
      overall: number;
    };
  };
}

export interface Job {
  id: string;
  status: JobStatusValue;
  created_at: string;
  updated_at: string;
  filename?: string | null;
  error?: string | null;
  result?: CaptionDocument | null;
}

// Mapa kolorów WCAG -> CSS (podgląd mówców we froncie)
export const SPEAKER_CSS_COLOR: Record<string, string> = {
  white: "#f5f5f5",
  yellow: "#ffd400",
  cyan: "#22d3ee",
  green: "#4ade80",
};

// Baza fontow (czytelnosc dla osob niedowidzacych = priorytet). legible=true: zalecane do napisow.
export const FONTS: { key: string; label: string; css: string; legible: boolean }[] = [
  { key: "system", label: "Systemowy (sans)", css: "system-ui, sans-serif", legible: true },
  { key: "arial", label: "Arial", css: "Arial, sans-serif", legible: true },
  { key: "verdana", label: "Verdana", css: "Verdana, sans-serif", legible: true },
  { key: "tahoma", label: "Tahoma", css: "Tahoma, sans-serif", legible: true },
  { key: "helvetica", label: "Helvetica", css: "Helvetica, Arial, sans-serif", legible: true },
  { key: "atkinson", label: "Atkinson Hyperlegible", css: "'Atkinson Hyperlegible', Verdana, sans-serif", legible: true },
  { key: "georgia", label: "Georgia (serif)", css: "Georgia, serif", legible: false },
  { key: "times", label: "Times New Roman (serif)", css: "'Times New Roman', serif", legible: false },
  { key: "courier", label: "Courier (mono)", css: "'Courier New', monospace", legible: false },
];
export function fontCss(key: string): string {
  return FONTS.find((f) => f.key === key)?.css ?? key ?? "system-ui, sans-serif";
}
export const SIZE_PRESETS = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48];

// Kontrast WCAG 1.4.3: stosunek luminancji dwoch kolorow.
function _lum(hex: string): number {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const n = parseInt(full.length >= 6 ? full.slice(0, 6) : "ffffff", 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
export function contrastRatio(fg: string, bg = "#000000"): number {
  try {
    const a = _lum(fg) + 0.05, b = _lum(bg) + 0.05;
    return Math.round((Math.max(a, b) / Math.min(a, b)) * 10) / 10;
  } catch {
    return 1;
  }
}

export function msToTimecode(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const cs = Math.floor((ms % 1000) / 10);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}
