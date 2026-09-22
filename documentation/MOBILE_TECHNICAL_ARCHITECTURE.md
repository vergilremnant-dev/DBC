# DBC Native Mobile Application Technical Architecture Specification

## 1. Framework Evaluation & Technology Recommendation

### Evaluation Matrix

| Criterion | React Native (TypeScript) | Flutter (Dart) | Native Kotlin + Swift |
| :--- | :--- | :--- | :--- |
| **API & DTO Reuse** | **100% Direct Reuse** (TypeScript types & Axios services) | 0% (Requires rewriting DTOs & clients in Dart) | 0% (Requires duplicating models in Kotlin & Swift) |
| **Development Velocity** | **High** (Single shared JS/TS ecosystem) | High | Medium (Two separate native codebases) |
| **Native Device Access** | **Full** (Camera, Biometrics, Push via TurboModules) | Full | Native |
| **Team Expertise** | **Direct Alignment** (React + TypeScript stack) | Requires Dart learning curve | Requires 2 specialized native teams |

### Technology Recommendation: **React Native + TypeScript**
- **Justification**: React Native allows DBC to share 100% of the existing frontend API services (`authService.ts`, `bookingService.ts`, `quotationClientService.ts`, `ProjectService.ts`), HTTP client interceptor queues (`axiosClient.ts`), and domain interfaces (`src/types/`) without duplicating server integration logic.

---

## 2. Layered Mobile Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                            │
│           (React Native Screens, Components & Native Theme)            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                          APPLICATION LAYER                             │
│     (React Navigation Stacks, Route Guards & Feature Controllers)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                            DOMAIN LAYER                                │
│       (Project, Quotation, Milestone, Payment Status State Machines)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                           DATA / API LAYER                             │
│      (axiosClient.ts, Bearer Interceptor, DTO Mapping & Repositories)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                           PLATFORM LAYER                               │
│  (StorageAdapter, CameraAdapter, FilePickerAdapter, NotificationAdapter)│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Mobile Project Structure

```text
mobile/
├── src/
│   ├── navigation/        # React Navigation stacks (Auth, CustomerTab, ProTab)
│   ├── screens/           # Mobile screen view components
│   ├── features/          # Domain feature modules (auth, requests, projects, quotes)
│   ├── services/          # Shared HTTP API services (reused from Phase 1)
│   ├── types/             # Shared TypeScript domain interfaces (reused from Phase 1)
│   ├── state/             # Redux toolkit / React Context stores
│   ├── storage/           # StorageAdapter (SecureStore / AsyncStorage)
│   ├── platform/          # Native platform adapters (Camera, FilePicker, Biometrics)
│   └── theme/             # Mobile design system tokens (Colors, Typography)
├── assets/                # Icons, splash screens, local fonts
└── documentation/         # Architecture & API specifications
```

---

## 4. Native Platform Adapters

To prevent native device APIs from scattering throughout business code, all platform interactions are wrapped behind abstraction interfaces:

1. **`StorageAdapter`**:
   - `getItem(key)`, `setItem(key, value)`, `removeItem(key)`.
   - Native: `react-native-encrypted-storage` / `expo-secure-store` for JWT access tokens.
2. **`CameraAdapter`**:
   - `capturePhoto(options)` returning image URI.
   - Native: `react-native-image-picker` / `expo-camera`.
3. **`FilePickerAdapter`**:
   - `pickDocument(options)` returning file URI & metadata.
   - Native: `react-native-document-picker`.
4. **`NotificationAdapter`**:
   - `registerForPush()`, `onNotificationReceived(handler)`.
   - Native: `@react-native-firebase/messaging` (FCM) & APNs.
5. **`BiometricAdapter`**:
   - `authenticateBiometric(prompt)` returning boolean success.
   - Native: `react-native-biometrics` / `expo-local-authentication`.
6. **`DeepLinkAdapter`**:
   - `getInitialUrl()`, `subscribeDeepLink(handler)`.
   - Native: `React Navigation` linking configuration for `dbc://` schemes.

---

## 5. Security & Financial Data Protection

- **Server Authoritative Calculations**: The mobile client never calculates platform escrow fees, GST, or milestone payment balances locally. All financial breakdown figures originate from backend REST endpoints.
- **Secure Token Storage**: Authentication tokens are stored exclusively in platform secure storage (`Keychain` on iOS, `Keystore` on Android).
- **Transport Layer Security**: All API traffic is strictly enforced over HTTPS with TLS 1.3 encryption.

---

## 6. Testing Architecture Plan

```text
┌────────────────────────────────────────────────────────────────────────┐
│                           END-TO-END TESTS                             │
│                  (Detox / Appium Mobile E2E Journeys)                  │
├────────────────────────────────────────────────────────────────────────┤
│                          INTEGRATION TESTS                             │
│          (React Native Testing Library Component Flow Tests)           │
├────────────────────────────────────────────────────────────────────────┤
│                            UNIT TESTS                                  │
│             (Vitest / Jest Service & DTO Mapping Tests)                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Status & Conclusion

The technical architecture specification establishes a clean, decoupled foundation for native mobile development while preserving 100% of Phase 1 API contracts and backend microservice rules.

**STATUS: PHASE 2 — MOBILE TECHNICAL ARCHITECTURE: COMPLETE**
