# infra/db

Migracje schematu Postgres dla Widźwięk.

- `0001_init.sql` — schemat v1 (orgs/users/projects/media/jobs/documents/versions/provenance/provider_runs/usage/entitlements/subscriptions/payments/invoices/wcag_rulesets).

Uruchomienie (lokalnie/serwer):
```
psql "$DATABASE_URL" -f infra/db/0001_init.sql
```
Docelowo: Alembic (Python) jako warstwa migracji wersjonowanych. Opis: docs/DATA_MODEL.md.
