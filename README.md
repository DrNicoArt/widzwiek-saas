# Widźwięk

> Zobacz to, co inni słyszą.
> Webowa aplikacja SaaS do tworzenia **napisów dostępnościowych zgodnych z WCAG 2.1 AA**
> dla polskiego audio i wideo. Projekt grupy **SubrosAI**.

Widźwięk to nie zwykła transkrypcja, lecz narzędzie do **captions dostępnościowych**: treść mowy +
identyfikacja mówców + opisy dźwięków niewerbalnych (`[oklaski]`, `[muzyka]`, `[pukanie]`) +
formatowanie i timing + eksport **SRT/VTT** + **raport zgodności WCAG (TAK/NIE + lista problemów)**.

To repo to **Complete Demo v0.4** — pełny flow produktu działa lokalnie w trybie **mock**, **bez kluczy API**.

---

## Co działa w demo (mock, bez kluczy)

`/` (wejście) → `/app` (pracownia): wgrywasz audio/wideo (lub symulujesz) i przechodzisz cały proces —
**processing → transkrypcja → napisy → mówcy i dźwięki → raport WCAG → eksport SRT/VTT** — bez żadnych
zewnętrznych API. Walidacja WCAG i eksport SRT/VTT są **realne**; transkrypcja/mówcy/dźwięki w demo to
dane mock zgodne z kontraktem `CaptionDocument` (ten sam kontrakt obsłuży później realne providery).

- Scenariusz pokazu: [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md)
- Orkiestrator przetwarzania: [`docs/ORCHESTRATOR.md`](docs/ORCHESTRATOR.md)
- Co działa / mock / placeholder: [`docs/PRODUCT_STATUS.md`](docs/PRODUCT_STATUS.md)
- Integracje zewnętrzne (status, ENV, fallback): [`docs/EXTERNAL_APIS.md`](docs/EXTERNAL_APIS.md)
- Test live API (po kluczu): [`docs/API_LIVE_TEST.md`](docs/API_LIVE_TEST.md) · droga do MVP: [`docs/MVP_CHECKLIST.md`](docs/MVP_CHECKLIST.md)

---

## Architektura i trasy

```
web/  (Next.js + TS)            worker/ (Python + FastAPI)
  /     wejście produktowe        /health            tryb + providery + gotowość API
  /app  pracownia (cockpit)  ⇄    POST /api/jobs      upload → pipeline
        materiał→processing→       GET  /api/jobs/{id} status + wynik
        transkrypcja→napisy→        .../export/srt|vtt pliki napisów
        mówcy+dźwięki→WCAG→eksport
```

- **worker/** — pipeline pod orkiestratorem: źródło transkryptu → provider transkrypcji → diaryzacja →
  dźwięki → formatowanie → WCAG → eksport; tryb `mock`/`api`.
- **contracts/** — `CaptionDocument` (JSON Schema) — wspólny kontrakt web↔worker, niezmieniany przy podmianie providerów.
- **docs/** — [ARCHITECTURE](docs/ARCHITECTURE.md) · [ORCHESTRATOR](docs/ORCHESTRATOR.md) · [DATA_CONTRACT](docs/DATA_CONTRACT.md) · [WCAG](docs/WCAG.md) · [DECISIONS](docs/DECISIONS.md) · [BRAND_UI_GUIDELINES](docs/BRAND_UI_GUIDELINES.md) · [EXTERNAL_APIS](docs/EXTERNAL_APIS.md) · [PRODUCT_STATUS](docs/PRODUCT_STATUS.md) · [DEMO_SCRIPT](docs/DEMO_SCRIPT.md) · [API_LIVE_TEST](docs/API_LIVE_TEST.md) · [MVP_CHECKLIST](docs/MVP_CHECKLIST.md) · [ROADMAP](docs/ROADMAP.md)

---

## Tryby pipeline: mock vs api

| Tryb | Co robi | Klucz API? | Zastosowanie |
|------|---------|------------|--------------|
| **mock** (domyślny) | symuluje cały przepływ na przykładowym materiale PL | **nie** | demo, praca nad UI, testy |
| **api** | realna transkrypcja audio (OpenAI); reszta jak w mock | tak (`OPENAI_API_KEY`) | realne nagrania |

`mock` nie wymaga `openai`, klucza, ffmpeg, bazy ani storage. W `api` bez klucza worker zwraca czytelny błąd.
Gotowość sprawdzisz offline: `python -m widzwiek.api_check`. `GET /health` pokazuje `mode`, `ready`,
`api_key_present`, `openai_installed`, `ffmpeg_present`, providery i notatki.

---

## Uruchomienie lokalne (Windows / PowerShell)

### 1) Worker — terminal 1
```powershell
cd worker
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn widzwiek.main:app --reload --port 8000
```
Sprawdzenie: http://localhost:8000/health → `{"status":"ok","mode":"mock","ready":true,...}`. Swagger: `/docs`.

### 2) Frontend — terminal 2
```powershell
cd web
npm install
copy .env.example .env.local
npm run dev
```
- `/` → http://localhost:3000 · `/app` → http://localhost:3000/app
- Jeśli style/route nie odświeżają się: `Remove-Item -Recurse -Force .next` i `npm run dev`.

### Jak przejść demo
`/` → **Otwórz demo** → `/app` → **Wgraj materiał** (dowolny plik) → **Przetwórz** → przewiń sekcje
transkrypcja → napisy → mówcy/dźwięki → raport WCAG → pobierz SRT/VTT. Krok po kroku: `docs/DEMO_SCRIPT.md`.

---

## Walidacja
```powershell
cd worker; .\.venv\Scripts\Activate.ps1; pytest -q; python -m widzwiek.demo; python -m widzwiek.api_check
cd web; npm run typecheck; npm run lint; npm run build
```
Testy nie wymagają klucza API ani sieci (wywołania API są mockowane).

---

## Struktura repozytorium
```
widzwiek/
├─ web/          # Next.js (TS) — / (wejście) i /app (pracownia, pełny flow)
├─ worker/       # Python (FastAPI) — pipeline mock/api, WCAG, eksport, api_check
├─ contracts/    # JSON Schema kontraktu CaptionDocument
├─ docs/         # architektura, kontrakt, WCAG, branding, external APIs, status, demo, api-test, mvp, roadmapa
├─ .env.example
└─ .gitignore
```
Sekrety wyłącznie w `.env` (ignorowane). W repo nie ma żadnych kluczy. Branding: oficjalne assety
`web/public/brand/` (logotyp + sygnet) przez `BrandLogo` / `BrandEye`.

---

## Następne etapy
Live API transcription → diaryzacja → sound events → persistence → deploy → auth/billing/security → UI polish.
Definicje „done": [`docs/MVP_CHECKLIST.md`](docs/MVP_CHECKLIST.md).

SubrosAI · Widźwięk · Complete Demo v0.4
