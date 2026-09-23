# DBC Mobile Notifications, Deep Links & Event Routing Architecture (Module 46)

> [!NOTE]
> This document details the completed **Mobile Notifications, Deep Links & Event Routing Architecture** for the DBC Mobile Application (Modules 33–46). It establishes the notification domain models, notification center UI, centralized deep-link resolver, role-based authorization guards, authentication handoff, and push token abstraction boundary (FCM/APNs).

---

## 1. Executive Summary

Module 46 establishes a unified notification and event-routing infrastructure for the DBC Mobile Application. In strict alignment with pre-approved Architecture Decision Records (ADR-001 through ADR-005) and existing notification endpoints (`notificationApi`), the system connects backend activity events into structured mobile notifications, resolves deep-link targets, preserves pending targets across login redirects, enforces strict role-based access control (RBAC), and provides a deferred adapter boundary for future native FCM/APNs push delivery.

---

## 2. Architecture & Data Flow

```text
Backend Event / notificationApi
         │
         ▼
mobileNotificationService
(Maps category & priority into MobileNotification & MobileNotificationTarget)
         │
         ▼
NotificationsScreen (Notification Center)
         │  (User Taps Notification)
         ▼
mobileDeepLinkService.resolveNotificationTarget()
         │
         ▼
mobileDeepLinkService.evaluateTargetAccess()
  ├── [If Unauthenticated] ──► Sets mobileAuthStore.pendingTarget ──► AuthStack (Login/OTP)
  │                                                                       │ (Post Auth)
  │                                                                       ▼
  │                                                            Navigate to Intended Screen
  ├── [If Role Mismatch]   ──► Blocks access ──► Fallback to Role Home Screen
  └── [If Authorized]      ──► Navigates directly to target screen (e.g. QuotationDetails, Workspace)
```

---

## 3. Supported Notification Event Types & Target Mapping

### Customer Notifications
| Notification Type | Trigger / Event | Route Target | Target Params / Resource |
| :--- | :--- | :--- | :--- |
| `QUOTATION_AVAILABLE` | Contractor submitted quotation proposal | `QuotationDetails` | `{ quotationId: 101 }` |
| `QUOTATION_STATUS_CHANGED` | Quotation accepted/rejected | `QuotationDetails` | `{ quotationId: 101 }` |
| `PROJECT_MILESTONE_UPDATED` | Milestone stage completed or updated | `CustomerMilestoneDetails` | `{ projectId: 'p1', milestoneId: 'm1' }` |
| `PAYMENT_STATUS_CHANGED` | Payment invoice generated or processed | `CustomerPaymentHistory` | `{ projectId: 'p1' }` |
| `MESSAGE_RECEIVED` | New message from assigned contractor | `CustomerConversation` | `{ threadId: 't1' }` |
| `PROJECT_COMPLETION_REQUIRED` | Project completion handover request | `CustomerProjectWorkspace` | `{ projectId: 'p1' }` |

### Professional Notifications
| Notification Type | Trigger / Event | Route Target | Target Params / Resource |
| :--- | :--- | :--- | :--- |
| `NEW_PROJECT_REQUEST` | New project request assigned to contractor | `ProfessionalRequests` | `{ status: 'REQUESTED' }` |
| `QUOTATION_RESPONSE` | Customer accepted/rejected proposal | `ProfessionalQuotationDetails` | `{ quotationId: 101 }` |
| `PROJECT_MILESTONE_ACTION` | Milestone progress update required | `ProfessionalMilestoneDetails` | `{ projectId: 'p1', milestoneId: 'm1' }` |
| `PAYMENT_EARNING_UPDATE` | Milestone payment deposited | `ProfessionalFinance` | `{ tab: 'EARNINGS' }` |
| `CUSTOMER_MESSAGE` | New message from customer client | `CustomerConversation` | `{ threadId: 't1' }` |

### Admin Notifications
| Notification Type | Trigger / Event | Route Target | Target Params / Resource |
| :--- | :--- | :--- | :--- |
| `USER_REVIEW_REQUIRED` | New user or callback request assigned | `AdminUsers` | `{ role: 'ALL' }` |
| `PROVIDER_VERIFICATION_REQUIRED` | Trade partner credentials submitted | `AdminProfessionals` | `{ status: 'PENDING' }` |
| `PROJECT_OPERATION_REQUIRED` | Platform build issue or update | `AdminProjects` | `{ status: 'ALL' }` |

---

## 4. Deep-Link Resolver & URL Format

The `mobileDeepLinkService.resolveDeepLink(urlPath, role)` converts URLs and deep-link paths into structured `MobileNotificationTarget` objects:

| Path URL Format | Customer Target | Professional Target | Admin Target |
| :--- | :--- | :--- | :--- |
| `/project/proj-101` | `CustomerProjectWorkspace` | `ProfessionalProjectWorkspace` | `AdminProjects` |
| `/project/proj-101/milestones/m-1` | `CustomerMilestoneDetails` | `ProfessionalMilestoneDetails` | `AdminProjects` |
| `/project/proj-101/financials` | `CustomerProjectFinancials` | `ProfessionalProjectFinancials` | `AdminProjects` |
| `/request/req-505` | `ProjectRequestDetails` | `ProfessionalRequestDetails` | `AdminUsers` |
| `/quotation/101` | `QuotationDetails` | `ProfessionalQuotationDetails` | `AdminProjects` |
| `/messages/thread-101` | `CustomerConversation` | `CustomerConversation` | `AdminAuditLog` |
| `/admin/users/u-101` | `CustomerHome` (Blocked) | `ProfessionalHome` (Blocked) | `AdminUserDetails` |

---

## 5. Security & Authentication Handoff

1. **Unauthenticated Deep Link**:
   - If a deep link or notification is opened while unauthenticated, `mobileDeepLinkService.evaluateTargetAccess` preserves the target in `mobileAuthStore.setPendingTarget(target)` and returns `{ redirectedToAuth: true }`.
   - After user completes authentication (login/OTP), `resolvePostAuthNavigation` retrieves `pendingTarget`, routes to the intended target screen, and clears the pending target.

2. **Authorization & RBAC Enforcement**:
   - Every deep link evaluates `target.allowedRoles` against `authState.user.role`.
   - If a customer attempts to access `/admin/users/u-101`, navigation is safely blocked, returning `{ canNavigate: false, reason: 'UNAUTHORIZED_ROLE_MISMATCH', fallbackRoute: 'CustomerHome' }` without leaking confidential data or breaking the layout.

---

## 6. Push Token Architecture & Native Provider Boundary

Push token management is abstracted behind the `PushProviderAdapter` interface:
```typescript
export interface PushProviderAdapter {
  registerToken(userId: string, role: string): Promise<MobilePushTokenRegistration>;
  unregisterToken(userId: string): Promise<void>;
  onTokenRefresh(callback: (token: string) => void): void;
}
```
In the current web/PWA environment, `DeferredPushProviderAdapter` handles token calls gracefully without requiring native Android (FCM) or iOS (APNs) dependencies. Native SDKs will link into this adapter during future native mobile compilation.
