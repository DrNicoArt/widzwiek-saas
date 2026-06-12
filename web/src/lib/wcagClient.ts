// KLIENTOWA walstwa PODGLĄDU/OFFLINE (nie autorytet) — lustro worker/widzwiek/wcag/validator.py.
// Autorytetem WCAG jest worker. Tu liczymy raport dla trybu przeglądarkowego i szybkiego podglądu.
// Progi pochodzą z ./wcagRuleset.ts (lustro contracts/wcag_ruleset.json). Patrz docs/PLATFORM_AUDIT.md.
// i orchestrator.apply_quality. Dzięki temu tryb przeglądarkowy (Vercel, bez workera/API) realnie
// liczy raport WCAG i Quality Score dla dowolnych napisów (import, edycja, sample).
import type { CaptionDocument, Cue, WcagIssue, WcagReport } from "./contract";
import {
  RULESET_VERSION, WCAG_TARGET as TARGET,
  MAX_CHARS_PER_LINE, RECOMMENDED_CHARS_PER_LINE, MAX_LINES,
  MIN_DURATION_MS, MAX_DURATION_MS, MIN_GAP_MS, MAX_CPS, ALLOWED_CAPS,
} from "./wcagRuleset";

function isShouting(line: string): boolean {
  let s = line.replace(/\[[^\]]*\]/g, "");
  for (const tok of ALLOWED_CAPS) s = s.split(tok).join("");
  const letters = [...s].filter((c) => /\p{L}/u.test(c));
  if (letters.length <= 4) return false;
  const upper = letters.filter((c) => c === c.toUpperCase() && c !== c.toLowerCase()).length;
  return upper / letters.length > 0.6;
}

const charCount = (c: Cue) => c.lines.reduce((n, l) => n + l.length, 0);

function wrapLines(text: string, max: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [text];
  const lines: string[] = []; let cur = "";
  for (const w of words) { if (!cur) cur = w; else if (cur.length + 1 + w.length <= max) cur += " " + w; else { lines.push(cur); cur = w; } }
  if (cur) lines.push(cur);
  return lines.length <= maxLines ? lines : [...lines.slice(0, maxLines - 1), lines.slice(maxLines - 1).join(" ")];
}

export interface QualityScores {
  transcription: number; diarization: number; sound_events: number;
  segmentation: number; wcag: number; completeness: number; overall: number;
}

export function validateWcag(doc: CaptionDocument): WcagReport {
  const issues: WcagIssue[] = [];
  const cues = [...doc.cues].sort((a, b) => a.start_ms - b.start_ms);
  const multiSpeaker = doc.speakers.length >= 2;

  cues.forEach((cue, i) => {
    if (cue.lines.length > MAX_LINES)
      issues.push({ code: "TOO_MANY_LINES", severity: "error", cue_id: cue.id, field: "lines", message: `Napis ma ${cue.lines.length} linie — maksimum to ${MAX_LINES}.` });

    for (const line of cue.lines) {
      const n = line.length;
      if (n > MAX_CHARS_PER_LINE)
        issues.push({ code: "LINE_TOO_LONG", severity: "error", cue_id: cue.id, field: "lines", message: `Linia ma ${n} znaków — limit ${MAX_CHARS_PER_LINE}: "${line}"` });
      else if (n > RECOMMENDED_CHARS_PER_LINE)
        issues.push({ code: "LINE_TOO_LONG", severity: "warning", cue_id: cue.id, field: "lines", message: `Linia ma ${n} znaków — zalecane ≤ ${RECOMMENDED_CHARS_PER_LINE}: "${line}"` });
      if (isShouting(line))
        issues.push({ code: "ALL_CAPS", severity: "error", cue_id: cue.id, field: "lines", message: `Tekst wielkimi literami (CAPS = krzyk), niedozwolone w AA: "${line}"` });
    }

    const dur = cue.end_ms - cue.start_ms;
    if (dur < MIN_DURATION_MS)
      issues.push({ code: "DURATION_TOO_SHORT", severity: "error", cue_id: cue.id, field: "end_ms", message: `Napis wyświetlany ${dur} ms — minimum ${MIN_DURATION_MS} ms.` });
    if (dur > MAX_DURATION_MS)
      issues.push({ code: "DURATION_TOO_LONG", severity: "warning", cue_id: cue.id, field: "end_ms", message: `Napis wyświetlany ${dur} ms — zalecane maks. ${MAX_DURATION_MS} ms.` });

    if (cue.kind === "speech" && dur > 0) {
      const cps = charCount(cue) / (dur / 1000);
      if (cps > MAX_CPS)
        issues.push({ code: "READING_SPEED", severity: "warning", cue_id: cue.id, message: `Prędkość czytania ${cps.toFixed(1)} zn./s — zalecane ≤ ${MAX_CPS} zn./s.` });
    }

    if (i > 0) {
      const gap = cue.start_ms - cues[i - 1].end_ms;
      if (gap < 0)
        issues.push({ code: "OVERLAP", severity: "error", cue_id: cue.id, field: "start_ms", message: `Napis nakłada się na poprzedni o ${-gap} ms.` });
      else if (gap < MIN_GAP_MS)
        issues.push({ code: "GAP_TOO_SHORT", severity: "warning", cue_id: cue.id, field: "start_ms", message: `Przerwa ${gap} ms względem poprzedniego — zalecane ≥ ${MIN_GAP_MS} ms (anty-miganie).` });
    }

    if (multiSpeaker && cue.kind === "speech") {
      const sp = doc.speakers.find((s) => s.id === cue.speaker_id);
      if (!sp || !sp.label)
        issues.push({ code: "NO_SPEAKER_ID", severity: "warning", cue_id: cue.id, field: "speaker_id", message: "Brak identyfikacji mówcy przy ≥2 mówcach." });
    }
  });

  if (!cues.some((c) => c.kind === "sound"))
    issues.push({ code: "NO_SOUND_DESCRIPTION", severity: "info", message: "Brak opisów dźwięków niewerbalnych ([muzyka], [oklaski]...). WCAG 1.2.2 wymaga ich, jeśli występują." });

  const error_count = issues.filter((i) => i.severity === "error").length;
  const warning_count = issues.filter((i) => i.severity === "warning").length;
  return {
    target: TARGET, ruleset_version: RULESET_VERSION, compliant: error_count === 0, generated_at: new Date().toISOString(),
    stats: { cue_count: cues.length, error_count, warning_count }, issues,
  };
}

