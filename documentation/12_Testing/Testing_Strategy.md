# Testing Strategy

DBC utilizes the Vitest testing runner for asserting backend logic blocks and frontend components.

## Testing Layers
1.  **Backend Integration Tests:** Located in `tests/backend/`. Verify API handlers, service transitions, status update restrictions, and Razorpay webhook payload verifications.
2.  **Frontend Component/RBAC Tests:** Located in `tests/frontend/`. Assert routing controls and role permissions checker logic (`rbac.ts`).
