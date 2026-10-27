-- =============================================================================
-- DBC Auth Migration — Phase 1: Firebase phone identity columns
-- Additive and non-destructive. Safe to run more than once.
--
-- Matches the `firebaseUid`, `phoneE164` and `phoneVerifiedAt` fields added to
-- the User model in prisma/schema.prisma. Apply EITHER this file (Supabase SQL
-- editor / psql) OR `npx prisma db push` — not both are required.
--
-- Existing rows keep NULL in all three columns, so no existing user, profile,
-- project, quotation or payment relationship changes.
-- =============================================================================

BEGIN;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "firebase_uid" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_e164" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_verified_at" TIMESTAMP(3);

-- Unique identity constraints (NULLs are allowed and do not conflict).
-- Index names match Prisma's defaults so `prisma db push` sees no drift.
CREATE UNIQUE INDEX IF NOT EXISTS "users_firebase_uid_key" ON "users" ("firebase_uid");
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_e164_key" ON "users" ("phone_e164");

-- Enforce E.164 shape for verified phone numbers.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_e164_format_chk'
  ) THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_phone_e164_format_chk"
      CHECK ("phone_e164" IS NULL OR "phone_e164" ~ '^\+[1-9][0-9]{7,14}$');
  END IF;
END $$;

COMMIT;

-- Rollback (manual, only if needed — drops the new identity links):
--   ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_e164_format_chk";
--   DROP INDEX IF EXISTS "users_phone_e164_key";
--   DROP INDEX IF EXISTS "users_firebase_uid_key";
--   ALTER TABLE "users" DROP COLUMN IF EXISTS "phone_verified_at",
--                       DROP COLUMN IF EXISTS "phone_e164",
--                       DROP COLUMN IF EXISTS "firebase_uid";