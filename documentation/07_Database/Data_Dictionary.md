# Database Data Dictionary

Glossary of fields and types.

## 1. `UserSubscription` Table
*   `id` (String, UUID) - Unique subscription record key.
*   `userId` (String) - Maps to `User.id`.
*   `planId` (Int) - Maps to `SubscriptionPlan.id`.
*   `status` (Enum: `ACTIVE`, `EXPIRED`, `CANCELLED`) - Current authorization state of the pass.
*   `endDate` (DateTime) - Expiration boundary.

## 2. `Payment` Table
*   `id` (String, UUID) - Transaction record key.
*   `amount` (Float) - Price value.
*   `status` (Enum: `PENDING`, `SUCCESS`, `FAILED`) - Checksum verification status.
*   `razorpayOrderId` (String) - Razorpay API reference.
