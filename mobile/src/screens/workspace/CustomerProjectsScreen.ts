/**
 * Mobile Customer Projects Screen Component & Controller for DBC Mobile Application.
 * Displays active and historical construction projects created from accepted quotations.
 */

import { mobileCustomerWorkspaceService } from '../../services/mobileCustomerWorkspaceService';
import { mobileTheme } from '../../theme/themeTokens';
import { MobileCustomerProject } from '../../types/customerWorkspaceMobileTypes';

export interface CustomerProjectsState {
  projects: MobileCustomerProject[];
  isLoading: boolean;
  errorMessage: string | null;
}

export class CustomerProjectsController {
  private state: CustomerProjectsState = {
    projects: [],
    isLoading: false,
    errorMessage: null,
  };

  getState(): CustomerProjectsState {
    return { ...this.state };
  }

  async loadProjects(): Promise<void> {
    this.state.isLoading = true;
    this.state.errorMessage = null;

    try {
      this.state.projects = await mobileCustomerWorkspaceService.getCustomerProjects();
    } catch (err: unknown) {
      this.state.errorMessage = err instanceof Error ? err.message : 'Unable to load active projects';
    } finally {
      this.state.isLoading = false;
    }
  }
}

export const renderCustomerProjectsScreenDescriptor = (state: CustomerProjectsState) => ({
  type: 'Screen',
  name: 'CustomerProjectsScreen',
  styles: {
    backgroundColor: mobileTheme.colors.background,
    padding: mobileTheme.spacing.lg,
  },
  header: {
    title: 'My Projects',
    subtitle: 'Track active construction builds, milestones, and project execution progress',
  },
  projectCards: state.projects.map((proj) => ({
    id: proj.id,
    title: proj.title,
    providerName: proj.providerName,
    categoryName: proj.categoryName,
    status: proj.status,
    statusLabel: proj.statusLabel,
    progressPercentage: proj.progressPercentage,
    currentMilestone: proj.currentMilestoneName,
    budgetFormatted: proj.totalBudgetFormatted || 'Quotation Contract',
    startDate: proj.startDate,
    actionLabel: 'Open Project Workspace',
    minHeight: mobileTheme.touchTargets.buttonHeight,
  })),
  emptyState: !state.isLoading && state.projects.length === 0 ? {
    title: 'No active projects yet.',
    subtitle: 'Your active projects will appear here once a contractor quotation proposal is accepted.',
    ctaLabel: 'View Project Requests',
    targetRoute: 'CustomerRequests',
    minHeight: mobileTheme.touchTargets.buttonHeight,
  } : null,
  loader: state.isLoading,
  errorBanner: state.errorMessage,
});
