import { VercelRequest, VercelResponse } from '@vercel/node';
import { socialLoginUser } from '../../services/authService.js';
import { setCookie } from '../../utils/cookies.js';
import { checkRateLimit } from '../../utils/rateLimiter.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }

  const userAgent = (req.headers && req.headers['user-agent']) as string || 'unknown';
  const ipAddress = (req.headers && req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || 'unknown';

  const isAllowed = await checkRateLimit(ipAddress, 15, 60000);
  if (!isAllowed) {
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again in a minute.',
    });
  }

  const { idToken } = req.body || {};

  try {
    const response = await socialLoginUser({ idToken, provider: 'apple' }, userAgent, ipAddress);

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
    const message = err.message || '';
    if (message.includes('required') || message.includes('Invalid') || message.includes('Apple') || message.includes('inactive') || message.includes('suspended')) {
      return res.status(400).json({ success: false, message });
    }
    console.error('Apple Auth Route Error:', err);
    return res.status(500).json({ success: false, message: message || 'Apple authentication failed' });
  }
}
