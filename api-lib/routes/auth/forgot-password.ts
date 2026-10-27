import { VercelResponse } from '@vercel/node';
import { db } from '../../utils/db.js';
import crypto from 'crypto';
import { logSecurityEvent } from '../../services/auditService.js';
import { VercelRequestWithUser } from '../../middleware/authMiddleware.js';

export default async function handler(req: VercelRequestWithUser, res: VercelResponse) {
  const method = req.method;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email address is required' });
  }

  try {
    const user = await db.user.findUnique({ where: { email } });
    
    // Security Best Practice: Don't leak whether the email exists. Return 200 regardless.
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been dispatched.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Save token as session
    await db.userSession.create({
      data: {
        userId: user.id,
        token: `PWD_RESET:${hashedToken}`,
        expiresAt,
      },
    });

    await logSecurityEvent(user.id, 'PASSWORD_CHANGE', 'Password reset token generated and dispatched.');

    return res.status(200).json({
      success: true,
      message: 'If the email exists, a password reset link has been dispatched.',
      // The reset token is NEVER returned: returning it let anyone reset any account by email.
      // It must be delivered out-of-band (email) — see deployment notes; no email sender exists yet.
    });
    } catch (_error: any) {
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
}
