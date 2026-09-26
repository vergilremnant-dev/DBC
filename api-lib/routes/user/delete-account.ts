import { VercelResponse } from '@vercel/node';
import { withAuth, VercelRequestWithUser } from '../../middleware/authMiddleware.js';
import { db } from '../../utils/db.js';
import { clearCookie } from '../../utils/cookies.js';
import { logSecurityEvent } from '../../services/auditService.js';

async function handler(req: VercelRequestWithUser, res: VercelResponse) {
  const method = req.method;

  if (method !== 'POST' && method !== 'DELETE') {
    res.setHeader('Allow', ['POST', 'DELETE']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }

  const authenticatedUser = req.user;
  if (!authenticatedUser) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid access token' });
  }

  const targetUserId = req.body?.userId || authenticatedUser.id;

  // Authorization Check: Only account owner or ADMIN can delete account
  if (targetUserId !== authenticatedUser.id && authenticatedUser.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Forbidden: Cannot delete another user account' });
  }

  try {
    const existingUser = await db.user.findUnique({
      where: { id: targetUserId },
    });

    if (!existingUser) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    // Execute atomic transaction to anonymize account & purge active sessions
    await db.$transaction(async (tx) => {
      // 1. Purge active user sessions & tokens
      await tx.userSession.deleteMany({ where: { userId: targetUserId } });

      // 2. Purge user presence & temporary notifications
      await tx.userPresence.deleteMany({ where: { userId: targetUserId } });
      await tx.notification.deleteMany({ where: { userId: targetUserId } });
      await tx.readReceipt.deleteMany({ where: { userId: targetUserId } });

      // 3. Anonymize user record & disable status (preserve financial retention integrity)
      const anonymizedEmail = `deleted_${targetUserId.slice(0, 8)}_${Date.now()}@deleted.dbc.com`;
      await tx.user.update({
        where: { id: targetUserId },
        data: {
          status: 'INACTIVE',
          email: anonymizedEmail,
          password: '$2a$10$DELETEDUSERACCOUNTDUMMYHASHFORRETENTIONRULE',
        },
      });

      // 4. Anonymize profile PII if customer profile exists
      const customerProf = await tx.customerProfile.findUnique({ where: { userId: targetUserId } });
      if (customerProf) {
        await tx.customerProfile.update({
          where: { userId: targetUserId },
          data: {
            fullName: 'Anonymized User',
            phoneNumber: '0000000000',
            address: 'DELETED',
          },
        });
      }

      // 5. Anonymize profile PII if provider profile exists
      const providerProf = await tx.providerProfile.findUnique({ where: { userId: targetUserId } });
      if (providerProf) {
        await tx.providerProfile.update({
          where: { userId: targetUserId },
          data: {
            fullName: 'Anonymized Contractor',
            businessName: 'Anonymized Business',
            phoneNumber: '0000000000',
          },
        });
      }
    });

    // 6. Log security audit event
    await logSecurityEvent(
      authenticatedUser.id,
      'ADMIN_ACTION',
      'User account deleted and anonymized in compliance with data privacy policy',
      'USER',
      targetUserId
    );

    // 7. Clear refresh token cookie if user deleted their own account
    if (targetUserId === authenticatedUser.id) {
      clearCookie(res, 'refresh_token', '/api/auth');
    }

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
      deletedUserId: targetUserId,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'An error occurred during account deletion',
    });
  }
}

export default withAuth(handler);
