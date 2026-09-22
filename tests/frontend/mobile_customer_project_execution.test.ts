import { describe, it, expect, beforeEach, vi } from 'vitest';

import { MemoryStorageAdapter } from '../../mobile/src/storage/StorageAdapter';
import { MobileAuthStore } from '../../mobile/src/state/authStore';
import { mobileProjectExecutionService, formatMilestoneStatusLabel } from '../../mobile/src/services/mobileProjectExecutionService';
import { ProjectService } from '../../src/services/contractor/ProjectService';
import { CustomerProjectOverviewController, renderCustomerProjectOverviewScreenDescriptor } from '../../mobile/src/screens/execution/CustomerProjectOverviewScreen';
import { CustomerMilestonesController, renderCustomerMilestonesScreenDescriptor } from '../../mobile/src/screens/execution/CustomerMilestonesScreen';
import { CustomerMilestoneDetailsController, renderCustomerMilestoneDetailsScreenDescriptor } from '../../mobile/src/screens/execution/CustomerMilestoneDetailsScreen';
import { CustomerProjectTimelineController, renderCustomerProjectTimelineScreenDescriptor } from '../../mobile/src/screens/execution/CustomerProjectTimelineScreen';
import { CustomerProjectDocumentsController, renderCustomerProjectDocumentsScreenDescriptor } from '../../mobile/src/screens/execution/CustomerProjectDocumentsScreen';

vi.mock('../../src/services/contractor/ProjectService', () => ({
  ProjectService: {
    getProjectDetail: vi.fn(),
    getProjectDocuments: vi.fn(),
    resolveApproval: vi.fn(),
  },
}));

