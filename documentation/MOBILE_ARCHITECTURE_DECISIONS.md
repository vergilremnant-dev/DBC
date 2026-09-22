# DBC Mobile Architecture Decision Records (ADRs)

## ADR-001: Mobile Framework Selection
- **Decision**: Select **React Native + TypeScript** as the official mobile development framework for DBC Android + iOS applications.
- **Reason**: Allows 100% direct code reuse of existing frontend API services (`authService.ts`, `bookingService.ts`, `quotationClientService.ts`, `ProjectService.ts`), HTTP bearer request interceptors (`axiosClient.ts`), and TypeScript domain models (`src/types/`).
- **Alternatives Considered**: Flutter (Dart), Native Kotlin + Swift.
- **Trade-offs**: Requires proper TurboModule bridge integration for heavy native camera/scanning plugins; managed effectively via Expo / React Native native modules.
- **Status**: **ACCEPTED**

---

## ADR-002: API & Domain Code Reuse Strategy
- **Decision**: Reuse existing Phase 1 REST API contracts, DTO types, and Axios service modules directly without duplicating backend integration logic.
- **Reason**: Guarantees complete business logic alignment between web and mobile clients while preventing server-side API fragmentation.
- **Alternatives Considered**: Writing dedicated mobile BFF (Backend-For-Frontend) microservices.
- **Trade-offs**: Requires environment variable injection (`VITE_API_BASE_URL` vs mobile `API_BASE_URL`).
- **Status**: **ACCEPTED**

---

## ADR-003: Secure Token Storage Adapter
- **Decision**: Implement a platform-agnostic `StorageAdapter` interface that delegates JWT access token persistence to platform secure storage (`Keychain` on iOS, `Keystore` on Android) on mobile devices and `localStorage` / memory tokens on web.
- **Reason**: Protects user credentials against plain-text filesystem inspection or unauthorized extraction on mobile devices.
- **Alternatives Considered**: Storing JWT tokens in unencrypted AsyncStorage.
- **Trade-offs**: Adds asynchronous read overhead during app startup, handled via splash screen loading states.
- **Status**: **ACCEPTED**

---

## ADR-004: Native Platform Capability Abstraction Boundary
- **Decision**: Wrap all native device capabilities (Camera, File Picker, Push Notifications, Biometrics, Deep Linking) behind typescript adapter interfaces.
- **Reason**: Decouples UI screens and feature controllers from specific third-party native plugin implementations, enabling easy mocking during unit testing.
- **Alternatives Considered**: Direct inline calls to native plugin modules in React components.
- **Trade-offs**: Requires writing thin adapter wrapper classes.
- **Status**: **ACCEPTED**

---

## ADR-005: Navigation Stack Architecture
- **Decision**: Use **React Navigation** with native stack navigators, bottom tab bars, and nested modal screens.
- **Reason**: Provides fluid native 60fps screen transitions and deep linking URL routing (`dbc://`) out of the box.
- **Alternatives Considered**: Web-style router libraries (`react-router-native`).
- **Trade-offs**: Requires setting up native screen container wrappers.
- **Status**: **ACCEPTED**
