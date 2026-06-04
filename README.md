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

## Stan projektu (PoC)

AI nie jest jeszcze zintegrowane. Repo zawiera **kompletny, działający przepływ** na **mock pipeline**,
który symuluje wynik transkrypcji, rozpoznania mówców, detekcji dźwięków, formatowania, walidacji WCAG
oraz eksportu SRT/VTT. Dzięki temu można pokazać docelowy produkt na demo, zanim podłączymy modele.

Mocki są ukryte za interfejsami (`ASRProvider`, `DiarizationProvider`, `SoundEventProvider`),
więc realne modele (Whisper itd.) podmienia się bez przepisywania reszty. Patrz [`docs/DECISIONS.md`](docs/DECISIONS.md).

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
- **worker/** — pipeline: `ASR → diaryzacja → dźwięki → formatowanie napisów → walidacja WCAG → eksport`. Lokalnie lub na serwerze z GPU.
- **contracts/** — `CaptionDocument` (JSON Schema) — wspólny kontrakt danych między etapami i między web↔worker.
- **docs/** — architektura, kontrakt danych, decyzje techniczne, parametry WCAG, roadmapa.

Szczegóły: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/DATA_CONTRACT.md`](docs/DATA_CONTRACT.md) · [`docs/WCAG.md`](docs/WCAG.md) · [`docs/ROADMAP.md`](docs/ROADMAP.md)

---

## Uruchomienie lokalne (Windows / PowerShell)

Potrzebne: **Python 3.10+** i **Node.js 18+**. Dwa terminale.

### 1) Worker (backend AI/pipeline) — terminal 1

```powershell
cd worker
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy ..\.env.example .env
uvicorn widzwiek.main:app --reload --port 8000
```

Sprawdzenie: otwórz http://localhost:8000/health → `{"status":"ok"}`.
Dokumentacja API (Swagger): http://localhost:8000/docs

### 2) Web (frontend / demo) — terminal 2

```powershell
cd web
npm install
copy .env.example .env.local
npm run dev
```

Otwórz http://localhost:3000 — wgraj dowolny plik audio/wideo, kliknij **Przetwórz**,
zobacz transkrypcję, mówców, dźwięki, raport WCAG i pobierz SRT/VTT.

> Na PoC pipeline jest mockiem — zwróci spójny przykładowy materiał PL niezależnie od wgranego pliku,
> żeby zademonstrować pełny przepływ.

### Szybki test samego workera (bez frontendu)

```powershell
cd worker
.\.venv\Scripts\Activate.ps1
pytest -q
python -m widzwiek.demo   # wypisze SRT/VTT i raport WCAG dla przykładu
```

---

## Deploy demo na Vercel (później)

Na Vercel wrzucamy **tylko `web/`** (Root Directory = `web`). Worker AI **nie** idzie na Vercel
(limity czasu/RAM/dysku). Worker stawiamy osobno (lokalnie przez tunel, albo VPS/GPU) i podajemy
jego adres przez zmienną `NEXT_PUBLIC_WORKER_URL`. Pełna instrukcja: [`docs/ROADMAP.md`](docs/ROADMAP.md#deploy-na-vercel).

---

## Struktura repozytorium

```
widzwiek/
├─ web/          # Next.js (TypeScript) — frontend/demo, Vercel-ready
├─ worker/       # Python (FastAPI) — pipeline AI, WCAG, eksport SRT/VTT
├─ contracts/    # JSON Schema kontraktu danych CaptionDocument
├─ docs/         # architektura, kontrakt, decyzje, WCAG, roadmapa
├─ .env.example
└─ .gitignore
```

---

SubrosAI · Widźwięk · Czerwiec 2026 · dokument wewnętrzny grupy
