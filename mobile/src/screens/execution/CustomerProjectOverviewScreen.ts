/**
 * Mobile Customer Project Overview Screen Component & Controller for DBC Mobile Application.
 * Displays project status badge, contractor partner info, overall progress percentage bar,
 * current milestone, start date, next milestone, and section navigation tabs.
 */

import { mobileProjectExecutionService } from '../../services/mobileProjectExecutionService';
import { mobileTheme } from '../../theme/themeTokens';
import { MobileProjectOverview } from '../../types/projectExecutionMobileTypes';

export interface CustomerProjectOverviewState {
  projectId: string;
  overview: MobileProjectOverview | null;
  isLoading: boolean;
  errorMessage: string | null;
}

export class CustomerProjectOverviewController {
  private state: CustomerProjectOverviewState;

  constructor(projectId: string = '') {
    this.state = {
      projectId,
      overview: null,
      isLoading: false,
      errorMessage: null,
    };
  }

  getState(): CustomerProjectOverviewState {
    return { ...this.state };
  }

  async loadOverview(id?: string): Promise<void> {
    const targetId = id || this.state.projectId;
    if (!targetId) return;

    this.state.projectId = targetId;
    this.state.isLoading = true;
    this.state.errorMessage = null;

    try {
      this.state.overview = await mobileProjectExecutionService.getProjectOverview(targetId);
    } catch (err: unknown) {
      this.state.errorMessage = err instanceof Error ? err.message : 'Unable to load project overview';
    } finally {
      this.state.isLoading = false;
    }
  }
}

export const renderCustomerProjectOverviewScreenDescriptor = (state: CustomerProjectOverviewState) => ({
  type: 'Screen',
  name: 'CustomerProjectOverviewScreen',
  styles: {
    backgroundColor: mobileTheme.colors.background,
    padding: mobileTheme.spacing.lg,
  },
  header: {
    title: state.overview?.title || `Project #${state.projectId}`,
    statusBadge: {
      status: state.overview?.status || 'IN_PROGRESS',
      label: state.overview?.statusLabel || 'In Progress',
    },
    providerName: state.overview?.providerName || 'Contractor Partner',
    rating: state.overview?.providerRating || 4.9,
    city: state.overview?.providerCity || 'Hyderabad',
  },
  progressCard: {
    title: 'Overall Construction Progress',
    percentage: state.overview?.progressPercentage || 0,
    currentMilestone: state.overview?.currentMilestoneName || 'Initial Setup',
    nextMilestone: state.overview?.nextMilestoneName || 'Next Phase',
    startDate: state.overview?.startDate,
    expectedCompletion: state.overview?.expectedCompletionDate || 'Per Contract Schedule',
  },
  financialSummaryCard: {
    title: 'Contract Budget',
    totalBudgetFormatted: state.overview?.totalBudgetFormatted || 'Quotation Contract',
  },
  pendingApprovalBanner: state.overview?.hasPendingApproval ? {
    title: 'Milestone Approval Required',
    notice: 'A project milestone requires customer review and approval.',
    buttonLabel: 'Review Milestone Approval',
    minHeight: mobileTheme.touchTargets.buttonHeight,
  } : null,
  sectionTabs: [
    { label: 'Milestones', route: 'CustomerMilestones' },
    { label: 'Timeline', route: 'CustomerProjectTimeline' },
    { label: 'Documents', route: 'CustomerProjectDocuments' },
  ],
  loader: state.isLoading,
  errorBanner: state.errorMessage,
});
