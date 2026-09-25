# DBC Mobile Application — Store Readiness & Metadata Specification

> [!NOTE]
> This document specifies application store metadata, asset guidelines, legal privacy policy requirements, account deletion compliance status, and external dependencies for Google Play, Apple App Store, and Web PWA releases.

---

## 1. Application Store Metadata

### App Name
**DBC**

### Short Description
Design, Build & Construct — Your trusted long-term project execution & professional construction management platform.

### Full Description
DBC (Design, Build & Construct) connects property owners, architects, structural engineers, civil contractors, and MEP specialists for transparent, milestone-driven construction project execution.

Key Features:
- Discover verified construction professionals and review portfolio galleries.
- Submit structured project requests and receive detailed milestone proposals.
- Track real-time project progress, activity timeline, and document repository.
- Authorize milestone payments backed by 1% DBC Escrow protection and 18% GST invoice transparency.
- Communicate directly via secure in-app messaging.

### Store Categories (Proposed)
- **Google Play**: Productivity / Business
- **Apple App Store**: Business / Lifestyle

---

## 2. Screenshot & Visual Asset Requirements

Required screenshots for store submission:
1. **Customer Marketplace**: Category discovery & verified contractor profiles.
2. **Project Request & Quotation Review**: Detailed scope of work & milestone cost schedule.
3. **Customer Project Workspace**: Interactive progress overview, milestone approval action, & financial breakdown.
4. **Professional Workspace**: Request processing, milestone progress updates, & bank payout tracking.
5. **Admin Console**: User verification queue & audit log oversight.

---

## 3. Account Deletion & Legal Compliance Status

| Compliance Requirement | Implementation Status | Action Required / Release Dependency |
| :--- | :--- | :--- |
| **Privacy Policy Link** | `https://dbc.in/privacy` (Configured in footer/settings) | External Legal Approval Required |
| **Terms of Service Link** | `https://dbc.in/terms` (Configured in footer/settings) | External Legal Approval Required |
| **Account Deletion Flow** | `Backend Account Deletion API = NOT YET IMPLEMENTED` | **STORE RELEASE DEPENDENCY** (Must implement backend deletion endpoint prior to Apple App Store submission) |
| **Support Contact Email** | `support@dbc.in` (Configured in Help Center) | Operational Inbox Active |

---

## 4. External Dependencies Summary

```text
Apple Developer Account:        REQUIRED FOR IOS RELEASE
Google Play Console Account:    REQUIRED FOR ANDROID RELEASE
Signing Certificates & Keys:     REQUIRED FOR NATIVE APK/IPA
Push Notification Providers:    FCM / APNs PROD CREDENTIALS REQUIRED
Production Payment Credentials: RAZORPAY PROD KEYS REQUIRED
Account Deletion Endpoint:      BACKEND IMPLEMENTATION REQUIRED
```
