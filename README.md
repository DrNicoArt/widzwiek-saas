# Widźwięk

> Zobacz to, co inni słyszą.
> Automatyczne napisy **zgodne z WCAG 2.1 AA** dla polskiego audio i wideo.
> Projekt grupy **SubrosAI** — etap **PoC przed MVP**.

Widźwięk to nie zwykła transkrypcja. To narzędzie do **captions dostępnościowych**:
treść mowy + identyfikacja mówców + opisy dźwięków niewerbalnych (`[oklaski]`, `[muzyka]`,
`[pukanie]`) + poprawne formatowanie + timing + eksport **SRT/VTT** + **raport zgodności WCAG**.

Najważniejsza funkcja biznesowa to raport: **„Materiał spełnia WCAG 2.1 AA: TAK/NIE"** wraz z
listą konkretnych błędów i ostrzeżeń do poprawy.

---

## Tryby pipeline: mock vs api

Worker ma jeden przełącznik `PIPELINE_MODE`:

| Tryb | Co robi | Wymaga klucza API? | Zastosowanie |
|------|---------|--------------------|--------------|
| **mock** (domyślny) | symuluje cały przepływ na przykładowym materiale PL | **nie** | demo, praca nad UI, testy |
| **api** | realna transkrypcja audio przez OpenAI; reszta etapów jak w mock | tak (`OPENAI_API_KEY`) | realne nagrania |

Tryb **mock jest domyślny** i działa bez żadnych kluczy — brak `OPENAI_API_KEY` nie psuje demo.
Pełna instrukcja trybu API: [`worker/README.md`](worker/README.md).

### Co jest gotowe ✅
Mock pipeline (pełny przepływ), kontrakt `CaptionDocument`, formatowanie napisów (≤42 zn., max 2 linie),
walidacja WCAG 2.1 AA (raport TAK/NIE + lista problemów), eksport SRT/VTT, frontend demo (upload → status →
podgląd → raport → pobieranie), branding (logotyp/sygnet) + favicon, realna transkrypcja przez OpenAI w trybie api.

### Co jest TBD 🔜
Diaryzacja mówców (na razie jeden mówca w trybie api), detekcja dźwięków niewerbalnych dla realnego audio,
realny czas trwania przez ffprobe, live-test API (brak klucza), pełny UI refresh wg brandingu, deploy na Vercel.

---

## Architektura w skrócie

Dwie warstwy, bo ciężkie AI/audio nie zmieści się w limitach Vercela:

```
┌──────────────────────────┐        HTTP        ┌──────────────────────────────┐
│  web/  (Next.js + TS)    │  ───────────────▶  │  worker/  (Python + FastAPI) │
│  Frontend / demo         │                    │  Pipeline AI + WCAG + eksport│
│  → deploy na Vercel       │  ◀───────────────  │  → lokalnie / osobny serwer  │
└──────────────────────────┘   CaptionDocument   └──────────────────────────────┘
```

- **web/** — upload, status, podgląd transkrypcji/mówców/dźwięków, raport WCAG, pobieranie SRT/VTT. Gotowe pod Vercel.
- **worker/** — pipeline: `ASR → diaryzacja → dźwięki → formatowanie napisów → walidacja WCAG → eksport`. Tryb mock/api.
- **contracts/** — `CaptionDocument` (JSON Schema) — wspólny kontrakt danych między etapami i między web↔worker.
- **docs/** — architektura, kontrakt danych, decyzje techniczne, parametry WCAG, branding, roadmapa.

Szczegóły: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/DATA_CONTRACT.md`](docs/DATA_CONTRACT.md) · [`docs/WCAG.md`](docs/WCAG.md) · [`docs/BRAND_UI_GUIDELINES.md`](docs/BRAND_UI_GUIDELINES.md) · [`docs/ROADMAP.md`](docs/ROADMAP.md)

---

## Uruchomienie lokalne (Windows / PowerShell)

Potrzebne: **Python 3.10+** i **Node.js 18+**. Dwa terminale.

### 1) Worker (backend pipeline) — terminal 1

```powershell
cd worker
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn widzwiek.main:app --reload --port 8000
```

Sprawdzenie: http://localhost:8000/health → `{"status":"ok", ...}` (pokazuje aktywne providery).
Swagger: http://localhost:8000/docs. Domyślnie działa tryb **mock** (bez klucza API).

### 2) Web (frontend / demo) — terminal 2

```powershell
cd web
npm install
copy .env.example .env.local
npm run dev
```

Otwórz http://localhost:3000 — wgraj plik audio/wideo, kliknij **Przetwórz**, zobacz transkrypcję,
mówców, dźwięki, raport WCAG i pobierz SRT/VTT. W trybie mock wynik to spójny przykładowy materiał PL.

### Tryb API (realna transkrypcja)

W `worker/.env` ustaw `PIPELINE_MODE=api` oraz `OPENAI_API_KEY=...` i zrestartuj worker.
Szczegóły, obsługa wideo (ffmpeg) i komunikaty błędów: [`worker/README.md`](worker/README.md).

### Szybki test samego workera (bez frontendu, bez sieci)

```powershell
cd worker
.\.venv\Scripts\Activate.ps1
pytest -q
python -m widzwiek.demo   # SRT/VTT + raport WCAG dla przykładu (tryb mock)
```

---

## Walidacja (CI lokalne)

```powershell
# worker
cd worker; .\.venv\Scripts\Activate.ps1; pytest -q
# web
cd web; npm run typecheck; npm run lint; npm run build
```

---

## Deploy demo na Vercel (później)

Na Vercel wrzucamy **tylko `web/`** (Root Directory = `web`). Worker AI **nie** idzie na Vercel
(limity czasu/RAM/dysku). Worker stawiamy osobno i podajemy adres przez `NEXT_PUBLIC_WORKER_URL`.
Pełna instrukcja: [`docs/ROADMAP.md`](docs/ROADMAP.md#deploy-na-vercel).

---

## Struktura repozytorium

```
widzwiek/
├─ web/          # Next.js (TypeScript) — frontend/demo, Vercel-ready
├─ worker/       # Python (FastAPI) — pipeline (mock/api), WCAG, eksport SRT/VTT
├─ contracts/    # JSON Schema kontraktu danych CaptionDocument
├─ docs/         # architektura, kontrakt, decyzje, WCAG, branding, roadmapa
├─ .env.example
└─ .gitignore
```

Sekrety trzymamy wyłącznie w `.env` (ignorowane przez git). W repo nie ma żadnych kluczy API.

---

SubrosAI · Widźwięk · Czerwiec 2026 · dokument wewnętrzny grupy
