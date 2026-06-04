// DEMO DATA (UI) — dane przykładowe dla ekranów, których mock worker jeszcze nie zwraca
// (biblioteka projektów, statystyki). Wyraźnie oznaczone; kontrakt CaptionDocument bez zmian.
export const IS_DEMO_DATA = true;

export type ProjectStatus = "done" | "processing" | "review";

export interface DemoProject {
  id: string;
  title: string;
  durationLabel: string;
  status: ProjectStatus;
  wcag: number;          // % zgodności (demo)
  updated: string;
  accent: string;        // kolor okładki
}

export const DEMO_PROJECTS: DemoProject[] = [
  { id: "p1", title: "Konferencja o dostępności 2024", durationLabel: "18:42", status: "done", wcag: 96, updated: "2 godz. temu", accent: "#0057A8" },
  { id: "p2", title: "Szkolenie BHP — moduł 3", durationLabel: "32:10", status: "review", wcag: 81, updated: "wczoraj", accent: "#0D9488" },
  { id: "p3", title: "Webinar: Nowe standardy WCAG", durationLabel: "47:55", status: "processing", wcag: 0, updated: "przed chwilą", accent: "#7C3AED" },
  { id: "p4", title: "Wywiad z ekspertką", durationLabel: "12:03", status: "done", wcag: 99, updated: "2 dni temu", accent: "#D97706" },
  { id: "p5", title: "Spot reklamowy — kampania Q4", durationLabel: "00:46", status: "done", wcag: 92, updated: "3 dni temu", accent: "#E11D48" },
  { id: "p6", title: "Prezentacja wyników badań", durationLabel: "24:18", status: "review", wcag: 74, updated: "5 dni temu", accent: "#1F6FBE" },
];

export const DEMO_STATS = [
  { label: "Wszystkie projekty", value: 24, icon: "ti-folders" },
  { label: "W toku", value: 3, icon: "ti-loader" },
  { label: "Zgodne z WCAG", value: 18, icon: "ti-circle-check" },
  { label: "Do poprawy", value: 3, icon: "ti-alert-triangle" },
];
