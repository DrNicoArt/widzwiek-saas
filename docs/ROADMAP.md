# Roadmapa — od PoC do MVP SaaS

## Etap 0 — PoC (TERAZ, ten commit)
- [x] Repo Git-ready, README, .env.example, .gitignore
- [x] Kontrakt danych `CaptionDocument` (pydantic + JSON Schema + typy TS)
- [x] Pipeline z interfejsami AI + mockami (ASR, diaryzacja, dźwięki)
- [x] Formatter napisów (łamanie linii ≤42 zn., max 2 linie, timing)
- [x] Walidator WCAG 2.1 AA → raport TAK/NIE + lista problemów
- [x] Eksport SRT i VTT
- [x] FastAPI: upload → status → wynik → pobranie
- [x] Frontend demo (Next.js) z całym przepływem
- **Cel spotkania #2:** GO/NO-GO. Kryteria z briefu: transkrypcja ≥90%, mówcy ≥85%, ≥3 dźwięki, WCAG bez błędów krytycznych, ≤10 min/5 min wideo.

## Etap 1 — Integracja AI (po GO)
- [ ] `WhisperASRProvider` (large-v3 lokalnie lub API) zamiast mocka — pomiar dokładności PL.
- [ ] `PyannoteDiarizationProvider` — przypisanie `speaker_id`, mapowanie na kolory WCAG.
- [ ] `SoundEventProvider` (YAMNet/PANNs lub LLM po transkrypcji) — opisy `[muzyka]`, `[oklaski]`…
- [ ] Ingest realny (ffprobe/ffmpeg) — czas, ekstrakcja audio z wideo.
- [ ] Metryka synchronizacji ±80 ms względem referencji (mierzalna hipoteza WCAG).

## Etap 2 — MVP SaaS
- [ ] Przetwarzanie asynchroniczne: kolejka (Redis/RQ lub Celery) + worker w tle; status realny.
- [ ] Trwałe przechowywanie: Postgres (joby/metadane) + storage plików (S3/R2) zamiast dysku.
- [ ] Upload dużych plików bez limitu body (presigned URL do storage, nie przez funkcję).
- [ ] Lekka autoryzacja (np. magic link) — minimalna, bez pełnego systemu kont.
- [ ] Prosty edytor poprawek napisów (jedno z wireframe'ów Agnieszki) — po MVP.

## Etap 3 — Produkt
- [ ] WCAG 2.2 AA + moduł AAA ([ironicznie], [szeptem], [cisza]).
- [ ] EBU-TT (broadcasting), walidacja kontrastu/pozycji w warstwie wideo.
- [ ] Płatności, panel, role.

---

## Deploy na Vercel

**Co idzie na Vercel:** wyłącznie `web/`. **Co NIE idzie:** `worker/` (limity serverless — patrz `ARCHITECTURE.md`).

### Kroki
1. Repo na GitHub. W Vercel: **New Project → Import**, ustaw **Root Directory = `web`**.
2. Framework preset: **Next.js** (wykryje automatycznie).
3. Zmienna środowiskowa w Vercel: `NEXT_PUBLIC_WORKER_URL` = publiczny adres workera.
4. Worker (AI) **nie** jest na Vercel — wystaw go jednym z:
   - **Demo na żywo:** worker lokalnie + tunel (np. `cloudflared`/`ngrok`) → publiczny URL do `NEXT_PUBLIC_WORKER_URL`.
   - **Stabilnie:** worker na VPS/serwerze z GPU (Docker), HTTPS, ten adres w zmiennej.
5. Deploy. Frontend na Vercel woła worker po HTTP.

### Uwaga o CORS
Worker musi zezwolić na origin Vercela: ustaw `WIDZWIEK_CORS_ORIGINS` na domenę `*.vercel.app`/własną.

### Tryb „demo bez workera" (opcjonalny, TBD)
Jeśli na samym spotkaniu nie chcemy stawiać workera, można dorobić w `web/` tryb, który serwuje
gotowy przykładowy `CaptionDocument` z pliku statycznego (mock po stronie frontu). Domyślnie wyłączony.
