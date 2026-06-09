# Widźwięk — model danych v1 (Krok 2)

Schemat: `infra/db/0001_init.sql` (Postgres). Zasady: `org_id` na każdej tabeli domenowej; izolacja egzekwowana w API (Krok 5); `usage_events` i `provider_runs` są **append-only** (ledger/telemetria).

## Dlaczego tak
- **Tenancy od początku.** Nawet z jedną domyślną organizacją — żeby nie retrofitować izolacji do płaskich jobów później.
- **Wersjonowanie dokumentu (`document_versions.kind = ai|human|merged`)** + `cue_provenance` (źródło, pewność, czy poprawione ręcznie) = audyt (dowód) i korpus korekt (fosa) naraz.
- **`provider_runs`** zapisuje każdy przebieg providera (jakość, koszt, czas, czy wybrany) → napędza auto-wybór (Krok 4) i analitykę kosztów.
- **`usage_events`** to jednocześnie billing, rozliczenie kosztów providerów (marża = cena − cost_cents) i jednostka „minuta zgodności WCAG".
- **`wcag_rulesets`** pinuje wersję standardu per raport (z Kroku 1).

## Migracja z obecnego stanu (worker/storage/*.json)
Dziś: `JobStore` trzyma `Job{ id, status, filename, result: CaptionDocument }` jako pliki JSON.
Mapowanie 1:1 przy migracji:
- `Job` → `jobs` (+ domyślny `org_id`, `project_id` utworzony z `filename`).
- `Job.result` (CaptionDocument) → `documents` + `document_versions{ kind:'ai', payload, ruleset_version, wcag_* }`.
- Pole `meta.decision`/`meta.quality` → `provider_runs` (jeśli dostępne) lub pozostaje w `payload`.
Skrypt migracyjny: iteruje pliki, tworzy org „default", projekt per plik, wstawia job+document+version. Idempotentny po `jobs.idempotency_key = stary job.id`.

## Warstwa dostępu (do zaimplementowania w API/worker — Krok 3/5)
Repozytoria zamiast bezpośredniego SQL w handlerach: `OrgRepo`, `ProjectRepo`, `JobRepo`, `DocumentRepo`, `UsageRepo`, `ProviderRunRepo`. Każda metoda przyjmuje `org_id` i filtruje po nim (jeden punkt egzekwowania izolacji). Rekomendacja: SQLAlchemy 2.x + Alembic (migracje). Połączenie z puli; transakcja per request/zadanie.

## Uwaga wdrożeniowa
Sandbox nie ma Postgresa ani sieci do instalacji sterowników — schemat jest gotowy do uruchomienia u Ciebie:
`psql "$DATABASE_URL" -f infra/db/0001_init.sql` (lub przez Alembic jako migracja 0001).
