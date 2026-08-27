# Third-Party Integrations

DBC integrates external services to support payment capture.

## 1. Razorpay Payment Gateway (Implemented)
*   **Use Cases:** Subscriptions and payment passes.
*   **SDK:** Node Razorpay SDK is used in backend handlers.
*   **Checksum Verification:** Payment signatures are verified using HMAC SHA256 hashes generated with webhook secret keys.

## 2. SMS / Email Gateways (Planned - Not Implemented)
*   Supabase OTP integration and Twilio dispatch are planned.
