// Parser SRT/VTT po stronie klienta -> CaptionDocument (offline, bez AI).
// Wykrywa mowcow z <v Nazwa>, opisy dzwiekow [..] jako cue typu sound, zachowuje timing.
import type { CaptionDocument, Cue, Speaker } from "./contract";
import { DEFAULT_STYLE } from "./contract";

const PALETTE = ["#f5f5f5", "#ffd400", "#22d3ee", "#4ade80", "#ff8a5b", "#c084fc", "#60a5fa", "#ff5d6c"];

function tcToMs(raw: string): number | null {
  const t = raw.trim();
  let m = t.match(/(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})/);
  if (m) return ((+m[1] * 3600 + +m[2] * 60 + +m[3]) * 1000) + +m[4].padEnd(3, "0");
  m = t.match(/(\d{1,2}):(\d{2})[.,](\d{1,3})/);
  if (m) return ((+m[1] * 60 + +m[2]) * 1000) + +m[3].padEnd(3, "0");
  return null;
}

function stripTags(s: string): string {
  return s.replace(/<\/?[^>]+>/g, "").trim();
}

export function parseSubtitles(content: string, filename: string): CaptionDocument {
  const text = content.replace(/\r/g, "");
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

  const speakers: Speaker[] = [];
  const speakerByName = new Map<string, string>();
  const ensureSpeaker = (name: string): string => {
    const key = name.trim();
    if (speakerByName.has(key)) return speakerByName.get(key)!;
    const id = `S${speakers.length + 1}`;
    speakers.push({ id, label: key, color: PALETTE[speakers.length % PALETTE.length] });
    speakerByName.set(key, id);
    return id;
  };

  const cues: Cue[] = [];
  let idx = 0;
  for (const block of blocks) {
    const lines = block.split("\n");
    if (/^WEBVTT/i.test(lines[0]) || /^STYLE/i.test(lines[0]) || /^NOTE/i.test(lines[0]) || /^REGION/i.test(lines[0])) continue;
    const arrowLine = lines.find((l) => l.includes("-->"));
    if (!arrowLine) continue;
    const [l, r] = arrowLine.split("-->");
    const start = tcToMs(l);
    const end = tcToMs((r || "").split(/\s+/).filter(Boolean)[0] || "");
    if (start == null || end == null) continue;

    const textLines = lines.slice(lines.indexOf(arrowLine) + 1);
    let raw = textLines.join("\n").trim();
    if (!raw) continue;

    // mowca z <v Nazwa>
    let speaker_id: string | null = null;
    const v = raw.match(/<v\s+([^>]+)>/i);
    if (v) speaker_id = ensureSpeaker(v[1]);
    const clean = stripTags(raw);
    const isSound = /^\[.*\]$/.test(clean.replace(/\n/g, " ").trim());

    idx += 1;
    const cueLines = clean.split("\n").map((x) => x.trim()).filter(Boolean);
    cues.push({
      id: `c${idx}`, index: idx, start_ms: start, end_ms: end,
      kind: isSound ? "sound" : "speech",
      speaker_id: isSound ? null : speaker_id,
      lines: cueLines.length ? cueLines : [clean],
      text: clean.replace(/\n/g, " "),
    });
  }

  const duration = cues.reduce((mx, c) => Math.max(mx, c.end_ms), 0);
  return {
    schema_version: "1.0",
    media: { filename, source_kind: "audio", duration_ms: duration, language: "pl" },
    speakers,
    cues,
    wcag: { target: "WCAG 2.1 AA", compliant: false, generated_at: new Date().toISOString(), stats: { cue_count: cues.length, error_count: 0, warning_count: 0 }, issues: [] },
    style: { ...DEFAULT_STYLE },
    meta: { generated_at: new Date().toISOString(), pipeline: { asr: "import", diarization: "import", sound_events: "import" } },
  };
}
