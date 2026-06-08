// Audyt biblioteki (bez API): bierze wiele plików napisów naraz, waliduje każdy klientowym
// silnikiem WCAG i sumuje w JEDEN werdykt organizacji + ranking najczęstszych naruszeń.
// To jest wgląd poziomu organizacji, którego narzędzia per-plik nie dają.
import type { CaptionDocument, WcagIssue } from "./contract";
import { parseSubtitles } from "./importSubs";
import { finalizeDoc } from "./wcagClient";

export const CODE_LABEL: Record<string, string> = {
  TOO_MANY_LINES: "Za dużo linii na ekranie",
  LINE_TOO_LONG: "Zbyt długie linie",
  ALL_CAPS: "Tekst wielkimi literami (krzyk)",
  DURATION_TOO_SHORT: "Za krótki czas wyświetlania",
  DURATION_TOO_LONG: "Za długi czas wyświetlania",
  READING_SPEED: "Za szybkie tempo czytania",
  OVERLAP: "Nakładające się napisy",
  GAP_TOO_SHORT: "Za krótkie przerwy (miganie)",
  NO_SPEAKER_ID: "Brak identyfikacji mówców",
  NO_SOUND_DESCRIPTION: "Brak opisów dźwięków",
};

export function scoreOf(errors: number, warnings: number): number {
  return Math.max(0, Math.min(100, 100 - errors * 15 - warnings * 4));
}

export interface AuditItem {
  id: string;
  name: string;
  doc: CaptionDocument;
  score: number;
  compliant: boolean;
  errors: number;
  warnings: number;
  issues: WcagIssue[];
}

export function auditCaptions(content: string, filename: string): AuditItem {
  const doc = finalizeDoc(parseSubtitles(content, filename));
  const errors = doc.wcag.stats.error_count;
  const warnings = doc.wcag.stats.warning_count;
  return {
    id: `${filename}-${Math.random().toString(36).slice(2, 7)}`,
    name: filename,
    doc,
    score: scoreOf(errors, warnings),
    compliant: doc.wcag.compliant,
    errors,
    warnings,
    issues: doc.wcag.issues,
  };
}

export interface CodeStat { code: string; label: string; occurrences: number; materials: number }
export interface AuditSummary {
  total: number;
  compliant: number;
  pctCompliant: number;
  avgScore: number;
  totalErrors: number;
  totalWarnings: number;
  byCode: CodeStat[];
}

export function summarize(items: AuditItem[]): AuditSummary {
  const total = items.length;
  const compliant = items.filter((i) => i.compliant).length;
  const totalErrors = items.reduce((s, i) => s + i.errors, 0);
  const totalWarnings = items.reduce((s, i) => s + i.warnings, 0);
  const avgScore = total ? Math.round(items.reduce((s, i) => s + i.score, 0) / total) : 0;

  const occ = new Map<string, number>();
  const mats = new Map<string, number>();
  for (const it of items) {
    const seen = new Set<string>();
    for (const is of it.issues) {
      occ.set(is.code, (occ.get(is.code) ?? 0) + 1);
      if (!seen.has(is.code)) { mats.set(is.code, (mats.get(is.code) ?? 0) + 1); seen.add(is.code); }
    }
  }
  const byCode: CodeStat[] = [...occ.entries()]
    .map(([code, occurrences]) => ({ code, label: CODE_LABEL[code] ?? code, occurrences, materials: mats.get(code) ?? 0 }))
    .sort((a, b) => b.materials - a.materials || b.occurrences - a.occurrences);

  return { total, compliant, pctCompliant: total ? Math.round((compliant / total) * 100) : 0, avgScore, totalErrors, totalWarnings, byCode };
}
