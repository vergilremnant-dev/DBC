# Mobile Security Threat Model & Defense Architecture

## 1. Asset & Threat Taxonomy

| Asset | Threat | Attack Vector | Existing Control | Hardening Status |
| :--- | :--- | :--- | :--- | :--- |
| **User Credentials & Session Tokens** | Session Fixation / Token Theft | Storage / API Logs | `StorageAdapter` abstraction + `sanitizeObservabilityPayload` | **VERIFIED HARDENED** |
| **OTP Secrets** | OTP Interception / Telemetry Leakage | Logs / Analytics Buffer | Stripped from telemetry; generic cache rejects `otp` keys | **VERIFIED HARDENED** |
| **Role Authorization** | Vertical Privilege Escalation | Admin Route Navigation | `checkRoleAuthorization` + Backend API role check | **VERIFIED HARDENED** |
| **Object Data (Projects/Quotes)** | Horizontal IDOR Access | Deep links / Query params | Backend authorization authority; fails fast with 403 | **VERIFIED HARDENED** |
| **User Input (Messages/Bios)** | Cross-Site Scripting (XSS) | Message rendering | HTML tag sanitization (`&lt;script&gt;`) | **VERIFIED HARDENED** |
| **Financial Calculations & Payments** | Price Tampering / Fake Success | Client-side totals | Backend-authoritative amounts; payment requires `txn_` receipt | **VERIFIED HARDENED** |
| **Private Documents** | Public Document Leakage | Service Worker / Cache | Private API endpoints excluded from service worker cache | **VERIFIED HARDENED** |
| **API Transport** | Man-in-the-Middle (MitM) | Production Endpoint | HTTPS protocol assertion (`assertValidEnvironmentConfig`) | **VERIFIED HARDENED** |

---

## 2. Trust Boundaries

```text
Untrusted Client User Input
       ↓
Mobile UI Component Layer (sanitizeText / ARIA Props)
       ↓
Client Service Layer & MutationSafetyController (Duplicate Lock & Cache Security)
       ↓ [HTTPS Encrypted Transport]
Backend API Gateway & Authorization Layer (AUTHORITATIVE SECURITY BOUNDARY)
       ↓
Database & Third-Party Payment Services
```

> **CRITICAL RULE**: The client application is NEVER treated as the primary security boundary. Frontend role checks and validation are defense-in-depth UX controls; backend authorization is strictly authoritative.

---

## 3. Attack Surface Defense Summary

### A. Authentication & Session Isolation
- **Session Fixation Prevention**: `mobileAuthStore.logout()` wipes `user_profile` storage, session tokens, pending navigation targets, and in-memory caches.
- **Cache Isolation**: Generic cache (`mobileCache`) explicitly rejects keys matching `access_token`, `refresh_token`, `password`, or `otp`.

### B. Role & Route Boundaries
- `Customer` and `Contractor` roles attempting to navigate to `/admin/users`, `/admin/projects`, or `/admin/audit` via deep links are automatically redirected to `CustomerHome` or `ProfessionalHome`.

### C. XSS & Injection Safeguards
- HTML tags inside user messages, bios, and project descriptions are escaped (`<` -> `&lt;`, `>` -> `&gt;`).
- Unsafe URL schemes (`javascript:`, `data:`, `vbscript:`) are rejected for external navigation.

### D. Financial & Payment Integrity
- Financial payment amounts are strictly backend-authoritative.
- Credit card numbers, CVVs, and bank account numbers are rejected by `mobileCache.set()`.
- Milestone payment records require explicit backend transaction receipts (`txn_`).

### E. Service Worker Caching Safeguards
- Service worker cache rules explicitly exclude `/api/auth/*`, `/api/payments/*`, and `/api/messages/*` to prevent caching sensitive authenticated API responses in browser storage.
- Only static hashed assets (`/assets/*.js`, `/assets/*.css`) are cached for offline shell loading.

---

## 4. Residual Risks & Deferred Controls

- **Client-Side Code Tampering**: On web/PWA platforms, client-side code can be inspected by browser dev tools. Backend APIs enforce all business authorization rules.
- **Future Native Device Hardening**: Certificate pinning, biometrics (FaceID/TouchID), and root/jailbreak detection are deferred to the native Android/iOS compilation phase.
