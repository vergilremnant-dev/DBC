import { VercelRequest, VercelResponse } from '@vercel/node';
import { startPhoneSession, toPhoneAuthHttpError } from '../../services/phoneAuthService.js';
import { setCookie } from '../../utils/cookies.js';
import { checkRateLimit } from '../../utils/rateLimiter.js';

/**
 * POST /api/auth/phone/session
 * Body: { firebaseIdToken }
 * Verifies the Firebase phone identity server-side. Existing accounts receive a
 * DBC session; unknown numbers get status REGISTRATION_REQUIRED (no session, no
 * account created).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const userAgent = (req.headers?.['user-agent'] as string) || 'unknown';
  const ipAddress = (req.headers?.['x-forwarded-for'] as string) || req.socket?.remoteAddress || 'unknown';

  if (!(await checkRateLimit(ipAddress, 15, 60000, 'phone-session'))) {
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again in a minute.',
    });
  }

  try {
    const result = await startPhoneSession(req.body?.firebaseIdToken, { userAgent, ipAddress });

    if (result.status === 'REGISTRATION_REQUIRED') {
      return res.status(200).json({
        success: true,
        status: 'REGISTRATION_REQUIRED',
        phone: result.phoneE164,
      });
    }

    setCookie(res, 'refresh_token', result.session.refreshToken, {
      httpOnly: true,
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60,
    });
    return res.status(200).json({
      success: true,
      status: 'AUTHENTICATED',
      isNewUser: false,
      accessToken: result.session.accessToken,
      user: result.session.user,
    });
  } catch (err) {
    const httpErr = toPhoneAuthHttpError(err);
    if (httpErr.status >= 500) console.error('[PHONE_SESSION_ERROR]', (err as Error)?.message);
    return res.status(httpErr.status).json({ success: false, code: httpErr.code, message: httpErr.message });
  }
}
