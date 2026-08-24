import type { UserRole } from '../../types/auth/authTypes'

export function getDashboardPathForRole(role: UserRole | undefined) {
  if (!role) return '/';
  const norm = role.toUpperCase();
  if (norm.includes('ADMIN')) return '/admin/dashboard';
  if (norm.includes('PROVIDER')) return '/workspace/dashboard';
  // Customers are redirected to the public homepage (marketplace) after login
  return '/';
}
