import { VercelResponse } from '@vercel/node';
import { db } from '../../utils/db.js';
import crypto from 'crypto';
import { VercelRequestWithUser } from '../../middleware/authMiddleware.js';
import { clearAttempts, clientIp, consumeAttempt, isThrottled, recordAttempt, throttledResponse } from '../../utils/authThrottle.js';
import {
  EMAIL_UNAVAILABLE_MESSAGE,
  OTP_MAX_VERIFY_ATTEMPTS,
  OTP_TTL_MS,
  PROOF_TTL_MS,
  emailDeliveryAvailable,
  normalizeEmail,
  otpMatches,
  otpPrefix,
  proofPrefix,
  proofToken,
} from '../../utils/emailVerification.js';

export default async function handler(req: VercelRequestWithUser, res: VercelResponse) {
  const method = req.method;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }

  if (!emailDeliveryAvailable()) {
    return res.status(503).json({ success: false, code: 'EMAIL_DELIVERY_UNAVAILABLE', message: EMAIL_UNAVAILABLE_MESSAGE });
  }

  const ipLimit = await consumeAttempt('otp-verify-ip', clientIp(req), 30, 10 * 60 * 1000);
  if (ipLimit.limited) return throttledResponse(res, ipLimit);

  const { email, otp } = req.body ?? {};

  if (!email || !otp || typeof email !== 'string' || typeof otp !== 'string') {
    return res.status(400).json({ success: false, message: 'Email and verification code are required' });
  }

  const normalizedEmail = normalizeEmail(email);
  const cleanOtp = otp.trim();
  if (!/^\d{6}$/.test(cleanOtp)) {
    return res.status(400).json({ success: false, message: 'Invalid verification code. Please check the code or click Resend.' });
  }

  try {
    // Wrong-code limit per email: after too many failures the code is destroyed and a new one is required.
    const attempts = await isThrottled('otp-verify', normalizedEmail, OTP_MAX_VERIFY_ATTEMPTS, OTP_TTL_MS);
    if (attempts.limited) {
      await db.userSession.deleteMany({ where: { token: { startsWith: otpPrefix(normalizedEmail) } } });
      return throttledResponse(res, attempts, 'Too many incorrect codes. Please request a new code.');
    }

    const session = await db.userSession.findFirst({
      where: { token: { startsWith: otpPrefix(normalizedEmail) } },
      orderBy: { createdAt: 'desc' },
    });

    if (!session || !otpMatches(session.token, normalizedEmail, cleanOtp)) {
      await recordAttempt('otp-verify', normalizedEmail, OTP_TTL_MS);
      return res.status(400).json({ success: false, message: 'Invalid verification code. Please check the code or click Resend.' });
    }

    if (new Date() > session.expiresAt) {
      await db.userSession.delete({ where: { id: session.id } });
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
    }

    // Single use: the code is consumed on success.
    await db.userSession.delete({ where: { id: session.id } });
    await clearAttempts('otp-verify', normalizedEmail);

    // Short-lived, single-use registration proof. Only its digest is stored.
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await db.userSession.deleteMany({ where: { token: { startsWith: proofPrefix(normalizedEmail) } } });

    const { getTempUserId } = await import('../../utils/auth.js');
    const tempUserId = await getTempUserId();

    await db.userSession.create({
      data: {
        userId: tempUserId,
        token: proofToken(normalizedEmail, verificationToken),
        expiresAt: new Date(Date.now() + PROOF_TTL_MS),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Email OTP verified successfully.',
      verificationToken,
    });
  } catch {
    console.error('[EMAIL_OTP] Verification failed with an internal error');
    return res.status(500).json({ success: false, message: 'An internal error occurred during OTP verification.' });
  }
}
