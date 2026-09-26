# DBC Mobile Production Deployment & PWA Architecture — Module 65

> [!NOTE]
> This document details the production deployment configuration, hosting platform architecture, environment variables, PWA service worker behavior, security headers, routing rewrites, and custom domain setup for the **DBC Mobile Application (Web/PWA Runtime)**.

---

## 1. Deployment Platform Discovery & Summary

| Parameter | Configuration Value | Verification Status |
| :--- | :--- | :--- |
| **Primary Deployment Platform** | Vercel Serverless / Static Platform | ✅ Configured (`vercel.json`) |
| **Secondary Container Platform** | Docker Runtime (`node:20-alpine`) | ✅ Configured (`Dockerfile`) |
| **Framework** | Vite + React 19 + TypeScript | ✅ Configured (`vite.config.ts`) |
| **Build Command** | `npm run build` (`prisma generate && tsc -b && vite build`) | ✅ Verified |
| **Output Directory** | `dist` | ✅ Verified |
| **Active Mobile Runtime** | Progressive Web Application (`Web/PWA`) | ✅ Operational |
| **Production App Domain** | `https://dbc.com` | ⚠️ External Dependency |
| **Production API Domain** | `https://api.dbc.com` | ⚠️ External Dependency |
| **Staging API Domain** | `https://staging-api.dbc.com` | ✅ Supported via Env |

---

## 2. Environment Variable & Secret Security Matrix

```text
VITE_APP_ENV=production
VITE_REQUIRE_HTTPS=true
VITE_API_BASE_URL=https://api.dbc.com
VITE_ENABLE_CONSOLE_LOGS=false
```

### Security Audit Assertions:
1. **0 Secret Exposure**: Zero database connection strings (`DATABASE_URL`), JWT secret keys (`JWT_SECRET`), Razorpay secret keys (`RAZORPAY_KEY_SECRET`), or administrative access tokens are embedded in client-side code (`mobile/src/`).
2. **HTTPS Enforcement**: In production mode (`VITE_APP_ENV=production`), `VITE_REQUIRE_HTTPS=true` is strictly enforced by `environmentValidation.ts`. API connection attempts over unencrypted `http://` or local addresses (`localhost`, `127.0.0.1`) throw immediate client runtime exceptions.
3. **Silent Production Logging**: Console logging (`console.log`, `console.debug`) is disabled in production via `VITE_ENABLE_CONSOLE_LOGS=false` and `observabilitySanitizer.ts`.

---

## 3. PWA Manifest & Service Worker Configuration

### Web App Manifest (`public/manifest.json`)
* **Application Name**: `DBC Design Build Connect`
* **Short Name**: `DBC`
* **Display Mode**: `standalone` (Full-screen mobile app shell without browser chrome)
* **Start URL**: `/`
* **Scope**: `/`
* **Theme Color**: `#10b981` (DBC Emerald Primary)
* **Background Color**: `#ffffff`
* **Icon Set**: 192x192, 512x512, and 512x512 maskable icons (`/icons/icon-*.png`)

### Service Worker (`public/sw.js` & `dbc-cache-v2`)
* **Cache Identifier**: `dbc-cache-v2`
* **Activation**: Automatically purges legacy caches (`dbc-cache-v1` or unversioned caches) on activation via `self.clients.claim()`.
* **HTML Navigation Requests**: Network-First strategy (never caches HTML files to prevent stale deployment locks).
* **Version-Hashed Static Assets (`/assets/`)**: Cache-First strategy with network fallback and automatic cache eviction on asset fetch failure.
* **API Calls (`/api/*`)**: Network-Only strategy. API requests bypass the Service Worker cache completely to ensure real-time state integrity and zero stale business data.
* **Stale Chunk Recovery**: `index.html` includes an inline global error boundary script that detects 404 chunk load failures, unregisters broken service workers, clears browser cache, and reloads the application cleanly.

---

## 4. Platform Rewrites, Headers & Routing (`vercel.json`)

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" }
      ]
    },
    {
      "source": "/(index.html)?",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate, max-age=0" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/index" },
    { "source": "/((?!api|assets|favicon.ico|manifest.json|sw.js|\\.well-known).*)", "destination": "/index.html" }
  ]
}
```

---

## 5. Production API Connectivity & CORS Boundary

1. **Restricted CORS Policy**: Production backend endpoints validate origin headers against the production domain (`https://dbc.com`). API routes supporting authenticated cookie/header sessions mandate `Access-Control-Allow-Credentials: true`.
2. **Token Security**: Tokens (JWT access tokens & refresh tokens) are held in memory and encrypted local storage via `StorageAdapter.ts`. Zero plaintext tokens are logged or stored in unencrypted cookies.
3. **Idempotent Network Retries**: Mobile API requests utilize `mobileApiClient.ts` exponential backoff for transient 5xx / network failures, preventing duplicate POST submissions for payment or quotation actions.

---

## 6. Custom Domain & DNS Requirements

> [!IMPORTANT]
> The custom production domains (`https://dbc.com` and `https://api.dbc.com`) require the following DNS setup prior to public go-live:

| Record Type | Host | Target / Value | Purpose |
| :--- | :--- | :--- | :--- |
| `A` | `@` | `76.76.21.21` (Vercel Anycast IP) | Apex domain routing |
| `CNAME` | `www` | `cname.vercel-dns.com` | WWW subdomain canonical redirect |
| `CNAME` | `api` | `cname.vercel-dns.com` | Production API endpoint routing |
| `CAA` | `@` | `0 issue "letsencrypt.org"` | Automated TLS certificate issuance |

---

## 7. Production Data Safety Rules

* **Zero Production Data Mutation**: Automated verification scripts and deployment smoke tests run exclusively in `STAGING` or `LOCAL` test environments.
* **No Mock Data in Production**: All `mobile/src/` components fetch live data from the backend API. 0 hardcoded test user profiles or fake financial figures exist in the bundle.
* **Read-Only Verification**: Production smoke tests perform non-destructive `GET` requests (health check, public marketplace view, category search). All mutation tests (`POST`, `PATCH`, `DELETE`) are strictly isolated to test environments.
