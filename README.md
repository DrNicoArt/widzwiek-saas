# Widźwięk

> Zobacz to, co inni słyszą.
> Webowa aplikacja SaaS do tworzenia **napisów dostępnościowych zgodnych z WCAG 2.1 AA**
> dla polskiego audio i wideo. Projekt grupy **SubrosAI**.

Widźwięk to nie zwykła transkrypcja, lecz narzędzie do **captions dostępnościowych**: treść mowy +
identyfikacja mówców + opisy dźwięków niewerbalnych (`[oklaski]`, `[muzyka]`, `[pukanie]`) +
formatowanie i timing + eksport **SRT/VTT** + **raport zgodności WCAG (TAK/NIE + lista problemów)**.

To repo to **Demo Stable** — działa w całości lokalnie, w trybie **mock**, **bez żadnych kluczy API**.

---

## Co działa w demo (mock)

Uruchamiasz worker + frontend, wchodzisz do aplikacji, wgrywasz audio/wideo (lub odpalasz
symulowany przepływ) i dostajesz: status przetwarzania → przykładową transkrypcję → segmenty napisów,
mówców i dźwięki (dane demonstracyjne) → **raport WCAG** → pobranie **SRT i VTT**. Tryb mock jest
pełnoprawnym trybem prezentacyjnym, nie obejściem awaryjnym.

Wszystkie integracje zewnętrzne (OpenAI, diaryzacja, dźwięki, storage, auth, PDF, cloud) są
**placeholderami/adapterami** — patrz [`docs/EXTERNAL_APIS.md`](docs/EXTERNAL_APIS.md). Demo nie
wymaga klucza ani sieci.

---

## Architektura i trasy

```
web/  (Next.js + TS)            worker/ (Python + FastAPI)
  /     immersive entry           /health            tryb + providery
  /app  pracownia (cockpit)  ⇄    POST /api/jobs      upload → pipeline
        upload→status→raport      GET  /api/jobs/{id} status + wynik
        →SRT/VTT                  .../export/srt|vtt  pliki napisów
```

- **`/`** — wejście produktowe (scena). **`/app`** — robocza aplikacja (upload → przetwarzanie → raport → eksport).
- **worker/** — pipeline `ASR → diaryzacja → dźwięki → formatowanie → walidacja WCAG → eksport`. Tryb `mock`/`api`.
- **contracts/** — `CaptionDocument` (JSON Schema) — wspólny kontrakt danych web↔worker.
- **docs/** — [ARCHITECTURE](docs/ARCHITECTURE.md) · [DATA_CONTRACT](docs/DATA_CONTRACT.md) · [WCAG](docs/WCAG.md) · [DECISIONS](docs/DECISIONS.md) · [BRAND_UI_GUIDELINES](docs/BRAND_UI_GUIDELINES.md) · [EXTERNAL_APIS](docs/EXTERNAL_APIS.md) · [ROADMAP](docs/ROADMAP.md)

---

## Tryby pipeline: mock vs api

| Tryb | Co robi | Klucz API? | Zastosowanie |
|------|---------|------------|--------------|
| **mock** (domyślny) | symuluje cały przepływ na przykładowym materiale PL | **nie** | demo, praca nad UI, testy |
| **api** | realna transkrypcja audio (OpenAI); reszta jak w mock | tak (`OPENAI_API_KEY`) | realne nagrania |

Tryb wybiera `PIPELINE_MODE`. `mock` jest domyślny i działa bez kluczy. W trybie `api` bez klucza
worker zwraca czytelny błąd (graceful failure) — demo pozostaje w `mock`. `GET /health` pokazuje
aktywny `mode`, realne providery i `ready`.

---

## Uruchomienie lokalne (Windows / PowerShell)

Potrzebne: **Python 3.10+**, **Node.js 18+**. Dwa terminale.

### 1) Worker — terminal 1
```powershell
cd worker
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn widzwiek.main:app --reload --port 8000
```
Sprawdzenie: http://localhost:8000/health → `{"status":"ok","mode":"mock",...}`. Swagger: `/docs`.

### 2) Frontend — terminal 2
```powershell
cd web
npm install
copy .env.example .env.local
npm run dev
```
- `/` → http://localhost:3000 (wejście) · `/app` → http://localhost:3000/app (pracownia).
- Jeśli zmieniałeś pliki, a style/route nie odświeżają się: `Remove-Item -Recurse -Force .next` i `npm run dev`.

### Tryb API (opcjonalnie, realna transkrypcja)
W `worker/.env`: `PIPELINE_MODE=api` + `OPENAI_API_KEY=...`, odkomentuj `openai` w `worker/requirements.txt`,
`pip install -r requirements.txt`, restart workera. Szczegóły: [`worker/README.md`](worker/README.md).

---

## Walidacja
```powershell
# worker
cd worker; .\.venv\Scripts\Activate.ps1; pytest -q; python -m widzwiek.demo
# frontend
cd web; npm run typecheck; npm run lint; npm run build
```
Testy nie wymagają żadnego klucza API ani sieci (wywołania API są mockowane).

---

## Struktura repozytorium
```
widzwiek/
├─ web/          # Next.js (TS) — / (wejście) i /app (pracownia)
├─ worker/       # Python (FastAPI) — pipeline mock/api, WCAG, eksport SRT/VTT
├─ contracts/    # JSON Schema kontraktu CaptionDocument
├─ docs/         # architektura, kontrakt, WCAG, decyzje, branding, external APIs, roadmapa
├─ .env.example
└─ .gitignore
```
Sekrety wyłącznie w `.env` (ignorowane). W repo nie ma żadnych kluczy. Branding: oficjalne assety
w `web/public/brand/` (logotyp + sygnet), używane przez `BrandLogo` / `BrandEye`.

---

## Następny etap
Po demo stable: live API transcription test → diaryzacja → dźwięki niewerbalne → storage → deploy →
dopracowanie warstwy UI/immersive. Szczegóły: [`docs/ROADMAP.md`](docs/ROADMAP.md).

SubrosAI · Widźwięk · Demo Stable
