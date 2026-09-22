/**
 * Mobile Customer Home Screen Component & Controller for DBC Mobile Application.
 * Action-oriented dashboard overview: Action Required, Active Requests, Active Projects,
 * Recent Activity log, and touch targets >= 44px.
 */

import { mobileCustomerWorkspaceService } from '../../services/mobileCustomerWorkspaceService';
import { mobileTheme } from '../../theme/themeTokens';
import { CustomerDashboardOverview } from '../../types/customerWorkspaceMobileTypes';

export interface CustomerHomeState {
  overview: CustomerDashboardOverview | null;
  isLoading: boolean;
  errorMessage: string | null;
}

export class CustomerHomeController {
  private state: CustomerHomeState = {
    overview: null,
    isLoading: false,
    errorMessage: null,
  };

  getState(): CustomerHomeState {
    return { ...this.state };
  }

  async loadDashboard(): Promise<void> {
    this.state.isLoading = true;
    this.state.errorMessage = null;

    try {
      this.state.overview = await mobileCustomerWorkspaceService.getCustomerDashboardOverview();
    } catch (err: unknown) {
      this.state.errorMessage = err instanceof Error ? err.message : 'Unable to load customer dashboard';
    } finally {
      this.state.isLoading = false;
    }
  }
}

export const renderCustomerHomeScreenDescriptor = (state: CustomerHomeState) => ({
  type: 'Screen',
  name: 'CustomerHomeScreen',
  styles: {
    backgroundColor: mobileTheme.colors.background,
    padding: mobileTheme.spacing.lg,
  },
  header: {
    title: 'Customer Workspace',
    subtitle: 'Track project requests, quotations, and active construction builds',
  },
  actionRequiredSection: {
    title: 'Action Required',
    items: (state.overview?.actionItems || []).map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      priority: item.priority,
      targetRoute: item.targetRoute,
      targetId: item.targetId,
      actionLabel: item.type === 'QUOTATION_REVIEW' ? 'Review Quotation' : 'View Action',
      minHeight: mobileTheme.touchTargets.buttonHeight,
    })),
    emptyText: 'No pending actions required at this time.',
  },
  activeRequestsSection: {
    title: 'Active Project Requests',
    items: (state.overview?.activeRequests || []).map((req) => ({
      id: req.id,
      bookingNumber: req.bookingNumber,
      providerName: req.providerName,
      categoryName: req.categoryName,
      statusLabel: req.statusLabel,
      submittedDate: req.createdAt ? req.createdAt.split('T')[0] : '',
      actionLabel: 'View Details',
      minHeight: mobileTheme.touchTargets.minTouchArea,
    })),
    emptyText: 'No active project requests.',
    viewAllRoute: 'CustomerRequests',
  },
  activeProjectsSection: {
    title: 'Active Construction Projects',
    items: (state.overview?.activeProjects || []).map((proj) => ({
      id: proj.id,
      title: proj.title,
      providerName: proj.providerName,
      statusLabel: proj.statusLabel,
      progressPercentage: proj.progressPercentage,
      currentMilestone: proj.currentMilestoneName,
      actionLabel: 'Open Project Workspace',
      minHeight: mobileTheme.touchTargets.buttonHeight,
    })),
    emptyText: 'No active construction projects running.',
    viewAllRoute: 'CustomerProjects',
  },
  recentActivitySection: {
    title: 'Recent Activity',
    items: state.overview?.recentActivity || [],
  },
  loader: state.isLoading,
  errorBanner: state.errorMessage,
});
