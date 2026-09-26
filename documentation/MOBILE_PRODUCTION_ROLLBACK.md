# DBC Mobile Production Rollback & Emergency Strategy — Module 65

> [!NOTE]
> This document details the procedures, triggers, verification steps, Service Worker cache invalidation rules, database compatibility requirements, and emergency response owner protocols for rolling back the **DBC Mobile Application (Web/PWA Runtime)** in production.

---

## 1. Rollback Triggers & Severity Matrix

A production rollback is mandated under any of the following critical conditions:

| Trigger Severity | Condition / Metric Threshold | Immediate Action Required |
| :--- | :--- | :--- |
| **SEV-1 (Critical)** | Production authentication failure rate > 5% or session drop loop | Initiate Instant Vercel Rollback / Container Reversion |
| **SEV-1 (Critical)** | Payment submission failure or duplicate payment execution | Disable Payment Routes + Instant Rollback |
| **SEV-1 (Critical)** | Data leak or security vulnerability discovered in bundle | Revoke deployment & deploy security patch |
| **SEV-2 (High)** | Service Worker cache deadlock / 404 chunk load failure rate > 2% | Trigger SW cache key increment + Rollback static build |
| **SEV-2 (High)** | API route mismatch / 500 server error spike on core workflows | Revert frontend build to previous stable release SHA |
| **SEV-3 (Medium)** | UI visual alignment defect or minor feature regression | Fast-forward hotfix patch deployment |

---

## 2. Platform-Specific Rollback Execution Procedures

### A. Vercel Platform Rollback (Primary Web/PWA Hosting)
1. **Instant Vercel Instant Rollback via CLI**:
   ```bash
   # Revert production alias to previous successful deployment ID
   vercel rollback <previous-deployment-id> --yes
   ```
2. **Instant Vercel Dashboard Rollback**:
   * Navigate to `Vercel Dashboard` -> `Project Settings` -> `Deployments`.
   * Locate the target verified deployment (e.g. `v1.0.0-rc.1`).
   * Select `Promote to Production` / `Rollback`.
   * Instant domain alias reassignment occurs within < 5 seconds.

### B. Docker Container Rollback (Secondary Container Infrastructure)
1. **Docker Container Tag Reversion**:
   ```bash
   # Stop running container
   docker stop dbc-mobile-app
   
   # Restart previous verified image tag
   docker run -d --name dbc-mobile-app -p 5174:5174 --restart=always dbc-mobile:v1.0.0-rc.1
   ```

---

## 3. Service Worker Cache Invalidation & Stale Chunk Eviction

When rolling back a single-page application build with hashed bundle filenames, browser caches and active Service Workers can retain stale references (`404 Loading chunk failed`).

To prevent customer client locks during a rollback:

1. **Service Worker Version Bump**:
   * Update `CACHE_NAME` in `public/sw.js` from `dbc-cache-v2` to `dbc-cache-v3` (or append emergency suffix `dbc-cache-v2-rollback`).
   * On registration, the new Service Worker activates and automatically executes the `activate` listener purge:
     ```javascript
     caches.keys().then((keys) => {
       return Promise.all(
         keys.map((key) => {
           if (key !== CACHE_NAME) return caches.delete(key);
         })
       );
     }).then(() => self.clients.claim());
     ```
2. **Inline Auto-Recovery Verification**:
   * `index.html` contains an unregister & cache-delete handler triggered on script load error.
   * If a client browser attempts to fetch a removed asset hash, `sessionStorage.getItem('dbc_stale_reload')` prevents infinite reload loops while purging stale service workers and hard-reloading `index.html`.

---

## 4. Backend & Database Migration Compatibility

> [!IMPORTANT]
> **Database Rollback Rule**:
> Frontend client rollbacks MUST NOT break existing database schemas. All database migrations executed via Prisma (`prisma migrate deploy`) must maintain backwards compatibility (expand-and-contract pattern) so that rolling back the mobile PWA code from `v1.1.0` to `v1.0.0` does not cause null pointer exceptions or column mismatch errors on the API backend.

---

## 5. Rollback Verification Checklist

Following execution of a rollback, the deployment team must perform the following immediate checks:

* [ ] **Domain Ping**: Verify `https://dbc.com` responds with HTTP status 200 OK.
* [ ] **Version Verification**: Inspect `window.__DBC_BUILD_VERSION__` or deployment metadata tag to confirm reversion to previous version.
* [ ] **SW Status Check**: Confirm `sw.js` fetches without 304 caching errors and cache key matches target version.
* [ ] **Auth Smoke Test**: Verify login via OTP, session token issuance, and role navigation.
* [ ] **API Health**: Confirm `/api/health` returns status `ok`.
* [ ] **Incident Communication**: Notify platform stakeholders and update status page.

---

## 6. Responsible Ownership & Emergency Contacts

* **Deployment Lead**: Mobile Operations / DevOps Lead
* **Backend Integration Contact**: API Engineering Team
* **Emergency Escalation Channel**: `#dbc-deployments-emergency`
