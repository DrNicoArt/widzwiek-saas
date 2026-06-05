# Widźwięk — scenariusz prezentacji (demo mock, ~5 min)

Demo działa lokalnie, **bez żadnych kluczy API**. Dwa terminale (Windows / PowerShell).

## 0. Przygotowanie (przed spotkaniem)
```powershell
# Terminal 1 — worker
cd worker; python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt; copy .env.example .env
uvicorn widzwiek.main:app --reload --port 8000
# Terminal 2 — frontend
cd web; npm install; copy .env.example .env.local
npm run dev
```

## 1. Kontekst (30 s)
„Widźwięk zamienia audio/wideo w napisy **dostępnościowe zgodne z WCAG 2.1 AA** — z opisem mówców
i dźwięków, nie tylko transkrypcją. Najważniejszy jest raport: *materiał spełnia WCAG: TAK/NIE*."

## 2. System żyje (30 s)
- Otwórz `http://localhost:8000/health` → pokaż `mode: mock`, `ready: true`, aktywne providery.
- Otwórz `http://localhost:3000` (`/`) → wejście produktowe. Kliknij **Rozpocznij analizę** → `/app`.

## 3. Pracownia (1 min)
- Pokaż status **worker online** (kropka), tryb **mock** (badge „tryb demo").
- (Opcjonalnie wyłącz worker → pokaż elegancki stan **offline** z instrukcją; włącz z powrotem.)

## 4. Przetwarzanie (1 min)
- Wgraj dowolny plik audio/wideo (albo kliknij Przetwórz) → pokaż **pipeline**: Audio → Transkrypcja →
  Mówcy → Dźwięki → WCAG → Eksport.
- Podkreśl: w mock to przykładowy materiał PL — pełny przepływ produktu bez kosztów API.

## 5. Wynik (1 min)
- Pokaż **segmenty napisów**: timestampy, mówcy, dźwięki `[oklaski]`/`[muzyka]`.
- Pokaż **raport WCAG**: gauge + „Spełnia WCAG 2.1 AA: TAK" + lista reguł (np. ostrzeżenie o długości linii).

## 6. Eksport (30 s)
- Pobierz **SRT** i **VTT** (realne pliki). „SRT = kompatybilność, VTT = pełniejsza zgodność WCAG."

## 7. Domknięcie (30 s)
„Wszystkie zewnętrzne API są placeholderami za interfejsami. Realna transkrypcja to tylko ustawienie
`PIPELINE_MODE=api` + klucz OpenAI i test live na 30–60 s nagraniu — **bez zmiany kontraktu danych**.
Diaryzacja i dźwięki to kolejne etapy. Mapa: `docs/ROADMAP.md`, statusy: `docs/PRODUCT_STATUS.md`."
