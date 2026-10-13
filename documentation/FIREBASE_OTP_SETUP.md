# DBC Firebase OTP Authentication Setup Guide

## 1. Overview & Architecture

The DBC platform uses client-side Firebase Authentication coupled with server-side token verification and custom JWT session issuance:

```
[User Phone Input]
       │
       ▼
[reCAPTCHA Invisible Verifier] (#recaptcha-container)
       │
       ▼
[Firebase Web SDK] ──(signInWithPhoneNumber)──► [Firebase Auth Cloud Gateway]
       │                                                         │
       │                                                 (Dispatches SMS OTP)
       ▼                                                         │
[User Enters 6-Digit OTP]                                        ▼
       │                                                 [User Receives SMS]
       ▼                                                         │
[confirmationResult.confirm(otp)] ◄──────────────────────────────┘
       │
       ▼
[Firebase UserCredential Resolved]
       │
       ▼
[Retrieve Firebase ID Token & UID]
       │
       ▼
[POST /api/auth/register]
  Payload: { email: "phone@dbc.com", password, firstName, lastName, phone, firebaseIdToken }
       │
       ▼
[Backend verifyFirebaseIdToken]
  - Cryptographically verifies Firebase ID token (Google Identity Toolkit / JWT verification)
  - Extracts trusted UID from verified token (never trusts arbitrary client firebaseUid)
  - Enforces match between verified token phone number and submitted phone number
       │
       ▼
[DBC Prisma PostgreSQL Database]
  - BCrypt password hash created
  - Role.CUSTOMER enforced
  - User & CustomerProfile created
       │
       ▼
[DBC JWT Access Token + DB Refresh Session Cookie Issued]
       │
       ▼
[Redirect to Workspace Dashboard (/workspace/overview)]
```

---

## 2. Firebase Console Configuration Checklist

To allow real and test phone numbers to receive OTPs, the following external settings must be configured in the [Firebase Console](https://console.firebase.google.com/):

### 1. Enable Phone Provider
1. Navigate to **Authentication** > **Sign-in method**.
2. Select **Phone** under Sign-in providers.
3. Toggle to **Enable**.
4. Click **Save**.

### 2. Configure Authorized Domains
1. Navigate to **Authentication** > **Settings** > **Authorized domains**.
2. Ensure the following domains are present:
   - `localhost` (for local development)
   - `127.0.0.1`
   - Your Vercel deployment domain (e.g. `*.vercel.app`)
   - Production domain (e.g. `dbc.com`, `www.dbc.com`)

### 3. Setup Test Phone Numbers (Zero Cost & Deterministic Sandbox)
Firebase provides testing phone numbers that bypass carrier SMS gateways and always verify with fixed codes:
1. Under **Authentication** > **Sign-in method** > **Phone**, expand **Phone numbers for testing**.
2. Add test numbers, for example:
   - Phone: `+917981160986` | Verification Code: `123456`
   - Phone: `+919876543210` | Verification Code: `654321`
3. Click **Save**.

### 4. Enable Google Cloud Billing (Blaze Plan) for Real SMS
- Real SMS delivery requires the **Blaze (Pay as you go)** plan on Google Cloud.
- Free tier (Spark plan) includes a daily SMS allowance, but carrier delivery in certain regions (such as India +91) requires Blaze plan billing and carrier compliance.

### 5. Check SMS Region Policies
1. Navigate to **Authentication** > **Settings** > **SMS region policy**.
2. Verify that the country code for target users (e.g., India `+91`, USA `+1`) is allowed.

---

## 3. Environment Variables

### Frontend Configuration (Vite)
Declared in `.env.local` for development and in **Vercel Project Settings > Environment Variables** for production:

```ini
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=designbuildconnect.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=designbuildconnect
VITE_FIREBASE_STORAGE_BUCKET=designbuildconnect.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=375980529125
VITE_FIREBASE_APP_ID=1:375980529125:web:...
VITE_FIREBASE_MEASUREMENT_ID=G-...
```

### Backend Configuration
The backend automatically reads `VITE_FIREBASE_API_KEY` / `FIREBASE_API_KEY` and `VITE_FIREBASE_PROJECT_ID` / `FIREBASE_PROJECT_ID` to perform server-side token cryptographic verification.

---

## 4. Verification & Testing

Run the full validation suite:

```bash
# TypeScript Typecheck
npx tsc -b
npx tsc -p api/tsconfig.json

# Mobile & Full Test Suites
npm run test:mobile
npm test

# Production Build
npx vite build
```
