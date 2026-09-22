# DBC Mobile API Contracts & Client Integration Specification

## 1. API Endpoint Inventory

### Authentication Endpoints (`/api/auth`)
- `POST /api/auth/login`: Verify user credentials and return JWT access token.
- `POST /api/auth/register`: Register new customer or provider account.
- `POST /api/auth/refresh`: Exchange refresh token for a new access token.
- `POST /api/auth/logout`: Invalidate active session.
- `GET /api/auth/me`: Fetch authenticated user profile details.

### Customer & Request Endpoints (`/api/bookings`, `/api/requirements`)
- `POST /api/bookings`: Create a direct project request to a professional.
- `GET /api/bookings/my`: List all project requests associated with the logged-in customer.
- `GET /api/bookings/:id`: Fetch specific request details.
- `PATCH /api/bookings/:id/cancel`: Cancel an active project request.
- `POST /api/requirements`: Post a public marketplace requirement lead.
- `GET /api/requirements/my`: List marketplace requirements posted by the customer.

### Professional & Lead Endpoints (`/api/provider`, `/api/requirements`)
- `GET /api/requirements`: Search and filter open marketplace leads.
- `PATCH /api/provider/bookings/:id/accept`: Accept an inbound project request.
- `PATCH /api/provider/bookings/:id/reject`: Decline an inbound project request.
- `PATCH /api/provider/bookings/:id/start`: Change booking status to `IN_PROGRESS`.
- `PATCH /api/provider/bookings/:id/complete`: Change booking status to `COMPLETED`.

### Proposal & Quotation Endpoints (`/api/quotations`)
- `POST /api/quotations`: Submit a detailed quotation proposal with scope and milestone breakdowns.
- `GET /api/quotations/:id`: Retrieve quotation details.
- `GET /api/quotations/requirement/:reqId`: List quotations submitted for a specific requirement.
- `PUT /api/quotations/:id/status`: Accept or reject a quotation proposal.

### Project & Milestone Endpoints (`/api/projects`)
- `GET /api/projects`: List active and historical projects.
- `GET /api/projects/:id`: Retrieve project execution workspace details.
- `GET /api/projects/:id/milestones`: List project milestone tracking progress.
- `POST /api/projects/:id/milestones`: Create a new project milestone.
- `PATCH /api/projects/:id/milestones/:mId`: Update milestone progress or mark complete.
- `POST /api/projects/:id/documents`: Upload a project drawing or contract document.
- `GET /api/projects/:id/documents`: Fetch project document repository.

### Messaging Endpoints (`/api/chat`)
- `GET /api/chat/threads`: List active messaging threads.
- `GET /api/chat/threads/:id/messages`: Retrieve chat message history.
- `POST /api/chat/threads/:id/messages`: Send a message or attachment.

### Reviews & Subscriptions (`/api/reviews`, `/api/subscriptions`)
- `POST /api/reviews`: Submit customer feedback rating and review.
- `GET /api/subscriptions/my`: Retrieve active provider subscription tier details.

---

## 2. Authentication Contract

- **Header Specification**: All protected requests require an HTTP Authorization header:
  `Authorization: Bearer <access_token>`
- **Token Management**:
  - `axiosClient.ts` handles automatic bearer header injection.
  - Refresh subscriber queue intercepts HTTP `401 Unauthorized` status and exchanges refresh tokens automatically.
- **Mobile Integration Recommendation**:
  - Secure store native adapters (`AsyncStorage` / `FlutterSecureStorage` / `Keychain` / `Keystore`) store tokens safely on mobile devices.

---

## 3. Error Response Contract

Standardized JSON error payload:
```json
{
  "message": "Error description text",
  "status": 400,
  "errors": {
    "field": "Specific validation constraint failure"
  }
}
```

### HTTP Status Code Handling
- `400 Bad Request`: Payload validation failure or invalid parameter.
- `401 Unauthorized`: Missing, expired, or invalid JWT token. Triggers auto-refresh flow.
- `403 Forbidden`: Role permission mismatch (e.g. customer attempting provider-only action).
- `404 Not Found`: Requested project, booking, or quotation ID does not exist.
- `409 Conflict`: Duplicate registration email or conflicting state transition.
- `500 Internal Error`: Unexpected server failure.

---

## 4. Validation Contract

