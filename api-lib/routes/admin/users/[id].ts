import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken, hasRole } from '../../../utils/auth.js';
import { db } from '../../../utils/db.js';
import { UserStatus, Role } from '@prisma/client';
import { AdminSafetyError, assertNotLastActiveAdmin, recordAdminAction, revokeUserSessions } from '../../../services/adminSafety.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const adminUser = verifyToken(req);
  if (!adminUser) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
  }

  if (!hasRole(adminUser, ['ADMIN'])) {
    return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
  }

  const { id } = req.query;
  const userId = Array.isArray(id) ? id[0] : id;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'Missing user ID parameter' });
  }

  const method = req.method;

  try {
    if (method === 'PATCH') {
      const { status, role } = req.body ?? {};
      const updateData: { status?: UserStatus; role?: Role } = {};

      if (status !== undefined && status !== null && status !== '') {
        if (!Object.values(UserStatus).includes(status)) {
          return res.status(400).json({ success: false, message: 'Invalid user status value' });
        }
        updateData.status = status;
      }

      if (role !== undefined && role !== null && role !== '') {
        if (!Object.values(Role).includes(role)) {
          return res.status(400).json({ success: false, message: 'Invalid user role value' });
        }
        updateData.role = role;
      }

      if (!updateData.status && !updateData.role) {
        return res.status(400).json({ success: false, message: 'Nothing to update: provide a valid status or role' });
      }

      const before = await db.user.findUnique({ where: { id: userId }, select: { role: true, status: true } });
      if (!before) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Never leave DBC without an active administrator (covers self-demotion and self-suspension too).
      await assertNotLastActiveAdmin(userId, updateData);

      const updatedUser = await db.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
        },
      });

      const roleChanged = updateData.role !== undefined && updateData.role !== before.role;
      const statusChanged = updateData.status !== undefined && updateData.status !== before.status;
      if (roleChanged || statusChanged) {
        // Old sessions carry the old role/status: end them so the change applies immediately.
        await revokeUserSessions(userId);
        const changes = [
          roleChanged ? `role ${before.role} -> ${updatedUser.role}` : null,
          statusChanged ? `status ${before.status} -> ${updatedUser.status}` : null,
        ].filter(Boolean).join(', ');
        await recordAdminAction(adminUser.id, `Admin changed user ${userId}: ${changes}; sessions revoked`, 'USER', userId);
      }

      return res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
      });
    }

    if (method === 'DELETE') {
      const before = await db.user.findUnique({ where: { id: userId }, select: { status: true } });
      if (!before) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      await assertNotLastActiveAdmin(userId, { status: UserStatus.INACTIVE });

      // Soft Delete: update status to INACTIVE
      const softDeletedUser = await db.user.update({
        where: { id: userId },
        data: { status: UserStatus.INACTIVE },
        select: { id: true, email: true, status: true },
      });
      await revokeUserSessions(userId);
      await recordAdminAction(adminUser.id, `Admin soft-deleted user ${userId}: status ${before.status} -> INACTIVE; sessions revoked`, 'USER', userId);

      return res.status(200).json({
        success: true,
        message: 'User soft-deleted successfully (marked INACTIVE)',
        data: softDeletedUser,
      });
    }

    res.setHeader('Allow', ['PATCH', 'DELETE']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  } catch (err: unknown) {
    if (err instanceof AdminSafetyError) {
      return res.status(err.status).json({ success: false, code: err.code, message: err.message });
    }
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
}
