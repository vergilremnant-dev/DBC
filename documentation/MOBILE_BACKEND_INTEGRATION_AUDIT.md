# DBC Mobile ↔ Backend Integration & API Contract Audit

> [!NOTE]
> This document presents the complete integration audit matrix and verification findings between the **DBC Native Mobile Application (`mobile/src/`)** and the authoritative **DBC Express Backend API (`api-lib/app.ts` & `api-lib/routes/`)**.

---

## 1. Core Audit Principle & Scope

The existing backend implementation (`api-lib/app.ts`) is treated as the **authoritative source of truth** for API routes, HTTP methods, request payloads, response structures, authentication mechanisms, role authorization rules, financial values, and lifecycle status enums.

Mobile service layers in `mobile/src/services/` were audited against the actual backend route handlers to ensure zero fabricated backend endpoints and complete contract alignment.

---

## 2. Comprehensive Integration Matrix

| Mobile Feature | Mobile Service | Backend Endpoint | Method | Auth | Role | Request Shape | Response Shape | Integration Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **User Login** | `mobileAuthService` | `/api/auth/login` | POST | Public | Any | `{ email, password }` | `{ token, user }` | **VERIFIED** | Auth token returned in response |
| **User Registration** | `mobileAuthService` | `/api/auth/register` | POST | Public | Customer / Contractor | `{ email, password, name, role, phone }` | `{ success, user }` | **VERIFIED** | Role mapped via `resolveUserRole` |
| **Send Email OTP** | `mobileAuthService` | `/api/auth/send-email-otp` | POST | Public | Any | `{ email }` | `{ success, message }` | **VERIFIED** | Triggers 6-digit email OTP |
| **Verify Email OTP** | `mobileAuthService` | `/api/auth/verify-email-otp` | POST | Public | Any | `{ email, code }` | `{ success, token, user }` | **VERIFIED** | Verified against backend session |
| **Session Refresh** | `mobileAuthStore` | `/api/auth/refresh` | POST | Token | Any | `{ refreshToken }` | `{ token }` | **VERIFIED** | Renews active JWT bearer token |
| **User Logout** | `mobileAuthStore` | `/api/auth/logout` | POST | Token | Any | `{}` | `{ success: true }` | **VERIFIED** | Clears session token & server cookie |
| **Customer Profile** | `mobileProfileService` | `/api/customer/profile` | GET / PUT | Token | Customer | `{ name, phone, address, city }` | `{ profile }` | **VERIFIED** | Scoped to authenticated customer |
| **Contractor Profile** | `mobileProfileService` | `/api/contractor/profile` | GET / PUT | Token | Contractor | `{ name, phone, trade, bio, experience }` | `{ profile }` | **VERIFIED** | Scoped to authenticated contractor |
| **Profile Photo Upload**| `mobileProfileService` | `/api/profile/upload` | POST | Token | Any | `FormData (file)` | `{ url, success: true }` | **VERIFIED** | Uploads image attachment |
| **Category List** | `mobileMarketplaceService`| `/api/categories` | GET | Public | Any | Query: `{ limit, offset }` | `{ categories: [] }` | **VERIFIED** | Supports pagination parameters |
| **Search Professionals**| `mobileMarketplaceService`| `/api/search/providers` | GET | Public | Any | Query: `{ q, category, city }` | `{ providers: [] }` | **VERIFIED** | Public contractor discovery |
| **Create Request** | `mobileRequestService` | `/api/requirements` | POST | Token | Customer | `{ title, category, city, details }` | `{ requirement: { id, status } }` | **VERIFIED** | Backend assigns `REQUESTED` status |
| **My Requests** | `mobileRequestService` | `/api/requirements/my` | GET | Token | Customer | Query: `{ limit, offset, status }` | `{ requirements: [] }` | **VERIFIED** | Returns customer request feed |
| **Request Details** | `mobileRequestService` | `/api/requirements/:id` | GET / PUT | Token | Customer / Admin | `{ details, budget }` | `{ requirement }` | **VERIFIED** | Detail lookup & update |
| **Request Status** | `mobileRequestService` | `/api/requirements/:id/status` | PUT | Token | Customer / Contractor | `{ status: "CANCELLED" \| "ACCEPTED" }` | `{ requirement }` | **VERIFIED** | Lifecycle status transition |
| **Create Quotation** | `mobileProfessionalQuotationService` | `/api/quotations` | POST | Token | Contractor | `{ requirementId, totalAmount, milestones }` | `{ quotation: { id, status } }` | **VERIFIED** | Initial proposal in `SUBMITTED` state |
| **List Quotations** | `mobileProfessionalQuotationService` | `/api/quotations` | GET | Token | Customer / Contractor | Query: `{ requirementId, status }` | `{ quotations: [] }` | **VERIFIED** | Scoped by requirement or user |
| **Quotation Details** | `mobileProfessionalQuotationService` | `/api/quotations/:id` | GET | Token | Customer / Contractor | `{}` | `{ quotation, milestones }` | **VERIFIED** | Includes breakdown & milestones |
| **Update Quotation Status**| `mobileProfessionalQuotationService` | `/api/quotations/:id/status` | PUT | Token | Customer / Contractor | `{ status: "ACCEPTED" \| "REJECTED" }` | `{ quotation }` | **VERIFIED** | Customer accepts/rejects proposal |
| **Revise Quotation** | `mobileProfessionalQuotationService` | `/api/quotations/:id/revise` | POST | Token | Contractor | `{ totalAmount, milestones }` | `{ quotation }` | **VERIFIED** | Creates revised proposal version |
| **List Projects** | `mobileCustomerWorkspaceService` | `/api/projects` | GET | Token | Customer / Contractor | Query: `{ limit, offset, status }` | `{ projects: [] }` | **VERIFIED** | Scoped active project feed |
| **Project Details** | `mobileProjectExecutionService` | `/api/projects/:id` | GET / PUT | Token | Customer / Contractor | `{ progress, notes }` | `{ project }` | **VERIFIED** | Returns project overview |
| **Project Milestones**| `mobileProjectExecutionService` | `/api/projects/:id/milestones` | GET / POST / PUT | Token | Customer / Contractor | `{ title, amount, status }` | `{ milestones: [] }` | **VERIFIED** | Milestone list & status updates |
| **Project Approvals** | `mobileProjectExecutionService` | `/api/projects/:id/approvals` | POST | Token | Customer | `{ milestoneId, approved: true }` | `{ milestone, success }` | **VERIFIED** | Customer milestone sign-off |
| **Project Documents** | `mobileProjectExecutionService` | `/api/projects/:id/documents` | GET / POST | Token | Customer / Contractor | `FormData (file)` | `{ documents: [] }` | **VERIFIED** | Document upload & listing |
| **Subscriptions/Payments**| `mobileCustomerFinancialService` | `/api/subscriptions/plans` | GET | Token | Any | `{}` | `{ plans: [] }` | **VERIFIED** | Payment plan discovery |
| **Create Payment Order**| `mobileCustomerFinancialService` | `/api/subscriptions/create-order` | POST | Token | Customer | `{ planId, amount }` | `{ orderId, key }` | **VERIFIED** | Payment gateway initiation |
| **Verify Payment** | `mobileCustomerFinancialService` | `/api/subscriptions/verify-payment` | POST | Token | Customer | `{ orderId, paymentId, signature }` | `{ success: true, receipt }` | **VERIFIED** | Backend payment verification |
| **Conversations List**| `mobileCustomerMessagingService` | `/api/conversations` | GET / POST | Token | Customer / Contractor | `{ participantId, projectId }` | `{ conversations: [] }` | **VERIFIED** | Thread list or thread creation |
| **Conversation Messages**| `mobileCustomerMessagingService` | `/api/conversations/:id/messages` | GET / POST | Token | Customer / Contractor | `{ text, attachments }` | `{ messages: [] }` | **VERIFIED** | In-app messaging & pagination |
| **Mark Messages Read**| `mobileCustomerMessagingService` | `/api/conversations/:id/read` | POST | Token | Customer / Contractor | `{ messageIds }` | `{ success: true }` | **VERIFIED** | Read receipt update |
| **Admin User List** | `mobileAdminWorkspaceService` | `/api/admin/users` | GET | Token | Admin | Query: `{ limit, offset, role }` | `{ users: [], total }` | **VERIFIED** | Admin user directory |
| **Admin Update User** | `mobileAdminWorkspaceService` | `/api/admin/users/:id` | PATCH | Token | Admin | `{ status: "ACTIVE" \| "SUSPENDED" }` | `{ user }` | **VERIFIED** | User account state toggle |
| **Admin Provider List**| `mobileAdminWorkspaceService` | `/api/admin/providers` | GET | Token | Admin | Query: `{ status, verified }` | `{ providers: [], total }` | **VERIFIED** | Admin contractor verification |
| **Admin Analytics** | `mobileAdminWorkspaceService` | `/api/admin/analytics/overview` | GET | Token | Admin | `{}` | `{ stats: {} }` | **VERIFIED** | Operational platform metrics |

