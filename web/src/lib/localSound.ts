// Rozpoznawanie dźwięków niewerbalnych BEZ API — transformers.js audio-classification
// (AST fine-tuned na AudioSet) w przeglądarce. Mapujemy etykiety AudioSet -> polskie [oznaczenia].
// Działa na oknach ~3 s; mowa/cisza są pomijane. Best-effort: błąd -> pusta lista (fallback do heurystyki).
import type { Cue } from "./contract";
import { loadTransformers, decodeTo16kMono, SAMPLE_RATE } from "./transformersClient";

export const SOUND_MODEL = "Xenova/ast-finetuned-audioset-10-10-0.4593";

const LABEL_MAP: { re: RegExp; pl: string }[] = [
  { re: /applause/i, pl: "[oklaski]" },
  { re: /cheer|crowd/i, pl: "[wiwaty tłumu]" },
  { re: /laugh|giggle|chuckle/i, pl: "[śmiech]" },
  { re: /\bmusic|musical|singing|instrument/i, pl: "[muzyka]" },
  { re: /knock/i, pl: "[pukanie]" },
  { re: /telephone|ringtone|\bring/i, pl: "[dzwonek telefonu]" },
  { re: /\bbell/i, pl: "[dzwonek]" },
  { re: /\bdog|bark/i, pl: "[szczekanie psa]" },
  { re: /\bcat|meow/i, pl: "[miauczenie]" },
  { re: /cry|sob|weep/i, pl: "[płacz]" },
  { re: /footstep|walk/i, pl: "[kroki]" },
  { re: /explosion|boom|blast/i, pl: "[wybuch]" },
  { re: /gunshot|gunfire/i, pl: "[wystrzał]" },
  { re: /siren/i, pl: "[syrena]" },
  { re: /door/i, pl: "[drzwi]" },
  { re: /\brain/i, pl: "[deszcz]" },
  { re: /\bwind/i, pl: "[wiatr]" },
  { re: /thunder/i, pl: "[grzmot]" },
  { re: /\bcar|engine|vehicle|traffic/i, pl: "[pojazd]" },
  { re: /water|splash|stream/i, pl: "[woda]" },
];
function toPl(label: string): string | null {
  if (/speech|talk|narration|silence|inside|outside|noise/i.test(label)) return null;
  for (const m of LABEL_MAP) if (m.re.test(label)) return m.pl;
  return null;
}

export async function detectSounds(file: File): Promise<Cue[]> {
  const mod = await loadTransformers();
  // eslint-disable-next-line
  let classifier: any;
  // eslint-disable-next-line
  const hasGpu = typeof navigator !== "undefined" && !!(navigator as any).gpu;
  if (hasGpu) {
    try { classifier = await mod.pipeline("audio-classification", SOUND_MODEL, { device: "webgpu", dtype: "fp16" }); } catch { classifier = null; }
  }
  if (!classifier) classifier = await mod.pipeline("audio-classification", SOUND_MODEL);
  const audio = await decodeTo16kMono(file);
  const win = SAMPLE_RATE * 3; // okno 3 s
  const cues: Cue[] = [];
  let idx = 1;
  let last: string | null = null;
  for (let start = 0; start < audio.length; start += win) {
    const slice = audio.subarray(start, Math.min(audio.length, start + win));
    if (slice.length < SAMPLE_RATE) break; // pomiń ogon < 1 s
    // eslint-disable-next-line
    let out: any;
    try { out = await classifier(slice, { top_k: 5 }); } catch { continue; }
    const arr = Array.isArray(out) ? out : [];
    let pl: string | null = null;
    for (const o of arr) {
      const p = toPl(String(o?.label ?? ""));
      if (p && (o?.score ?? 0) >= 0.3) { pl = p; break; }
    }
    if (pl && pl !== last) {
      const s = Math.round((start / SAMPLE_RATE) * 1000);
      cues.push({ id: `snd${idx}`, index: idx, start_ms: s, end_ms: s + 2000, kind: "sound", speaker_id: null, lines: [pl], text: pl });
      idx++; last = pl;
    } else if (!pl) {
      last = null;
    }
  }
  return cues;
}
