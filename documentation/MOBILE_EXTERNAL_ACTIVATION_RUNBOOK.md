# DBC Production External DNS Activation, Vercel & Infrastructure Operator Runbook — Module 70

> [!NOTE]
> This runbook provides a registrar-neutral, operator-ready procedure for domain DNS activation, Vercel project domain attachment, environment secret management, production database migration safeguards, post-activation verification, and emergency rollback protocols for the **DBC Platform and Mobile Application**.

---

## 1. Overview & Operational Scope

Modules 33 through 69 established that 100% of mobile application code, backend API endpoints, Account Deletion handlers, security controls, and release gate test suites are production ready and compiled.

This runbook guides the infrastructure operator / domain administrator through activating public traffic on:
* `https://dbc.com` (Apex Frontend)
* `https://www.dbc.com` (Subdomain Frontend)
* `https://api.dbc.com` (Production API Gateway)

---

## 2. Vercel Project Association Architecture

The DBC codebase uses a single Vercel project (`frontend`) configured via `vercel.json`:
* Static web application assets are served from `/` (via `dist/index.html`).
* Serverless API endpoints are routed via `/api/:path*` -> `/api/index` (resolving to `api-lib/app.ts`).

### Project Domain Attachment Steps:
1. Log into [Vercel Dashboard](https://vercel.com/dashboard).
2. Select the **DBC Production Project**.
3. Navigate to **Settings > Domains**.
4. Add the following custom domains:
   - `dbc.com` (Set as Primary or configure redirect to `www.dbc.com`).
   - `www.dbc.com`.
   - `api.dbc.com` (Routes directly to backend serverless functions `/api/*`).

---

## 3. Registrar-Neutral DNS Activation Matrix

Instruct the domain administrator at your registrar (e.g., GoDaddy, Namecheap, Cloudflare, AWS Route 53) to apply the following DNS records:

| Host / Name | Record Type | Proposed Target Value | Operational Purpose |
| :--- | :--- | :--- | :--- |
| `@` (Apex) | `A` | `76.76.21.21` | Points `dbc.com` to Vercel Edge Network |
| `www` | `CNAME` | `cname.vercel-dns.com` | Routes `www.dbc.com` traffic |
| `api` | `CNAME` | `cname.vercel-dns.com` | Routes `api.dbc.com` serverless API gateway |

---

## 4. Pre-Activation DNS Safety & Record Preservation Audit

> [!CAUTION]
> DO NOT delete unrelated DNS records. Improper DNS deletion can disable corporate email, domain ownership verification, or third-party integrations.

### Record Preservation Checklist:
1. **MX Records**: Retain all Mail Exchange (MX) records (e.g., Google Workspace, Outlook).
2. **TXT / SPF / DKIM / DMARC Records**: Retain all TXT records for email authentication and domain validation.
3. **Third-Party CNAME / A Records**: Retain records pointing to external subdomains (e.g., `blog`, `mail`, `support`).

### Inspecting Existing DNS Records Before Editing:
* **Windows PowerShell**:
  ```powershell
  Resolve-DnsName dbc.com -Type A
  Resolve-DnsName dbc.com -Type MX
  Resolve-DnsName dbc.com -Type TXT
  ```
* **Cross-Platform CLI**:
  ```cmd
  nslookup -type=A dbc.com
  nslookup -type=MX dbc.com
  nslookup -type=TXT dbc.com
  ```

---

## 5. Vercel Environment Variables & Secret Inventory

Configure production environment variables in **Vercel Dashboard > Settings > Environment Variables** (target: `Production` environment ONLY):

### Secret Server Variables (NEVER expose to client static bundles):

| Variable Name | Required Value Description | Component Consuming Variable |
| :--- | :--- | :--- |
| `DATABASE_URL` | Pooled connection string to production PostgreSQL | Prisma ORM (`api-lib/utils/db.ts`) |
| `DIRECT_URL` | Direct connection string for Prisma schema migrations | Prisma CLI (`prisma/schema.prisma`) |
| `JWT_SECRET` | 256-bit cryptographically secure secret key | JWT Signer (`api-lib/utils/auth.js`) |
| `RAZORPAY_KEY_SECRET` | Production Razorpay merchant key secret | Payment Verifier (`subscriptions/verify-payment.ts`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (if applicable) | Admin DB / Storage |

### Public Client Configuration Variables:

| Variable Name | Production Value | Consuming Component |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Node.js Runtime |
| `VITE_APP_ENV` | `production` | Frontend Environment Guard |
| `VITE_API_BASE_URL` | `https://api.dbc.com` | Mobile API Client (`mobileApiClient.ts`) |
| `RAZORPAY_KEY_ID` | `rzp_live_...` | Razorpay Checkout SDK |

---

## 6. Database Migration Safety & Deployment Rules

> [!IMPORTANT]
> Never execute `prisma migrate reset` or destructive schema operations against production.

1. **Pre-Migration Snapshot**: Verify an automated or manual backup snapshot of the PostgreSQL database is completed.
2. **Execute Non-Destructive Migrations**:
   ```bash
   npx prisma migrate deploy
   ```
3. **Verify Migration Status**:
   ```bash
   npx prisma migrate status
   ```

---

## 7. Verification & Propagation Diagnostic Commands

Once DNS changes are submitted, monitor resolution and HTTPS reachability:

### 1. DNS Propagation Verification
```powershell
# Check apex A record
Resolve-DnsName dbc.com -Type A

# Check www CNAME
Resolve-DnsName www.dbc.com -Type CNAME

# Check api CNAME
Resolve-DnsName api.dbc.com -Type CNAME
```

### 2. HTTPS & API Health Verification
```powershell
# Verify Frontend Root
curl.exe -i https://dbc.com

# Verify API Health Check
curl.exe -i https://api.dbc.com/api/health

# Verify Compliance Route
curl.exe -i https://api.dbc.com/api/compliance
```

---

## 8. Post-Activation Smoke Verification Protocol

Perform safe, non-destructive checks:

1. **Vercel SSL Certificate**: In Vercel Dashboard > Domains, confirm SSL certificate status reads `Valid` and `Active`.
2. **Health Check Response**: `GET https://api.dbc.com/api/health` returns HTTP `200 OK` with JSON body `{"status":"ok", ...}`.
3. **CORS Allowlist Enforcement**: Confirm preflight request from `https://dbc.com` returns `Access-Control-Allow-Origin: https://dbc.com`.
4. **Unauthenticated Route Security**: `GET https://api.dbc.com/api/customer/profile` returns HTTP `401 Unauthorized`.
5. **Account Deletion Safety**: Confirm non-admin cross-user deletion (`POST /api/user/delete-account`) returns HTTP `403 Forbidden`.

---

## 9. Emergency DNS & Deployment Rollback Protocol

If unexpected downtime occurs during DNS activation:

1. **Revert Apex A Record**: Update `@` `A` record back to original registrar parking IP (`216.23.224.51`) or previous host.
2. **Remove CNAME Records**: Delete newly added `www` and `api` `CNAME` records.
3. **Vercel Deployment Rollback**: In Vercel Dashboard > Deployments, locate previous stable deployment and select **Promote to Production** or run:
   ```bash
   vercel rollback <PREVIOUS_DEPLOYMENT_ID>
   ```

---

## 10. Operator Master Checklist

* [ ] Backup DNS zone file / export existing records.
* [ ] Add `76.76.21.21` `A` record for `dbc.com`.
* [ ] Add `cname.vercel-dns.com` `CNAME` record for `www`.
* [ ] Add `cname.vercel-dns.com` `CNAME` record for `api`.
* [ ] Attach custom domains in Vercel Dashboard.
* [ ] Inject production secrets into Vercel environment.
* [ ] Deploy database migrations (`npx prisma migrate deploy`).
* [ ] Verify HTTPS and `GET /api/health` 200 OK.
