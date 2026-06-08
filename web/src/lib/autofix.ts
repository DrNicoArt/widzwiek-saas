// Autopilot WCAG (bez API): jednym przejściem naprawia to, co maszyna może bezpiecznie naprawić —
// timing (brak nakładania, min. czas), zawijanie linii, kondensacja pod tempo czytania (usuwanie
// wtypowych wtrąceń, nie parafraza — zero ryzyka zmiany sensu). Reszta zostaje do podpisu człowieka.
import type { CaptionDocument, Cue } from "./contract";
import { finalizeDoc } from "./wcagClient";

const MIN_DUR = 1000;
const FILLERS = ["yyy", "eee", "mmm", "yy", "ee", "hmm", "no wiesz", "wiesz", "jakby", "generalnie", "że tak powiem", "prawda?"];

function condense(text: string): string {
  let t = ` ${text} `;
  for (const f of FILLERS) {
    const re = new RegExp(`\\s${f.replace(/[.?*+^$()]/g, "\\$&")}\\s`, "gi");
    t = t.replace(re, " ");
  }
  t = t.replace(/\b(\w+)\s+\1\b/gi, "$1");      // powtórzone słowo ("to to" -> "to")
  return t.replace(/\s{2,}/g, " ").trim();
}

export interface FixReport { timing: number; condensed: number; before: { errors: number; warnings: number }; after: { errors: number; warnings: number } }

export function autoFix(doc: CaptionDocument): { doc: CaptionDocument; report: FixReport } {
  const before = { errors: doc.wcag.stats.error_count, warnings: doc.wcag.stats.warning_count };
  const maxCps = 21;
  let timing = 0, condensed = 0;

  const sorted = [...doc.cues].sort((a, b) => a.start_ms - b.start_ms);
  let prevEnd = -Infinity;
  const fixed: Cue[] = sorted.map((c) => {
    let start = c.start_ms, end = c.end_ms;
    if (start < prevEnd) { start = prevEnd; timing++; }
    if (end - start < MIN_DUR) { end = start + MIN_DUR; timing++; }
    prevEnd = end;

    let text = c.text;
    if (c.kind === "speech") {
      const dur = (end - start) / 1000;
      const cps = dur > 0 ? text.replace(/\s/g, "").length / dur : 0;
      if (cps > maxCps) {
        const c2 = condense(text);
        if (c2.length < text.length) { text = c2; condensed++; }
      }
    }
    return { ...c, start_ms: start, end_ms: end, text, lines: [text] };
  });

  const out = finalizeDoc({ ...doc, cues: fixed.map((c, i) => ({ ...c, index: i + 1 })) });
  return { doc: out, report: { timing, condensed, before, after: { errors: out.wcag.stats.error_count, warnings: out.wcag.stats.warning_count } } };
}
