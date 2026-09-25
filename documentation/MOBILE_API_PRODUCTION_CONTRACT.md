# DBC Mobile Production API Contract Documentation

> [!NOTE]
> This document serves as the authoritative production API contract reference for the **DBC Mobile Application**. All paths, methods, headers, schemas, error codes, and authorization rules reflect the verified implementation in `api-lib/app.ts`.

---

## 1. Authentication Endpoints

### 1.1 Login
- **METHOD**: `POST`
- **PATH**: `/api/auth/login`
- **AUTHENTICATION**: None (Public)
- **ROLE**: Any
- **REQUEST BODY**:
  ```json
  {
    "email": "user@example.com",
    "password": "SecretPassword123"
  }
  ```
- **RESPONSE BODY** (200 OK):
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr-1001",
      "email": "user@example.com",
      "name": "Jane Customer",
      "role": "customer"
    }
  }
  ```
- **ERRORS**: `400 Bad Request` (Missing fields), `401 Unauthorized` (Invalid credentials), `500 Internal Server Error`.
- **NOTES**: Sets HTTP-only cookie and returns JWT bearer token.

### 1.2 Registration
- **METHOD**: `POST`
- **PATH**: `/api/auth/register`
- **AUTHENTICATION**: None (Public)
- **ROLE**: Any
- **REQUEST BODY**:
  ```json
  {
    "email": "contractor@example.com",
    "password": "Password123!",
    "name": "Apex Builders",
    "role": "contractor",
    "phone": "+919876543210"
  }
  ```
- **RESPONSE BODY** (201 Created):
  ```json
  {
    "success": true,
    "user": {
      "id": "usr-2002",
      "email": "contractor@example.com",
      "name": "Apex Builders",
      "role": "contractor"
    }
  }
  ```
- **ERRORS**: `400 Bad Request` (Validation error), `409 Conflict` (Email already registered).

### 1.3 Send Email OTP
- **METHOD**: `POST`
- **PATH**: `/api/auth/send-email-otp`
- **AUTHENTICATION**: None (Public)
- **ROLE**: Any
- **REQUEST BODY**: `{ "email": "user@example.com" }`
- **RESPONSE BODY** (200 OK): `{ "success": true, "message": "OTP sent successfully" }`
- **ERRORS**: `400 Bad Request`, `429 Too Many Requests`.

### 1.4 Verify Email OTP
- **METHOD**: `POST`
- **PATH**: `/api/auth/verify-email-otp`
- **AUTHENTICATION**: None (Public)
- **ROLE**: Any
- **REQUEST BODY**: `{ "email": "user@example.com", "code": "654321" }`
- **RESPONSE BODY** (200 OK): `{ "success": true, "token": "JWT...", "user": { ... } }`
- **ERRORS**: `400 Bad Request` (Invalid or expired OTP).

---

## 2. Profile Endpoints

### 2.1 Customer Profile
- **METHOD**: `GET`, `PUT`
- **PATH**: `/api/customer/profile`
- **AUTHENTICATION**: Bearer Token
- **ROLE**: Customer
- **REQUEST BODY** (PUT): `{ "name": "Jane Customer", "phone": "+919876543210", "city": "Bangalore" }`
- **RESPONSE BODY** (200 OK): `{ "profile": { ... } }`
- **ERRORS**: `401 Unauthorized`, `403 Forbidden`.

### 2.2 Contractor Profile
- **METHOD**: `GET`, `PUT`
- **PATH**: `/api/contractor/profile`
- **AUTHENTICATION**: Bearer Token
- **ROLE**: Contractor
- **REQUEST BODY** (PUT): `{ "name": "Apex Construction", "trade": "General Building", "experience": 10 }`
- **RESPONSE BODY** (200 OK): `{ "profile": { ... } }`
- **ERRORS**: `401 Unauthorized`, `403 Forbidden`.

---

## 3. Marketplace Endpoints

### 3.1 Category Listing
- **METHOD**: `GET`
- **PATH**: `/api/categories`
- **AUTHENTICATION**: None (Public)
- **QUERY PARAMS**: `limit` (default 20), `offset` (default 0)
- **RESPONSE BODY** (200 OK): `{ "categories": [ { "id": "cat-1", "name": "Structural Engineering" } ] }`

### 3.2 Professional Provider Search
- **METHOD**: `GET`
- **PATH**: `/api/search/providers`
- **AUTHENTICATION**: None (Public)
- **QUERY PARAMS**: `q` (search term), `category` (category ID), `city` (location filter)
- **RESPONSE BODY** (200 OK): `{ "providers": [ { "id": "prov-1", "name": "Builder", "rating": 4.9 } ] }`

---

## 4. Project Request & Requirements Endpoints

### 4.1 Create Requirement / Request
- **METHOD**: `POST`
- **PATH**: `/api/requirements`
- **AUTHENTICATION**: Bearer Token
- **ROLE**: Customer
- **REQUEST BODY**:
  ```json
  {
    "title": "2-Story Villa Construction",
    "category": "Construction",
    "city": "Hyderabad",
    "details": "Full turnkey construction requirement"
  }
  ```
- **RESPONSE BODY** (201 Created): `{ "requirement": { "id": "req-501", "status": "REQUESTED" } }`

### 4.2 Customer Requirements Feed
- **METHOD**: `GET`
- **PATH**: `/api/requirements/my`
- **AUTHENTICATION**: Bearer Token
- **ROLE**: Customer
- **QUERY PARAMS**: `limit`, `offset`, `status`
- **RESPONSE BODY** (200 OK): `{ "requirements": [ ... ] }`

---

## 5. Quotation Endpoints

### 5.1 Create Quotation Proposal
- **METHOD**: `POST`
- **PATH**: `/api/quotations`
- **AUTHENTICATION**: Bearer Token
- **ROLE**: Contractor
- **REQUEST BODY**:
  ```json
  {
    "requirementId": "req-501",
    "totalAmount": 1500000,
    "milestones": [
      { "title": "Foundation & Excavation", "amount": 300000, "targetDays": 30 }
    ]
  }
  ```
- **RESPONSE BODY** (201 Created): `{ "quotation": { "id": "q-100", "status": "SUBMITTED" } }`

### 5.2 Update Quotation Status (Accept/Reject)
- **METHOD**: `PUT`
- **PATH**: `/api/quotations/:id/status`
- **AUTHENTICATION**: Bearer Token
- **ROLE**: Customer / Contractor
- **REQUEST BODY**: `{ "status": "ACCEPTED" }`
- **RESPONSE BODY** (200 OK): `{ "quotation": { "id": "q-100", "status": "ACCEPTED" } }`

---

## 6. Project & Execution Endpoints

### 6.1 List Active Projects
- **METHOD**: `GET`
- **PATH**: `/api/projects`
- **AUTHENTICATION**: Bearer Token
- **ROLE**: Customer / Contractor
- **QUERY PARAMS**: `limit`, `offset`, `status`
- **RESPONSE BODY** (200 OK): `{ "projects": [ ... ] }`

### 6.2 Project Milestones
- **METHOD**: `GET`, `POST`, `PUT`
- **PATH**: `/api/projects/:id/milestones`
- **AUTHENTICATION**: Bearer Token
- **ROLE**: Customer / Contractor
- **RESPONSE BODY** (200 OK): `{ "milestones": [ ... ] }`

---

## 7. Payments & Subscriptions Endpoints

### 7.1 Subscription Plans
- **METHOD**: `GET`
- **PATH**: `/api/subscriptions/plans`
- **AUTHENTICATION**: Bearer Token
- **RESPONSE BODY** (200 OK): `{ "plans": [ ... ] }`

### 7.2 Create Payment Order
- **METHOD**: `POST`
- **PATH**: `/api/subscriptions/create-order`
- **AUTHENTICATION**: Bearer Token
- **ROLE**: Customer
- **REQUEST BODY**: `{ "planId": "plan-pro", "amount": 5000 }`
- **RESPONSE BODY** (200 OK): `{ "orderId": "order_xyz", "amount": 5000, "key": "rzp_live_..." }`

### 7.3 Verify Payment Signature
- **METHOD**: `POST`
- **PATH**: `/api/subscriptions/verify-payment`
- **AUTHENTICATION**: Bearer Token
- **ROLE**: Customer
- **REQUEST BODY**: `{ "orderId": "order_xyz", "paymentId": "pay_abc", "signature": "sig_123" }`
- **RESPONSE BODY** (200 OK): `{ "success": true, "receipt": { "txnId": "txn_99" } }`

---

## 8. Messaging & Chat Endpoints

### 8.1 List / Create Conversations
- **METHOD**: `GET`, `POST`
- **PATH**: `/api/conversations` (or `/api/chat/conversations`)
- **AUTHENTICATION**: Bearer Token
- **ROLE**: Customer / Contractor
- **RESPONSE BODY** (200 OK): `{ "conversations": [ ... ] }`

### 8.2 Get / Send Messages
- **METHOD**: `GET`, `POST`
- **PATH**: `/api/conversations/:id/messages` (or `/api/chat/messages`)
- **AUTHENTICATION**: Bearer Token
- **ROLE**: Customer / Contractor
- **REQUEST BODY** (POST): `{ "text": "Hello, when can we start?" }`
- **RESPONSE BODY** (200 OK): `{ "message": { "id": "msg-1", "text": "..." } }`

---

## 9. Admin Operational Endpoints

### 9.1 User Directory
- **METHOD**: `GET`, `PATCH`, `DELETE`
- **PATH**: `/api/admin/users` (or `/api/admin/users/:id`)
- **AUTHENTICATION**: Bearer Token
- **ROLE**: Admin
- **RESPONSE BODY** (200 OK): `{ "users": [ ... ], "total": 100 }`

### 9.2 Provider Verification Directory
- **METHOD**: `GET`
- **PATH**: `/api/admin/providers`
- **AUTHENTICATION**: Bearer Token
- **ROLE**: Admin
- **RESPONSE BODY** (200 OK): `{ "providers": [ ... ], "total": 50 }`

---

## 10. Standard Error & Pagination Specifications

### Error Structure
All API error responses adopt the normalized error DTO:
```json
{
  "code": "ERROR_CODE",
  "message": "User-safe error description",
  "status": 400
}
```

### Pagination Standard
- Offset pagination: `limit` (integer, default 20) and `offset` (integer, default 0).
- Timestamps: ISO-8601 strings (`2026-09-25T14:30:00.000Z`).
