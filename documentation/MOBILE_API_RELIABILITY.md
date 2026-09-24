# Module 52 — Mobile API Reliability, Error Handling & Network Resilience

## 1. Executive Summary

Module 52 hardened the DBC Mobile Application's API and network layer following completion of Modules 33–51. Building directly on the **Backend Truth Principle** established in Module 51, Module 52 ensures that degraded backend conditions (timeouts, network drops, 401 session expirations, 403 access denials, 404 missing entities, 409 conflicts, 422 validation errors, or 500+ server failures) produce predictable, truthful, recoverable mobile user experiences without fabricating fake state, swallowing errors, or exposing raw technical tracebacks.

---

## 2. API Architecture & Request Lifecycle

```text
Screen / UI Component
       ↓
MutationSafetyController / RequestCancellationTracker
       ↓
Mobile Service (e.g., mobileCustomerWorkspaceService)
       ↓
MobileApiClient (mobile/src/api/mobileApiClient.ts)
       ↓
AxiosClient (src/services/auth/axiosClient.ts) [15s Default Timeout & Bearer Token Interceptor]
       ↓
Backend API Endpoint
       ↓
Response Interceptor / normalizeMobileApiError
       ↓
Mobile Domain Model (Backend Truth)
       ↓
Rendered Mobile UI
```

---

## 3. Centralized Error Model & HTTP Error Mapping

Standardized in `mobile/src/types/mobileApiErrorTypes.ts` and normalized in `mobile/src/api/mobileErrorUtils.ts`:

```ts
export interface MobileApiError {
  code: string;
  message: string;
  status: number;
  category: 'NETWORK' | 'TIMEOUT' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION' | 'CONFLICT' | 'SERVER' | 'UNKNOWN';
  retryable: boolean;
  fieldErrors?: Record<string, string>;
  originalError?: unknown;
}
```

### HTTP Error Classification Table

| Condition / HTTP Status | Error Category | Error Code | Retryable | User-Facing Message |
| :--- | :--- | :--- | :--- | :--- |
| **No Connection / ERR_NETWORK** | `NETWORK` | `NETWORK_ERROR` | `true` | *"We could not connect to the server. Please check your internet connection and try again."* |
| **Timeout (ECONNABORTED)** | `TIMEOUT` | `TIMEOUT_ERROR` | `true` | *"The request took too long. Please check your connection and try again."* |
| **401 Unauthorized** | `UNAUTHORIZED` | `UNAUTHORIZED_EXPIRED_SESSION` | `false` | *"Your session has expired. Please sign in again."* |
| **403 Forbidden** | `FORBIDDEN` | `ACCESS_DENIED` | `false` | *"You don't have permission to perform this action."* |
| **404 Not Found** | `NOT_FOUND` | `NOT_FOUND` | `false` | *"The requested resource could not be found."* |
| **409 Conflict** | `CONFLICT` | `CONFLICT` | `false` | *"The operation could not be completed because the backend state has changed. Please refresh and try again."* |
| **422 Unprocessable Entity** | `VALIDATION` | `VALIDATION_ERROR` | `false` | *"Please check your input values and try again."* (Includes field-level errors) |
| **500+ Server Error** | `SERVER` | `SERVER_ERROR` | `true` | *"We're experiencing technical difficulties. Please try again in a moment."* |

---

## 4. User-Safe Error Messages & Diagnostic Redaction

- **Technical Detail Redaction**: Raw technical exceptions (`AxiosError`, `TypeError`, `ECONNREFUSED`, `SQL error`, stack traces) are sanitized via `formatUserErrorMessage()` and never rendered directly to normal users.
- **Diagnostic Logging Redaction**: `sanitizeLogPayload()` redacts sensitive keys (`Authorization`, `Cookie`, `password`, `otp`, `access_token`, `refresh_token`, `creditcard`) from client development logs.

---

## 5. Timeout Policy & Mutation Safety

### Timeout Configuration (`API_TIMEOUT_CONFIG`)
- **Default Requests**: `15,000ms` (15 seconds)
- **Payment Operations**: `30,000ms` (30 seconds)
- **File / Document Uploads**: `60,000ms` (60 seconds)

### Mutation Lock & Duplicate Submission Protection (`MutationSafetyController`)
- In-flight mutation lock prevents double-click submissions on critical forms (Project Requests, Quotation Submissions, Quotation Acceptance, Payment Initiation, Message Sending).
- Unsafe operations (Payment initiation, Project Request creation, Milestone Payment releases) are marked `retryable: false` to prevent blind automatic retries upon network timeout.
- Payment status uncertainty communicates explicit caution to the user without submitting duplicate payment attempts.

---

## 6. Race Condition Prevention & Search Request Cancellation

- `RequestCancellationTracker` manages `AbortSignal` instances for search inputs (Marketplace Search, Trade Partner Filtering, Knowledge Base Search).
- Submitting a new search automatically aborts any active pending request for the same search scope key, preventing stale out-of-order network responses from overwriting newer search results.

---

## 7. Response Shape Validation

- `validateObjectShape` and `validateArrayShape` (`mobile/src/utils/responseValidation.ts`) validate backend payload integrity before domain mapping.
- Missing required keys in API responses trigger controlled `ResponseValidationError` rather than crashing the application or fabricating fake fallback state.

---

## 8. Automated Reliability Verification Results

| Verification Test Suite | Command | Result |
| :--- | :--- | :--- |
| **API Reliability Suite** | `npx vitest run tests/frontend/mobile_api_reliability.test.ts` | **18/18 passed** |
| **All Mobile Test Suites** | `npx vitest run mobile_` | **24 test files passed (247/247 tests passed)** |
| **TypeScript Compilation** | `npx tsc -b` | **0 errors** |
| **Production Web Build** | `npx vite build` | **Build successful (1.06s)** |

---

## 9. Artifacts Created & Modified

### Created Files
- `mobile/src/types/mobileApiErrorTypes.ts`
- `mobile/src/api/mobileErrorUtils.ts`
- `mobile/src/utils/mutationSafety.ts`
- `mobile/src/utils/requestCancellation.ts`
- `mobile/src/utils/responseValidation.ts`
- `tests/frontend/mobile_api_reliability.test.ts`
- `documentation/MOBILE_API_RELIABILITY.md`

### Modified Files
- `src/services/auth/axiosClient.ts`
- `mobile/src/api/mobileApiClient.ts`
- `documentation/MOBILE_IMPLEMENTATION_STATUS.md`
