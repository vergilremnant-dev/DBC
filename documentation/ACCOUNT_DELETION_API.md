# DBC Account Deletion & Anonymization API Specification — Module 67

> [!NOTE]
> This document details the technical specification, security authorization, atomic transaction mechanics, data retention policy, PII anonymization strategy, and client integration for the **DBC Account Deletion API** (`POST /api/user/delete-account` and `DELETE /api/user/delete-account`).

---

## 1. Overview & Compliance Objective

In accordance with mobile app store privacy requirements (Apple App Store Guideline 5.1.1(v) & Google Play User Data policy) and data protection standards (DPDP Act / GDPR), the DBC platform provides an in-app Account Deletion capability.

When a user requests account deletion:
1. **Active Sessions & Tokens**: Instantly revoked and purged to block further authenticated access.
2. **PII Anonymization**: Personally Identifiable Information (name, email, phone number, address, business name) is irreversibly sanitized and scrubbed.
3. **Financial Ledger Integrity**: Transaction records, milestone payment history, tax audit logs, and project contracts are retained with anonymized identity references to preserve accounting integrity and satisfy statutory financial retention obligations.
4. **Security Audit Trail**: Account deletion actions are recorded in the central platform audit log (`global_activities`).

---

## 2. API Contract & Routing

### Endpoints
* `POST /api/user/delete-account`
* `DELETE /api/user/delete-account`

### Server File Location
* Handler: `api-lib/routes/user/delete-account.ts`
* Express Routing Entry: `api-lib/app.ts` (`app.post('/api/user/delete-account')`, `app.delete('/api/user/delete-account')`)

### Headers
```http
Authorization: Bearer <JWT_ACCESS_TOKEN>
Content-Type: application/json
```

### Request Body (Optional)
```json
{
  "userId": "usr_c12345678"
}
```
* If `userId` is omitted, the API defaults to the authenticated user's ID (`req.user.id`).

---

## 3. Authorization & Access Rules

1. **Authentication Requirement**: Requests must include a valid Bearer access token verified via `withAuth` middleware.
2. **Self-Service Deletion**: A user can delete their own account (`targetUserId === req.user.id`).
3. **Administrative Deletion**: An `ADMIN` user can trigger deletion for any user account (`req.user.role === 'ADMIN'`).
4. **Cross-User Rejection**: Non-admin users attempting to delete another user's account receive `403 Forbidden`.

---

## 4. Atomic Transaction & Data Anonymization Flow

Account deletion is executed as an isolated atomic transaction (`db.$transaction`). If any step fails, the entire transaction is rolled back.

```text
Request (Authenticated User)
           │
           ▼
Authorization Validation (Self or Admin)
           │
           ▼
Begin Database Transaction
           │
           ├── 1. Delete user active sessions (userSession)
           ├── 2. Purge user presence (userPresence)
           ├── 3. Purge notifications & read receipts (notification, readReceipt)
           ├── 4. Anonymize user record:
           │        • status = 'INACTIVE'
           │        • email = 'deleted_<userId_prefix>_<timestamp>@deleted.dbc.com'
           │        • password = '$2a$10$DELETEDUSERACCOUNTDUMMYHASHFORRETENTIONRULE'
           ├── 5. Anonymize customer profile PII (if customer):
           │        • fullName = 'Anonymized User'
           │        • phoneNumber = '0000000000'
           │        • address = 'DELETED'
           └── 6. Anonymize contractor profile PII (if provider):
                    • fullName = 'Anonymized Contractor'
                    • businessName = 'Anonymized Business'
                    • phoneNumber = '0000000000'
           │
           ▼
Log Security Audit Event (logSecurityEvent -> 'ADMIN_ACTION')
           │
           ▼
Clear Refresh Cookie ('refresh_token', '/api/auth')
           │
           ▼
Return 200 OK & Client Cache Purge
```

---

## 5. HTTP Response Schema & Error Codes

### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Account deleted successfully",
  "deletedUserId": "usr_c12345678"
}
```

### Response Codes & Error Formats

| Status Code | Scenario | Response Body |
| :--- | :--- | :--- |
| `200 OK` | Account successfully deleted & anonymized | `{ "success": true, "message": "Account deleted successfully", "deletedUserId": "..." }` |
| `401 Unauthorized` | Missing or invalid Bearer access token | `{ "success": false, "message": "Unauthorized: Missing or invalid access token" }` |
| `403 Forbidden` | Non-admin user targeting another user ID | `{ "success": false, "message": "Forbidden: Cannot delete another user account" }` |
| `404 Not Found` | Target `userId` does not exist in database | `{ "success": false, "message": "User account not found" }` |
| `405 Method Not Allowed` | Method other than `POST` or `DELETE` | `{ "success": false, "message": "Method GET Not Allowed" }` |
| `500 Internal Error` | Database transaction error | `{ "success": false, "message": "An error occurred during account deletion" }` |

---

## 6. Mobile Client Integration

The mobile client encapsulates account deletion in `mobile/src/services/mobileAuthService.ts`:

```typescript
async deleteAccount(userId?: string): Promise<{ success: boolean; message: string }> {
  try {
    const targetId = userId || useAuthStore.getState().user?.id;
    const response = await mobileApiClient.post<{ success: boolean; message: string; deletedUserId?: string }>(
      '/api/user/delete-account',
      { userId: targetId }
    );
    if (response.data.success) {
      await this.logout();
    }
    return {
      success: response.data.success,
      message: response.data.message || 'Account deleted successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to delete account',
    };
  }
}
```

When called from the Settings screen (`AccountSettingsScreen.ts`), the client:
1. Prompts for user confirmation via modal dialog.
2. Dispatches `mobileAuthService.deleteAccount()`.
3. Clears local auth state, tokens, in-memory caches, and redirects to `LoginScreen.ts`.

---

## 7. Verification & Automated Tests

Account deletion & production backend readiness are fully verified by `tests/frontend/mobile_account_deletion.test.ts` covering:
* Authenticated `POST` and `DELETE` requests
* Cross-account unauthorized rejection (`403`)
* Unauthenticated request rejection (`401`)
* Target user non-existence handling (`404`)
* Transaction rollback safety
* Mobile auth store & cache purge upon completion
* Security event logging audit
