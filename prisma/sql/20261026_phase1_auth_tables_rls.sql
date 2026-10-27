-- =============================================================================
-- DBC Auth Migration — Phase 1: Row Level Security for auth tables
--
-- Architecture (Option A): the browser never talks to Supabase directly. Only the
-- DBC backend reads/writes these tables, through Prisma using DATABASE_URL.
-- So the correct policy for Supabase's public API roles (`anon`, `authenticated`)
-- is: NO access to password hashes, refresh-session hashes or identity links.
--
-- Enabling RLS with no policies denies those roles. The table owner (the role
-- Prisma normally connects as on Supabase, e.g. `postgres`) bypasses RLS because
-- FORCE ROW LEVEL SECURITY is NOT used.
--
-- BEFORE RUNNING: confirm the DATABASE_URL user owns these tables or has
-- BYPASSRLS. Check with:
--   SELECT tablename, tableowner FROM pg_tables WHERE tablename IN ('users','user_sessions');
--   SELECT current_user;   -- run using the same connection string as DATABASE_URL
-- If they differ, do not run this file until that is resolved, or the backend
-- will lose access to these tables.
-- =============================================================================

BEGIN;

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_sessions" ENABLE ROW LEVEL SECURITY;

-- Belt and braces: remove direct grants from Supabase API roles if they exist.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "users", "user_sessions" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "users", "user_sessions" FROM authenticated;
  END IF;
END $$;

COMMIT;

-- Rollback:
--   ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;
--   ALTER TABLE "user_sessions" DISABLE ROW LEVEL SECURITY;
