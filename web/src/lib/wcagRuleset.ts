// LUSTRO kanonicznego contracts/wcag_ruleset.json (jedno źródło prawdy progów WCAG).
// Wartości MUSZĄ odpowiadać tamtemu plikowi i RULESET_VERSION. Worker (Python) ładuje JSON
// bezpośrednio; tu trzymamy odpowiednik dla klienta. Zmiana progów = zmiana w JSON + tutaj + bump wersji.
// (W docelowym monorepo ten plik będzie generowany z JSON — patrz docs/PLATFORM_AUDIT.md Krok 1.)
export const RULESET_VERSION = "1.0.0";
export const WCAG_TARGET = "WCAG 2.1 AA";

export const MAX_CHARS_PER_LINE = 42;
export const RECOMMENDED_CHARS_PER_LINE = 37;
export const MAX_LINES = 2;
export const MIN_DURATION_MS = 1000;
export const MAX_DURATION_MS = 7000;
export const MIN_GAP_MS = 1500;
export const MAX_CPS = 21;
export const ALLOWED_CAPS = ["BLEEP"];
