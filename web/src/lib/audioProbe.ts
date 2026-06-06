// Przeglądarkowy pre-check obecności dźwięku — bez API, bez backendu (działa na Vercelu).
// Liczy energię (RMS/peak) zdekodowanej ścieżki audio. Wykrywa "brak słyszalnego dźwięku".
// NIE odróżnia mowy od muzyki (to wymaga modelu) — dlatego komunikat jest ostrożny.
export interface AudioProbe {
  ok: boolean;          // czy udało się zdekodować i ocenić
  hasAudio: boolean;    // czy jest słyszalny dźwięk
  durationSec: number;
  rms: number;
  reason?: "too-large" | "decode-failed" | "no-context";
}

const SIZE_GUARD = 120 * 1024 * 1024; // >120MB pomijamy głębokie dekodowanie (pamięć)

export async function probeAudioPresence(file: File): Promise<AudioProbe> {
  if (file.size > SIZE_GUARD) return { ok: false, hasAudio: true, durationSec: 0, rms: 0, reason: "too-large" };
  const AC = (typeof window !== "undefined" && (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)) || null;
  if (!AC) return { ok: false, hasAudio: true, durationSec: 0, rms: 0, reason: "no-context" };

  let ctx: AudioContext | null = null;
  try {
    const buf = await file.arrayBuffer();
    ctx = new AC();
    const audio = await ctx.decodeAudioData(buf.slice(0));
    const ch = audio.getChannelData(0);
    const step = Math.max(1, Math.floor(ch.length / 200000));
    let sum = 0, n = 0, peak = 0;
    for (let i = 0; i < ch.length; i += step) {
      const v = ch[i]; sum += v * v; if (Math.abs(v) > peak) peak = Math.abs(v); n++;
    }
    const rms = Math.sqrt(sum / Math.max(1, n));
    const hasAudio = rms > 0.005 || peak > 0.02;
    return { ok: true, hasAudio, durationSec: audio.duration, rms };
  } catch {
    return { ok: false, hasAudio: true, durationSec: 0, rms: 0, reason: "decode-failed" };
  } finally {
    try { await ctx?.close(); } catch { /* ignore */ }
  }
}
