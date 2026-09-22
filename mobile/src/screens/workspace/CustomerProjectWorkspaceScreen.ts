/**
 * Mobile Customer Project Workspace Screen Component & Controller for DBC Mobile Application.
 * Displays project overview, contractor partner bio, milestone progress timeline %, and document repository.
 */

import { mobileCustomerWorkspaceService } from '../../services/mobileCustomerWorkspaceService';
import { mobileTheme } from '../../theme/themeTokens';
import { MobileCustomerProject } from '../../types/customerWorkspaceMobileTypes';
import { Project, ProjectDocument, ProjectMilestone } from '../../src/types/contractor/ProjectTypes';

export interface CustomerProjectWorkspaceState {
  projectId: string;
  project: Project | null;
  mobile: MobileCustomerProject | null;
  activeTab: 'Overview' | 'Timeline' | 'Milestones' | 'Documents' | 'Financials';
  isLoading: boolean;
  errorMessage: string | null;
}

export class CustomerProjectWorkspaceController {
  private state: CustomerProjectWorkspaceState;

  constructor(projectId: string = '') {
    this.state = {
      projectId,
      project: null,
      mobile: null,
      activeTab: 'Overview',
      isLoading: false,
      errorMessage: null,
    };
  }

  getState(): CustomerProjectWorkspaceState {
    return { ...this.state };
  }

  setActiveTab(tab: CustomerProjectWorkspaceState['activeTab']) {
    this.state.activeTab = tab;
  }

  async loadProjectWorkspace(id?: string): Promise<void> {
    const targetId = id || this.state.projectId;
    if (!targetId) return;

    this.state.projectId = targetId;
    this.state.isLoading = true;
    this.state.errorMessage = null;

    try {
      const { project, mobile } = await mobileCustomerWorkspaceService.getProjectDetails(targetId);
      this.state.project = project;
      this.state.mobile = mobile;
    } catch (err: unknown) {
      this.state.errorMessage = err instanceof Error ? err.message : 'Unable to load project workspace details';
    } finally {
      this.state.isLoading = false;
    }
  }
}

export const renderCustomerProjectWorkspaceScreenDescriptor = (state: CustomerProjectWorkspaceState) => ({
  type: 'Screen',
  name: 'CustomerProjectWorkspaceScreen',
  styles: {
    backgroundColor: mobileTheme.colors.background,
    padding: mobileTheme.spacing.lg,
  },
  header: {
    title: state.mobile?.title || `Project #${state.projectId}`,
    statusBadge: {
      status: state.mobile?.status || 'IN_PROGRESS',
      label: state.mobile?.statusLabel || 'In Progress',
    },
    progressPercentage: state.mobile?.progressPercentage || 0,
    providerName: state.mobile?.providerName || 'Contractor Partner',
  },
  tabs: [
    { key: 'Overview', label: 'Overview' },
    { key: 'Timeline', label: 'Timeline' },
    { key: 'Milestones', label: 'Milestones' },
    { key: 'Documents', label: 'Documents' },
    { key: 'Financials', label: 'Financials' },
  ],
  activeTab: state.activeTab,
  overviewContent: {
    contractorCard: {
      name: state.mobile?.providerName || 'Contractor Partner',
      city: state.mobile?.startDate || 'Pan India',
      rating: 4.9,
    },
    progressCard: {
      progressPercentage: state.mobile?.progressPercentage || 0,
      currentMilestone: state.mobile?.currentMilestoneName || 'Execution Setup',
    },
    financialCard: {
      totalBudget: state.mobile?.totalBudgetFormatted || 'Quotation Contract',
    },
  },
  milestonesContent: (state.project?.milestones || []).map((m: ProjectMilestone, idx: number) => ({
    index: idx + 1,
    id: m.id,
    name: m.name,
    status: m.status,
    completionPercentage: m.completionPercentage,
    budgetFormatted: `₹${m.budgetAllocation.toLocaleString()}`,
  })),
  documentsContent: (state.project?.documents || []).map((d: ProjectDocument) => ({
    id: d.id,
    name: d.name,
    fileType: d.fileType || 'PDF',
    uploadedAt: d.createdAt,
    fileUrl: d.fileUrl,
  })),
  loader: state.isLoading,
  errorBanner: state.errorMessage,
});
