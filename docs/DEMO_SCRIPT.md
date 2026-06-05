# Widźwięk — scenariusz prezentacji (demo mock, ~5 min)

Demo działa lokalnie, **bez żadnych kluczy API**. Dwa terminale (Windows / PowerShell).

## 0. Przygotowanie
```powershell
# Terminal 1 — worker
cd worker; python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt; copy .env.example .env
uvicorn widzwiek.main:app --reload --port 8000
# Terminal 2 — frontend
cd web; npm install; copy .env.example .env.local
npm run dev
```

## 1. Wejście / (30 s)
- Otwórz `http://localhost:3000` → duży logotyp, hasło „Napisy dostępnościowe WCAG dla audio i wideo",
  pasek funkcji (transkrypcja, mówcy, dźwięki, raport WCAG, eksport), sygnet jako element systemu.
- Podkreśl: „Demo działa w trybie mock — bez kluczy API." Kliknij **Otwórz demo** → `/app`.

## 2. Pracownia /app — system (30 s)
- Pokaż status **worker online** + badge **tryb demo · mock**. (Opcjonalnie: ubij worker → elegancki stan offline; wróć.)

## 3. Materiał + przetwarzanie (1 min)
- Sekcja 1 **Materiał**: wgraj dowolny plik audio/wideo → **Przetwórz**.
- Sekcja 2 **Przetwarzanie**: pipeline Audio → Transkrypcja → Mówcy → Dźwięki → WCAG → Eksport (mock, ale jak realny).

## 4. Wynik krok po kroku (2 min)
- Sekcja 3 **Transkrypcja**: segmenty z timestampem i mówcą.
- Sekcja 4 **Napisy**: cue index, start→end, tekst, długość linii, status zgodności (OK/uwaga/błąd).
- Sekcja 5 **Mówcy i dźwięki**: kolorowi mówcy + `[oklaski]`/`[muzyka]` — „to captions, nie subtitles" (WCAG 1.2.2).
  Zaznacz: dane mock, realne providery (diaryzacja, detekcja) to placeholdery.
- Sekcja 6 **Raport WCAG** (najmocniejszy): „Spełnia WCAG 2.1 AA: TAK" + score + lista reguł (passed/warning/failed).

## 5. Eksport + status (30 s)
- Sekcja 7 **Eksport**: pobierz **SRT** i **VTT** (realne pliki). „SRT = kompatybilność, VTT = pełniejsza zgodność WCAG."
- Sekcja **Status demo**: co realne (WCAG, eksport), co mock (transkrypcja/mówcy/dźwięki), co placeholder.

## 6. Domknięcie (30 s)
„Wszystkie zewnętrzne API są placeholderami za interfejsami. Realna transkrypcja = `PIPELINE_MODE=api` +
klucz OpenAI + test live na 30–60 s nagraniu, **bez zmiany kontraktu danych**. Mapa: `docs/ROADMAP.md`,
statusy: `docs/PRODUCT_STATUS.md`, integracje: `docs/EXTERNAL_APIS.md`."
