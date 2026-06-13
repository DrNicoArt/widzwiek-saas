-- Widźwięk — Row-Level Security (krok kont/self-serve). Egzekwuje izolację najemców w BAZIE,
-- nie tylko w API. Zakłada Supabase: auth.uid() = users.id (zsynchronizuj auth.users -> public.users
-- z tym samym id, np. triggerem on auth.users insert). Service role (worker/webhook) omija RLS.

-- Czy bieżący użytkownik należy do organizacji.
CREATE OR REPLACE FUNCTION app_is_member(org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.org_id = org AND m.user_id = auth.uid()
  );
$$;

-- users: użytkownik widzi/edytuje tylko swój wiersz.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_self ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY users_self_upd ON users FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- orgs + memberships: dostęp dla członków.
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
CREATE POLICY orgs_member ON orgs FOR SELECT USING (app_is_member(id));
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY memberships_member ON memberships FOR SELECT USING (app_is_member(org_id));

-- Tabele domenowe z org_id: pełny CRUD ograniczony do członków organizacji.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['projects','media_assets','jobs','documents','entitlements','subscriptions','payment_accounts'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('CREATE POLICY %I_rw ON %I USING (app_is_member(org_id)) WITH CHECK (app_is_member(org_id));', t, t);
  END LOOP;
END $$;

-- Ledger/telemetria (append-only): członkowie tylko ODCZYTUJĄ; zapis wyłącznie service role (omija RLS).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['usage_events','provider_runs','invoices'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('CREATE POLICY %I_read ON %I FOR SELECT USING (app_is_member(org_id));', t, t);
  END LOOP;
END $$;

-- Tabele powiązane przez rodzica (brak własnego org_id) — dostęp przez dokument/zlecenie.
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY docver_member ON document_versions USING (
  EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND app_is_member(d.org_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM documents d WHERE d.id = document_id AND app_is_member(d.org_id))
);

-- cue_provenance: domyślnie zablokowane dla klienta (tylko service role), do doprecyzowania po ustaleniu FK.
ALTER TABLE cue_provenance ENABLE ROW LEVEL SECURITY;

-- wcag_rulesets: publiczny katalog reguł — odczyt dla zalogowanych.
ALTER TABLE wcag_rulesets ENABLE ROW LEVEL SECURITY;
CREATE POLICY rulesets_read ON wcag_rulesets FOR SELECT USING (auth.role() = 'authenticated');
