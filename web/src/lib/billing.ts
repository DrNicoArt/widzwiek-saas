// DEMO BILLING (UI) — warstwa monetyzacji jest na tym etapie PLACEHOLDEREM.
// Architektura provider-agnostic: realny dostawca (Stripe/Paddle/Przelewy24/PayU/Tpay/
// faktura B2B...) podłączymy później przez adapter. W demo nic nie jest pobierane.
// Pełny opis modelu: docs/MONETIZATION.md.
import type { IconName } from "@/components/ui/Icon";

export const IS_DEMO_BILLING = true;

export interface CreditUsage {
  month: string;      // np. "Czerwiec"
  minutes: number;    // przetworzone minuty
  credits: number;    // zużyte kredyty
}

export interface DemoPlanState {
  planName: string;
  billingMode: "credits" | "subscription" | "manual";
  provider: string;            // aktywny adapter (w demo: mock)
  creditsTotal: number;
  creditsUsed: number;
  unitLabel: string;           // jednostka rozliczeniowa
}

export const DEMO_PLAN: DemoPlanState = {
  planName: "Demo",
  billingMode: "credits",
  provider: "mock",
  creditsTotal: 300,
  creditsUsed: 180,
  unitLabel: "1 kredyt ≈ 1 minuta transkrypcji (mnożnik za mówców/dźwięki/raport)",
};

export const DEMO_USAGE: CreditUsage[] = [
  { month: "Luty", minutes: 22, credits: 30 },
  { month: "Marzec", minutes: 41, credits: 58 },
  { month: "Kwiecień", minutes: 35, credits: 49 },
  { month: "Maj", minutes: 58, credits: 82 },
  { month: "Czerwiec", minutes: 130, credits: 180 },
];

// Plany cenowe — kierunkowe, nie wiążące. Liczby są przykładowe (TBD).
export interface PlanTier {
  name: string;
  priceLabel: string;
  forWhom: string;
  features: string[];
  highlight?: boolean;
}
export const PLAN_TIERS: PlanTier[] = [
  { name: "Demo", priceLabel: "0 zł", forWhom: "Testy i prezentacje", features: ["Pełny flow w trybie mock", "Eksport SRT/VTT", "Raport WCAG", "Bez pobierania kredytów"] },
  { name: "Starter", priceLabel: "Cena robocza (TBD)", forWhom: "Freelancerzy, twórcy", features: ["Pula minut/kredytów", "Transkrypcja PL", "Raport WCAG + eksport", "1 użytkownik"], highlight: true },
  { name: "Pro", priceLabel: "Cena robocza (TBD)", forWhom: "Małe zespoły, agencje", features: ["Więcej minut", "Mówcy + dźwięki (po integracji)", "Historia projektów", "Kilku użytkowników"] },
  { name: "Business", priceLabel: "Wycena", forWhom: "Firmy, agencje", features: ["Duże limity", "Wielu użytkowników", "Priorytetowe wsparcie", "Faktura B2B"] },
  { name: "Instytucje / Uczelnie", priceLabel: "Wycena", forWhom: "Edukacja, sektor publiczny", features: ["Faktura / przelew", "Polityka retencji", "Wsparcie wdrożenia", "Zgodność WCAG dla instytucji"] },
];

// Metody płatności — placeholdery adapterów (provider-agnostic).
export interface PaymentMethod { id: string; label: string; note: string; status: "placeholder" }
export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "stripe", label: "Stripe", note: "karty, subskrypcje (międzynarodowo)", status: "placeholder" },
  { id: "paddle", label: "Paddle", note: "merchant of record, VAT", status: "placeholder" },
  { id: "p24", label: "Przelewy24", note: "PL: szybkie przelewy, BLIK", status: "placeholder" },
  { id: "payu", label: "PayU", note: "PL/CEE", status: "placeholder" },
  { id: "tpay", label: "Tpay", note: "PL: przelewy, BLIK", status: "placeholder" },
  { id: "paypal", label: "PayPal", note: "globalnie", status: "placeholder" },
  { id: "invoice", label: "Faktura / przelew B2B", note: "instytucje, ręczna aktywacja", status: "placeholder" },
  { id: "voucher", label: "Voucher / prepaid", note: "kody, granty, dostęp sponsorowany", status: "placeholder" },
];

export const PRIMARY_ACTIONS: { id: string; label: string; icon: IconName }[] = [
  { id: "buy", label: "Kup kredyty", icon: "sparkles" },
  { id: "plans", label: "Zobacz plany", icon: "card" },
  { id: "b2b", label: "Rozliczenie B2B / faktura", icon: "file" },
  { id: "methods", label: "Metody płatności", icon: "plug" },
];
