// Model B: klient wybiera TRYB „Silnika AI", nie providera. Tryb mapuje się na konkretny
// model/strategię pod spodem (którą Widźwięk może w przyszłości podmieniać bez zmiany UI).
// W trybie przeglądarkowym tryb wybiera model Whisper; docelowo steruje Routerem providerów.
import { setAsrModel } from "./asrModel";

export type EngineMode = "auto" | "quality" | "cheap" | "fast";

export interface EngineModeOpt { id: EngineMode; label: string; desc: string; model: string; price: string }

export const ENGINE_MODES: EngineModeOpt[] = [
  { id: "auto",    label: "Automatyczny",      desc: "Zalecane — najlepsza wartość", model: "Xenova/whisper-base",  price: "0,40–0,60 zł" },
  { id: "quality", label: "Maksymalna jakość", desc: "Najlepszy wynik, wolniej",     model: "Xenova/whisper-small", price: "0,90–1,40 zł" },
  { id: "cheap",   label: "Najniższy koszt",   desc: "Lekko i tanio",                model: "Xenova/whisper-tiny",  price: "0,15–0,25 zł" },
  { id: "fast",    label: "Najszybsze",        desc: "Najkrótszy czas",              model: "Xenova/whisper-tiny",  price: "0,15–0,25 zł" },
];

const KEY = "widzwiek.engine_mode";

export function getEngineMode(): EngineMode {
  try { return (localStorage.getItem(KEY) as EngineMode) || "auto"; } catch { return "auto"; }
}

export function setEngineMode(mode: EngineMode): void {
  try { localStorage.setItem(KEY, mode); } catch { /* ignore */ }
  const opt = ENGINE_MODES.find((m) => m.id === mode);
  if (opt) setAsrModel(opt.model);   // tryb ustawia model pod spodem (Zaawansowane może nadpisać)
}
