// Warstwa projektu (demo). Mapuje projekt z biblioteki (DEMO_PROJECTS) na wynik CaptionDocument.
// Docelowo: Project → Material → Job → CaptionDocument/WcagReport/ExportRecord z bazy.
// Dziś: dane demonstracyjne, ale route'y i kontrakt już odzwierciedlają przyszły produkt.
import { DEMO_PROJECTS, type DemoProject } from "./mockData";
import { DEMO_DOC } from "./demoDoc";
import type { CaptionDocument } from "./contract";

export const DEMO_PROJECT_ID = "p1"; // „Konferencja o dostępności 2024" — w pełni przetworzony przykład

export function getProject(id: string): DemoProject | undefined {
  return DEMO_PROJECTS.find((p) => p.id === id);
}

// Wynik projektu: dla materiałów gotowych/do-poprawy zwracamy przykładowy CaptionDocument.
// Dla „przetwarzanie" jeszcze nie ma wyniku (null) — UI pokazuje stan w toku.
export function getProjectDoc(id: string): CaptionDocument | null {
  const p = getProject(id);
  if (!p || p.status === "processing") return null;
  return DEMO_DOC;
}

export function isProcessing(id: string): boolean {
  return getProject(id)?.status === "processing";
}
