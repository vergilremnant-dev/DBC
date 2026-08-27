# Production Configuration Checklist

Ensure the following variables are configured in the production environment settings.

*   `DATABASE_URL` - Target production database connection string.
*   `DIRECT_URL` - Target direct database URL.
*   `JWT_SECRET` / `JWT_REFRESH_SECRET` - Strong cryptographic keys.
*   `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` - Production keys matching the verified Razorpay business account.
