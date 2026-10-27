import { auth, isFirebaseConfigured, RecaptchaVerifier, signInWithPhoneNumber, signOut } from '../../config/firebase';
import type { ConfirmationResult } from '../../config/firebase';
import type { User } from 'firebase/auth';

/**
 * Client-side Firebase phone OTP helpers. These only prove phone ownership to
 * Firebase; the DBC session is created by the backend after it verifies the
 * resulting ID token.
 */

export const SUPPORTED_COUNTRY_CODES = [
  { code: '+91', label: 'IN +91' },
  { code: '+971', label: 'AE +971' },
  { code: '+1', label: 'US +1' },
  { code: '+44', label: 'UK +44' },
  { code: '+61', label: 'AU +61' },
  { code: '+65', label: 'SG +65' },
] as const;

const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export function buildE164(countryCode: string, rawNumber: string): { e164: string } | { error: string } {
  const digits = rawNumber.replace(/\D/g, '');
  const code = countryCode.trim();
  if (!/^\+[1-9]\d{0,3}$/.test(code)) {
    return { error: 'Please choose a valid country code.' };
  }
  if (code === '+91') {
    const national = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits.replace(/^0/, '');
    if (!/^[6-9]\d{9}$/.test(national)) {
      return { error: 'Please enter a valid 10-digit Indian mobile number.' };
    }
    return { e164: `+91${national}` };
  }
  const e164 = `${code}${digits}`;
  if (digits.length < 6 || !E164_PATTERN.test(e164)) {
    return { error: 'Please enter a valid mobile number.' };
  }
  return { e164 };
}

type RecaptchaWindow = Window & { __dbcPhoneRecaptcha?: { verifier: RecaptchaVerifier; containerId: string } };

export function resetPhoneRecaptcha(): void {
  const w = window as RecaptchaWindow;
  const existing = w.__dbcPhoneRecaptcha;
  if (existing) {
    try {
      existing.verifier.clear();
    } catch {
      // Already cleared.
    }
    const container = document.getElementById(existing.containerId);
    if (container) container.innerHTML = '';
  }
  w.__dbcPhoneRecaptcha = undefined;
}

function getRecaptcha(containerId: string): RecaptchaVerifier {
  if (!auth) throw Object.assign(new Error('Firebase is not configured'), { code: 'dbc/firebase-not-configured' });
  const w = window as RecaptchaWindow;
  if (w.__dbcPhoneRecaptcha && w.__dbcPhoneRecaptcha.containerId === containerId) {
    return w.__dbcPhoneRecaptcha.verifier;
  }
  resetPhoneRecaptcha();
  const verifier = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
  w.__dbcPhoneRecaptcha = { verifier, containerId };
  return verifier;
}

/** Asks Firebase to send an OTP. Resolving means the request was accepted, not that the SMS was delivered. */
export async function requestPhoneOtp(phoneE164: string, recaptchaContainerId: string): Promise<ConfirmationResult> {
  if (!isFirebaseConfigured || !auth) {
    throw Object.assign(new Error('Firebase is not configured'), { code: 'dbc/firebase-not-configured' });
  }
  try {
    return await signInWithPhoneNumber(auth, phoneE164, getRecaptcha(recaptchaContainerId));
  } catch (err) {
    // A failed attempt leaves the invisible reCAPTCHA unusable; start fresh next time.
    resetPhoneRecaptcha();
    throw err;
  }
}

/** Confirms the OTP with Firebase and returns the Firebase user (for fresh ID tokens). */
export async function confirmPhoneOtp(confirmation: ConfirmationResult, code: string): Promise<User> {
  const credential = await confirmation.confirm(code);
  return credential.user;
}

/** Ends the client-side Firebase session once the DBC session is the source of truth. */
export async function signOutFirebasePhoneUser(): Promise<void> {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch {
    // Non-fatal: the DBC session does not depend on the Firebase client session.
  }
}

export function mapPhoneOtpError(err: unknown, mapFirebase: (code: string, msg?: string) => string): string {
  const code = (err as { code?: string })?.code || '';
  if (code === 'dbc/firebase-not-configured') {
    return 'Phone sign-in is not available right now. Please try again later.';
  }
  return mapFirebase(code, (err as { message?: string })?.message);
}
