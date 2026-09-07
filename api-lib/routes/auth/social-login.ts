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

  const userAgent = req.headers['user-agent'] as string;
  const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

  const isAllowed = await checkRateLimit(ipAddress, 15, 60000);
  if (!isAllowed) {
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again in a minute.',
    });
  }

  try {
    const response = await socialLoginUser(req.body, userAgent, ipAddress);

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
    if (message.includes('required') || message.includes('Could not verify') || message.includes('inactive') || message.includes('suspended')) {
      return res.status(400).json({ success: false, message });
    }
    console.error('Social Login Error:', err);
    return res.status(500).json({ success: false, message: message || 'Social authentication failed' });
  }
}
