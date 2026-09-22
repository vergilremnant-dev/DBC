/**
 * DBC Mobile Customer Workspace & Project Tracking Types.
 * Domain models for Customer Dashboard Overview, Active Projects, Action Items, and Milestones.
 */

import { MobileProjectRequestDetails, MobileQuotationDetails } from './requestMobileTypes';
import { ProjectStatus } from '../../src/types/contractor/ProjectTypes';

export type CustomerWorkspaceTab = 'Home' | 'Requests' | 'Projects' | 'Messages' | 'Profile';

export interface MobileActionItem {
  id: string;
  type: 'QUOTATION_REVIEW' | 'MILESTONE_APPROVAL' | 'PROJECT_UPDATE' | 'ACTION_REQUIRED';
  title: string;
  description: string;
  targetRoute: string;
  targetId: string | number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
}

export interface MobileCustomerProject {
  id: string;
  requirementId?: number;
  quotationId?: number;
  title: string;
  providerId: string;
  providerName: string;
  providerRating?: number;
  categoryName: string;
  status: ProjectStatus;
  statusLabel: string;
  progressPercentage: number;
  currentMilestoneName?: string;
  totalBudgetFormatted?: string;
  startDate?: string;
  updatedAt: string;
}

export interface CustomerDashboardOverview {
  actionItems: MobileActionItem[];
  activeRequests: MobileProjectRequestDetails[];
  activeProjects: MobileCustomerProject[];
  recentActivity: {
    id: string;
    title: string;
    description: string;
    timestamp: string;
  }[];
  unreadMessagesCount: number;
}
