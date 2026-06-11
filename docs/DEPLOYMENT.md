# Widźwięk — wdrożenie (rdzeń: transkrypcja + dźwięki + WCAG na serwerze)

Są DWA tryby. Wybierz świadomie.

## Tryb A — Demo (dziś, zero infrastruktury)
Frontend statyczny na Vercelu, **rdzeń liczy w przeglądarce** (Whisper + AST + WCAG, transformers.js).
- Vercel: Root Directory = `web`, env `NEXT_PUBLIC_STATIC_DEMO=1`.
- Zaleta: działa od ręki, za darmo, bez serwera. Wada: to nie jest produkt serwerowy (liczy urządzenie użytkownika; brak kont, kolejek, kontroli jakości).

## Tryb B — Serwer (cel: prawdziwy SaaS, rdzeń liczy worker)
Frontend (Vercel) → API workera (kontener na hoście). To jest droga „na serwer".

### 1. Worker (transkrypcja+dźwięki+WCAG+eksport) jako kontener
Obraz: `worker/Dockerfile` (python 3.11 + ffmpeg + faster-whisper). Lokalnie/na hoście:
```
cd infra
cp .env.example .env        # uzupełnij WIDZWIEK_CORS_ORIGINS (domena frontu), PIPELINE_MODE=auto
docker compose up -d --build worker
# worker słucha na :8000, /health zwraca tryb i gotowość
```
- `PIPELINE_MODE=auto` → transkrypcja lokalnym faster-whisper (model pobiera się raz do wolumenu `/data/models`).
- Joby trzymane na wolumenie `/data/storage` (przeżywają restart).
- Hosting kontenera: Railway / Render / Fly.io / własny VPS (dowolny, byle Docker). Ustaw publiczny URL workera, np. `https://api.twojadomena.pl`.

### 2. Frontend na Vercelu wskazujący na workera
- Root Directory = `web`.
- Env: `NEXT_PUBLIC_WORKER_URL=https://api.twojadomena.pl` **oraz USUŃ** `NEXT_PUBLIC_STATIC_DEMO` (albo `=0`) — wtedy frontend przestaje liczyć w przeglądarce i korzysta z workera.
- W workerze ustaw `WIDZWIEK_CORS_ORIGINS=https://twoj-front.vercel.app` (żeby przeglądarka mogła wołać API).

### 3. Sprawdzenie
- `GET https://api.twojadomena.pl/health` → `mode`, `ready`, providerzy.
- Upload pliku w aplikacji → job `queued/processing/done` → transkrypcja + WCAG + eksport SRT/VTT.

## Stan rdzenia na serwerze (uczciwie)
- ✅ Transkrypcja: faster-whisper w kontenerze (CPU; GPU opcjonalnie szybsze).
- ✅ WCAG: pełna walidacja + eksport SRT/VTT/TXT/JSON.
- 🟡 Dźwięki niewerbalne: pełny model (inaSpeechSegmenter/AST) jest opcjonalny i ciężki — domyślnie best-effort; w przeglądarce działa AST. Do dołożenia w obrazie jako opcja.
- 🟡 **Przetwarzanie w tle (S4):** ustaw `WIDZWIEK_ASYNC=1` (domyślne w compose) — `POST /api/jobs` wraca natychmiast, job liczy się w wątku tła, frontend odpytuje status. To wystarcza na jednym kontenerze dla umiarkowanego ruchu. Dla pełnej skali (wiele instancji, retry, równoległość) docelowo kolejka zewnętrzna (Redis/SQS) — `services/common/queue.py` + `infra/db` (Krok 3). Uruchamiaj `uvicorn --workers N` wg rdzeni.

## Następne (konta / płatności / skala)
Schemat bazy (`infra/db/0001_init.sql`), auth/hardening (`docs/AUTH_AND_SECURITY.md`), billing (`services/common/billing.py`) są gotowe jako fundament. Kolejność: kolejka (S4) → DB+tenancy → auth → billing. Patrz `docs/PLATFORM_AUDIT.md` i `docs/QUALITY_THESIS.md`.
