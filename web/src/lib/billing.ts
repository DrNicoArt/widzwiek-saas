// Plan i płatności (dane UI). Płatności uruchomimy przy starcie wersji płatnej — architektura
// neutralna wobec dostawcy: dodanie kolejnej metody to jeden wpis poniżej. Stan planu i wykres
// zużycia liczone są z REALNYCH materiałów użytkownika (zob. plan/page.tsx).
import type { IconName } from "@/components/ui/Icon";

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
  { name: "Darmowy", priceLabel: "0 zł", forWhom: "Testy i prezentacje", cta: "Aktywny", features: ["Pełny przepływ produktu", "Transkrypcja PL w przeglądarce", "Eksport SRT / VTT", "Raport zgodności WCAG"] },
  { name: "Starter", priceLabel: "Cena ustalana", forWhom: "Freelancerzy, twórcy", cta: "Powiadom mnie", highlight: true, features: ["Pula minut miesięcznie", "Transkrypcja + mówcy + dźwięki", "Raport WCAG i eksport", "1 użytkownik"] },
  { name: "Pro", priceLabel: "Cena ustalana", forWhom: "Małe zespoły, agencje", cta: "Powiadom mnie", features: ["Większa pula minut", "Historia i archiwum projektów", "Priorytetowa kolejka", "Kilku użytkowników"] },
  { name: "Business", priceLabel: "Wycena", forWhom: "Firmy, agencje", cta: "Porozmawiajmy", features: ["Duże limity", "Wielu użytkowników i role", "Wsparcie priorytetowe", "Faktura B2B"] },
  { name: "Instytucje / Uczelnie", priceLabel: "Wycena", forWhom: "Edukacja, sektor publiczny", cta: "Porozmawiajmy", features: ["Faktura / przelew, terminy", "Polityka retencji danych (UE)", "Wsparcie wdrożenia i szkolenie", "Zgodność z ustawą o dostępności"] },
];

// Metody płatności. region: gdzie metoda ma sens; brand: kolor wordmarku (loga).
export type PayRegion = "PL" | "global" | "b2b";
export interface PaymentMethod { id: string; label: string; note: string; region: PayRegion; brand: string }
export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "p24",     label: "Przelewy24",          note: "Szybkie przelewy, BLIK, karty",       region: "PL",     brand: "#d4022a" },
  { id: "payu",    label: "PayU",                note: "Polska i region CEE",                 region: "PL",     brand: "#a6c307" },
  { id: "tpay",    label: "Tpay",                note: "Przelewy, BLIK",                      region: "PL",     brand: "#0c5fd6" },
  { id: "blik",    label: "BLIK",                note: "Płatność kodem z aplikacji banku",    region: "PL",     brand: "#000000" },
  { id: "stripe",  label: "Stripe",              note: "Karty i subskrypcje, globalnie",      region: "global", brand: "#635bff" },
  { id: "paddle",  label: "Paddle",              note: "Merchant of record, rozliczanie VAT", region: "global", brand: "#111827" },
  { id: "paypal",  label: "PayPal",              note: "Płatności globalne",                  region: "global", brand: "#003087" },
  { id: "invoice", label: "Faktura / przelew B2B", note: "Instytucje, ręczna aktywacja",      region: "b2b",    brand: "#0057a8" },
  { id: "voucher", label: "Voucher / prepaid",   note: "Kody, granty, dostęp sponsorowany",   region: "b2b",    brand: "#fb5e26" },
];
export const REGION_LABEL: Record<PayRegion, string> = { PL: "Polska", global: "Globalnie", b2b: "Instytucje / B2B" };

// id służy też jako cel przewijania: buy/plans -> sekcja planów, b2b/methods -> metody płatności.
export const PRIMARY_ACTIONS: { id: string; label: string; icon: IconName; target: "plany" | "metody" }[] = [
  { id: "buy", label: "Kup minuty", icon: "sparkles", target: "plany" },
  { id: "plans", label: "Zobacz plany", icon: "card", target: "plany" },
  { id: "b2b", label: "Faktura / przelew", icon: "file", target: "metody" },
  { id: "methods", label: "Metody płatności", icon: "plug", target: "metody" },
];
