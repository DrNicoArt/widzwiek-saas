# Krok 9 — Publiczne wdrożenie v1

## Topologia (start: jeden VPS, granice gotowe do rozdzielenia)
`infra/docker-compose.yml`: Postgres + Redis + MinIO (S3-compat) + API + worker(×2). Frontend (Next) na Vercel, woła API po HTTPS.

## Kolejność uruchomienia
1. Wypełnij `infra/.env` wg `infra/.env.example` (sekrety z menedżera sekretów, nie z repo).
2. Migracje DB: `psql "$DATABASE_URL" -f infra/db/0001_init.sql`.
3. `docker compose -f infra/docker-compose.yml up -d`.
4. Frontend: Vercel, `NEXT_PUBLIC_API_URL=https://api.widzwiek.pl`, build z `web/`.
5. Bucket storage + polityki CORS na presigned upload.

## Produkcja vs demo
- Demo (dziś): frontend statyczny na Vercel, silnik w przeglądarce (`NEXT_PUBLIC_STATIC_DEMO=1`), bez backendu.
- Produkcja (cel): frontend → API → kolejka → workery → providerzy; storage/DB w UE.

## CI/CD (zarys)
- PR: lint + tsc + pytest (worker + orchestrator + common) muszą przejść.
- Merge do `main`: build obrazów API/worker, deploy compose/stack; Vercel auto-deploy frontu.
- Migracje DB jako krok pipeline (Alembic) przed startem nowej wersji.

## Backup / odtwarzanie
- Postgres: codzienny dump + PITR. Object storage: wersjonowanie + lifecycle (retencja/usuwanie RODO).

## Checklist „gotowe do publicznego ruchu"
- [ ] Migracje DB zastosowane; tenancy egzekwowane (Krok 5).
- [ ] Kolejka + workery zamiast synchronicznego przetwarzania (Krok 3).
- [ ] Router providerów + telemetria (Krok 4) z kluczami platformy.
- [ ] Usage ledger + 1 operator płatności (Krok 6).
- [ ] CORS allowlist, rate-limit, walidacja plików, AV, `/api/config` wyłączony w prod.
- [ ] Retencja/usuwanie mediów, region UE, zgody (Krok 8).
- [ ] Monitoring + error tracking + backupy.

## Stan
Scaffold (compose + env + migracja + checklist). Sandbox nie ma sieci/infry — uruchomienie u Ciebie.
