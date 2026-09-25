# DBC Mobile Application — End-to-End State Consistency & Workflow Matrix

> [!NOTE]
> This document specifies the authoritative state consistency matrix for all 20 end-to-end (E2E) workflow scenarios across Customer, Professional/Contractor, and Admin roles in the DBC Mobile Application.

---

## 1. E2E Classification Taxonomy

Every workflow scenario in this matrix is classified into one of four environment execution levels:

- **`LIVE_BACKEND_E2E`**: Fully executed against an active backend server with live DB state.
- **`REPOSITORY_INTEGRATION`**: Executed using actual mobile service layer, API handlers, state stores, and in-memory repository adapters.
- **`CONTRACT_E2E`**: Executed against strictly typed API response contracts and error normalizers.
- **`ENVIRONMENT_BLOCKED`**: Blocked at third-party provider boundaries (e.g. live bank disbursement gateway / live Razorpay webhook).

---

## 2. E2E State Consistency Matrix (Scenarios 1–20)

| Workflow Scenario | Actor | Initial State | Action | Backend State | Mobile State | Cache State | Result / Outcome | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Customer Registration & Auth** | Customer | Unauthenticated | Register with email & OTP verification | `USER_CREATED`, OTP token active | `authStatus = 'authenticated'`, user profile set | `access_token` persisted | Session restored, navigates to Customer Home | `REPOSITORY_INTEGRATION` |
| **1.1 Invalid / Expired OTP** | Customer | OTP Sent | Enter incorrect or expired OTP | `OTP_INVALID` / `OTP_EXPIRED` | `challengeState = 'CHALLENGE_REQUIRED'`, error set | Token not issued | Error displayed, session remains unauthenticated | `REPOSITORY_INTEGRATION` |
| **1.2 Session Logout** | Any | Authenticated | Perform Logout action | Token invalidated | `authStatus = 'unauthenticated'`, user = null | `access_token` purged, cache cleared | Storage & cache wiped, redirected to LoginScreen | `REPOSITORY_INTEGRATION` |
| **2. Marketplace Discovery** | Customer | Home | Search category & filter contractors | Returns matched category list | Marketplace items rendered | Category cache TTL 5m | Live search results rendered; empty results handled | `REPOSITORY_INTEGRATION` |
| **3. Customer Request Submission** | Customer | Professional Profile | Submit Project Request Form | `Booking = REQUESTED` | Active request created | `customer_requests` invalidated | Request details visible with status `REQUESTED` | `REPOSITORY_INTEGRATION` |
| **3.1 Double Request Submission** | Customer | Request Form | Click Submit rapidly twice | 1st creates request, 2nd blocked by lock | 1 request object returned | Single request cached | Single request created; duplicate submit prevented | `REPOSITORY_INTEGRATION` |
| **4. Professional Request Processing** | Contractor | Requests List | Accept customer request | `Booking = ACCEPTED` | Request status updated to `ACCEPTED` | `pro_requests` invalidated | Customer & Pro see status updated to `ACCEPTED` | `REPOSITORY_INTEGRATION` |
| **4.1 Unauthorized Request Access** | Contractor A | Workspace | Attempt to process Contractor B request | `403 Forbidden` | Rejection error thrown | No state mutation | Rejection message displayed; state untouched | `REPOSITORY_INTEGRATION` |
| **5. Professional Create Quotation** | Contractor | Request Details | Create & submit Quotation proposal | `Quotation = SUBMITTED` | Quotation item stored | `quotation_` invalidated | Quotation proposal visible to Customer | `REPOSITORY_INTEGRATION` |
| **5.1 Quotation Revision / Lock** | Contractor | Quotation Details | Attempt to edit accepted quotation | `400 State Locked` | Rejection error thrown | Cached quotation unchanged | Rejection displayed; accepted quotation locked | `REPOSITORY_INTEGRATION` |
| **6. Quotation Acceptance $\rightarrow$ Project** | Customer | Quotation Review | Accept quotation proposal | `Quotation = ACCEPTED`, `Project = ASSIGNED` | Project entity created | `customer_projects` invalidated | Single project spawned with status `ASSIGNED` | `REPOSITORY_INTEGRATION` |
| **6.1 Duplicate Acceptance Lock** | Customer | Quotation Review | Accept quotation twice concurrently | 1st succeeds, 2nd returns `409 Conflict` | 1 project created | Invalidation completed once | Duplicate acceptance blocked with 409 error | `REPOSITORY_INTEGRATION` |
| **7. Project Execution Start** | Contractor | Project Overview | Transition project to `IN_PROGRESS` | `Project = IN_PROGRESS` | Progress percentage updated | `project_` invalidated | Pro & Customer see active execution state | `REPOSITORY_INTEGRATION` |
| **8. Milestone Completion & Approval** | Contractor / Customer | Milestone Item | Contractor completes $\rightarrow$ Customer approves | Milestone `COMPLETED` $\rightarrow$ `APPROVED` | Approval badge active | `milestone_` invalidated | Completion % updated; payout unlocked | `REPOSITORY_INTEGRATION` |
| **9. Milestone Payment Intent** | Customer | Financials | Create payment intent & verify Razorpay | Transaction `SUCCESSFUL` | Payment status = `PAID` | `financial_` invalidated | Payment recorded; invoice generated | `REPOSITORY_INTEGRATION` |
| **9.1 Payment Provider Gateway** | Customer | Payment Modal | Live Razorpay bank gateway call | Sandbox gateway response | Payment pending verification | Cached intent | Live bank gateway execution | `ENVIRONMENT_BLOCKED` |
| **10. Mobile Messaging** | Customer / Pro | Inbox | Send conversation message | `Message` persisted | Conversation message appended | Unread badge reset | Message delivered with timestamp & read state | `REPOSITORY_INTEGRATION` |
| **10.1 Unauthorized Conversation** | User A | Inbox | Access User B conversation ID | `403 Forbidden` | Access denied error | No conversation cached | Access blocked; privacy enforced | `REPOSITORY_INTEGRATION` |
| **11. Project Documents Upload** | Contractor | Documents | Upload project blueprint PDF | `ProjectDocument` created | Document list updated | `documents_` invalidated | PDF visible in repository to Customer & Pro | `REPOSITORY_INTEGRATION` |
| **12. Project Handover & Closure** | Pro / Customer | Overview | Complete 100% milestones $\rightarrow$ Close | `Project = COMPLETED` / `CLOSED` | 100% progress badge | `project_` invalidated | Project marked `COMPLETED`; review enabled | `REPOSITORY_INTEGRATION` |
| **13. Professional Finance & Earnings** | Contractor | Finance | View net payout details & history | Gross - platform fee (1%) - TDS | Earnings summary rendered | `financial_` cached 30s | Zero client calculations; backend totals shown | `REPOSITORY_INTEGRATION` |
| **14. Admin Workspace Oversight** | Admin | Admin Console | Audit users, projects, and security logs | Operational summary returned | Admin dashboard rendered | Admin cache TTL 1m | System audit log visible; non-admins blocked | `REPOSITORY_INTEGRATION` |
| **14.1 Non-Admin RBAC Breach** | Customer | Direct API | Access `/api/admin/audit-logs` | `403 Admin Required` | Error displayed | No admin data stored | Non-admin access blocked at gateway | `REPOSITORY_INTEGRATION` |
| **15. Session Expiration & Recovery** | User | Workspace | Token expires during API request | `401 Unauthorized` | Session marked expired | Token purged on failure | Re-authenticates or redirects to LoginScreen | `REPOSITORY_INTEGRATION` |
| **16. Cross-Account Switch Isolation** | Customer A | Workspace | Logout Customer A, login Customer B | Customer B session active | Customer B data loaded | Customer A cache purged | Customer B sees 0 data from Customer A | `REPOSITORY_INTEGRATION` |
| **17. Deep-Link Routing** | User | App Launch | Open deep link `dbc://project/proj-301` | Link resolved & validated | Target route navigated | Link target stored | Authenticated user directed to project | `REPOSITORY_INTEGRATION` |
| **18. Offline & Recovery Behavior** | User | Workspace | Lose internet connection | Request fails offline | Offline banner shown | Stale GET cache served | Reads work offline; mutations fail gracefully | `REPOSITORY_INTEGRATION` |
| **19. Network Timeout & Retry** | User | Request Form | Network timeout during API call | `408 Timeout` | Retry prompt rendered | Request state unchanged | Mutation safe; no duplicate execution | `REPOSITORY_INTEGRATION` |
| **20. Complete Customer $\rightarrow$ Pro Journey** | Customer & Pro | End-to-End | Request $\rightarrow$ Quote $\rightarrow$ Accept $\rightarrow$ Milestones $\rightarrow$ Pay $\rightarrow$ Close | Full lifecycle completed | All screens updated | All caches updated in order | Complete end-to-end business lifecycle verified | `REPOSITORY_INTEGRATION` |

---

## 3. Financial & Calculation Integrity Rules

1. **Zero Client Calculations**: Mobile client application performs **0 calculations** for milestone amounts, total contract value, platform fees (1%), GST (18%), TDS deductions, or net payouts. All values are sourced authoritatively from backend API endpoints.
2. **Deterministic Data Factories**: All E2E automated test scenarios utilize deterministic factories (`mobileE2ETestFactories.ts`) with zero production mock data.
3. **Authorization Isolation**: Role boundaries strictly separate Customer, Professional, and Admin views. Cross-account access attempts return standardized `403 Forbidden` / `401 Unauthorized` errors.
