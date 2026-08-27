# Payment Architecture

DBC integrates Razorpay for processing subscription purchases and billing records.

## Key Architectures
*   **Order Creation:** The backend issues a unique Order ID via `createRazorpayOrder` inside `subscriptionService.ts`, registering a pending `Payment` record in the database.
*   **Signature verification:** On payment completion, the client returns details to `/api/subscriptions/verify-payment`. The server checks the payment signature using a HMAC SHA256 checksum with the Razorpay Key Secret. If valid, the database activates the subscription and updates payment status to `SUCCESS`.
