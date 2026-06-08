// Heurystyczne wykrywanie dźwięków niewerbalnych BEZ API (Web Audio). W obszarach bez mowy mierzymy
// energię sygnału — jeśli słychać dźwięk, proponujemy opis ([muzyka w tle] / [dźwięki w tle]).
// Best-effort: gdy plik się nie zdekoduje (np. kontener wideo), zwraca [].
import type { Cue } from "./contract";

const SIZE_GUARD = 120 * 1024 * 1024;

export async function analyzeSounds(file: File, speech: { start_ms: number; end_ms: number }[]): Promise<Cue[]> {
  if (file.size > SIZE_GUARD) return [];
  const AC = (typeof window !== "undefined" && (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)) || null;
  if (!AC) return [];
  let ctx: AudioContext | null = null;
  try {
    const buf = await file.arrayBuffer();
    ctx = new AC();
    const audio = await ctx.decodeAudioData(buf.slice(0));
    const ch = audio.getChannelData(0);
    const sr = audio.sampleRate;
    const durMs = audio.duration * 1000;
    const rms = (aMs: number, bMs: number) => {
      const i0 = Math.max(0, Math.floor((aMs / 1000) * sr));
      const i1 = Math.min(ch.length, Math.floor((bMs / 1000) * sr));
      if (i1 <= i0) return 0;
      let s = 0, n = 0; const step = Math.max(1, Math.floor((i1 - i0) / 4000));
      for (let i = i0; i < i1; i += step) { s += ch[i] * ch[i]; n++; }
      return Math.sqrt(s / Math.max(1, n));
    };
    const sorted = [...speech].sort((a, b) => a.start_ms - b.start_ms);
    const gaps: [number, number][] = [];
    let prev = 0;
    for (const c of sorted) { if (c.start_ms - prev >= 1200) gaps.push([prev, c.start_ms]); prev = Math.max(prev, c.end_ms); }
    if (durMs - prev >= 1500) gaps.push([prev, durMs]);
    const out: Cue[] = [];
    let idx = 0;
    for (const [a, b] of gaps) {
      if (rms(a, b) > 0.02) {
        const dur = b - a;
        const label = dur >= 3000 ? "[muzyka w tle]" : "[dźwięki w tle]";
        out.push({ id: `snd${++idx}`, index: 0, start_ms: Math.round(a), end_ms: Math.round(b), kind: "sound", speaker_id: null, lines: [label], text: label });
      }
    }
    return out;
  } catch {
    return [];
  } finally {
    try { await ctx?.close(); } catch { /* ignore */ }
  }
}
