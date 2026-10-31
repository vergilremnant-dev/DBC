import { VercelResponse } from '@vercel/node';
import { db } from '../../utils/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { validatePasswordStrength } from '../../utils/validation.js';
import { logSecurityEvent } from '../../services/auditService.js';
import { VercelRequestWithUser } from '../../middleware/authMiddleware.js';
import { clientIp, consumeAttempt, throttledResponse } from '../../utils/authThrottle.js';

export default async function handler(req: VercelRequestWithUser, res: VercelResponse) {
  const method = req.method;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }

  const limit = await consumeAttempt('reset-password-ip', clientIp(req), 10, 15 * 60 * 1000);
  if (limit.limited) return throttledResponse(res, limit);

  const { token, newPassword } = req.body ?? {};

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: 'Token and new password are required' });
  }

  const passwordErrors = validatePasswordStrength(newPassword);
  if (passwordErrors.length > 0) {
    return res.status(400).json({ success: false, message: passwordErrors.join(' ') });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const sessionTokenKey = `PWD_RESET:${hashedToken}`;

    const session = await db.userSession.findUnique({
      where: { token: sessionTokenKey },
    });

    if (!session) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    if (new Date() > session.expiresAt) {
      await db.userSession.delete({ where: { id: session.id } });
      return res.status(400).json({ success: false, message: 'Reset token has expired' });
    }

    // A reset only changes the password. It never restores SUSPENDED or INACTIVE (incl. soft-deleted) accounts;
    // that needs an authorised admin or support action.
    const account = await db.user.findUnique({ where: { id: session.userId }, select: { status: true } });
    if (!account || account.status !== 'ACTIVE') {
      await db.userSession.delete({ where: { id: session.id } });
      return res.status(400).json({ success: false, message: 'This account cannot be reset online. Please contact DBC support.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.user.update({
      where: { id: session.userId },
      data: { password: hashedPassword },
    });

    // Delete token session
    await db.userSession.delete({ where: { id: session.id } });

    // Invalidate all other active login sessions for security!
    await db.userSession.deleteMany({
      where: { userId: session.userId },
    });

    await logSecurityEvent(session.userId, 'PASSWORD_CHANGE', 'Password reset completed successfully. All other active sessions terminated.');

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new credentials.',
    });
    } catch (_error: any) {
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
}
