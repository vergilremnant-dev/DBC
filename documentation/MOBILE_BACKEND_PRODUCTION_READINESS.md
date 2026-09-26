# DBC Mobile Backend Production Readiness & Deployment Discovery — Module 67

> [!NOTE]
> This document details the backend framework architecture, deployment discovery, environment variable classification, security controls, database migration strategy, CORS policies, health monitoring, and production deployment prerequisites for the **DBC Mobile Backend Infrastructure**.

---

## 1. Backend Architecture & Runtime Discovery

| Technical Dimension | Configuration / Architecture Value | Audit Status |
| :--- | :--- | :--- |
| **Backend Runtime** | Node.js v20 (ES2022 / NodeNext Module) | ✅ Verified (`api/tsconfig.json`) |
| **Server Framework** | Express.js adapt gateway for Vercel Serverless | ✅ Verified (`api-lib/app.ts`) |
| **Primary Deployment Channel** | Vercel Serverless Functions (`/api/*` rewrite) | ✅ Verified (`vercel.json`) |
| **Secondary Container Channel** | Docker Runtime (`node:20-alpine`) | ✅ Verified (`Dockerfile`) |
| **Database ORM** | Prisma v6.0 (`@prisma/client`) | ✅ Verified (`prisma/schema.prisma`) |
| **Database Provider** | PostgreSQL (Supabase / Managed Postgres) | ✅ Schema Verified |
| **Authentication Engine** | JWT Access Tokens (15m expiry) + HTTP Cookies | ✅ Verified (`api-lib/utils/auth.js`) |
| **Security Audit Logging** | Global Activity Ledger (`logSecurityEvent`) | ✅ Verified (`auditService.ts`) |

---

## 2. Environment Variable Inventory & Secret Classification

```text
# ------------------------------------------------------------------------------
# SECRET ENVIRONMENT VARIABLES (Backend Server Environment ONLY - NEVER in Client)
# ------------------------------------------------------------------------------
DATABASE_URL=postgresql://user:pass@db-host:5432/dbc_prod      [SECRET]
DIRECT_URL=postgresql://user:pass@db-host:5432/dbc_prod        [SECRET]
JWT_SECRET=super-secret-jwt-signing-key-production             [SECRET]
RAZORPAY_KEY_SECRET=rzp_live_secret_key_xxxx                  [SECRET]
SUPABASE_SERVICE_ROLE_KEY=supabase_service_role_key           [SECRET]

# ------------------------------------------------------------------------------
# NON-SECRET PUBLIC CONFIGURATION (Safe for Client / VITE Bundles)
# ------------------------------------------------------------------------------
VITE_APP_ENV=production
VITE_REQUIRE_HTTPS=true
VITE_API_BASE_URL=https://api.dbc.com
RAZORPAY_KEY_ID=rzp_live_key_id_xxxx
```

### Security Assertions:
1. **0 Secret Exposure**: `DATABASE_URL`, `JWT_SECRET`, `RAZORPAY_KEY_SECRET`, and private service keys are strictly isolated to serverless functions / container runtime environments.
2. **Client Bundle Cleanliness**: Frontend static assets contain 0 database connection strings or server secret keys.

---

## 3. Database Migration & Rollback Strategy

1. **Schema Deployment**: Deploy database migrations before rolling out new application code:
   ```bash
   # Apply pending Prisma migrations in production
   npx prisma migrate deploy
   ```
2. **Expand-and-Contract Pattern**: All schema alterations maintain backward compatibility. Column deletions or table drop migrations must be deferred until older code versions are completely retired.
3. **Automated Client Generation**: `prisma generate` generates type-safe database queries automatically during build phase.

---

## 4. CORS Origin Policy & Security Headers

1. **Allowed Origins**: `https://dbc.com`, `https://www.dbc.com`, `https://staging.dbc.com`.
2. **Credentialed Requests**: API handlers accept cookie/header sessions with `Access-Control-Allow-Credentials: true`.
3. **OWASP Security Headers**: All API endpoints inject standard security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`).

---

## 5. Health & Readiness Monitoring Endpoints

* **Health Check**: `GET /api/health` -> Returns `200 OK` `{ status: "ok", timestamp: "..." }`.
* **Compliance Audit**: `GET /api/compliance` -> Returns platform security & privacy compliance status.

---

## 6. Production Backend Deployment Prerequisites

* [ ] Apply production database migrations (`npx prisma migrate deploy`).
* [ ] Configure production DNS `CNAME api` pointing to backend ingress.
* [ ] Inject `JWT_SECRET` and `DATABASE_URL` into production environment secret manager.
* [ ] Configure production Razorpay live key pair (`RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`).
* [ ] Deploy serverless endpoints to Vercel / container runner.
