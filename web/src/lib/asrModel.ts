// Wybór modelu Whisper (jakość vs szybkość/rozmiar). Trzymany w localStorage. Domyślnie base.
export interface AsrModelOpt { id: string; label: string; note: string }
export const ASR_MODELS: AsrModelOpt[] = [
  { id: "Xenova/whisper-tiny", label: "Tiny — najszybszy", note: "~75 MB · szybki, słabszy polski" },
  { id: "Xenova/whisper-base", label: "Base — zalecany", note: "~150 MB · dobry polski" },
  { id: "Xenova/whisper-small", label: "Small — najlepszy", note: "~480 MB · najlepszy polski, wolniejszy" },
];
const KEY = "widzwiek.asr_model";
const DEFAULT = "Xenova/whisper-base";
export function getAsrModel(): string {
  try { return localStorage.getItem(KEY) || DEFAULT; } catch { return DEFAULT; }
}
export function setAsrModel(id: string): void {
  try { localStorage.setItem(KEY, id); } catch { /* ignore */ }
}
