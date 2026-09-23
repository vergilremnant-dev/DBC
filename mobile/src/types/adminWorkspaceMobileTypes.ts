export type AdminUserRole = 'customer' | 'contractor' | 'admin';
export type AdminUserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
export type AdminVerificationStatus = 'VERIFIED' | 'PENDING' | 'REJECTED' | 'UNVERIFIED';

export interface AdminDashboardMetrics {
  totalUsersCount: number;
  customersCount: number;
  professionalsCount: number;
  activeProjectsCount: number;
  pendingRequestsCount: number;
  pendingVerificationsCount: number;
}

export interface AdminActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'VERIFICATION' | 'REQUEST_REVIEW' | 'USER_MODERATION' | 'PROJECT_AUDIT';
  targetRoute: string;
  targetId?: string;
  actionLabel: string;
}

export interface MobileAdminUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  createdAt: string;
  lastActive?: string;
  isActionable: boolean;
}

export interface MobileAdminProfessional {
  id: string;
  businessName: string;
  contactPerson: string;
  email?: string;
  phone?: string;
  category: string;
  city: string;
  rating?: number;
  verificationStatus: AdminVerificationStatus;
  isFeatured: boolean;
  registeredDate: string;
}

export interface MobileAdminRequest {
  id: string;
  bookingNumber: string;
  customerName: string;
  providerName?: string;
  serviceCategory: string;
  status: string;
  statusLabel: string;
  submittedDate: string;
  budgetFormatted: string;
}

export interface MobileAdminProject {
  id: string;
  title: string;
  customerName: string;
  providerName: string;
  status: string;
  statusLabel: string;
  progressPercentage: number;
  startDate: string;
  budgetFormatted: string;
}

export interface MobileAdminAuditLog {
  id: string;
  action: string;
  actorEmail: string;
  target: string;
  timestamp: string;
  formattedDate: string;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
}

export interface AdminDashboardOverview {
  metrics: AdminDashboardMetrics;
  actionItems: AdminActionItem[];
  recentUsers: MobileAdminUser[];
  pendingProfessionals: MobileAdminProfessional[];
  recentAuditLogs: MobileAdminAuditLog[];
}
