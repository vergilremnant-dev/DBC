/**
 * Mobile Customer Milestone Details Screen Component & Controller for DBC Mobile Application.
 * Displays milestone scope, description, progress %, dates, budget, and "Approve Milestone" action.
 */

import { mobileProjectExecutionService } from '../../services/mobileProjectExecutionService';
import { mobileTheme } from '../../theme/themeTokens';
import { MobileMilestoneItem } from '../../types/projectExecutionMobileTypes';

export interface CustomerMilestoneDetailsState {
  projectId: string;
  milestoneId: string;
  milestone: MobileMilestoneItem | null;
  isLoading: boolean;
  isApproving: boolean;
  errorMessage: string | null;
  successMessage: string | null;
}

export class CustomerMilestoneDetailsController {
  private state: CustomerMilestoneDetailsState;

  constructor(projectId: string = '', milestoneId: string = '') {
    this.state = {
      projectId,
      milestoneId,
      milestone: null,
      isLoading: false,
      isApproving: false,
      errorMessage: null,
      successMessage: null,
    };
  }

  getState(): CustomerMilestoneDetailsState {
    return { ...this.state };
  }

  async loadMilestone(projectId?: string, milestoneId?: string): Promise<void> {
    const pId = projectId || this.state.projectId;
    const mId = milestoneId || this.state.milestoneId;
    if (!pId || !mId) return;

    this.state.projectId = pId;
    this.state.milestoneId = mId;
    this.state.isLoading = true;
    this.state.errorMessage = null;

    try {
      this.state.milestone = await mobileProjectExecutionService.getMilestoneDetails(pId, mId);
    } catch (err: unknown) {
      this.state.errorMessage = err instanceof Error ? err.message : 'Unable to load milestone details';
    } finally {
      this.state.isLoading = false;
    }
  }

  async approveMilestone(): Promise<boolean> {
    const m = this.state.milestone;
    if (!m || !m.approvalId || this.state.isApproving) return false;

    this.state.isApproving = true;
    this.state.errorMessage = null;

    try {
      await mobileProjectExecutionService.approveMilestone(this.state.projectId, m.approvalId);
      this.state.successMessage = 'Milestone approved successfully!';
      await this.loadMilestone(); // Refresh milestone data after approval
      return true;
    } catch (err: unknown) {
      this.state.errorMessage = err instanceof Error ? err.message : 'Failed to approve milestone';
      return false;
    } finally {
      this.state.isApproving = false;
    }
  }
}

export const renderCustomerMilestoneDetailsScreenDescriptor = (state: CustomerMilestoneDetailsState) => ({
  type: 'Screen',
  name: 'CustomerMilestoneDetailsScreen',
  styles: {
    backgroundColor: mobileTheme.colors.background,
    padding: mobileTheme.spacing.lg,
  },
  header: {
    title: state.milestone?.name || `Milestone #${state.milestoneId}`,
    statusBadge: {
      status: state.milestone?.status || 'PENDING',
      label: state.milestone?.statusLabel || 'Pending',
    },
    completionPercentage: state.milestone?.completionPercentage || 0,
  },
  detailsSection: {
    title: 'Scope & Description',
    description: state.milestone?.description || 'No detailed scope description provided for this milestone phase.',
    budgetFormatted: state.milestone?.budgetFormatted || '₹0',
    plannedStart: state.milestone?.plannedStart,
    plannedEnd: state.milestone?.plannedEnd,
    actualStart: state.milestone?.actualStart,
    actualEnd: state.milestone?.actualEnd,
  },
  approvalActionCard: state.milestone?.hasPendingApproval ? {
    title: 'Customer Approval Requested',
    notice: 'The contractor partner has completed phase execution and requested your approval.',
    approveButton: {
      label: state.isApproving ? 'Approving Milestone...' : 'Approve Milestone Phase',
      disabled: state.isApproving,
      minHeight: mobileTheme.touchTargets.buttonHeight,
      backgroundColor: mobileTheme.colors.success,
    },
  } : null,
  loader: state.isLoading,
  errorBanner: state.errorMessage,
  successBanner: state.successMessage,
});
