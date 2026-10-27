-- =============================================================================
-- DBC Auth Migration — Phase 2: Row Level Security for ALL application tables
-- Supersedes 20261026_phase1_auth_tables_rls.sql (that file covered only
-- users + user_sessions; running both is harmless).
--
-- Architecture (Option A): only the DBC backend reads/writes the database, via
-- Prisma using DATABASE_URL. Browsers never use supabase-js. Therefore Supabase's
-- public API roles (`anon`, `authenticated`) must have NO access to any table:
-- projects, quotations, payments, messages, sessions, password hashes, etc.
-- Every Supabase project exposes a REST API for the `public` schema, so a table
-- without RLS is readable by anyone holding the project's anon key.
--
-- Enabling RLS with no policies denies those roles. The table OWNER (the role
-- Prisma connects as, normally `postgres`) bypasses RLS because FORCE ROW LEVEL
-- SECURITY is NOT used, so the backend keeps working unchanged.
--
-- Non-destructive: no data, column or constraint changes. Safe to re-run.
--
-- BEFORE RUNNING (required): confirm the DATABASE_URL role owns the tables:
--   SELECT current_user;                                   -- using DATABASE_URL
--   SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public';
-- If any table's owner differs from current_user and that role lacks BYPASSRLS,
-- STOP: the backend would lose access to that table.
-- =============================================================================

BEGIN;

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated';
  END IF;
END $$;

COMMIT;

-- Verify (expect rowsecurity = true for every table):
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY 1;
--
-- Rollback (re-opens tables to Supabase API roles only if grants are restored too):
--   DO $$ DECLARE t record; BEGIN
--     FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
--       EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t.tablename);
--     END LOOP; END $$;
--   -- Re-grant only if something genuinely needed anon/authenticated access (nothing in DBC does):
--   -- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
