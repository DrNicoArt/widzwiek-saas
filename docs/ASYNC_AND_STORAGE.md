# Krok 3 — przetwarzanie asynchroniczne + storage

## Przepływ docelowy
1. Klient prosi API o **presigned upload** → wgrywa plik **wprost do object storage** (duże wideo nie obciąża API).
2. API tworzy `media_assets` + `jobs(status=queued)` i **enqueue** wiadomości do kolejki. Zwraca `job_id`.
3. Pula **workerów** konsumuje kolejkę, uruchamia pipeline (ingest→ASR→diar→sounds→WCAG→export), zapisuje `document_versions` + `provider_runs` + `usage_events`, ustawia `jobs.status`.
4. Klient odpytuje `GET /jobs/{id}` (lub SSE/websocket) o status i wynik.

## Dlaczego
Dziś `jobs.store.process()` działa **synchronicznie w wątku HTTP** — 30-min plik blokuje workera. Rozdzielenie API↔worker przez kolejkę daje: skalowanie poziome (replicas), retry, brak timeoutów, realny progres.

## Idempotencja
`jobs.idempotency_key` (UNIQUE per org) chroni przed podwójnym uruchomieniem providerów (każde uruchomienie = realny koszt).

## Pliki
- `services/common/queue.py` — interfejs `JobQueue` (+ `InMemoryQueue` do dev/testów). Prod: RedisQueue/SQSQueue.
- `services/common/storage.py` — interfejs `ObjectStorage` (presign upload/download, delete dla RODO). Prod: S3/R2/GCS.
- `infra/docker-compose.yml` — db + redis + minio + api + worker(replicas).

## Stan
Scaffold (sandbox bez sieci/infry). Uruchomienie u Ciebie: `docker compose -f infra/docker-compose.yml up` po wypełnieniu `.env`.
