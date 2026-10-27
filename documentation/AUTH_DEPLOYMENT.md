# DBC Authentication — Deployment Runbook (Phase 1 + Phase 2)

Architecture: **Firebase phone OTP → backend verifies the Firebase ID token (Admin SDK) → existing DBC session (15-min HS256 access JWT in memory + rotating 7-day refresh token, hashed in `user_sessions`, httpOnly cookie) → Prisma → Supabase PostgreSQL.**
Supabase Auth is **not** used. Never put a secret in a `VITE_` variable: those are compiled into the public bundle.

## 1. Environment variables

| Variable | Where | Required | Purpose |
|---|---|---|---|
| `VITE_FIREBASE_API_KEY` | Frontend build | Yes | Firebase web config (public by design) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Frontend build | Yes | e.g. `<project>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Frontend build | Yes | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` / `VITE_FIREBASE_MESSAGING_SENDER_ID` / `VITE_FIREBASE_APP_ID` | Frontend build | Yes | Firebase web config |
| `VITE_API_BASE_URL` | Frontend build | No | Leave empty: the API is same-origin (`/api` rewrite) |
| `FIREBASE_PROJECT_ID` | Server only | **Yes** | Token audience/issuer check. Without it, phone + social sign-in fail closed |
| `FIREBASE_SERVICE_ACCOUNT_JSON` *(or `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`)* | Server only, secret | Recommended | Enables revoked/disabled Firebase user checks |
| `JWT_SECRET` | Server only, secret | **Yes** | HS256 signing key. ≥32 random bytes: `openssl rand -base64 48`. Rotating it logs everyone out once |
| `DATABASE_URL` | Server only, secret | **Yes** | Supabase Postgres (pooler) connection string used by Prisma |
| `DIRECT_URL` | Server only, secret | **Yes** | Supabase direct connection (Prisma schema operations) |
| `NODE_ENV` | Server | **Yes** | `production` (enables `Secure` cookies). Never `test` in a deployed environment |
| `CORS_ALLOWED_ORIGINS` | Server | No | Comma-separated exact origins allowed cross-origin with credentials. Empty = same-origin only |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Server only, secret | Existing | Payments (unchanged) |

Vite reads `VITE_*` **at build time**: set them in Vercel *before* building, and rebuild after any change.
Not used and not needed: Supabase anon key, Supabase service-role key (the browser never talks to Supabase).

## 2. Firebase console

1. Authentication → Sign-in method → enable **Phone** (and Google/Microsoft/Apple only if those buttons are used).
2. Authentication → Settings → **Authorized domains**: add the production domain(s), `www` variant, and any preview domain you test on. `localhost` is allowed by default.
3. Phone auth for India: SMS delivery depends on Firebase's provider and telecom DLT rules; Firebase's Blaze plan is required for production SMS volume. Add **test phone numbers** (Authentication → Settings) for QA without real SMS.
4. Project settings → Service accounts → generate a key → store it only as `FIREBASE_SERVICE_ACCOUNT_JSON` (server). Never commit it.
5. Optional hardening: App Check for the web app; SMS region policy limited to the countries you serve.

## 3. Database migrations (Supabase SQL editor or psql) — apply in order

All are additive and re-runnable. Take a Supabase backup / PITR snapshot first.

1. `prisma/sql/20261026_phase1_firebase_phone_identity.sql` — adds nullable unique `users.firebase_uid`, `users.phone_e164`, `users.phone_verified_at` + E.164 check. (Equivalent: `npx prisma db push`.)
2. `prisma/sql/20261026_phase2_rls_all_tables.sql` — enables RLS on every `public` table and revokes `anon`/`authenticated` grants. **Run the owner check in the file header first.** (Supersedes the Phase 1 RLS file; running both is harmless.)
3. `npx prisma generate` (part of `npm run build`).

Verify:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('firebase_uid','phone_e164','phone_verified_at');
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity;  -- expect 0 rows
```

## 4. Build and deploy

```bash
npm install            # adds firebase-admin; commit the updated package-lock.json
npm test               # vitest
npm run lint
npm run build          # prisma generate && tsc -b && vite build
```
Vercel: framework Vite, build `npm run build`, `/api/*` → `api/index` (Express app in `api-lib/app.ts`). `vercel.json` no longer sends `Access-Control-Allow-Origin: *`; CORS is the server allowlist.

## 5. Post-deploy verification (production)

1. `GET /api/health` → 200.
2. Phone sign-in on a **real phone**: request code → SMS arrives → verify → new number shows the name step → account created → lands on workspace. Record whether the SMS actually arrived (automated tests cannot prove delivery).
3. Reload the page: you stay signed in (no OTP). DevTools → Application → Cookies: `refresh_token` is `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/api/auth`.
4. Sign out → reload → you are signed out; the old refresh cookie no longer works.
5. Existing email account: "Sign in with email and password instead" still works.
6. As customer B, open customer A's project/quotation/conversation URL or API → 403.
7. As a customer, call an `/api/admin/*` endpoint → 403.
8. `POST /api/auth/forgot-password` response contains no `resetToken`.
9. Supabase → Logs: no `anon`/`authenticated` reads succeed on application tables.

## 6. Rollback

- **Code:** redeploy the previous Vercel deployment (Deployments → Promote). Sessions stay valid because the session format is unchanged.
- **RLS:** run the rollback block in `20261026_phase2_rls_all_tables.sql` (only needed if the backend's DB role was not the table owner).
- **Identity columns:** leave them (nullable, ignored by old code). Dropping them is in the Phase 1 SQL file's rollback block and permanently removes phone↔account links.
- **Firebase:** disabling the Phone provider stops new OTP logins; existing DBC sessions keep working until they expire.

## 7. Known external dependencies / not yet done

- No email provider is wired up: password-reset and email-OTP codes are generated but **not delivered**. The reset token is deliberately no longer returned by the API.
- Refresh-token rotation has no reuse-grace window: two tabs refreshing at the same instant can sign one out.
- Access tokens carry the role for 15 minutes; a suspended user's current access token works until it expires (refresh is now refused immediately).
- The `mobile/` app layer has not been migrated to phone OTP.