---

## 3. Financial API Integrity Audit Findings

All financial calculations (quotation totals, milestone costs, payment verification, transaction receipts) are strictly **backend-authoritative**:
- `totalAmount`, `amount`, and `milestone_amount` are returned directly from the backend API response and rendered in the mobile UI via safe currency formatters (`formatCurrency`).
- The mobile application performs **zero authoritative calculation** of platform fees, brokerage rates, taxes, or total payable amounts.
- Payment confirmation requires explicit backend transaction receipts (`verify-payment` endpoint returning `orderId` and signature verification). `HTTP 200` alone is never treated as payment settlement.

---

## 4. Fabricated / Mock Data Audit Results

A comprehensive audit of `mobile/src/` confirmed:
- **Production Code**: **ZERO** fabricated, fallback, or dummy business data records exist in any production mobile screen, component, or service layer.
- **Test Fixtures**: Mock data objects in `tests/frontend/*.test.ts` are strictly isolated within automated test files for Vitest execution.

---

## 5. Environment & CORS Production Connectivity

- **HTTPS Protocol Assertion**: Enforced in `mobile/src/config/environmentValidation.ts` (`assertValidEnvironmentConfig()`). Production API URLs must use `https://`.
- **Localhost Guard**: Throws an explicit `EnvironmentValidationError` if production environment configuration points to `localhost` or `127.0.0.1`.
- **CORS Alignment**: Backend Express app configures CORS headers allowing authorized origin domains (`app.dbc.in`, `dbc.in`) while prohibiting wildcards (`*`) on credentialed routes.
