// Lekka warstwa i18n z reaktywnym locale (useSyncExternalStore — bezpieczne dla SSR/hydracji).
// Domyślny język z BRAND.locale; użytkownik przełącza, wybór trafia do localStorage.
"use client";
import { useSyncExternalStore } from "react";
import { BRAND } from "@/lib/brand";
import { pl, en, type Messages } from "./messages";

export type Locale = "pl" | "en";
const CATALOG: Record<Locale, Messages> = { pl, en };
const KEY = "widzwiek.locale";
const FALLBACK = ((BRAND.locale as Locale) in CATALOG ? (BRAND.locale as Locale) : "pl");

const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  if (typeof window !== "undefined") window.addEventListener("storage", cb);
  return () => { listeners.delete(cb); if (typeof window !== "undefined") window.removeEventListener("storage", cb); };
}
function clientSnapshot(): Locale {
  try {
    const v = window.localStorage.getItem(KEY) as Locale | null;
    return v && v in CATALOG ? v : FALLBACK;
  } catch { return FALLBACK; }
}
function serverSnapshot(): Locale { return FALLBACK; }

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}
export function setLocale(code: Locale): void {
  try { if (typeof window !== "undefined") window.localStorage.setItem(KEY, code); } catch { /* ignore */ }
  emit();
}
export const LOCALES: { code: Locale; label: string }[] = [
  { code: "pl", label: "PL" }, { code: "en", label: "EN" },
];

/** Typowany katalog dla bieżącego języka: const t = useT(); t.nav.overview */
export function useT(): Messages {
  return CATALOG[useLocale()];
}