### Booking Request (`POST /api/bookings`)
- `providerId` (String, Required): Target provider identifier.
- `categoryId` (Number, Required): Service category identifier.
- `city` (String, Required): Project location city.
- `preferredDate` (String YYYY-MM-DD, Required): Requested project start date.
- `estimatedBudget` (Number, Optional): Target budget limit.
- `notes` (String, Optional): Scope description details.

### Quotation Submission (`POST /api/quotations`)
- `requirementId` (String, Required): Associated requirement lead ID.
- `totalAmount` (Number, Required): Total project price.
- `scopeOfWork` (String, Required): Deliverables text description.
- `milestones` (Array, Required): List of milestone breakdowns `[{ title, amount, targetDate }]`.

---

## 5. Date & Time Contract

- **Timestamps**: All server timestamps use standard ISO 8601 UTC strings:
  `YYYY-MM-DDTHH:mm:ss.sssZ` (e.g., `2026-09-22T10:30:00.000Z`).
- **Target Dates**: Milestone dates and booking dates use ISO date format `YYYY-MM-DD`.

---

## 6. Monetary & Financial Contract

- **Currency**: All monetary values are represented as positive numbers in INR (`₹`).
- **Escrow Fee**: DBC Platform Escrow Verification Fee is calculated at **1%** of milestone value.
- **Taxes**: GST on platform fee is calculated at **18%**.
- **Calculations**: Monetary calculations are server-authoritative; mobile clients render server-provided breakdown values.

---

## 7. Pagination & Filtering Contract

- **Pagination Parameters**: `limit` (default: 20, max: 100), `offset` (default: 0).
- **Search Parameters**: `q` (search term keyword), `city` (location filter), `categoryId` (service category ID), `collarFilter` (`WHITE_COLLAR` vs `BLUE_COLLAR`).

---

## 8. File & Document Upload Contract

- **Multipart Upload**: `POST /api/projects/:id/documents` uses `multipart/form-data`.
- **Form Fields**: `file` (Binary document), `category` (`Blueprints`, `Contracts`, `Invoices`, `SitePhotos`), `description` (String).
- **Response**: Returns document metadata object with permanent file download URL.

---

## 9. Project Lifecycle State Machine

```text
  Customer Request         Provider Review            Project Execution            Handover & Warranty
┌─────────────────┐       ┌─────────────────┐       ┌───────────────────┐       ┌────────────────────┐
│    REQUESTED    │ ────> │    ACCEPTED     │ ────> │    IN_PROGRESS    │ ────> │     COMPLETED      │
└─────────────────┘       └─────────────────┘       └───────────────────┘       └────────────────────┘
         │                         │                          │
         ▼                         ▼                          │
    CANCELLED                   REJECTED                      ▼
                                                        Project Closed
```

---

## 10. Role / Permission Matrix

| Endpoint Domain | Customer | Professional / Provider | Admin |
| :--- | :---: | :---: | :---: |
| `GET /api/bookings/my` | **Own Bookings** | **Assigned Requests** | **All Bookings** |
| `POST /api/bookings` | **Allowed** | Forbidden | Allowed |
| `PATCH /api/provider/bookings/:id/*` | Forbidden | **Allowed (Assigned)** | Allowed |
| `POST /api/quotations` | Forbidden | **Allowed** | Allowed |
| `PUT /api/quotations/:id/status` | **Allowed (Own)** | Forbidden | Allowed |
| `GET /api/projects/:id` | **Allowed (Participant)** | **Allowed (Participant)** | **Allowed** |
| `POST /api/projects/:id/milestones` | Forbidden | **Allowed** | Allowed |

---

## 11. Mobile Client Readiness Classification

- **`POST /api/auth/login`**: **READY**
- **`POST /api/auth/register`**: **READY**
- **`POST /api/bookings`**: **READY**
- **`GET /api/bookings/my`**: **READY**
- **`PATCH /api/provider/bookings/:id/accept`**: **READY**
- **`POST /api/quotations`**: **READY**
- **`GET /api/projects/:id`**: **READY**
- **`POST /api/projects/:id/documents`**: **READY WITH CLIENT ADAPTATION** (Native file picker integration required).
- **`GET /api/chat/threads/:id/messages`**: **READY**

---

## 12. Conclusion & Status

The DBC API contract is well-structured, RESTful, and fully decoupled from web presentation code. Native Android and iOS mobile applications can consume these endpoints directly.

**STATUS: MOBILE API CONTRACT READY FOR NATIVE CLIENT PLANNING**
