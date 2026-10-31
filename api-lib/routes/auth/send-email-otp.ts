import { VercelResponse } from '@vercel/node';
import { db } from '../../utils/db.js';
import crypto from 'crypto';
import { VercelRequestWithUser } from '../../middleware/authMiddleware.js';
import { clearAttempts, clientIp, consumeAttempt, isThrottled, recordAttempt, throttledResponse } from '../../utils/authThrottle.js';
import {
  EMAIL_UNAVAILABLE_MESSAGE,
  OTP_MAX_SENDS_PER_HOUR,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
  emailDeliveryAvailable,
  legacyOtpPrefix,
  normalizeEmail,
  otpPrefix,
  otpToken,
} from '../../utils/emailVerification.js';

const HOUR_MS = 60 * 60 * 1000;

export default async function handler(req: VercelRequestWithUser, res: VercelResponse) {
  const method = req.method;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }

  // No email provider is configured: say so instead of claiming a code was sent.
  if (!emailDeliveryAvailable()) {
    return res.status(503).json({ success: false, code: 'EMAIL_DELIVERY_UNAVAILABLE', message: EMAIL_UNAVAILABLE_MESSAGE });
  }

  const ipLimit = await consumeAttempt('otp-send-ip', clientIp(req), 10, HOUR_MS);
  if (ipLimit.limited) return throttledResponse(res, ipLimit);

  const { email } = req.body ?? {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'A valid email address is required' });
  }

  const normalizedEmail = normalizeEmail(email);

  try {
    // Check if user is already registered
    const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email address is already registered' });
    }

    // Resend cooldown and hourly cap per email address.
    const cooldown = await isThrottled('otp-send', normalizedEmail, 1, OTP_RESEND_COOLDOWN_MS);
    if (cooldown.limited) return throttledResponse(res, cooldown, 'Please wait a minute before requesting another code.');
    const hourly = await isThrottled('otp-send-hour', normalizedEmail, OTP_MAX_SENDS_PER_HOUR, HOUR_MS);
    if (hourly.limited) return throttledResponse(res, hourly, 'Too many codes requested for this email. Please try again later.');

    // Cryptographically secure 6-digit code. The deterministic test code is gated to NODE_ENV === 'test' and
    // test-prefixed emails only.
    const isTestEnvironment = process.env.NODE_ENV === 'test';
    const isTestEmail = normalizedEmail.startsWith('test');
    const rawOtp = isTestEnvironment && isTestEmail ? '123456' : crypto.randomInt(100000, 1000000).toString();

    // Issuing a new code invalidates every previous code (current and legacy plaintext format) and resets the
    // wrong-code counter.
    await db.userSession.deleteMany({ where: { token: { startsWith: otpPrefix(normalizedEmail) } } });
    await db.userSession.deleteMany({ where: { token: { startsWith: legacyOtpPrefix(normalizedEmail) } } });
    await clearAttempts('otp-verify', normalizedEmail);

    const { getTempUserId } = await import('../../utils/auth.js');
    const tempUserId = await getTempUserId();

    // Only the keyed digest is stored, never the code.
    await db.userSession.create({
      data: {
        userId: tempUserId,
        token: otpToken(normalizedEmail, rawOtp),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });
    await recordAttempt('otp-send', normalizedEmail, OTP_RESEND_COOLDOWN_MS);
    await recordAttempt('otp-send-hour', normalizedEmail, HOUR_MS);

    // Never log OTP values (in any environment).
    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${normalizedEmail}.`,
    });
  } catch {
    console.error('[EMAIL_OTP] Failed to issue a verification code');
    return res.status(500).json({ success: false, message: 'Failed to generate email verification code.' });
  }
}
