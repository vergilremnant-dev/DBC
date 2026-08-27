# Resource Ownership Authorization

Beyond role checks, the backend validates resource ownership to prevent data exposure.

## Key Examples
*   **Direct Request Detail (`api-lib/routes/bookings/[id]/index.ts`):** Checks that the requesting user's ID matches the booking's `customerId` or the assigned `providerId`. If not, returns `403 Forbidden`.
*   **Inbox Chats:** Messages inside a thread are only returned if the requesting user's profile is registered as a participant in the conversation record.
