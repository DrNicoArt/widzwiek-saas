# Roadmapa — Widźwięk

## ✅ Teraz: Demo Stable (lokalnie, bez kluczy)
Działający, spójny przepływ w trybie **mock**: worker FastAPI + frontend Next.js + mock pipeline +
kontrakt `CaptionDocument` + eksport SRT/VTT + raport WCAG 2.1 AA. Trasy: `/` (wejście produktowe),
`/app` (pracownia robocza). Zielone testy workera i build frontendu. Placeholdery dla wszystkich
integracji zewnętrznych (patrz `EXTERNAL_APIS.md`).

## 🔜 Kolejne etapy (kolejność)
1. **Live API transcription test** — `PIPELINE_MODE=api` + `OPENAI_API_KEY`, pomiar jakości PL na realnym nagraniu.
2. **Diaryzacja mówców** — realny provider (np. pyannote) zamiast `single-speaker-tbd`; mapowanie na kolory WCAG.
3. **Dźwięki niewerbalne** — detekcja (`[oklaski]`, `[muzyka]`...) zamiast `noop-tbd`.
4. **Storage / persistencja** — Postgres (joby/metadane) + obiektowy storage (pliki), kolejka do długiego przetwarzania.
5. **Deploy** — frontend na Vercel, worker osobno (VPS/GPU) lub tunel; `NEXT_PUBLIC_WORKER_URL` + CORS.
6. **UI / immersive layer** — dopracowanie warstwy doświadczenia (`/`), pełne sceny i motion (Phase 1B+).

## Poza zakresem demo (świadomie)
Auth, płatności, panel admina, produkcyjna autoryzacja, ciężki cloud, zaawansowany edytor napisów,
eksport PDF — placeholdery/UI-kierunek; realizacja po MVP. Patrz `EXTERNAL_APIS.md`.

## Deploy na Vercel (skrót)
Na Vercel idzie tylko `web/` (Root Directory = `web`). Worker AI **nie** (limity serverless).
Worker hostujemy osobno; adres podajemy przez `NEXT_PUBLIC_WORKER_URL`. CORS: `WIDZWIEK_CORS_ORIGINS`.
