# DBC Mobile Application — Release Candidate Pre-Flight Checklist

> [!NOTE]
> Mandatory pre-release gate checklist for DBC Mobile Application across Code, Security, Privacy, Backend, PWA, Store, and Release domains.

---

## 1. Pre-Flight Checklist

### Code & Automated Quality Gates
- [x] All 35 mobile unit & integration test files pass 100% (600 tests).
- [x] Full test suite (64 test files, 755 tests) passes 100%.
- [x] Release Candidate test suite (`mobile_release_candidate.test.ts`) passes 100% (52 tests).
- [x] TypeScript compilation (`npx tsc -b`) passes with **0 errors**.
- [x] Production web build (`npx vite build`) completes cleanly.

### Security & Secret Scanning
- [x] Zero database connection passwords, service-role keys, or signing secrets in client bundle.
- [x] Production environment forces HTTPS; HTTP and `localhost` fallbacks blocked.
- [x] Bearer JWT tokens stored securely in persistent storage adapter.
- [x] Logout purges tokens, persistent user profile, pending deep links, and memory cache.

### Privacy & Data Governance
- [x] Telemetry sanitization redacts sensitive credentials (tokens, passwords, OTPs).
- [x] Service worker cache explicitly **excludes** API network requests (`/api/*`).
- [x] Zero background device GPS location queried.
- [x] Account switching completely purges prior user cache data.

### Backend & Financial Integrity
- [x] Client application performs **0 calculations** for subtotal, platform fee (1%), GST (18%), or net payouts.
- [x] Quotation acceptance atomically spawns Project entity with duplicate acceptance protection.
- [x] Payment verification checks Razorpay signature on backend.

### PWA Target Readiness
- [x] PWA Manifest (`site.webmanifest` / `manifest.json`) valid.
- [x] Service worker registration & static asset caching verified.
- [x] PWA installability verified in desktop/mobile browsers.

### Store & Legal Dependencies (External)
- [ ] Apple Developer & Google Play Console developer accounts configured.
- [ ] Native Android Gradle & iOS Xcode projects generated.
- [ ] Backend account deletion API endpoint implemented.
- [ ] Legal approval for Privacy Policy and Terms of Service URLs.
- [ ] FCM / APNs production push notification credentials configured.
