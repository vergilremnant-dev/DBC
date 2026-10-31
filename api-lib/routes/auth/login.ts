import { VercelRequest, VercelResponse } from '@vercel/node';
import { LoginThrottledError, loginUser } from '../../services/authService.js';
import { setCookie } from '../../utils/cookies.js';
import { checkRateLimit } from '../../utils/rateLimiter.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }

  const userAgent = req.headers['user-agent'] as string;
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

  // Apply request throttling/rate-limiting by IP (max 10 attempts per minute)
  const isAllowed = await checkRateLimit(ipAddress, 10, 60000, 'login');
  if (!isAllowed) {
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again in a minute.',
    });
  }

  try {
    const response = await loginUser(req.body, userAgent, ipAddress);

    setCookie(res, 'refresh_token', response.refreshToken, {
      httpOnly: true,
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res.status(200).json({
      success: true,
      accessToken: response.accessToken,
      user: response.user,
    });
  } catch (err: any) {
    if (err instanceof LoginThrottledError) {
      res.setHeader('Retry-After', String(err.retryAfterSeconds));
      return res.status(err.unavailable ? 503 : 429).json({ success: false, code: 'TOO_MANY_ATTEMPTS', retryAfterSeconds: err.retryAfterSeconds, message: err.message });
    }
    const message = err.message || '';
    if (message.includes('Invalid') || message.includes('required') || message.includes('inactive') || message.includes('locked')) {
      return res.status(400).json({ success: false, message });
    }
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
}
