# Environment Variables Reference

Create a `.env` file in the root directory.

> [!WARNING]
> Do not expose sensitive API secrets in commits or public documentation files.

## Required Variables
*   `DATABASE_URL` - PostgreSQL connection URL.
*   `DIRECT_URL` - Direct PostgreSQL connection URL (bypassing connection poolers).
*   `JWT_SECRET` - Secret key used for signing session access tokens.
*   `JWT_REFRESH_SECRET` - Secret key used for signing session refresh tokens.
*   `RAZORPAY_KEY_ID` - Razorpay gateway Key ID.
*   `RAZORPAY_KEY_SECRET` - Razorpay gateway Secret.
*   `RAZORPAY_WEBHOOK_SECRET` - Signature validation secret key for Razorpay webhooks.
