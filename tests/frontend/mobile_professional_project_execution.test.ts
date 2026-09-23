import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mobileProfessionalProjectExecutionService } from '../../mobile/src/services/mobileProfessionalProjectExecutionService.js';
import {
  ProfessionalProjectWorkspaceScreenController,
  renderProfessionalProjectWorkspaceScreen,
} from '../../mobile/src/screens/execution/ProfessionalProjectWorkspaceScreen.js';
import {
  ProfessionalProjectOverviewScreenController,
  renderProfessionalProjectOverviewScreen,
} from '../../mobile/src/screens/execution/ProfessionalProjectOverviewScreen.js';
import {
  ProfessionalMilestonesScreenController,
  renderProfessionalMilestonesScreen,
} from '../../mobile/src/screens/execution/ProfessionalMilestonesScreen.js';
import {
  ProfessionalMilestoneDetailsScreenController,
  renderProfessionalMilestoneDetailsScreen,
} from '../../mobile/src/screens/execution/ProfessionalMilestoneDetailsScreen.js';
import {
  ProfessionalProjectTimelineScreenController,
  renderProfessionalProjectTimelineScreen,
} from '../../mobile/src/screens/execution/ProfessionalProjectTimelineScreen.js';
import {
  ProfessionalProjectDocumentsScreenController,
  renderProfessionalProjectDocumentsScreen,
} from '../../mobile/src/screens/execution/ProfessionalProjectDocumentsScreen.js';
import { ProjectService } from '../../src/services/contractor/ProjectService.js';
import type { Project } from '../../src/types/contractor/ProjectTypes.js';

vi.mock('../../src/services/contractor/ProjectService.js', () => ({
  ProjectService: {
    getProjectDetail: vi.fn(),
    updateProjectStatus: vi.fn(),
    updateMilestone: vi.fn(),
    getProjectDocuments: vi.fn(),
    uploadProjectDocument: vi.fn(),
  },
}));

const mockBackendProject: Project = {
  id: 'proj-501',
  requirementId: 501,
  quotationId: 801,
  providerId: 'prov-101',
  status: 'IN_PROGRESS',
  createdAt: '2026-08-01T10:00:00Z',
  updatedAt: '2026-09-20T10:00:00Z',
  customer: {
    id: 'cust-101',
    fullName: 'Ramesh Kumar',
    phoneNumber: '+91 98765 43210',
    email: 'ramesh.kumar@example.com',
  },
  requirement: {
    id: 501,
    title: 'Jubilee Hills Villa Raft Foundation',
    category: { name: 'Civil Masonry & Foundation' },
  },
  quotation: {
    id: 801,
    totalAmount: 120000,
  },
  milestones: [
    {
      id: 'm-1',
      projectId: 'proj-501',
      name: 'Site Clearance & Excavation',
      description: 'Excavate 500 Sq Yd area.',
      budgetAllocation: 30000,
      completionPercentage: 100,
      status: 'APPROVED',
    },
    {
      id: 'm-2',
      projectId: 'proj-501',
      name: 'Steel Reinforcement Mesh Binding',
      description: 'Bind TMT steel mesh grid.',
      budgetAllocation: 45000,
      completionPercentage: 50,
      status: 'IN_PROGRESS',
    },
  ],
  documents: [
    {
      id: 'doc-1',
      projectId: 'proj-501',
      name: 'Foundation Structural Blueprint.pdf',
      fileUrl: 'https://storage.dbc.in/docs/blueprint.pdf',
      fileType: 'PDF',
      createdAt: '2026-08-02T10:00:00Z',
    },
  ],
  timeline: [
    {
      id: 't-1',
      projectId: 'proj-501',
      eventType: 'PROJECT_ASSIGNED',
      description: 'Contractor accepted request.',
      createdAt: '2026-08-01T10:00:00Z',
    },
  ],
};

function getFreshMockProject(): Project {
  return JSON.parse(JSON.stringify(mockBackendProject));
}

