import type { UserRole } from '../../types/auth/authTypes'

export function getDashboardPathForRole(role: UserRole | undefined) {
  if (!role) return '/';
  const norm = role.toUpperCase();
  if (norm.includes('ADMIN')) return '/admin/dashboard';
  if (norm.includes('PROVIDER') || norm.includes('PARTNER') || norm.includes('CONSULTANT')) return '/workspace/dashboard';
  if (norm.includes('CUSTOMER')) return '/workspace/overview';
  return '/workspace/overview';
}

