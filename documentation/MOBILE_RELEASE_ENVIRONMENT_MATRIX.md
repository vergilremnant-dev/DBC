# DBC Mobile Application — Release Environment Matrix

> [!NOTE]
> This document specifies the environment configuration matrix, isolation boundaries, and security rules across Development, Staging, and Production deployment targets for the DBC Mobile Application.

---

## 1. Environment Matrix

| Environment Target | API Base Endpoint | Auth Transport | Database Target | Payment Provider | Push Notifications | Debugging & Logging | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Development** | `http://localhost:3000` / `http://127.0.0.1:3000` | Bearer JWT / Dev Cookie | Local Postgres / Supabase Local | Razorpay Test Sandbox | Local Mock Service | Verbose console logging enabled | **Isolated** |
| **Staging** | `https://staging-api.dbc.in` | HTTPS Bearer JWT + Secure Cookie | Staging Supabase Instance | Razorpay Test Sandbox | FCM Staging Channel | Error reporter enabled, verbose logs off | **Isolated** |
| **Production** | `https://api.dbc.in` | HTTPS Strict Bearer JWT + SameSite Cookie | Production Supabase DB | Razorpay Production Gateway | FCM / APNs Live Production | Error reporter sanitized, debug mode OFF | **VERIFIED** |

---

## 2. Production Environment Rules

1. **HTTPS Protocol Enforcement**: Production environment (`VITE_MOBILE_ENV = 'production'`) strictly enforces `https://` for all API endpoints. `http://` and `localhost` fallbacks are strictly blocked.
2. **Zero Server Secret Exposure**: Client bundle contains 0 database connection strings, 0 service-role keys, 0 private API keys, and 0 payment secret keys.
3. **Debug Console Redaction**: Production build disables development console logs and redacts sensitive parameters (tokens, passwords, OTPs) from telemetry payloads.
4. **Mock Data Elimination**: All screens consume backend-authoritative endpoints. Mock data fallbacks are disabled in production build configuration.
