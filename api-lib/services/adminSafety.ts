import { db } from '../utils/db.js';
import { logSecurityEvent } from './auditService.js';

/** Refused privileged change (HTTP 409), e.g. it would leave DBC without an active administrator. */
export class AdminSafetyError extends Error {
  readonly status = 409;
  constructor(message: string, readonly code = 'LAST_ACTIVE_ADMIN') {
    super(message);
    this.name = 'AdminSafetyError';
  }
}

export const LAST_ADMIN_MESSAGE = 'This is the last active administrator. Add or reactivate another administrator first.';

/**
 * Throws if changing `targetUserId` to the given role/status would leave no ACTIVE ADMIN account.
 * (Not serialisable against two admins demoting each other at the same instant; acceptable for this phase.)
 */
export async function assertNotLastActiveAdmin(targetUserId: string, next: { role?: string; status?: string }) {
  const target = await db.user.findUnique({ where: { id: targetUserId }, select: { role: true, status: true } });
  if (!target || target.role !== 'ADMIN' || target.status !== 'ACTIVE') return;
  const losesAdmin = (next.role !== undefined && next.role !== 'ADMIN') || (next.status !== undefined && next.status !== 'ACTIVE');
  if (!losesAdmin) return;
  const otherActiveAdmins = await db.user.count({ where: { role: 'ADMIN', status: 'ACTIVE', id: { not: targetUserId } } });
  if (otherActiveAdmins === 0) throw new AdminSafetyError(LAST_ADMIN_MESSAGE);
}

/**
 * Ends every session of a user (refresh tokens and pending reset/verification tokens) so a role or status change
 * takes effect at once: the user must sign in again, and a suspended user cannot refresh. Existing 15-minute access
 * tokens of non-admin users expire on their own; admin access tokens are re-checked on every privileged request.
 */
export async function revokeUserSessions(userId: string) {
  await db.userSession.deleteMany({ where: { userId } });
}

/** Security audit record for a privileged change. Descriptions hold ids and enum values only (no personal data). */
export async function recordAdminAction(actorId: string, description: string, targetType: string, targetId: string) {
  await logSecurityEvent(actorId, 'ADMIN_ACTION', description, targetType, targetId);
}
