// Plan i płatności (UI). Na etapie PoC płatności są nieaktywne — uruchomimy je przy starcie
// płatnej wersji. Architektura neutralna wobec dostawcy: dodanie kolejnej metody = jeden wpis tutaj.
// Stan planu i wykres zużycia są liczone z REALNYCH materiałów użytkownika (zob. plan/page.tsx);
// poniższe wartości DEMO_* służą tylko jako fallback, gdy nie ma jeszcze żadnego materiału.
import type { IconName } from "@/components/ui/Icon";

export const IS_DEMO_BILLING = true;

export interface CreditUsage { month: string; minutes: number; credits: number }

export interface DemoPlanState {
  planName: string;
  billingMode: "credits" | "subscription" | "manual";
  creditsTotal: number;
  creditsUsed: number;
  unitLabel: string;
}

export const DEMO_PLAN: DemoPlanState = {
  planName: "Demo",
  billingMode: "credits",
  creditsTotal: 300,
  creditsUsed: 0,
  unitLabel: "Rozliczamy minuty gotowego, zgodnego z WCAG materiału — nie technologię w tle.",
};

// Fallback wykresu, gdy użytkownik nie przetworzył jeszcze żadnego materiału.
export const DEMO_USAGE: CreditUsage[] = [
  { month: "Lut", minutes: 0, credits: 0 },
  { month: "Mar", minutes: 0, credits: 0 },
  { month: "Kwi", minutes: 0, credits: 0 },
  { month: "Maj", minutes: 0, credits: 0 },
  { month: "Cze", minutes: 0, credits: 0 },
];

// Plany cenowe — kierunkowe, nie wiążące. Ceny ustalimy przy uruchomieniu płatności.
export interface PlanTier {
  name: string;
  priceLabel: string;
  forWhom: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}
export const PLAN_TIERS: PlanTier[] = [
  { name: "Demo", priceLabel: "0 zł", forWhom: "Testy i prezentacje", cta: "Aktywny", features: ["Pełny przepływ produktu", "Transkrypcja PL w przeglądarce", "Eksport SRT / VTT", "Raport zgodności WCAG"] },
  { name: "Starter", priceLabel: "Cena ustalana", forWhom: "Freelancerzy, twórcy", cta: "Powiadom mnie", highlight: true, features: ["Pula minut miesięcznie", "Transkrypcja + mówcy + dźwięki", "Raport WCAG i eksport", "1 użytkownik"] },
  { name: "Pro", priceLabel: "Cena ustalana", forWhom: "Małe zespoły, agencje", cta: "Powiadom mnie", features: ["Większa pula minut", "Historia i archiwum projektów", "Priorytetowa kolejka", "Kilku użytkowników"] },
  { name: "Business", priceLabel: "Wycena", forWhom: "Firmy, agencje", cta: "Porozmawiajmy", features: ["Duże limity", "Wielu użytkowników i role", "Wsparcie priorytetowe", "Faktura B2B"] },
  { name: "Instytucje / Uczelnie", priceLabel: "Wycena", forWhom: "Edukacja, sektor publiczny", cta: "Porozmawiajmy", features: ["Faktura / przelew, terminy", "Polityka retencji danych (UE)", "Wsparcie wdrożenia i szkolenie", "Zgodność z ustawą o dostępności"] },
];

// Metody płatności. region: gdzie metoda ma sens; brand: kolor wordmarku (loga).
export type PayRegion = "PL" | "global" | "b2b";
export interface PaymentMethod { id: string; label: string; note: string; region: PayRegion; brand: string }
export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "p24",     label: "Przelewy24",          note: "Szybkie przelewy, BLIK, karty",     region: "PL",     brand: "#d4022a" },
  { id: "payu",    label: "PayU",                note: "Polska i region CEE",               region: "PL",     brand: "#a6c307" },
  { id: "tpay",    label: "Tpay",                note: "Przelewy, BLIK",                    region: "PL",     brand: "#0c5fd6" },
  { id: "blik",    label: "BLIK",                note: "Płatność kodem z aplikacji banku",  region: "PL",     brand: "#000000" },
  { id: "stripe",  label: "Stripe",              note: "Karty i subskrypcje, globalnie",    region: "global", brand: "#635bff" },
  { id: "paddle",  label: "Paddle",              note: "Merchant of record, rozliczanie VAT", region: "global", brand: "#111827" },
  { id: "paypal",  label: "PayPal",              note: "Płatności globalne",                region: "global", brand: "#003087" },
  { id: "invoice", label: "Faktura / przelew B2B", note: "Instytucje, ręczna aktywacja",    region: "b2b",    brand: "#0057a8" },
  { id: "voucher", label: "Voucher / prepaid",   note: "Kody, granty, dostęp sponsorowany", region: "b2b",    brand: "#fb5e26" },
];
export const REGION_LABEL: Record<PayRegion, string> = { PL: "Polska", global: "Globalnie", b2b: "Instytucje / B2B" };

export const PRIMARY_ACTIONS: { id: string; label: string; icon: IconName }[] = [
  { id: "buy", label: "Kup minuty", icon: "sparkles" },
  { id: "plans", label: "Zobacz plany", icon: "card" },
  { id: "b2b", label: "Faktura / przelew", icon: "file" },
  { id: "methods", label: "Metody płatności", icon: "plug" },
];
