// JEDNO ŹRÓDŁO TOŻSAMOŚCI MARKI + LOKALIZACJI.
// Rebranding / white-label = zmiana tego pliku, podmiana plików w public/brand,
// oraz tokenów kolorów w tailwind.config.ts (brand-* / accent-*). Nic nie jest
// „na sztywno" rozsiane po komponentach.
export const BRAND = {
  name: "Widźwięk",
  org: "SubrosAI",
  tagline: "zobacz to, co inni słyszą",
  description: "Inteligentny system napisów dostępnościowych dla audio i wideo. SubrosAI.",
  domain: "widzwiek.app",            // TBD — docelowa domena
  supportEmail: "kontakt@widzwiek.app", // TBD — adres kontaktowy/wsparcia

  // Assety wizualne. Podmiana logo = zmiana tych ścieżek albo samych plików.
  assets: {
    logo: "/brand/logotyp.svg",   // pełny logotyp (wordmark + sygnet)
    sygnet: "/brand/sygnet.svg",  // sam znak (oko)
    icon: "/icon.svg",
  },

  // Język MATERIAŁU do transkrypcji. NIE zaszywać "pl" w kodzie ASR — czytać stąd.
  // code: tag BCP-47 / kod używany przez API; whisper: nazwa języka dla Whispera.
  asr: { code: "pl", whisper: "polish" },

  // Domyślny język INTERFEJSU (i18n). Paleta kolorów żyje w tailwind.config.ts.
  locale: "pl",
} as const;

export type BrandConfig = typeof BRAND;