function segmentationScore(cues: Cue[]): number {
  const speech = cues.filter((c) => c.kind === "speech");
  if (!speech.length) return 0;
  let ok = 0;
  for (const c of speech) {
    const dur = Math.max(1, c.end_ms - c.start_ms);
    const cps = c.text.length / (dur / 1000);
    if (dur <= MAX_DURATION_MS && cps <= MAX_CPS + 3) ok++;
  }
  return round(ok / speech.length);
}
function completenessScore(doc: CaptionDocument): number {
  let s = 0.25;
  if (doc.cues.some((c) => c.kind === "speech")) s += 0.35;
  if (doc.speakers.length) s += 0.15;
  if (doc.cues.some((c) => c.kind === "sound")) s += 0.15;
  if (doc.media.duration_ms && doc.cues.length) {
    const covered = doc.cues.reduce((n, c) => n + Math.max(0, c.end_ms - c.start_ms), 0);
    s += Math.min(0.1, (covered / Math.max(1, doc.media.duration_ms)) * 0.1);
  }
  return round(Math.min(1, s));
}
const round = (v: number) => Math.round(v * 1000) / 1000;

export function scoreQuality(doc: CaptionDocument, report: WcagReport): QualityScores {
  const wcag = doc.cues.length ? round(Math.max(0, 1 - Math.min(1, report.stats.error_count * 0.25 + report.stats.warning_count * 0.06))) : 0;
  const transcription = 0.72;
  const diar = doc.speakers.length > 1 ? 0.62 : doc.speakers.length ? 0.45 : 0;
  const sound = doc.cues.some((c) => c.kind === "sound") ? 0.5 : 0;
  const segmentation = segmentationScore(doc.cues);
  const completeness = completenessScore(doc);
  const overall = round(([transcription, diar, Math.max(sound, 0.35), segmentation, wcag, completeness]).reduce((a, b) => a + b, 0) / 6);
  return { transcription, diarization: diar, sound_events: sound, segmentation, wcag, completeness, overall };
}

// Zwraca dokument z policzonym raportem WCAG i meta.quality (zachowuje meta.decision, jeśli jest).
export function finalizeDoc(doc: CaptionDocument): CaptionDocument {
  const maxChars = doc.style?.max_chars_per_line ?? 42;
  const maxLines = doc.style?.max_lines ?? 2;
  doc = { ...doc, cues: doc.cues.map((c) => c.kind === "speech" ? { ...c, lines: wrapLines(c.text, maxChars, maxLines) } : { ...c, lines: [c.text] }) };
  const wcag = validateWcag(doc);
  const quality = scoreQuality(doc, wcag);
  return { ...doc, wcag, meta: { ...doc.meta, quality } };
}
