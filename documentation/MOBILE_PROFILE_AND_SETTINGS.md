# DBC Mobile Profile, Settings & Account Management Architecture (Module 47)

> [!NOTE]
> This document details the completed **Mobile Profile, Settings & Account Management Architecture** for the DBC Mobile Application (Modules 33–47). It establishes role-aware Profile screens, profile editing with unsaved changes protection, account settings, OTP security model overview, notification preferences, and session logout workflow.

---

## 1. Executive Summary

Module 47 completes the account lifecycle and profile management experience for the DBC Mobile Application. In strict alignment with pre-approved Architecture Decision Records (ADR-001 through ADR-005) and existing backend profile endpoints (`/api/profile`), the profile architecture adapts customer, professional, and administrator account details into a mobile-first interface without creating redundant authentication logic or modifying database schemas.

---

## 2. Architecture & Service Layer

```text
profileService (/api/profile) & mobileAuthStore (session token)
                          │
                          ▼
                mobileProfileService
(Encapsulates getCurrentProfile, updateProfile, uploadProfileImage, logout)
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
MobileProfileScreen  EditProfileScreen AccountSettingsScreen
(Role-Aware Hub)    (Editable fields,  (Security & Alert Shortcuts)
                     Unsaved modal)
```

---

## 3. Role-Aware Profile Screen Layouts

### Customer Profile
- **Header**: Avatar, Full Name, Email, Phone, Customer Badge, Edit Profile button.
- **Account Links**: My Requests, My Projects, Messages, Notifications.
- **Settings & Security**: Account Settings, Security & OTP Verification, Notification Preferences.
- **Action**: Sign Out of Account (with confirmation modal).

### Professional Profile
- **Header**: Avatar, Full Name, Trade Business Name, Category, Email, Phone, Contractor Badge, Edit Profile button.
- **Account Links**: Project Requests, Open Leads, Proposals & Quotes, Active Projects, Finance & Earnings.
- **Settings & Security**: Account Settings, Security & OTP Verification, Notification Preferences.
- **Action**: Sign Out of Account (with confirmation modal).

### Admin Profile
- **Header**: Avatar, Full Name, Email, Phone, Super Admin Badge, Edit Profile button.
- **Account Links**: Platform Users, Trade Partners, Platform Projects, Operational Console.
- **Settings & Security**: Account Settings, Security & OTP Verification, Notification Preferences.
- **Action**: Sign Out of Account (with confirmation modal).

---

## 4. Editable vs Read-Only Fields & Unsaved Changes Guard

1. **Editable Fields**:
   - First Name, Last Name, Phone Number, City / Location, Business Name (Contractor), Bio / About, Profile Avatar Photo.
2. **Read-Only / Security-Constrained Fields**:
   - Primary Email Address (`🔒 Email address change requires dedicated verification and OTP confirmation`).
   - Account Role (`customer`, `contractor`, `admin`).
3. **Unsaved Changes Protection Guard**:
   - If a user modifies form fields and attempts to navigate back before saving, `EditProfileScreenController.handleBackAttempt()` displays a confirmation modal:
     `Discard Unsaved Changes? You have unsaved changes to your profile. Leaving this page will discard your updates. [Keep Editing] [Discard]`

---

## 5. Security & Authentication Model

- **OTP Authentication Model**: Accurately reflects DBC's OTP verification architecture (`Your account is protected using 6-digit email OTP verification without passwords`).
- **Polished Logout Flow**:
  - Tapping "Sign Out" triggers a confirmation modal explaining that the active encrypted session token will be invalidated.
  - Upon confirmation, `mobileProfileService.logout()` invokes `authService.logout()`, destroys `mobileApiClient` tokens, clears `mobileAuthStore` session state, clears pending deep-link targets, and resets navigation to `AuthStack`.
  - Protected screens cannot be re-opened via browser back navigation.

---

## 6. Image Picker & Platform Boundary

- `uploadProfileImage(fileBase64)` wraps `profileService.uploadImage` (`POST /api/profile/upload`).
- Web/PWA clients convert selected files to base64; native Android/iOS builds will link native Camera/Gallery pickers into this adapter without breaking the web runtime.
