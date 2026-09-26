# DBC Mobile Production Domain & DNS Audit — Module 66

> [!NOTE]
> This document details the empirical audit of the production domains (`dbc.com`, `www.dbc.com`, `api.dbc.com`), DNS resolution targets, TLS availability, Vercel platform mapping, and external domain configuration status for the **DBC Mobile Application (Web/PWA Runtime)**.

---

## 1. Domain Resolution & Audit Summary

| Target Domain | Configured Target | Observed Resolution / Target | Current Status | Blocker Level | Action Required |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `dbc.com` (Apex) | `76.76.21.21` (Vercel IP) | `216.23.224.51`, `216.23.232.62` (Registrar Parking) | `DNS PENDING` | P0 Launch Blocker | Update `A` record at registrar to `76.76.21.21` |
| `www.dbc.com` | `cname.vercel-dns.com` | CNAME unmapped / Parking | `DNS PENDING` | P0 Launch Blocker | Add `CNAME` record pointing to `cname.vercel-dns.com` |
| `api.dbc.com` | `cname.vercel-dns.com` | `NXDOMAIN` (Non-existent domain) | `DNS PENDING` | P0 Launch Blocker | Add `CNAME` record `api` pointing to Vercel/API backend |

---

## 2. Empirical Verification Findings

### A. Apex Domain (`dbc.com`)
* **Verification Method**: `nslookup dbc.com` (DNS Query)
* **Observed Result**: Resolves to `216.23.224.51` & `216.23.232.62` (Namecheap / Registrar domain parking servers).
* **Expected Vercel Target**: `76.76.21.21` (Vercel Anycast Ingress).
* **Status**: `DNS PENDING` / `MISCONFIGURED` (The apex domain is owned but not pointed to Vercel).

### B. Subdomain (`www.dbc.com`)
* **Verification Method**: `nslookup www.dbc.com`
* **Observed Result**: Unresolved or resolves to registrar fallback page.
* **Expected Target**: `cname.vercel-dns.com`.
* **Status**: `DNS PENDING`.

### C. API Endpoint Domain (`api.dbc.com`)
* **Verification Method**: `nslookup api.dbc.com`
* **Observed Result**: `NXDOMAIN` (Non-existent domain).
* **Expected Target**: Production backend server / Vercel API function route.
* **Status**: `DNS PENDING`.

---

## 3. Platform & SSL/TLS Infrastructure Requirements

1. **TLS Certificate Issuance**: Once DNS records (`A` and `CNAME`) are correctly mapped in the domain registrar's DNS management console, Vercel will automatically issue Let's Encrypt TLS certificates for `dbc.com`, `www.dbc.com`, and `api.dbc.com`.
2. **HTTP -> HTTPS Redirection**: Vercel handles automated 301 redirects from `http://dbc.com` to `https://dbc.com` and from `http://www.dbc.com` to `https://dbc.com`.
3. **CORS Alignment**: The production API server must accept request origins from `https://dbc.com` with `Access-Control-Allow-Credentials: true`.

---

## 4. Environment & Configuration Security Matrix

| Environment Component | Local | Staging | Production | Production Verification |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_APP_ENV` | `development` | `staging` | `production` | ✅ Verified in build logic |
| `VITE_REQUIRE_HTTPS` | `false` | `true` | `true` | ✅ Strictly enforced |
| `VITE_API_BASE_URL` | `http://localhost:3000` | `https://staging-api.dbc.com` | `https://api.dbc.com` | ⚠️ Endpoint DNS pending |
| Client Secret Exposure | None | None | None | ✅ 0 exposed secrets |
| Logging Mode | Enabled | Enabled | Suppressed | ✅ Console logs silent |

---

## 5. Unresolved External Dependencies

* **DNS Delegation**: Registrar DNS records must be updated by the domain owner.
* **Backend API Deployment**: Deployment of production Node API / serverless backend on `api.dbc.com`.
* **Production Razorpay Live Keys**: Transitioning from Sandbox test key pair to live production merchant credentials.
* **Push Services**: Configuration of production FCM & APNs certificates for push notification dispatch.
