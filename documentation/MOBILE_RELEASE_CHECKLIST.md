# Mobile Release Engineering & Production Checklist

## Pre-Release Validation

### 1. Code & Source Control
- [x] Working tree clean (`git status` zero uncommitted changes).
- [x] Active branch identified (`main`).
- [x] Commit hash recorded (`git rev-parse HEAD`).
- [x] Zero raw `console.log` statements in production source files.
- [x] Zero committed passwords, API secrets, or private keys.

### 2. Automated Quality Gates
- [x] TypeScript compilation check: `npx tsc -b` (**0 errors**).
- [x] Mobile unit, integration & E2E release gate: `npm run test:mobile` (**380/380 tests passed**).
- [x] Production readiness suite: `npx vitest run tests/frontend/mobile_production_readiness.test.ts` (**25/25 tests passed**).

### 3. Production Build & Assets
- [x] Production web build execution: `npx vite build` (**Succeeded in <1.0s**).
- [x] Asset chunk hashes generated (`dist/assets/index-DBeQ4Gh8.js`, `dist/assets/vendor-DYMagUuo.js`).
- [x] Bundle size audit verified (Vendor chunk ~424KB, main bundle ~831KB).
- [x] PWA manifest specification valid (`display: "standalone"`, `theme_color: "#2563EB"`).

### 4. Environment & Secret Boundaries
- [x] `VITE_API_BASE_URL` uses HTTPS in production environment (`https://api.dbc.com`).
- [x] Production environment validation asserts NO localhost or HTTP endpoints.
- [x] Public config variables separated from server-only secrets.
- [x] Telemetry log filter suppresses `debug` output in production mode.

---

## Deployment & Verification

### 5. Deployment Execution
- [ ] Deploy immutable `dist/` directory to production web container / CDN.
- [ ] Purge CDN edge caches for HTML entry point (`index.html`).
- [ ] Confirm HTTP to HTTPS redirect rules on edge routers.

### 6. Post-Deployment Smoke Test
- [ ] Verify login & 6-digit email OTP authentication lifecycle.
- [ ] Verify Marketplace discovery & Category search filters.
- [ ] Verify Customer Project Request submission.
- [ ] Verify Professional Quotation proposal wizard.
- [ ] Verify Customer Quotation acceptance & Milestone payment history.
- [ ] Verify Customer/Professional/Admin workspace role separation.

---

## Rollback Procedure (Web/PWA Container)

If a critical production error occurs post-deployment:
1. **Identify Faulty Commit**: Record commit hash of failing release.
2. **Select Target Rollback Build**: Select previous known-good commit hash.
3. **Redeploy Immutable Artifact**: Trigger deployment pipeline using previous build artifact.
4. **Purge CDN Caches**: Immediately invalidate `index.html` at the edge to force clients to fetch clean asset references.
5. **Verify Session Integrity**: Confirm user sessions remain valid post-rollback.
