# Decyzje techniczne (ADR skrócony)

Każda decyzja ma powód. Format: Decyzja → Powód → Alternatywy → Status.

## ADR-001 — Rozdział web (Vercel) i worker (Python)
**Decyzja:** dwie warstwy: frontend Next.js + osobny backend Python/FastAPI.
**Powód:** modele AI audio (Whisper, diaryzacja) i 5-min wideo przekraczają limity serverless Vercel
(czas, RAM, dysk, brak GPU). Frontend nadaje się na Vercel, AI nie.
**Alternatywy:** wszystko na Vercel (odrzucone — niewykonalne dla AI); wszystko w Node (odrzucone —
ekosystem AI audio jest w Pythonie). **Status:** przyjęte.

## ADR-002 — Python + FastAPI dla pipeline
**Powód:** Whisper/pyannote/torch to Python; pydantic daje jeden model jako kontrakt danych + walidację
wejścia API; auto-dokumentacja `/docs`. **Alternatywy:** Flask (mniej typowania), Node+ONNX (gorsze
wsparcie modeli). **Status:** przyjęte.

## ADR-003 — Jeden `CaptionDocument` jako kontrakt
**Decyzja:** wszystkie etapy wzbogacają jeden wersjonowany obiekt (patrz `DATA_CONTRACT.md`).
**Powód:** brak transformacji między etapami, łatwa serializacja i testy, naturalna ewolucja do MVP.
**Alternatywy:** osobny payload per etap (więcej mapowań, więcej błędów). **Status:** przyjęte.

## ADR-004 — Provider Orchestrator + adaptery providerów
**Decyzja:** orkiestrator wybiera źródło transkryptu i adaptery (`TranscriptSourceProvider`,
`ASRProvider`, `DiarizationProvider`, `SoundEventProvider`, `ExportProvider`). `Mock*` działa w demo,
OpenAI jest pierwszym live providerem, reszta to placeholdery.
**Powód:** produkt ma być provider-agnostic i automatyczny dla użytkownika. Podmiana providera = adapter,
nie przebudowa UI ani kontraktu.
**Status:** przyjęte.

## ADR-005 — WCAG, formatowanie i eksport jako osobne moduły
**Decyzja:** `pipeline/formatter` (łamanie linii/timing) ≠ `wcag/validator` (ocena) ≠ `export/` (pliki).
**Powód:** wymóg briefu o rozdziale; walidator musi być niezależnie testowalny i to on daje główną
wartość produktu (raport TAK/NIE). **Status:** przyjęte.

## ADR-006 — Brak DB / kolejki / auth / płatności na PoC
**Decyzja:** in-memory job store + opcjonalny zrzut JSON; brak logowania i płatności.
**Powód:** PoC waliduje technologię, nie model sprzedaży; minimalizujemy ruchome części.
**Alternatywy:** Postgres + Redis + queue od razu (przedwczesne). **Status:** przyjęte; migracja w `ROADMAP.md`.

## ADR-007 — Mock pipeline zwraca realistyczny materiał PL
**Decyzja:** mock generuje spójny przykład (lektor + gość + dźwięki + 1 ostrzeżenie WCAG) niezależnie od pliku.
**Powód:** demo musi pokazać CAŁY przepływ produktu (łącznie z wartością raportu) przed integracją AI.
**Status:** przyjęte.

## ADR-008 — No-API-first + Model B (provider-agnostic)
**Decyzja:** domyślnie AI działa bez kluczy API (w przeglądarce), a płatny tryb idzie przez Model B:
użytkownik wybiera TRYB/jakość (nie dostawcę), Widźwięk opłaca providerów i dolicza marżę.
**Powód:** prywatność i zerowy koszt na wejściu; ukrycie dostawcy chroni marżę, lock-in i wartość firmy;
user nie musi rozumieć OpenAI/Deepgram. Rozszerza ADR-004 (orkiestrator zostaje warstwą wyboru ścieżki).
**Alternatywy:** BYO-key jako główny flow (odrzucone — zabija marżę i wartość). **Status:** przyjęte.

