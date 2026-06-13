# Konta i płatności — plan wdrożenia (bez własnego hosta)

Realizuje ADR-009/010: konta i billing przez **usługi zarządzane** (zero serwera do utrzymania).
Schemat danych już istnieje (`infra/db/0001_init.sql`), RLS dołożone w `0002_rls.sql`.

## Stack
- **Auth + baza:** Supabase (Postgres + Auth + RLS, region UE). `auth.uid()` = `users.id`.
- **Płatności:** Stripe (lub **Paddle** jako *merchant of record* — załatwia VAT/OSS w EU).
- **Webhook:** funkcja serverless na Vercelu — `web/src/app/api/stripe/webhook/route.ts` (już weryfikuje podpis).
- Frontend/worker bez zmian hostingu; service role tylko po stronie serwera.

## Co już jest w repo
- Model danych: orgs, users, memberships, projects, jobs, documents, usage_events, **subscriptions, invoices, entitlements, payment_accounts** (`0001_init.sql`).
- **RLS** izolujące najemców (`0002_rls.sql`) — dostęp przez `app_is_member(org_id)`; ledger append-only tylko do odczytu dla członków, zapis przez service role.
- **Webhook Stripe** ze sprawdzeniem podpisu (HMAC-SHA256, ochrona replay) — `route.ts` (TODO: zapisy do bazy).
- Placeholdery env w `.env.example` (Supabase + Stripe).

## Co trzeba dorobić (kolejność)
1. **Auth UI** — logowanie/rejestracja Supabase; trigger sync `auth.users -> public.users` (to samo `id`); auto-tworzenie `orgs` + `memberships(owner)` przy 1. logowaniu.
2. **Warstwa danych per-user** — przepiąć `web/src/lib/api.ts` z localStorage na Supabase (jobs/projekty per org); seam już jest (gałąź `IS_BROWSER_MODE` + `org_id` w workerze).
3. **Checkout** — Stripe Checkout/Payment Link z `client_reference_id = org_id`.
4. **Webhook → baza** — w `route.ts` uzupełnić TODO: na `checkout.session.completed`/`subscription.*`/`invoice.*` aktualizować `subscriptions`/`entitlements`/`invoices` przez service role.
5. **Egzekwowanie limitów** — sprawdzanie `entitlements` przed przetwarzaniem; licznik z `usage_events`.

## Twoje kroki (sekrety — NIE w repo)
1. Załóż projekt Supabase (region UE), uruchom `0001_init.sql` + `0002_rls.sql`.
2. Załóż konto Stripe/Paddle; skonfiguruj webhook na `/api/stripe/webhook`.
3. Uzupełnij `.env.local` (web) i env serwera wg `.env.example` — klucze tylko w env.
4. Service role i `STRIPE_WEBHOOK_SECRET` wyłącznie po stronie serwera.

## Bezpieczeństwo (must)
- RLS jako twarda izolacja (nie tylko API). Service role nigdy w kliencie.
- Webhook zawsze weryfikuje podpis (jest) + idempotencja po `event.id` (dorobić przy zapisach).
- Region danych UE, retencja + twarde usuwanie (RODO) — patrz docs/PRIVACY (do dopisania).
