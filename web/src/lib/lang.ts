// Język materiału do transkrypcji — wybór użytkownika (odblok pod skalowanie na EU).
// "auto" = wykrycie języka przez model (Whisper). Trzymane w localStorage; domyślnie auto.
// whisper: nazwa języka dla Whispera (transformers.js / OpenAI verbose). iso3: kod dla ElevenLabs.
export interface AsrLang { code: string; label: string; whisper?: string; iso3?: string }

export const ASR_LANGUAGES: AsrLang[] = [
  { code: "auto", label: "Automatycznie (wykryj)" },
  { code: "pl", label: "Polski", whisper: "polish", iso3: "pol" },
  { code: "en", label: "English", whisper: "english", iso3: "eng" },
  { code: "de", label: "Deutsch", whisper: "german", iso3: "deu" },
  { code: "fr", label: "Français", whisper: "french", iso3: "fra" },
  { code: "es", label: "Español", whisper: "spanish", iso3: "spa" },
  { code: "it", label: "Italiano", whisper: "italian", iso3: "ita" },
  { code: "nl", label: "Nederlands", whisper: "dutch", iso3: "nld" },
  { code: "pt", label: "Português", whisper: "portuguese", iso3: "por" },
  { code: "cs", label: "Čeština", whisper: "czech", iso3: "ces" },
  { code: "sv", label: "Svenska", whisper: "swedish", iso3: "swe" },
  { code: "da", label: "Dansk", whisper: "danish", iso3: "dan" },
  { code: "ro", label: "Română", whisper: "romanian", iso3: "ron" },
  { code: "uk", label: "Українська", whisper: "ukrainian", iso3: "ukr" },
];

const KEY = "widzwiek.asr_lang";

export function getAsrLang(): AsrLang {
  try {
    const code = (typeof window !== "undefined" && window.localStorage.getItem(KEY)) || "auto";
    return ASR_LANGUAGES.find((l) => l.code === code) ?? ASR_LANGUAGES[0];
  } catch {
    return ASR_LANGUAGES[0];
  }
}

export function setAsrLang(code: string): void {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, code);
  } catch { /* ignore */ }
}