## ADR-009 — Konta i płatności bez własnego hosta (usługi zarządzane)
**Decyzja:** auth + baza przez managed (Supabase lub Clerk), płatności przez Stripe/Paddle, webhooki jako
funkcje serverless na Vercelu. Bez stawiania i utrzymywania własnego serwera na tym etapie.
**Powód:** realne konta/billing wymagają backendu, ale nie własnej maszyny; managed daje EU region, RLS,
VAT (Paddle MoR) i szybki start. Aktualizuje ADR-006 (na PoC nadal brak — to ścieżka do MVP).
**Alternatywy:** własny serwer auth (odrzucone — koszt/ryzyko), tylko localStorage (atrapa). **Status:** przyjęte (plan MVP).

## ADR-010 — Warstwa danych: localStorage → user-scoped Postgres + RLS
**Decyzja:** dziś materiały w localStorage (tryb przeglądarkowy); docelowo per-użytkownik w Postgresie
(Supabase) z Row-Level Security, region UE, polityką retencji i twardym usuwaniem.
**Powód:** konta mają sens, gdy dane są per-user i dostępne między urządzeniami; RODO/instytucje wymagają
retencji, prawa do usunięcia i izolacji najemców. Seam już jest: abstrakcja `api.ts` + `org_id` w workerze.
**Alternatywy:** trzymanie w kliencie (brak multi-device, brak zgodności). **Status:** przyjęte (kierunek).

## ADR-011 — Przenośność hostingu (Vercel front + worker/VPS), bez lock-inu
**Decyzja:** front/demo na Vercelu, ciężkie AI na osobnym workerze (VPS/GPU); aplikacja jako standardowy
Next SSR (`output: standalone` + Docker), bez prymitywów Vercela (KV/Blob/Edge Config) jako jedynej warstwy.
**Powód:** Vercel nie udźwignie GPU/długiego przetwarzania; trzymanie się standardu czyni przeprowadzkę na
VPS operacyjną (TLS, proces, CI), nie architektoniczną. **Alternatywy:** all-in na Vercel (niewykonalne dla AI).
**Status:** przyjęte.

## ADR-012 — brand.config + i18n + język ASR jako parametr (pod EU/rebranding)
**Decyzja:** jedno źródło marki (`lib/brand.ts`: nazwa/logo/tagline/domena/asr/locale), lekka warstwa i18n
(`lib/i18n`, typowany katalog + `useT`), język materiału przez `BRAND.asr` (nie zaszyte „pl"), kolory jako
tokeny Tailwind. **Powód:** wejście na rynek EU i rebranding/white-label mają być zmianą konfiguracji, nie
przepisywaniem; WCAG 2.1 AA = standard EU, Whisper jest wielojęzyczny. **Alternatywy:** literały rozsiane po
kodzie (drogi rebranding). **Status:** przyjęte.

## ADR-013 — Usunięcie warstwy „demo/mock" z UI; flaga IS_BROWSER_MODE
**Decyzja:** żadnego słowa „demo"/„mock" w UI i kodzie; tryb przeglądarkowy sterowany `IS_BROWSER_MODE`
(env `NEXT_PUBLIC_BROWSER_MODE`, z fallbackiem na starą `NEXT_PUBLIC_STATIC_DEMO`); dane przykładowe tylko
jako fallback, gdy user nie ma materiałów. **Powód:** produkt ma wyglądać jak produkt, nie jak zabawka.
Aktualizuje ADR-007 (mock pipeline → „dane przykładowe" jako świadomy fallback). **Status:** przyjęte.

## Otwarte kwestie (TBD)
- Alternatywni providerzy ASR/API/hosted model — decyzja po pomiarze jakości/kosztu; self-hosted/lokalne
  modele tylko jako later/dev eksperyment infrastrukturalny, nie strategia produktu.
- Diaryzacja: pyannote.audio (licencja/HF token) vs alternatywy.
- Detekcja dźwięków: YAMNet/PANNs vs LLM po transkrypcji — do walidacji.
- Walidacja kontrastu/synchronizacji/pozycji — wymaga warstwy wideo (poza PoC).
- Format EBU-TT — po MVP.
