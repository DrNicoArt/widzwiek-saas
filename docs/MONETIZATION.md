# Widźwięk — model monetyzacji (kierunkowo, status: PLACEHOLDER)

Ten dokument opisuje **docelowy** model rozliczeń. Na obecnym etapie (PoC → demo MVP) billing jest
**placeholderem**: ekran `Plan i płatności` (`/app/plan`) pokazuje kierunek, ale **nic nie jest pobierane**,
a żaden dostawca płatności nie jest wpięty. Liczby (ceny, kredyty) są przykładowe i niewiążące (TBD).

## 1. Model hybrydowy
Trzy ścieżki, które się uzupełniają:

- **Kredyty / pay-per-use** — dla nieregularnych klientów i twórców. Kupujesz pulę, zużywasz wg potrzeb.
- **Subskrypcje tierowe** (miesięczne/roczne) — dla firm, agencji i zespołów o stałym wolumenie.
- **Manualne rozliczenia B2B** (faktura/przelew) — dla instytucji, uczelni i sektora publicznego.

## 2. Jednostka rozliczeniowa
Podstawą jest **minuta przetworzonego materiału**, przeliczana na **kredyty**. Funkcje dodatkowe to mnożniki:

| Zakres | Mnożnik (przykładowo) |
|---|---|
| Sama transkrypcja | × 1.0 |
| + identyfikacja mówców | × 1.3 |
| + dźwięki niewerbalne | × 1.3 |
| + raport WCAG + eksport | × 1.2 |

Heurystyka demo: `worker`/`web` liczą szacunek (`estimateCredits`) — w demo wyłącznie poglądowo.

## 3. Plany (kierunkowo — ceny TBD)
| Plan | Dla kogo | Rozliczenie |
|---|---|---|
| **Demo** | Testy i prezentacje | 0 zł, tryb mock, bez pobierania kredytów |
| **Starter** | Freelancerzy, twórcy | pula minut/kredytów, 1 użytkownik |
| **Pro** | Małe zespoły, agencje | więcej minut, mówcy/dźwięki (po integracji), historia |
| **Business / Uczelnie** | Instytucje, edukacja | faktura/przelew B2B, większe limity, wsparcie wdrożenia |

## 4. Billing provider-agnostic (ważne)
Płatności **nie są** sztywno przywiązane do jednego dostawcy. Architektura zakłada wspólny interfejs
`BillingProvider` i wymienne adaptery; w demo działa `MockBillingProvider` (nic nie pobiera).

Placeholdery adapterów: **Stripe**, **Paddle** (merchant of record/VAT), **PayPal**, **Przelewy24**,
**PayU**, **Tpay**, **BLIK** (przez operatora), **faktura/przelew B2B**, **voucher/prepaid**,
**grant / dostęp sponsorowany**.

Szkic kontraktu (TBD, nieзаimplementowany):
```
interface BillingProvider {
  createCheckout(plan|credits, customer): CheckoutSession
  handleWebhook(event): BillingResult        // potwierdzenia, chargebacki
  getBalance(customer): Credits
  chargeUsage(customer, units): void          // pay-per-use
}
```

## 5. UI (ekran „Plan i płatności")
W demo (`/app/plan`): plan **Demo**, billing mode **credits**, provider **mock**, przykładowe kredyty
(180/300), wizualizacja zużycia miesięcznego oraz przyciski-placeholdery: **Kup kredyty**, **Zobacz plany**,
**Rozliczenie B2B / faktura**, **Metody płatności**. Każda akcja jasno oznaczona jako placeholder.

## 6. Ryzyka i kwestie do rozstrzygnięcia (przed realnym billingiem)
- **VAT / podatki** — sprzedaż międzynarodowa (rozważyć merchant of record, np. Paddle).
- **Faktury** — wymóg PL dla B2B/instytucji; numeracja, dane nabywcy, korekty.
- **Webhooki** — idempotencja, ponowne dostarczenia, spójność salda kredytów.
- **Chargebacki / zwroty** — polityka i wpływ na saldo.
- **RODO** — dane płatnicze po stronie dostawcy; minimalizacja danych u nas.
- **Bezpieczeństwo** — brak danych kartowych u nas; klucze providerów w secrets managerze, nie w repo.

## 7. Status wdrożenia
Placeholder. Kolejność: najpierw wiarygodne demo (kredyty mock, ekran planu), potem — po decyzji
biznesowej — adapter pierwszego realnego dostawcy (najpewniej PL: Przelewy24/Tpay + faktura B2B,
oraz Stripe/Paddle dla zagranicy). Definicja „done" dla etapu: `docs/MVP_CHECKLIST.md` → „Billing MVP".
