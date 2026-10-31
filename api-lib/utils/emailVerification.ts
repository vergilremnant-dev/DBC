import crypto from 'crypto';
import { keyHash } from './authThrottle.js';

/**
 * Email one-time codes and registration proofs.
 *
 * - OTPs are never stored: only an HMAC (keyed with the server secret) of email + code.
 * - Registration proofs are stored as SHA-256 digests; the raw proof only exists in the verify response.
 * - Emails appear in storage keys only as hashes.
 */

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_SENDS_PER_HOUR = 5;
export const OTP_MAX_VERIFY_ATTEMPTS = 5;
export const PROOF_TTL_MS = 10 * 60 * 1000;

/**
 * No email provider is integrated yet, so codes and reset links cannot reach anyone. Email sign-up and
 * password reset therefore report themselves unavailable instead of pretending to send. The automated test
 * environment keeps the flow enabled so its security rules stay covered.
 */
export function emailDeliveryAvailable(): boolean {
  return process.env.NODE_ENV === 'test';
}

export const EMAIL_UNAVAILABLE_MESSAGE = 'Email verification is not available yet. Please continue with your phone number.';

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET environment variable is missing');
  return s;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function otpDigest(email: string, otp: string): string {
  return crypto.createHmac('sha256', secret()).update(`${normalizeEmail(email)}:${otp}`).digest('hex');
}

export function otpPrefix(email: string): string {
  return `EMAIL_OTP:${keyHash(email)}:`;
}

/** Legacy rows stored the raw email and raw code; they are invalidated whenever a new code is issued. */
export function legacyOtpPrefix(email: string): string {
  return `EMAIL_OTP:${normalizeEmail(email)}:`;
}

export function otpToken(email: string, otp: string): string {
  return `${otpPrefix(email)}${otpDigest(email, otp)}`;
}

/** Constant-time comparison of a stored OTP token with the digest of a submitted code. */
export function otpMatches(storedToken: string, email: string, otp: string): boolean {
  const expected = Buffer.from(otpToken(email, otp));
  const actual = Buffer.from(storedToken);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export function proofPrefix(email: string): string {
  return `REGISTRATION_PROOF:${keyHash(email)}:`;
}

export function proofToken(email: string, rawProof: string): string {
  return `${proofPrefix(email)}${crypto.createHash('sha256').update(rawProof.trim()).digest('hex')}`;
}
