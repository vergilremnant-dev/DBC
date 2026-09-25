# Mobile Observability, Analytics, Crash Monitoring & Production Diagnostics Report

## Executive Summary

Module 56 implements a comprehensive **Mobile Observability, Analytics, Crash Monitoring, Production Diagnostics, and Operational Health architecture** across the DBC Mobile Application.

This module provides operational health visibility and telemetry **without exposing sensitive user credentials, payment details, private message contents, OTP secrets, or raw PII**.

---

## 1. Observability Architecture

Observability logic is organized through a privacy-first, non-blocking service layer:

```text
Mobile UI / Feature / Screen
       ↓
Centralized Logger & Analytics Service (observabilityService.ts)
       ↓
Privacy & Sanitization Boundary (observabilitySanitizer.ts)
       ↓
Telemetry Event Buffer (In-Memory Queue: Max 50 events)
       ↓
External Monitoring Provider Adapter (Sentry / Crashlytics Native Boundary)
```

---

## 2. Logging Policy & Centralized Logger

Structured logging is provided by `logger` (`mobile/src/observability/observabilityService.ts`):
- **Log Levels**: `debug`, `info`, `warn`, `error`.
- **Payload Sanitization**: Automatically redacts sensitive parameters (`authorization`, `cookie`, `token`, `password`, `otp`, `access_token`, `refresh_token`, `creditcard`, `cvv`, `email`, `phone`).

---

## 3. Environment Separation

- **Development**: All log levels enabled (`debug`, `info`, `warn`, `error`). Payloads sanitized.
- **Staging**: `info`, `warn`, `error` logs enabled. Tagged as `staging`.
- **Production**: Verbose `debug` and raw API payload logs are **strictly suppressed**. Only `warn` and `error` telemetry are recorded.

---

## 4. Error Reporting & Module 52 Integration

`reportError(error, context)` integrates with Module 52 `normalizeMobileApiError()`:
- Maps caught errors into normalized categories (`NETWORK`, `TIMEOUT`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION`, `CONFLICT`, `SERVER`, `RUNTIME`, `UNKNOWN`).
- Strips raw stack traces and user PII.
- Generates user-safe error views.

---

## 5. Runtime Error Boundary (`MobileErrorBoundarySpec`)

- Catches uncaught React/PWA component render exceptions.
- Logs safe error diagnostics.
- Presents a user-friendly fallback view (`"Something went wrong. Please try again."`) with a **Try Again** button without leaking technical stack traces.

---

## 6. API Telemetry & URL Template Normalization

- API latency and status codes are tracked without logging body payloads or authorization headers.
- `normalizeEndpointUrl()` converts resource URLs with IDs into safe templates:
  - Raw: `/api/projects/proj-98765/milestones/ms-123`
  - Normalized: `/api/projects/:id/milestones/:id`

---

## 7. Screen & Performance Telemetry

`startPerformanceTimer(name)` / `stopPerformanceTimer(name)` / `measurePerformanceAsync(name, fn)`:
- Measures screen open duration, render latency, and API call execution times in milliseconds.
- Prevents main thread looper blocking and maintains an in-memory history capped at 50 metrics.

---

## 8. Analytics Event Taxonomy (`analyticsRegistry.ts`)

Allowed event names are registered in the authoritative taxonomy:
- **Customer**: `marketplace_viewed`, `service_searched`, `professional_viewed`, `project_request_started`, `project_request_submitted`, `quotation_viewed`, `quotation_accepted`, `quotation_rejected`, `project_viewed`, `milestone_viewed`, `payment_started`, `payment_completed`, `message_sent`, `project_completion_confirmed`
- **Professional**: `professional_dashboard_viewed`, `request_viewed`, `request_accepted`, `request_declined`, `quotation_created`, `quotation_submitted`, `project_started`, `milestone_updated`, `document_uploaded`
- **Admin**: `admin_dashboard_viewed`, `user_directory_viewed`, `audit_log_viewed`
- **Auth**: `login_started`, `login_succeeded`, `login_failed`, `otp_verification_failed`, `session_restored`, `session_expired`, `logout`
- **System**: `network_offline`, `network_reconnected`, `api_timeout`, `api_error`, `cache_hit`, `cache_miss`, `deep_link_received`, `deep_link_blocked`, `notification_opened`

---

## 9. Allowed vs Forbidden Properties

- **Allowed**: `role`, `status`, `category`, `screen`, `environment`, `appVersion`, `durationMs`, `httpStatus`, `anonymousSessionId`.
- **Forbidden (Sanitized to `[REDACTED]`)**: `authorization`, `token`, `password`, `otp`, `creditcard`, `cvv`, `email`, `phone`, `message_body`, `content`, `description`, `notes`.

---

## 10. Privacy Boundary Verification Matrix

| Data Element | Emitted in Telemetry? | Handling Rule |
| :--- | :--- | :--- |
| **Access / Refresh Tokens** | **NO** | Sanitized to `[REDACTED]` |
| **Passwords / OTPs** | **NO** | Sanitized to `[REDACTED]` |
| **Authorization Headers** | **NO** | Sanitized to `[REDACTED]` |
| **Payment Cards / CVV** | **NO** | Sanitized to `[REDACTED]` |
| **Message Content / Bodies** | **NO** | Sanitized to `[REDACTED]` |
| **Private Document Files** | **NO** | Sanitized to `[REDACTED]` |
| **Raw User PII (Email, Phone)** | **NO** | Sanitized to `[REDACTED]` |

---

## 11. Event Deduplication

- Events are debounced using a 1000ms deduplication window per `(eventName + screen + properties)` key.
- Prevents rapid duplicate analytics triggers caused by React re-renders or double taps.

---

## 12. Non-Blocking & Resilience Policy

- All telemetry logging and analytics tracking calls wrap in `try/catch`.
- Telemetry failure **NEVER** throws exceptions or interrupts business workflows, API calls, navigation, or payment processing.

---

## 13. Consent & Preferences

- `setObservabilityConsent({ analyticsOptIn, crashReportingOptIn })` manages user opt-in/opt-out preferences.
- When `analyticsOptIn` is `false`, event tracking returns `false` immediately without storing events.

---

## 14. Known Limitations & Future Native Integrations

- **Web/PWA Scope**: Current implementation uses an in-memory telemetry buffer and logger.
- **Future Native Boundary**: Native Android (Firebase Crashlytics / Google Analytics) and iOS (Sentry / App Store Diagnostics) SDK adapters will bridge directly to `observabilityService.ts` when native build targets are deployed.
