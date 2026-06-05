# Widźwięk — checklist do MVP (po demo v0.4)

Etapy po stabilnym demo. Każdy ma **Definition of Done (DoD)**. Kolejność = priorytet.
Statusy integracji: `docs/EXTERNAL_APIS.md`. Stan obecny: `docs/PRODUCT_STATUS.md`.

## 1. Live API transcription
- [ ] `PIPELINE_MODE=api` + `OPENAI_API_KEY`, `python -m widzwiek.api_check` → GOTOWY.
- **DoD:** realne audio PL → poprawny `CaptionDocument` (segmenty z czasami), raport WCAG się liczy,
  eksport SRT/VTT działa, brak zmian w kontrakcie danych. Procedura: `docs/API_LIVE_TEST.md`.

## 2. Diaryzacja mówców
- [ ] Realny `DiarizationProvider` (np. pyannote) zamiast `single-speaker-tbd`.
- **DoD:** co najmniej **2 rozróżnieni mówcy** na nagraniu z 2 głosami; `speaker_id` + etykiety + kolory WCAG
  poprawnie mapowane do `CaptionDocument`; raport pokazuje identyfikację mówców.

## 3. Sound events (dźwięki niewerbalne)
- [ ] Realny `SoundEventProvider` zamiast `noop-tbd`.
- **DoD:** wykryte **min. 3 klasy** (np. `[muzyka]`, `[oklaski]`, `[śmiech]`) z czasami, jako cues `kind=sound`;
  widoczne w napisach i sekcji „Mówcy i dźwięki".

## 4. Persistence / storage
- [ ] Trwałe joby/wyniki (Postgres) + pliki (S3/R2/Supabase) zamiast in-memory.
- **DoD:** projekt/job/wynik **przetrwają odświeżenie i restart**; lista projektów z realnych danych;
  upload pliku do storage przez presigned URL (bez przechodzenia przez funkcję).

## 5. Deploy
- [ ] Frontend (Vercel, Root=`web`) + worker (VPS/GPU lub tunel) osobno.
- **DoD:** frontend online, worker online, `NEXT_PUBLIC_WORKER_URL` + CORS poprawne, `/health` zielone z publicznego adresu.

## 6. Auth
- [ ] Lekki auth (np. magic link) — minimalny, bez pełnego systemu kont.
- **DoD:** dostęp do `/app` chroniony; sesja użytkownika; brak twardej zależności demo od auth.

## 7. Billing
- [ ] Plany/limity, integracja płatności.
- **DoD:** limit materiałów/minut per plan; webhook potwierdzeń; brak kluczy w repo.

## 8. Security uploadu
- [ ] Walidacja typu/rozmiaru, timeouty, sanity treści.
- **DoD:** twardy limit rozmiaru (np. `MAX_UPLOAD_MB`), whitelist formatów audio/wideo, odrzucenie złych plików z czytelnym błędem, timeout przetwarzania.

## 9. Monitoring / logging
- [ ] Błędy + metryki (Sentry/OTel), structured logs.
- **DoD:** błędy workera i frontu raportowane; podstawowe metryki (czas joba, błędy API); alert przy awarii.

## 10. UI polish / immersive
- [ ] Dopracowanie warstwy doświadczenia (`/`), pełne sceny i motion.
- **DoD:** spójny premium UX, scene transitions, `prefers-reduced-motion`, build zielony, brak regresji demo.
