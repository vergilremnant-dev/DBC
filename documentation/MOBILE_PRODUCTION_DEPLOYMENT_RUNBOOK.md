# DBC Mobile Production Deployment Runbook — Module 65

> [!NOTE]
> This runbook outlines the step-by-step operational procedure for executing, verifying, and monitoring production deployments of the **DBC Mobile Application (Web/PWA Runtime)** across Vercel and Docker deployment channels.

---

## 1. Pre-Deployment Phase (Quality & Release Gate)

Before initiating a production build or deployment, all quality release gates must pass cleanly:

### Step 1.1: Automated Code & Type Check
```bash
# Verify TypeScript strict compilation across the entire project
npx tsc -b
```
* **Acceptance Criteria**: 0 TypeScript compilation errors.

### Step 1.2: Mobile Automated Test Suite Execution
```bash
# Run all mobile unit, integration, and E2E test suites (Modules 33–65)
npm run test:mobile
```
* **Acceptance Criteria**: 37 test files, 100% passing rate (0 failed tests).

### Step 1.3: Full Repository Regression Test Suite Execution
```bash
# Run complete test suite across frontend, API, and mobile layers
npm test
```
* **Acceptance Criteria**: 66 test files, 100% passing rate.

### Step 1.4: Pre-Flight Environment & Secret Audit
Verify environment settings for production:
* `VITE_APP_ENV=production`
* `VITE_REQUIRE_HTTPS=true`
* `VITE_API_BASE_URL=https://api.dbc.com`
* Confirm 0 hardcoded private keys or connection strings in `mobile/src/`.

---

## 2. Deployment Execution Phase

### Step 2.1: Local Build Verification
```bash
# Execute local production build
npm run build
```
* **Verify Outputs**:
  * `dist/index.html` exists
  * `dist/manifest.json` exists
  * `dist/sw.js` exists
  * `dist/assets/` contains vendor and CSS chunks

### Step 2.2: Vercel Deployment Trigger
* **Automated Git Deployment**:
  Push release commit to `main` branch:
  ```bash
  git checkout main
  git pull origin main
  git add .
  git commit -m "feat(release): deploy release v1.0.0-rc.1 to production"
  git push origin main
  ```
* **Manual Vercel CLI Deployment (Optional)**:
  ```bash
  vercel --prod
  ```

### Step 2.3: Docker Container Deployment (Container Channel)
```bash
# Build production Docker container
docker build -t dbc-mobile:v1.0.0-rc.1 .

# Start container with production environment
docker run -d --name dbc-mobile-prod -p 5174:5174 --env NODE_ENV=production dbc-mobile:v1.0.0-rc.1
```

---

## 3. Post-Deployment Verification Phase (Smoke Testing)

Perform the following smoke tests against the live production URL (`https://dbc.com` or deployment target):

### Step 3.1: Core Health & Asset Verification
1. **HTTP Status & HTTPS Assertion**: Confirm `https://dbc.com` returns `200 OK` with valid TLS certificate.
2. **PWA Manifest Load**: Verify `https://dbc.com/manifest.json` returns valid JSON with `standalone` display mode.
3. **Service Worker Registration**: Open Chrome DevTools -> Application -> Service Workers. Confirm `sw.js` is `activated and running`.

### Step 3.2: SPA Deep-Link & Routing Verification
Directly navigate to the following deep-link paths in browser address bar:
* `https://dbc.com/login` -> Verify login form renders without 404.
* `https://dbc.com/workspace` -> Verify redirect to login when unauthenticated.
* `https://dbc.com/workspace/leads` -> Verify deep link handoff guard.

### Step 3.3: User Journey Production Smoke Test (Safe Read-Only Operations)
1. **Marketplace Navigation**: Load Home Marketplace, search for category "Architects", open professional profile.
2. **Authentication Flow**: Perform test user OTP login, confirm JWT session issuance, reload page, confirm session persistence.
3. **Workspace Access**: Inspect Customer, Contractor, and Admin dashboards without performing state-altering mutations against live customer data.
4. **Logout Flow**: Execute logout, verify session tokens are cleared, local cache is purged, and user is redirected to public home.

---

## 4. Post-Deployment Monitoring & Observability

Monitor operational health indicators for 30 minutes post-deployment:

1. **Error Monitoring**: Check error telemetry console (or Sentry dashboard if configured) for uncaught client exceptions.
2. **API Failure Rates**: Inspect Vercel Analytics / server logs for 5xx HTTP response spikes.
3. **PWA Cache Health**: Monitor for chunk load failure logs (`dbc_stale_reload`).

---

## 5. Rollback Execution Protocols

If critical errors are detected during post-deployment verification:

1. Refer to [MOBILE_PRODUCTION_ROLLBACK.md](file:///c:/Users/chagantipati%20sanjay/Abhista/documentation/MOBILE_PRODUCTION_ROLLBACK.md).
2. Execute Vercel instant rollback: `vercel rollback`.
3. If necessary, bump Service Worker cache version in `public/sw.js` to `dbc-cache-v3` and redeploy static patch.
4. Log incident details in release deployment log.
