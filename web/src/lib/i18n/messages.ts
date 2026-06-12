// Katalog tłumaczeń. Na start jeden język (pl) — struktura gotowa na kolejne (en, de, ...).
// Dostęp typowany: t.nav.overview (autouzupełnianie + brak literówek w runtime).
import { BRAND } from "@/lib/brand";

export const pl = {
  nav: { overview: "Przegląd", studio: "Studio", plan: "Plan i płatności", settings: "Ustawienia" },
  topbar: {
    kicker: "Pracownia napisów",
    greeting: "Dzień dobry 👋",
    newMaterial: "Nowy materiał",
    search: "Szukaj materiałów…",
    searchAria: "Szukaj materiałów",
    notifications: "Powiadomienia",
    account: "Konto",
  },
  splash: { loading: `${BRAND.name} ładuje się…` },
  sidebar: {
    home: `${BRAND.name} — strona główna`,
    build: `${BRAND.name} Pracownia · build`,
  },
  status: { online: "system online", offline: "worker offline", connecting: "łączenie…" },
} as const;

export type Messages = typeof pl;
