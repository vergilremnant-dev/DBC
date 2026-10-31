import { VercelRequest, VercelResponse } from '@vercel/node';
import { registerPhoneUser, toPhoneAuthHttpError } from '../../services/phoneAuthService.js';
import { setCookie } from '../../utils/cookies.js';
import { checkRateLimit } from '../../utils/rateLimiter.js';

/**
 * POST /api/auth/phone/register
 * Body: { firebaseIdToken, firstName, lastName?, preferredCity? }
 * Firebase UID and phone come only from the verified token. Role is always
 * CUSTOMER (existing public-registration policy); any client role is ignored.
 * Idempotent: repeating the request signs in to the same account.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const userAgent = (req.headers?.['user-agent'] as string) || 'unknown';
  const ipAddress = (req.headers?.['x-forwarded-for'] as string) || req.socket?.remoteAddress || 'unknown';

  if (!(await checkRateLimit(ipAddress, 10, 60000, 'phone-register'))) {
    return res.status(429).json({
      success: false,
      message: 'Too many registration attempts. Please try again in a minute.',
    });
  }

  const body = req.body || {};

  try {
    const result = await registerPhoneUser(
      body.firebaseIdToken,
      { firstName: body.firstName, lastName: body.lastName, preferredCity: body.preferredCity },
      { userAgent, ipAddress }
    );

    if (result.status !== 'AUTHENTICATED') {
      // registerPhoneUser never returns REGISTRATION_REQUIRED; guard for type safety.
      return res.status(500).json({ success: false, message: 'Registration could not be completed.' });
    }

    setCookie(res, 'refresh_token', result.session.refreshToken, {
      httpOnly: true,
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60,
    });
    return res.status(result.isNewUser ? 201 : 200).json({
      success: true,
      status: 'AUTHENTICATED',
      isNewUser: result.isNewUser,
      accessToken: result.session.accessToken,
      user: result.session.user,
    });
  } catch (err) {
    const httpErr = toPhoneAuthHttpError(err);
    if (httpErr.status >= 500) console.error('[PHONE_REGISTER_ERROR]', (err as Error)?.message);
    return res.status(httpErr.status).json({ success: false, code: httpErr.code, message: httpErr.message });
  }
}
