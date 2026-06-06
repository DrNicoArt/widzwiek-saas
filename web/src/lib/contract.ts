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
  color: string; // white | yellow | cyan | green
}

export interface Cue {
  id: string;
  index: number;
  start_ms: number;
  end_ms: number;
  kind: CueKind;
  speaker_id: string | null;
  lines: string[];
  text: string;
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
  compliant: boolean;
  generated_at: string;
  stats: { cue_count: number; error_count: number; warning_count: number };
  issues: WcagIssue[];
}

export interface CaptionStyle {
  font_family: "sans" | "serif" | "mono";
  font_size: "sm" | "md" | "lg";
  position: "bottom" | "top";
  background: boolean;
  max_chars_per_line: number;
  max_lines: number;
}

export const DEFAULT_STYLE: CaptionStyle = {
  font_family: "sans", font_size: "md", position: "bottom", background: true, max_chars_per_line: 42, max_lines: 2,
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

export const FONT_CSS: Record<string, string> = {
  sans: "ui-sans-serif, system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, 'SF Mono', monospace",
};
export const FONT_SIZE_PX: Record<string, number> = { sm: 14, md: 18, lg: 24 };

export function msToTimecode(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const cs = Math.floor((ms % 1000) / 10);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}