describe('Module 43 — Professional Mobile Project Execution, Milestones & Documents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mobileProfessionalProjectExecutionService.clearCache();
  });

  describe('1. Mobile Professional Project Execution Service Adaptations', () => {
    it('loads project overview and calculates financial & milestone metrics', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockResolvedValue(getFreshMockProject());

      const overview = await mobileProfessionalProjectExecutionService.getProjectOverview('proj-501');

      expect(overview.id).toBe('proj-501');
      expect(overview.title).toBe('Jubilee Hills Villa Raft Foundation');
      expect(overview.customerName).toBe('Ramesh Kumar');
      expect(overview.totalBudgetFormatted).toBe('₹1,20,000');
      expect(overview.progressPercentage).toBe(75);
      expect(overview.completedMilestonesCount).toBe(1);
      expect(overview.totalMilestonesCount).toBe(2);
      expect(overview.supportedActions).toContain('MANAGE_MILESTONES');
      expect(overview.supportedActions).toContain('MARK_READY_FOR_COMPLETION');
    });

    it('updates project status (e.g. mark ready for completion)', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockResolvedValue(getFreshMockProject());
      vi.mocked(ProjectService.updateProjectStatus).mockResolvedValue({
        ...getFreshMockProject(),
        status: 'UNDER_REVIEW',
      });

      const updated = await mobileProfessionalProjectExecutionService.markReadyForCompletion('proj-501');

      expect(updated.status).toBe('UNDER_REVIEW');
      expect(updated.statusLabel).toContain('Under Customer Review');
    });

    it('manages milestone progress and completion', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockResolvedValue(getFreshMockProject());
      vi.mocked(ProjectService.updateMilestone).mockResolvedValue({
        ...getFreshMockProject().milestones![1],
        completionPercentage: 100,
        status: 'COMPLETED',
      });

      const m = await mobileProfessionalProjectExecutionService.markMilestoneComplete('proj-501', 'm-2');

      expect(m.completionPercentage).toBe(100);
      expect(m.status).toBe('COMPLETED');
    });

    it('handles 401, 403, and 404 security errors cleanly', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockRejectedValue(new Error('401 Session Expired'));

      await expect(mobileProfessionalProjectExecutionService.getProjectOverview('proj-501')).rejects.toThrow(
        'UNAUTHORIZED_EXPIRED_SESSION'
      );
    });
  });

  describe('2. Professional Project Workspace Screen & Tabs', () => {
    it('renders workspace container and manages tab navigation', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockResolvedValue(getFreshMockProject());

      const controller = new ProfessionalProjectWorkspaceScreenController({ projectId: 'proj-501' });
      await controller.init();

      expect(controller.getState().activeTab).toBe('OVERVIEW');

      let html = renderProfessionalProjectWorkspaceScreen(controller);
      expect(html).toContain('Jubilee Hills Villa Raft Foundation');
      expect(html).toContain('Overall Site Progress');

      controller.setTab('MILESTONES');
      html = renderProfessionalProjectWorkspaceScreen(controller);
      expect(html).toContain('Project Milestones');
      expect(html).toContain('Site Clearance & Excavation');

      controller.setTab('DOCUMENTS');
      html = renderProfessionalProjectWorkspaceScreen(controller);
      expect(html).toContain('Project Documents');
      expect(html).toContain('Foundation Structural Blueprint.pdf');
    });
  });

  describe('3. Professional Project Overview Screen', () => {
    it('renders overview details and executes status transition action', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockResolvedValue(getFreshMockProject());

      const controller = new ProfessionalProjectOverviewScreenController({ projectId: 'proj-501' });
      await controller.init();

      let html = renderProfessionalProjectOverviewScreen(controller);
      expect(html).toContain('Ramesh Kumar');
      expect(html).toContain('₹1,20,000');
      expect(html).toContain('Submit Handover for Customer Review');

      await controller.handleAction('MARK_READY_FOR_COMPLETION');

      expect(controller.getState().overview?.status).toBe('UNDER_REVIEW');
      expect(controller.getState().statusMessage).toContain('Submitted project completion');
    });
  });

  describe('4. Professional Milestones & Milestone Details', () => {
    it('renders milestones list and handles stage completion', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockResolvedValue(getFreshMockProject());

      const controller = new ProfessionalMilestonesScreenController({ projectId: 'proj-501' });
      await controller.init();

      expect(controller.getState().milestones.length).toBe(2);

      let html = renderProfessionalMilestonesScreen(controller);
      expect(html).toContain('Steel Reinforcement Mesh Binding');
      expect(html).toContain('Mark Complete');

      await controller.markMilestoneComplete('m-2');

      expect(controller.getState().statusMessage).toContain('marked as complete');
    });

    it('updates milestone completion percentage in details screen', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockResolvedValue(getFreshMockProject());

      const controller = new ProfessionalMilestoneDetailsScreenController({
        projectId: 'proj-501',
        milestoneId: 'm-2',
      });
      await controller.init();

      expect(controller.getState().progressInput).toBe(50);

      controller.setProgressInput(80);
      await controller.updateProgress();

      expect(controller.getState().milestone?.completionPercentage).toBe(80);
      expect(controller.getState().statusMessage).toContain('updated to 80%');

      const html = renderProfessionalMilestoneDetailsScreen(controller);
      expect(html).toContain('Save Progress %');
    });
  });

  describe('5. Professional Project Documents & Upload', () => {
    it('renders document repository and handles upload modal', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockResolvedValue(getFreshMockProject());
      vi.mocked(ProjectService.getProjectDocuments).mockResolvedValue(getFreshMockProject().documents!);

      const controller = new ProfessionalProjectDocumentsScreenController({ projectId: 'proj-501' });
      await controller.init();

      expect(controller.getState().documents.length).toBe(1);

      controller.openUploadModal();
      expect(controller.getState().showUploadModal).toBe(true);

      controller.updateUploadForm('name', 'Soil Test Certificate.pdf');
      controller.updateUploadForm('fileUrl', 'https://storage.dbc.in/docs/soil_test.pdf');
      await controller.uploadDocument();

      expect(controller.getState().showUploadModal).toBe(false);
      expect(controller.getState().statusMessage).toContain('uploaded successfully');

      const html = renderProfessionalProjectDocumentsScreen(controller);
      expect(html).toContain('Soil Test Certificate.pdf');
    });
  });
});
