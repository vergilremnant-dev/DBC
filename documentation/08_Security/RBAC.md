# Role-Based Access Control (RBAC)

RBAC controls access boundaries in both the frontend routes and backend controllers.

## 1. Frontend Route Guards (`src/routes/ProtectedRoute.tsx`)
*   Protects routes using the `allowedRoles` array.
*   Redirects unauthorized attempts using `getDashboardPathForRole(user.role)`.
*   *Customer* restricted from `/admin/*` and `/workspace/dashboard` (Provider workspace).

## 2. Backend Middleware Verification
*   Tokens are parsed using `api-lib/middleware/auth.ts`.
*   User roles are checked to reject unauthorized operations (e.g. only `ROLE_ADMIN` can modify service category configurations).
