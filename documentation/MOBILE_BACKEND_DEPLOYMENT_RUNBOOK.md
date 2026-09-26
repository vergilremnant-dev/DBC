# DBC Mobile Backend Production Deployment & Operations Runbook — Module 68

> [!NOTE]
> This runbook specifies the step-by-step procedures, environment variable checklists, database migration safety rules, DNS mapping tasks, post-deployment smoke verification checks, rollback protocols, and prohibited actions for deploying the **DBC Mobile Backend API**.

---

## 1. Backend Architecture & Target Infrastructure

The DBC backend is architected to support two operational deployment models:

1. **Primary Gateway Target**: Vercel Serverless Functions
   - Routing: Managed via `vercel.json` rewrites (`/api/:path*` -> `/api/index`).
   - Handler Framework: Express app gateway in `api-lib/app.ts` wrapping Vercel serverless request/response handlers (`api/index.js`).
2. **Secondary Container Target**: Docker Runtime (`Dockerfile`)
   - Container Base: `node:20-alpine`.
   - Entry Point: `api-dev-server.js` listening on port `5174` (or `PORT` environment variable).
   - Healthcheck: `HEALTHCHECK --interval=30s CMD curl -f http://localhost:5174/api/health || exit 1`.

---

## 2. Prerequisites & Access Matrix

Before initiating production deployment, ensure the following access and credentials are ready:

| Resource | Required Access / Permission | Purpose |
| :--- | :--- | :--- |
| **Vercel Account** | Admin / Deployer role on project | Serverless backend deployment |
| **Domain Registrar** | DNS Zone Edit permissions for `dbc.com` | Apex and `api.dbc.com` subdomain mapping |
| **Postgres Managed DB** | `DATABASE_URL` (pooled) & `DIRECT_URL` (direct) | Database migration and query execution |
| **Razorpay Portal** | Merchant Account & Live API Key Access | Live payment processing |
| **Firebase Console** | Service Account Credentials | Cloud messaging and push notification setup |

---

## 3. Environment Variable Checklist

> [!IMPORTANT]
> Never print, log, or commit secret environment variables. Verify secret presence in Vercel / environment manager.

### Secret Server Variables (Production Backend Only)

| Variable Name | Description | Verification Status |
| :--- | :--- | :--- |
| `DATABASE_URL` | Pooled connection string to production PostgreSQL | `REQUIRED` |
| `DIRECT_URL` | Direct connection string for Prisma migrations | `REQUIRED` |
| `JWT_SECRET` | 256-bit cryptographically secure JWT signing key | `REQUIRED` |
| `RAZORPAY_KEY_SECRET` | Production Razorpay secret key | `REQUIRED` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for admin operations | `REQUIRED` |
| `FIREBASE_ADMIN_CREDENTIALS` | JSON service account credentials | `OPTIONAL` |

### Non-Secret Public Variables (Frontend & Gateway Config)

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `VITE_APP_ENV` | `production` | Enforces HTTPS and production safeguards |
| `VITE_API_BASE_URL` | `https://api.dbc.com` | Production API endpoint base URL |
| `RAZORPAY_KEY_ID` | `rzp_live_...` | Public Razorpay key ID |

---

## 4. Database Migration & Safety Precautions

1. **Pre-Deployment Backup**: Take an automated or manual snapshot of the production PostgreSQL database prior to executing migrations.
2. **Schema Migration Execution**: Run migrations before deploying application code:
   ```bash
   npx prisma migrate deploy
   ```
3. **Expand-and-Contract Rule**: Never drop columns or tables in a single release. Add new fields as optional, deploy updated application code, migrate data, and prune deprecated columns in subsequent releases.
4. **Client Generation**: Generate the Prisma client during container/serverless build:
   ```bash
   npx prisma generate
   ```

---

## 5. Deployment Step-by-Step Execution

### Option A: Vercel Serverless Deployment

```bash
# 1. Install dependencies & compile TypeScript
npm ci
npx tsc -p api/tsconfig.json

# 2. Run Prisma database migrations
npx prisma migrate deploy

# 3. Deploy to Vercel Production
vercel --prod
```

### Option B: Containerized Docker Deployment

```bash
# 1. Build production Docker image
docker build -t dbc-backend:latest .

# 2. Run container in production mode
docker run -d \
  --name dbc-backend \
  -p 5174:5174 \
  --env-file .env.production \
  dbc-backend:latest
```

---

## 6. DNS & Domain Mapping Procedures

1. **Apex Frontend Domain (`dbc.com`)**:
   - Record Type: `A`
   - Name: `@`
   - Value: `76.76.21.21` (Vercel Ingress)
2. **Subdomain (`www.dbc.com`)**:
   - Record Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com`
3. **API Subdomain (`api.dbc.com`)**:
   - Record Type: `CNAME`
   - Name: `api`
   - Value: `cname.vercel-dns.com` (or container load balancer IP)

---

## 7. Safe Post-Deployment Smoke Verification

Run non-destructive checks immediately following deployment:

1. **Health Check**:
   ```bash
   curl -i https://api.dbc.com/api/health
   # Expected: 200 OK, {"status":"ok", ...}
   ```
2. **Compliance Route**:
   ```bash
   curl -i https://api.dbc.com/api/compliance
   # Expected: 200 OK
   ```
3. **Unauthenticated Access Protection**:
   ```bash
   curl -i https://api.dbc.com/api/customer/profile
   # Expected: 401 Unauthorized
   ```
4. **CORS Verification**:
   ```bash
   curl -i -X OPTIONS https://api.dbc.com/api/health \
     -H "Origin: https://dbc.com" \
     -H "Access-Control-Request-Method: GET"
   # Expected: Access-Control-Allow-Origin: https://dbc.com
   ```

---

## 8. Rollback Procedure

If severe regression or runtime failure occurs:

1. **Vercel Instant Rollback**:
   ```bash
   vercel rollback <PREVIOUS_DEPLOYMENT_ID>
   ```
   Or promote the previous successful deployment via Vercel Dashboard.
2. **Container Rollback**:
   ```bash
   docker stop dbc-backend
   docker run -d --name dbc-backend -p 5174:5174 --env-file .env.production dbc-backend:previous-tag
   ```
3. **Database Rollback Note**: Schema modifications must be non-breaking to avoid breaking previous application versions.

---

## 9. Explicitly Prohibited Production Test Actions

> [!CAUTION]
> The following actions are strictly prohibited in the production environment:

* ❌ **NO real financial transactions**: Never attempt real money payment flows against live Razorpay keys during smoke checks.
* ❌ **NO mutating real user accounts**: Do not run account deletion (`POST /api/user/delete-account`) against real user accounts.
* ❌ **NO manual DB record deletion**: Do not execute direct SQL `DELETE` statements on production data.
* ❌ **NO committing secrets**: Never check `.env`, secrets, or credentials into source control.