describe('Module 38 — Customer Mobile Project Execution, Milestones & Documents Test Suite', () => {
  let memoryStorage: MemoryStorageAdapter;
  let authStore: MobileAuthStore;

  beforeEach(() => {
    vi.clearAllMocks();
    memoryStorage = new MemoryStorageAdapter();
    authStore = new MobileAuthStore(memoryStorage);
  });

  describe('1. Milestone Status Helper Resolution', () => {
    it('should map milestone statuses to human readable labels', () => {
      expect(formatMilestoneStatusLabel('PENDING')).toBe('Pending Start');
      expect(formatMilestoneStatusLabel('IN_PROGRESS')).toBe('In Progress');
      expect(formatMilestoneStatusLabel('APPROVED')).toBe('Approved by Customer');
    });
  });

  describe('2. Project Overview Screen Workflows', () => {
    it('should load project overview, progress %, contractor info, and pending approval banner', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockResolvedValueOnce({
        id: 'proj_500',
        requirementId: 201,
        customerId: 'cust_10',
        providerId: 'pro_99',
        quotationId: 801,
        status: 'IN_PROGRESS',
        createdAt: '2026-09-10T08:00:00Z',
        updatedAt: '2026-09-22T10:00:00Z',
        provider: { id: 'pro_99', businessName: 'BuildCraft Engineering', fullName: 'BuildCraft' },
        requirement: { id: 201, title: 'Luxury Villa Renovation', description: 'Desc', location: 'Hyderabad' },
        quotation: { id: 801, totalAmount: 750000 },
        milestones: [
          { id: 'm1', projectId: 'proj_500', name: 'Phase 1: Civil Works', completionPercentage: 100, budgetAllocation: 250000, status: 'APPROVED', createdAt: '' },
          { id: 'm2', projectId: 'proj_500', name: 'Phase 2: Electrical & Plumbing', completionPercentage: 60, budgetAllocation: 250000, status: 'IN_PROGRESS', createdAt: '' },
        ],
        approvals: [
          { id: 'app_1', projectId: 'proj_500', approverId: 'cust_10', targetType: 'MILESTONE', targetId: 'm2', status: 'PENDING', createdAt: '', updatedAt: '' },
        ],
      });

      const controller = new CustomerProjectOverviewController('proj_500');
      await controller.loadOverview();

      const state = controller.getState();
      expect(state.overview?.providerName).toBe('BuildCraft Engineering');
      expect(state.overview?.progressPercentage).toBe(80); // (100 + 60)/2
      expect(state.overview?.hasPendingApproval).toBe(true);

      const descriptor = renderCustomerProjectOverviewScreenDescriptor(state);
      expect(descriptor.name).toBe('CustomerProjectOverviewScreen');
      expect(descriptor.pendingApprovalBanner).not.toBeNull();
      expect(descriptor.pendingApprovalBanner?.title).toContain('Milestone Approval Required');
    });
  });

  describe('3. Customer Milestones & Detail Workflows', () => {
    it('should render milestone list with completion percentages and budget allocations', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockResolvedValueOnce({
        id: 'proj_500',
        requirementId: 201,
        customerId: 'cust_10',
        providerId: 'pro_99',
        quotationId: 801,
        status: 'IN_PROGRESS',
        createdAt: '2026-09-10T08:00:00Z',
        updatedAt: '2026-09-22T10:00:00Z',
        milestones: [
          { id: 'm1', projectId: 'proj_500', name: 'Foundation Work', completionPercentage: 100, budgetAllocation: 300000, status: 'APPROVED', createdAt: '' },
          { id: 'm2', projectId: 'proj_500', name: 'Brick Masonry', completionPercentage: 40, budgetAllocation: 200000, status: 'IN_PROGRESS', createdAt: '' },
        ],
      });

      const controller = new CustomerMilestonesController('proj_500');
      await controller.loadMilestones();

      const state = controller.getState();
      expect(state.milestones.length).toBe(2);
      expect(state.milestones[0].budgetFormatted).toContain('3,00,000');

      const descriptor = renderCustomerMilestonesScreenDescriptor(state);
      expect(descriptor.milestoneCards.length).toBe(2);
      expect(descriptor.milestoneCards[0].name).toBe('Foundation Work');
    });

    it('should load milestone details and process customer milestone approval action', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockResolvedValue({
        id: 'proj_500',
        requirementId: 201,
        customerId: 'cust_10',
        providerId: 'pro_99',
        quotationId: 801,
        status: 'IN_PROGRESS',
        createdAt: '2026-09-10T08:00:00Z',
        updatedAt: '2026-09-22T10:00:00Z',
        milestones: [
          { id: 'm2', projectId: 'proj_500', name: 'Brick Masonry', description: 'Wall construction', completionPercentage: 100, budgetAllocation: 200000, status: 'IN_PROGRESS', createdAt: '' },
        ],
        approvals: [
          { id: 'app_99', projectId: 'proj_500', approverId: 'cust_10', targetType: 'MILESTONE', targetId: 'm2', status: 'PENDING', createdAt: '', updatedAt: '' },
        ],
      });
      vi.mocked(ProjectService.resolveApproval).mockResolvedValueOnce({ success: true } as any);

      const controller = new CustomerMilestoneDetailsController('proj_500', 'm2');
      await controller.loadMilestone();

      const state = controller.getState();
      expect(state.milestone?.hasPendingApproval).toBe(true);
      expect(state.milestone?.approvalId).toBe('app_99');

      const descriptor = renderCustomerMilestoneDetailsScreenDescriptor(state);
      expect(descriptor.approvalActionCard).not.toBeNull();

      const approveSuccess = await controller.approveMilestone();
      expect(approveSuccess).toBe(true);
      expect(ProjectService.resolveApproval).toHaveBeenCalledWith('proj_500', expect.objectContaining({
        approvalId: 'app_99',
        isApproved: true,
      }));
      expect(controller.getState().successMessage).toContain('approved');
    });
  });

  describe('4. Customer Project Timeline Workflows', () => {
    it('should render chronological activity events and handle empty timeline state', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockResolvedValueOnce({
        id: 'proj_500',
        requirementId: 201,
        customerId: 'cust_10',
        providerId: 'pro_99',
        quotationId: 801,
        status: 'IN_PROGRESS',
        createdAt: '2026-09-10T08:00:00Z',
        updatedAt: '2026-09-22T10:00:00Z',
        timeline: [
          { id: 't1', projectId: 'proj_500', actorId: 'u1', eventType: 'PROJECT_STARTED', description: 'Project commenced on site', createdAt: '2026-09-10T09:00:00Z', actor: { id: 'u1', email: 'pro@dbc.com' } },
          { id: 't2', projectId: 'proj_500', actorId: 'u1', eventType: 'MILESTONE_COMPLETED', description: 'Phase 1 completed', createdAt: '2026-09-18T14:00:00Z', actor: { id: 'u1', email: 'pro@dbc.com' } },
        ],
      });

      const controller = new CustomerProjectTimelineController('proj_500');
      await controller.loadTimeline();

      const state = controller.getState();
      expect(state.events.length).toBe(2);

      const descriptor = renderCustomerProjectTimelineScreenDescriptor(state);
      expect(descriptor.timelineEvents.length).toBe(2);
      expect(descriptor.timelineEvents[0].description).toBe('Project commenced on site');
    });
  });

  describe('5. Customer Project Documents Workflows', () => {
    it('should render document repository list with file types and secure links', async () => {
      vi.mocked(ProjectService.getProjectDocuments).mockResolvedValueOnce([
        { id: 'doc_10', projectId: 'proj_500', name: 'Structural Engineering Plan.pdf', fileUrl: 'https://example.com/plan.pdf', fileType: 'PDF', uploadedById: 'pro_99', createdAt: '2026-09-12T10:00:00Z', uploadedBy: { id: 'pro_99', email: 'eng@dbc.com' } },
      ]);

      const controller = new CustomerProjectDocumentsController('proj_500');
      await controller.loadDocuments();

      const state = controller.getState();
      expect(state.documents.length).toBe(1);
      expect(state.documents[0].name).toBe('Structural Engineering Plan.pdf');

      const descriptor = renderCustomerProjectDocumentsScreenDescriptor(state);
      expect(descriptor.documentCards.length).toBe(1);
      expect(descriptor.documentCards[0].actionLabel).toBe('Open Document');
    });
  });

  describe('6. Security & Protected Access Boundary', () => {
    it('should preserve intended target route when accessing protected execution screen while unauthenticated', async () => {
      await authStore.logout();

      authStore.setPendingTarget({ routeName: 'CustomerMilestoneDetails', params: { projectId: 'proj_500', milestoneId: 'm2' } });
      expect(authStore.getState().pendingTarget?.routeName).toBe('CustomerMilestoneDetails');
      expect(authStore.getState().pendingTarget?.params).toEqual({ projectId: 'proj_500', milestoneId: 'm2' });
    });
  });
});
