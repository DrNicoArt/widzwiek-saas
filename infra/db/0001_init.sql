-- Widźwięk — schemat bazy v1 (Postgres). Krok 2 audytu: warstwa danych + wielodostępność.
-- Zasada: org_id na każdej tabeli domenowej; izolacja egzekwowana w warstwie API (Krok 5).
-- Append-only: usage_events, provider_runs (nie UPDATE/DELETE — to ledger i telemetria).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- === Tożsamość i wielodostępność ===
CREATE TABLE orgs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  plan_id       text NOT NULL DEFAULT 'demo',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         citext UNIQUE NOT NULL,
  display_name  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE member_role AS ENUM ('owner','admin','editor','viewer');
CREATE TABLE memberships (
  org_id        uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role          member_role NOT NULL DEFAULT 'editor',
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

-- === Projekty i media ===
CREATE TABLE projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  title         text NOT NULL,
  language      text NOT NULL DEFAULT 'pl',
  created_by    uuid REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_org ON projects(org_id, created_at DESC);

CREATE TYPE media_status AS ENUM ('uploaded','processing','ready','error','deleted');
CREATE TABLE media_assets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  storage_key   text NOT NULL,             -- klucz w object storage (S3/R2)
  mime          text,
  duration_ms   integer,
  checksum      text,
  status        media_status NOT NULL DEFAULT 'uploaded',
  retention_until timestamptz,             -- RODO: twarde usuwanie po terminie
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_media_project ON media_assets(project_id);

-- === Joby (przetwarzanie asynchroniczne — Krok 3) ===
CREATE TYPE job_status AS ENUM ('queued','processing','done','error','canceled');
CREATE TABLE jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  media_id      uuid REFERENCES media_assets(id) ON DELETE SET NULL,
  type          text NOT NULL DEFAULT 'caption',     -- caption|reprocess|import|url
  status        job_status NOT NULL DEFAULT 'queued',
  strategy      text NOT NULL DEFAULT 'automatic',    -- automatic|most_accurate|cheapest|fastest|institutional
  idempotency_key text,                                -- chroni przed podwójnym uruchomieniem (koszt providera)
  created_by    uuid REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  finished_at   timestamptz,
  error         text,
  UNIQUE (org_id, idempotency_key)
);
CREATE INDEX idx_jobs_org_status ON jobs(org_id, status, created_at DESC);

-- === Dokument napisów + wersjonowanie (AI vs człowiek) + provenancja (fosa: korpus korekt) ===
CREATE TABLE documents (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  project_id         uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  job_id             uuid REFERENCES jobs(id) ON DELETE SET NULL,
  current_version_id uuid,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE doc_kind AS ENUM ('ai','human','merged');
CREATE TABLE document_versions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  kind            doc_kind NOT NULL,
  ruleset_version text NOT NULL,            -- zgodne z contracts/wcag_ruleset.json
  wcag_compliant  boolean NOT NULL DEFAULT false,
  error_count     integer NOT NULL DEFAULT 0,
  warning_count   integer NOT NULL DEFAULT 0,
  payload         jsonb NOT NULL,            -- pełny CaptionDocument
  created_by      uuid REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_versions_doc ON document_versions(document_id, created_at DESC);
ALTER TABLE documents ADD CONSTRAINT fk_current_version
  FOREIGN KEY (current_version_id) REFERENCES document_versions(id) ON DELETE SET NULL;

-- Provenancja per cue: które źródło, jaka pewność, czy poprawione ręcznie.
-- To zasila audyt (dowód) ORAZ korpus korekt (uczenie routera/jakości).
CREATE TABLE cue_provenance (
  version_id      uuid NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
  cue_id          text NOT NULL,
  source_provider text,
  confidence      real,
  edited_by_human boolean NOT NULL DEFAULT false,
  PRIMARY KEY (version_id, cue_id)
);

-- === Telemetria providerów (Krok 4) — napędza auto-wybór i analitykę kosztów ===
CREATE TABLE provider_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  job_id        uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  kind          text NOT NULL,             -- transcription|diarization|sound_events|translation|cleanup
  provider      text NOT NULL,             -- openai|deepgram|speechmatics|assemblyai|elevenlabs|faster-whisper|...
  language      text,
  quality_score real,
  cost_cents    integer,
  latency_ms    integer,
  chosen        boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_provider_runs_job ON provider_runs(job_id);

-- === Billing (Krok 6) — usage ledger append-only + uprawnienia + płatności ===
CREATE TABLE usage_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  job_id        uuid REFERENCES jobs(id) ON DELETE SET NULL,
  unit          text NOT NULL DEFAULT 'wcag_minute',
  quantity      numeric(12,3) NOT NULL,
  credits_charged numeric(12,3) NOT NULL DEFAULT 0,
  cost_cents    integer NOT NULL DEFAULT 0,   -- koszt providerów (marża = cena - cost)
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_usage_org_time ON usage_events(org_id, created_at DESC);

CREATE TABLE entitlements (
  org_id        uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  key           text NOT NULL,             -- np. 'wcag_minutes_month'
  limit_value   numeric(12,3) NOT NULL,
  used_value    numeric(12,3) NOT NULL DEFAULT 0,
  period_start  timestamptz,
  period_end    timestamptz,
  PRIMARY KEY (org_id, key)
);

CREATE TABLE subscriptions (
  org_id        uuid PRIMARY KEY REFERENCES orgs(id) ON DELETE CASCADE,
  plan          text NOT NULL,
  status        text NOT NULL,
  provider      text,                       -- stripe|paddle|przelewy24|payu|tpay|manual
  period_start  timestamptz,
  period_end    timestamptz
);

CREATE TABLE payment_accounts (
  org_id        uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  provider      text NOT NULL,
  external_id   text NOT NULL,
  PRIMARY KEY (org_id, provider)
);

CREATE TABLE invoices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  amount_cents  integer NOT NULL,
  currency      text NOT NULL DEFAULT 'PLN',
  status        text NOT NULL,              -- draft|open|paid|void
  provider      text,
  external_id   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- === Wersjonowany standard WCAG (Krok 1 → tu pinowany per raport) ===
CREATE TABLE wcag_rulesets (
  version       text PRIMARY KEY,           -- np. '1.0.0'
  definition    jsonb NOT NULL,             -- snapshot contracts/wcag_ruleset.json
  effective_from timestamptz NOT NULL DEFAULT now()
);
