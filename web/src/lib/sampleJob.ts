// Syntetyczny "gotowy" job zbudowany z SAMPLE_DOC — pozwala pokazać PEŁEN flow
// w /app/studio nawet gdy worker jest offline (tryb przykładowego materiału).
import type { Job } from "./contract";
import { SAMPLE_DOC } from "./sampleDoc";

export function buildSampleJob(): Job {
  const now = new Date().toISOString();
  return {
    id: "sample",
    status: "done",
    created_at: now,
    updated_at: now,
    filename: SAMPLE_DOC.media.filename,
    error: null,
    result: SAMPLE_DOC,
  };
}

// Szacunkowy koszt (poglądowy) — czytelna heurystyka, NIE pobiera realnych kredytów.
export function estimateCredits(durationMs: number, opts: { speakers: boolean; sounds: boolean; wcag: boolean }): number {
  const minutes = Math.max(1, Math.ceil(durationMs / 60000));
  let mult = 1;
  if (opts.speakers) mult += 0.3;
  if (opts.sounds) mult += 0.3;
  if (opts.wcag) mult += 0.2;
  return Math.round(minutes * mult);
}
