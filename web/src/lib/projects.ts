// Warstwa projektu (dane przykładowe). Mapuje projekt z biblioteki (SAMPLE_PROJECTS) na wynik CaptionDocument.
// Docelowo: Project → Material → Job → CaptionDocument/WcagReport/ExportRecord z bazy.
// Dziś: dane przykładowe, ale route'y i kontrakt już odzwierciedlają przyszły produkt.
import { SAMPLE_PROJECTS, type SampleProject } from "./sampleData";
import { SAMPLE_DOC } from "./sampleDoc";
import type { CaptionDocument } from "./contract";

export const SAMPLE_PROJECT_ID = "p1"; // „Konferencja o dostępności 2024" — w pełni przetworzony przykład

export function getProject(id: string): SampleProject | undefined {
  return SAMPLE_PROJECTS.find((p) => p.id === id);
}

// Wynik projektu: dla materiałów gotowych/do-poprawy zwracamy przykładowy CaptionDocument.
// Dla „przetwarzanie" jeszcze nie ma wyniku (null) — UI pokazuje stan w toku.
export function getProjectDoc(id: string): CaptionDocument | null {
  const p = getProject(id);
  if (!p || p.status === "processing") return null;
  return SAMPLE_DOC;
}

export function isProcessing(id: string): boolean {
  return getProject(id)?.status === "processing";
}
