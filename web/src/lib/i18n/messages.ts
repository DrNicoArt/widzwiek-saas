// Katalogi tłumaczeń. Dostęp typowany: t.nav.overview. Kolejny język = dopisanie obiektu + wpis w index.
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
  sidebar: { home: `${BRAND.name} — strona główna`, build: `${BRAND.name} Pracownia · build` },
  status: { online: "system online", offline: "worker offline", connecting: "łączenie…" },
};

export type Messages = typeof pl;

export const en: Messages = {
  nav: { overview: "Overview", studio: "Studio", plan: "Plan & billing", settings: "Settings" },
  topbar: {
    kicker: "Caption studio",
    greeting: "Welcome 👋",
    newMaterial: "New material",
    search: "Search materials…",
    searchAria: "Search materials",
    notifications: "Notifications",
    account: "Account",
  },
  splash: { loading: `${BRAND.name} is loading…` },
  sidebar: { home: `${BRAND.name} — home`, build: `${BRAND.name} Studio · build` },
  status: { online: "system online", offline: "worker offline", connecting: "connecting…" },
};
