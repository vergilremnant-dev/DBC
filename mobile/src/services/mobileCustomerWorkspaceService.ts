/**
 * DBC Mobile Customer Workspace & Project Tracking Service.
 * Integrates with ProjectService, bookingApi, and quotationClientService for customer workspace views.
 */

import { ProjectService } from '../../../src/services/contractor/ProjectService';
import { bookingApi } from '../../../src/services/booking/bookingService';
import { quotationClientService } from '../../../src/services/quotation/quotationClientService';
import { Project, ProjectStatus } from '../../../src/types/contractor/ProjectTypes';
import { mobileRequestService, formatCurrency } from './mobileRequestService';
import {
  CustomerDashboardOverview,
  MobileActionItem,
  MobileCustomerProject,
} from '../types/customerWorkspaceMobileTypes';
import { MobileProjectRequestDetails } from '../types/requestMobileTypes';

export function formatProjectStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case 'CREATED': return 'Project Initialized';
    case 'ASSIGNED': return 'Contractor Assigned';
    case 'PLANNING': return 'Planning & Prep';
    case 'READY_TO_START': return 'Ready to Start';
    case 'IN_PROGRESS': return 'Execution In Progress';
    case 'ON_HOLD': return 'On Hold';
    case 'BLOCKED': return 'Blocked';
    case 'UNDER_REVIEW': return 'Quality Review';
    case 'CUSTOMER_APPROVAL': return 'Awaiting Customer Approval';
    case 'COMPLETED': return 'Project Completed';
    case 'CLOSED': return 'Closed';
    case 'CANCELLED': return 'Cancelled';
    default: return String(status);
  }
}

function calculateProjectProgress(project: Project): number {
  if (project.status === 'COMPLETED' || project.status === 'CLOSED') {
    return 100;
  }
  if (!project.milestones || project.milestones.length === 0) {
    return project.status === 'IN_PROGRESS' ? 35 : 10;
  }
  const total = project.milestones.reduce((acc, m) => acc + (m.completionPercentage || 0), 0);
  return Math.min(100, Math.round(total / project.milestones.length));
}

function mapProjectToMobileCustomer(project: Project): MobileCustomerProject {
  const currentMilestone = project.milestones?.find((m) => m.status !== 'COMPLETED' && m.status !== 'CLOSED');

  return {
    id: project.id,
    requirementId: project.requirementId,
    quotationId: project.quotationId,
    title: project.requirement?.title || `Project #${project.id}`,
    providerId: project.providerId,
    providerName: project.provider?.businessName || project.provider?.fullName || 'Contractor Partner',
    categoryName: project.requirement?.title || 'Construction Project',
    status: project.status,
    statusLabel: formatProjectStatusLabel(project.status),
    progressPercentage: calculateProjectProgress(project),
    currentMilestoneName: currentMilestone?.name || project.milestones?.[0]?.name || 'Initial Phase Setup',
    totalBudgetFormatted: project.quotation?.totalAmount ? formatCurrency(project.quotation.totalAmount) : undefined,
    startDate: project.createdAt ? project.createdAt.split('T')[0] : undefined,
    updatedAt: project.updatedAt || project.createdAt,
  };
}

export class MobileCustomerWorkspaceService {
  /**
   * Fetches customer dashboard overview: Action Items, Active Requests, Active Projects, Recent Activity.
   */
  async getCustomerDashboardOverview(): Promise<CustomerDashboardOverview> {
    const [requests, projects, quotations] = await Promise.all([
      mobileRequestService.getMyRequests().catch(() => [] as MobileProjectRequestDetails[]),
      this.getCustomerProjects().catch(() => [] as MobileCustomerProject[]),
      quotationClientService.getQuotations({ status: 'SUBMITTED' }).catch(() => []),
    ]);

    const actionItems: MobileActionItem[] = [];

    // Action Item: Pending Quotations
    quotations.forEach((q) => {
      actionItems.push({
        id: `action_quote_${q.id}`,
        type: 'QUOTATION_REVIEW',
        title: 'New Quotation Proposal Ready',
        description: `${q.provider?.businessName || 'Contractor Partner'} submitted a proposal of ${formatCurrency(q.totalAmount)}`,
        targetRoute: 'QuotationDetails',
        targetId: q.id,
        priority: 'HIGH',
        createdAt: q.createdAt,
      });
    });

    // Action Item: Project Approvals
    projects.filter((p) => p.status === 'CUSTOMER_APPROVAL').forEach((p) => {
      actionItems.push({
        id: `action_proj_${p.id}`,
        type: 'MILESTONE_APPROVAL',
        title: 'Project Milestone Approval Required',
        description: `${p.title} has completed a milestone phase ready for review.`,
        targetRoute: 'CustomerProjectWorkspace',
        targetId: p.id,
        priority: 'HIGH',
        createdAt: p.updatedAt,
      });
    });

    const activeRequests = requests.filter((r) => r.status === 'REQUESTED' || r.status === 'ACCEPTED');
    const activeProjects = projects.filter((p) => p.status !== 'CLOSED' && p.status !== 'CANCELLED');

    const recentActivity = [
      ...requests.slice(0, 3).map((r) => ({
        id: `act_req_${r.id}`,
        title: `Request ${r.bookingNumber}`,
        description: `Status: ${r.statusLabel} for ${r.providerName}`,
        timestamp: r.updatedAt || r.createdAt,
      })),
      ...projects.slice(0, 3).map((p) => ({
        id: `act_proj_${p.id}`,
        title: p.title,
        description: `Progress: ${p.progressPercentage}% (${p.statusLabel})`,
        timestamp: p.updatedAt,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

    return {
      actionItems,
      activeRequests,
      activeProjects,
      recentActivity,
      unreadMessagesCount: 0,
    };
  }

  /**
   * Clears any local cache for testing or session resets.
   */
  clearCache(): void {}

  async getMyProjects(status?: string): Promise<MobileCustomerProject[]> {
    return this.getCustomerProjects(status);
  }

  /**
   * Retrieves customer projects list.
   */
  async getCustomerProjects(status?: string): Promise<MobileCustomerProject[]> {
    try {
      const projects = await ProjectService.listProjects(status);
      return projects.map(mapProjectToMobileCustomer);
    } catch (err) {
      if (err instanceof Error && (err.message.includes('401') || err.message.includes('403') || err.message.includes('Access denied'))) {
        throw err;
      }
      return [];
    }
  }

  /**
   * Retrieves detailed project workspace data by ID.
   */
  async getProjectDetails(id: string): Promise<{ project: Project; mobile: MobileCustomerProject }> {
    const project = await ProjectService.getProjectDetail(id);
    return {
      project,
      mobile: mapProjectToMobileCustomer(project),
    };
  }
}

export const mobileCustomerWorkspaceService = new MobileCustomerWorkspaceService();
