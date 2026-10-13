# DBC Firebase OTP Troubleshooting Guide

This guide details common error codes, failure root causes, and step-by-step resolution actions for the DBC Firebase OTP flow.

---

## 1. Firebase Error Codes & Resolution Matrix

| Firebase Error Code | User-Friendly Message | Cause | Resolution Action |
|---|---|---|---|
| `auth/invalid-phone-number` | The phone number format is invalid. Please enter a valid 10-digit phone number. | Phone number string does not match E.164 format. | Enter valid 10 digits; application automatically prepends `+91`. |
| `auth/operation-not-allowed` | Phone Authentication is not enabled in Firebase Console. Please enable Phone provider under Firebase Authentication settings. | Phone sign-in provider is disabled in Firebase Console. | Go to Firebase Console > Authentication > Sign-in method > Phone, and toggle to Enable. |
| `auth/captcha-check-failed` | reCAPTCHA security check failed. Please click "Send Verification Code" to try again. | Invisible reCAPTCHA verification failed, expired, or was blocked. | Click "Send Verification Code" again to re-trigger a fresh reCAPTCHA token. |
| `auth/app-not-authorized` | This domain is not authorized for Firebase Authentication. Please add this domain under Authorized Domains in Firebase Console. | Current hostname (e.g. preview deployment or custom domain) is not listed in Authorized Domains. | Add the domain in Firebase Console > Authentication > Settings > Authorized domains. |
| `auth/too-many-requests` | Too many SMS requests sent to this number. Please wait a few minutes before trying again. | Rate limit triggered on phone number or IP address. | Wait 5–15 minutes before retrying, or configure a Test Phone Number in Firebase Console. |
| `auth/quota-exceeded` | SMS verification quota has been exceeded for today. Please try again later. | Daily free-tier SMS quota exhausted. | Upgrade Firebase project to Blaze Plan (Pay as you go) or use test numbers. |
| `auth/network-request-failed` | Network connection error. Please check your internet connection and try again. | Device offline or client network blocked Google Identity endpoints. | Check device network connection and ensure no firewall blocks Google API endpoints. |
| `auth/invalid-verification-code` | The 6-digit verification code you entered is invalid. Please check the code and try again. | The entered OTP does not match the OTP sent by Firebase. | Re-enter the exact 6 digits from the SMS or test phone configuration. |
| `auth/code-expired` | The verification code has expired. Please click resend to receive a new code. | SMS verification session expired (typically after 5–10 minutes). | Click "Resend OTP" to generate a fresh verification session. |
| `auth/invalid-app-credential` | Firebase app credentials or reCAPTCHA verification are invalid. Please check your configuration. | Missing or invalid API key, bundle ID, or reCAPTCHA client config. | Verify `VITE_FIREBASE_API_KEY` and project settings in `.env.local` or Vercel dashboard. |

---

## 2. Common Scenarios & Diagnostics

### Scenario A: "reCAPTCHA client element has been removed: 0"
* **Symptom**: User clicks "Send Verification Code", but receives error indicating element has been removed.
* **Root Cause**: React unmounted `<div id="recaptcha-container">` during re-render while Firebase still held widget ID `0`.
* **Fix Implemented**:
  1. `<div id="recaptcha-container">` is mounted at the root level of `RegisterWizard.tsx` so it persists across step changes.
  2. `getOrCreateRecaptchaVerifier()` safely clears any stale verifier and resets the container before `signInWithPhoneNumber`.

### Scenario B: SMS OTP Never Arrives on Real Phone
* **Diagnostic Steps**:
  1. **Check Firebase Console Sign-in method**: Ensure Phone provider is **Enabled**.
  2. **Check Authorized Domains**: Ensure the current domain is authorized.
  3. **Check Google Cloud Billing**: Free tier allows limited daily SMS. If billing is not enabled, carrier SMS in certain regions will fail.
  4. **Check SMS Region Policies**: India (`+91`) carrier routing may be blocked if SMS Region Policy restricts it.
  5. **Use Test Phone Number**: Test with a number listed under Firebase Console > Phone numbers for testing (e.g., `+917981160986` with code `123456`) to isolate carrier delivery issues from codebase issues.

### Scenario C: Backend Rejects Phone Registration with 400
* **Symptom**: Client says "Phone number does not match verified Firebase phone identity" or "Invalid, expired, or untrusted Firebase ID Token".
* **Root Cause**:
  - The submitted phone number does not match the phone number verified on the Firebase ID token.
  - The Firebase ID token expired or belonged to a different project.
* **Resolution**: Ensure the phone number entered in Step 1 matches the verified token session.
