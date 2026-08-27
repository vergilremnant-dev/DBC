# API Endpoints Reference

DBC exposes REST API endpoints grouped by component role.

## 1. Authentication Endpoints
*   `POST /api/auth/login` - Verify credentials and return JWT access token.
*   `POST /api/auth/register` - Customer account signup (UI verification flow).
*   `POST /api/auth/refresh` - Exchange refresh token for new access token.
*   `POST /api/auth/logout` - Invalidate current session token.

## 2. Requirements & Leads
*   `POST /api/requirements` - Create a general marketplace lead.
*   `GET /api/requirements/my` - List requirements posted by current customer.
*   `GET /api/requirements/:id` - Fetch lead details.
*   `PUT /api/requirements/:id/status` - Modify requirement status.

## 3. Project Requests (Bookings)
*   `POST /api/bookings` - Create a private direct request.
*   `GET /api/bookings/my` - List requests related to authenticated user.
*   `GET /api/bookings/:id` - View request details (ownership protected).
*   `PATCH /api/bookings/:id/cancel` - Cancel request (Customer action).
*   `PATCH /api/provider/bookings/:id/accept` - Accept request (Provider action).
*   `PATCH /api/provider/bookings/:id/reject` - Decline request (Provider action).
*   `PATCH /api/provider/bookings/:id/start` - Mark project as started (Provider action).
*   `PATCH /api/provider/bookings/:id/complete` - Mark project as completed (Provider action).

## 4. Proposals (Quotations)
*   `POST /api/quotations` - Submit a quotation bid for a lead.
*   `GET /api/quotations/:id` - Fetch detailed estimation sheet.
*   `PUT /api/quotations/:id/status` - Accept / reject proposal.
