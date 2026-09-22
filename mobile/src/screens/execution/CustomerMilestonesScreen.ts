/**
 * Mobile Customer Milestones Screen Component & Controller for DBC Mobile Application.
 * Displays milestone cards with status badges (PENDING, IN_PROGRESS, COMPLETED, APPROVED),
 * completion percentage, budget allocation, planned dates, and milestone detail links.
 */

import { mobileProjectExecutionService } from '../../services/mobileProjectExecutionService';
import { mobileTheme } from '../../theme/themeTokens';
import { MobileMilestoneItem } from '../../types/projectExecutionMobileTypes';

export interface CustomerMilestonesState {
  projectId: string;
  milestones: MobileMilestoneItem[];
  isLoading: boolean;
  errorMessage: string | null;
}

export class CustomerMilestonesController {
  private state: CustomerMilestonesState;

  constructor(projectId: string = '') {
    this.state = {
      projectId,
      milestones: [],
      isLoading: false,
      errorMessage: null,
    };
  }

  getState(): CustomerMilestonesState {
    return { ...this.state };
  }

  async loadMilestones(id?: string): Promise<void> {
    const targetId = id || this.state.projectId;
    if (!targetId) return;

    this.state.projectId = targetId;
    this.state.isLoading = true;
    this.state.errorMessage = null;

    try {
      this.state.milestones = await mobileProjectExecutionService.getProjectMilestones(targetId);
    } catch (err: unknown) {
      this.state.errorMessage = err instanceof Error ? err.message : 'Unable to load project milestones';
    } finally {
      this.state.isLoading = false;
    }
  }
}

export const renderCustomerMilestonesScreenDescriptor = (state: CustomerMilestonesState) => ({
  type: 'Screen',
  name: 'CustomerMilestonesScreen',
  styles: {
    backgroundColor: mobileTheme.colors.background,
    padding: mobileTheme.spacing.lg,
  },
  header: {
    title: 'Project Milestones',
    subtitle: 'Track phase progress, completion status, and milestone approvals',
  },
  milestoneCards: state.milestones.map((m, idx) => ({
    index: idx + 1,
    id: m.id,
    name: m.name,
    description: m.description,
    status: m.status,
    statusLabel: m.statusLabel,
    completionPercentage: m.completionPercentage,
    budgetFormatted: m.budgetFormatted,
    plannedStart: m.plannedStart,
    plannedEnd: m.plannedEnd,
    hasPendingApproval: m.hasPendingApproval,
    actionLabel: 'View Milestone Details',
    minHeight: mobileTheme.touchTargets.buttonHeight,
  })),
  emptyState: !state.isLoading && state.milestones.length === 0 ? {
    title: 'No milestones defined yet.',
    subtitle: 'Project milestones will appear here as work progresses.',
  } : null,
  loader: state.isLoading,
  errorBanner: state.errorMessage,
});
