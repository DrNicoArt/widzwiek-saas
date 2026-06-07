# Widźwięk — status produktu (brutalnie jasny)

Cel: nie mylić **działającego demo** z **produktem produkcyjnym**.
Wersja: Product Demo v0.6 (tryb mock; realny, trwały obieg offline — bez API).

## [OK] Działa naprawdę (demo, lokalnie)
- **Realny rdzeń offline (bez API):** trwała persistencja jobów (zrzut JSON, ładowanie po restarcie),
  lista materiałów `GET /api/jobs`, usuwanie, **edytor napisów** `PUT /api/jobs/{id}` (edycja tekstu/czasu →
  ponowna walidacja WCAG + prze-zawijanie linii), eksport **SRT/VTT/TXT/JSON**, realny czas trwania (ffprobe).
  Frontend: Projekty pokazują realne wgrane materiały, edycja w zakładce Napisy, eksport z workera.
- Worker FastAPI: `/health`, upload joba, status joba, eksport SRT/VTT.
- Mock pipeline: pełny przepływ → `CaptionDocument` (transkrypcja, mówcy, dźwięki — dane demo).
- Walidacja WCAG 2.1 AA: raport TAK/NIE + lista błędów/ostrzeżeń (realna logika, nie mock).
- Eksport SRT i VTT: realne pliki generowane z `CaptionDocument`.
- Frontend Next.js: `/` (wejście) + `/app` (pracownia), status worker online/offline, podgląd napisów, raport, pobieranie.
- Branding z oficjalnych assetów (`BrandLogo`/`BrandEye`).
- Testy zielone (29), build zielony, brak wymogu kluczy/sieci.

## [MOCK] Świadomie udawane w demo
- Transkrypcja, mówcy i dźwięki w trybie mock to przykładowy materiał PL, nie analiza wgranego pliku.
- Czas trwania, segmenty i timing pochodzą z `mock_data`.
- Biblioteka projektów i statystyki na dashboardzie to dane demonstracyjne (`mockData`).

## [API-READY] Przygotowane do testu live (czeka na klucz)
- Transkrypcja OpenAI (`PIPELINE_MODE=api` + `OPENAI_API_KEY`) — adapter i mapowanie gotowe, zero live-requestów w testach.
- Ekstrakcja audio z wideo (ffmpeg) — gotowa, wymaga ffmpeg w systemie.

## [TBD] Placeholder / interfejs, brak realnej logiki
- Diaryzacja mówców — `single-speaker-tbd` (api). Realny provider: kolejny etap.
- Dźwięki niewerbalne — `noop-tbd` (api). Realny detektor: kolejny etap.
- Realny czas trwania (ffprobe) zamiast wartości z mocka.

## [LATER] Po MVP, wymaga decyzji
- Storage plików (S3/R2/Supabase), persistencja (Postgres), auth, płatności, e-mail,
  eksport PDF raportu, integracje cloud, monitoring, rate limiting, limity i bezpieczeństwo uploadu.
  Status każdej: `docs/EXTERNAL_APIS.md`.

## [PLACEHOLDER] Monetyzacja / billing
- Ekran `Plan i płatności` (`/app/plan`): plan Demo, kredyty (mock), zużycie miesięczne, plany i metody płatności.
- Model: kredyty/pay-per-use + subskrypcje + faktura B2B; jednostka = minuta materiału. Architektura **provider-agnostic** (`MockBillingProvider`).
- **W demo nic nie jest pobierane**; żaden dostawca nie jest wpięty. Szczegóły i ryzyka: `docs/MONETIZATION.md`.

## Wymaga kluczy / zewnętrznych usług
- Tryb api: `OPENAI_API_KEY`. Diaryzacja: token Hugging Face (przyszłość). Reszta: EXTERNAL_APIS.
- Demo nie wymaga żadnego z powyższych.

## Wymaga osobnego deployu / decyzji biznesowej
- Frontend (Vercel) i worker (VPS/GPU lub tunel) deployowane osobno — decyzja + konfiguracja.
- Wybór dostawców (ASR, diaryzacja, dźwięki, storage) — decyzja techniczno-kosztowa.

## Czego brakuje do kolejnych progów
- Do live API test: klucz OpenAI + nagranie 30–60 s (bez zmiany kontraktu danych).
- Do MVP: live transkrypcja + diaryzacja + dźwięki + persistencja + deploy.
- Do produkcji: auth, limity/bezpieczeństwo uploadu, monitoring, rate limiting, storage, hardening.
