# DBC Mobile Application — Permissions & Hardware Capabilities Matrix

> [!NOTE]
> This document specifies the required application permissions, hardware access rules, justification, and current implementation status across Web/PWA, Android, and iOS targets.

---

## 1. Capabilities Permission Matrix

| Hardware Capability | Android Permission | iOS Permission Key | Why Needed / Justification | Current Implementation Status |
| :--- | :--- | :--- | :--- | :--- |
| **Camera Access** | `android.permission.CAMERA` | `NSCameraUsageDescription` | Capture site inspection photos & document proofs | `PWA HTML5 File Input / Native Prompt` |
| **Photo Gallery / Files** | `READ_EXTERNAL_STORAGE` / `READ_MEDIA_IMAGES` | `NSPhotoLibraryUsageDescription` | Upload project blueprints, invoices, & site photos | `PWA File Picker Supported` |
| **Push Notifications** | `android.permission.POST_NOTIFICATIONS` | `UserNotifications` | Deliver project updates, milestone approvals, & message alerts | `PWA Web Push / FCM Deferred for Native` |
| **Biometric Auth** | `android.permission.USE_BIOMETRIC` | `NSFaceIDUsageDescription` | Quick re-authentication for high-value financial actions | `WebAuthn / Deferred for Native` |
| **Location Access** | *Not Required* | *Not Required* | *Location is selected via dropdown text field; GPS hardware not accessed* | **NOT REQUESTED** |

---

## 2. Minimal Permission Enforcement Principles

1. **No Over-Permissioning**: Permissions are only requested when the user triggers a specific feature (e.g. clicking "Upload Document").
2. **Graceful Permission Denial**: If a user denies camera or file permission, the app displays a clear user warning without crashing or locking the screen.
3. **Location Privacy**: User city/location is chosen explicitly via standard form inputs. The mobile application does **not** query background device GPS coordinates.
