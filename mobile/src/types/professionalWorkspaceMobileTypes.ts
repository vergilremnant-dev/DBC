export type ProfessionalRequestStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ProfessionalDashboardMetrics {
  activeProjectsCount: number;
  pendingRequestsCount: number;
  openLeadsCount: number;
  pendingQuotationsCount: number;
}

export interface ProfessionalActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'REQUEST_RESPONSE' | 'QUOTATION_SUBMISSION' | 'CUSTOMER_RESPONSE' | 'MILESTONE_ACTION';
  targetRoute: string;
  targetId: string;
  actionLabel: string;
}

export interface MobileProfessionalRequest {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone?: string;
  serviceCategory: string;
  status: ProfessionalRequestStatus;
  statusLabel: string;
  submittedDate: string;
  budgetFormatted?: string;
  preferredTimeline?: string;
  location?: string;
  notes?: string;
  isActionable: boolean;
}

export interface MobileProfessionalLead {
  id: string;
  title: string;
  category: string;
  location: string;
  budgetFormatted: string;
  postedDate: string;
  status: string;
}

export interface MobileProfessionalProject {
  id: string;
  title: string;
  customerName: string;
  status: string;
  statusLabel: string;
  progressPercentage: number;
  currentMilestoneName: string;
  startDate: string;
  totalBudgetFormatted: string;
}

export interface ProfessionalDashboardOverview {
  metrics: ProfessionalDashboardMetrics;
  actionItems: ProfessionalActionItem[];
  activeProjects: MobileProfessionalProject[];
  recentRequests: MobileProfessionalRequest[];
  openLeads: MobileProfessionalLead[];
  recentActivity: { date: string; title: string; desc: string }[];
}
