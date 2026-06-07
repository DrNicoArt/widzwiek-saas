# API live test — checklist (transkrypcja OpenAI)

Cel: jednorazowy test realnej transkrypcji na krótkim nagraniu (30–60 s), **bez zmiany kontraktu danych**.
Branch: `api-live-test`. Demo w trybie mock pozostaje sprawne przez cały czas.

## Wymagania
- Klucz `OPENAI_API_KEY` (płatne wywołanie — krótkie nagranie = grosze).
- Pakiet `openai` (zakomentowany w `worker/requirements.txt`).
- (Wideo) `ffmpeg` w PATH; dla pliku audio (mp3/wav/m4a) niepotrzebny.
- Nagranie PL 30–60 s (mp3/wav/m4a), najlepiej 1–2 mówców.

## Krok po kroku (Windows / PowerShell)
1. `cd worker; .\.venv\Scripts\Activate.ps1`
2. Odkomentuj `openai>=1.0` w `requirements.txt` → `pip install -r requirements.txt`.
3. W `worker/.env`:
   ```
   PIPELINE_MODE=api
   OPENAI_API_KEY=sk-...
   OPENAI_TRANSCRIPTION_MODEL=whisper-1
   ```
4. **Offline sanity (bez wywołań sieci):** `python -m widzwiek.api_check` → ma pokazać `GOTOWY DO API: TAK`.
5. Start: `uvicorn widzwiek.main:app --reload --port 8000`.
6. Sprawdź `GET /health` → `mode:"api"`, `ready:true`, `openai_installed:true`.
7. Frontend: `/app` → wgraj nagranie → Przetwórz. (Albo `curl -F "file=@probka.mp3" http://localhost:8000/api/jobs`.)

## Co sprawdzić w wyniku
- Transkrypcja PL sensowna (≥ ~90% słów — kryterium PoC).
- Segmenty mają czasy (start/end) i trafiają do `CaptionDocument` bez błędów mapowania.
- Napisy: długość linii ≤ 42, raport WCAG generuje się; eksport SRT/VTT działa.
- Diaryzacja = jeden mówca (`single-speaker-tbd`), dźwięki = brak (`noop-tbd`) — zgodnie z oczekiwaniem.

## Gdyby coś nie działało
- Brak/zły klucz → job kończy się `error` z czytelnym komunikatem; wróć do `PIPELINE_MODE=mock`.
- Limit 25 MB / długie audio → przytnij nagranie; dla wideo zainstaluj ffmpeg.
- **Rollback:** `PIPELINE_MODE=mock` w `.env` + restart — demo znów stabilne.

## Po teście
- Zanotuj jakość (dokładność, czasy, koszt) w issue/notatce.
- Kolejne etapy (wg ROADMAP): diaryzacja → dźwięki niewerbalne → persistencja → deploy.
- Klucza ani `.env` NIE commituj (są w `.gitignore`).
