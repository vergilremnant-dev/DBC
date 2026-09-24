import { describe, it, expect, beforeEach, vi } from 'vitest';

import { MemoryStorageAdapter } from '../../mobile/src/storage/StorageAdapter';
import { MobileAuthStore } from '../../mobile/src/state/authStore';
import { mobileCustomerWorkspaceService, formatProjectStatusLabel } from '../../mobile/src/services/mobileCustomerWorkspaceService';
import { ProjectService } from '../../src/services/contractor/ProjectService';
import { bookingApi } from '../../src/services/booking/bookingService';
import { quotationClientService } from '../../src/services/quotation/quotationClientService';
import { CustomerHomeController, renderCustomerHomeScreenDescriptor } from '../../mobile/src/screens/workspace/CustomerHomeScreen';
import { CustomerRequestsController, renderCustomerRequestsScreenDescriptor } from '../../mobile/src/screens/workspace/CustomerRequestsScreen';
import { CustomerProjectsController, renderCustomerProjectsScreenDescriptor } from '../../mobile/src/screens/workspace/CustomerProjectsScreen';
import { CustomerProjectWorkspaceController, renderCustomerProjectWorkspaceScreenDescriptor } from '../../mobile/src/screens/workspace/CustomerProjectWorkspaceScreen';

vi.mock('../../src/services/contractor/ProjectService', () => ({
  ProjectService: {
    listProjects: vi.fn(),
    getProjectDetail: vi.fn(),
  },
}));

vi.mock('../../src/services/booking/bookingService', () => ({
  bookingApi: {
    getMyBookings: vi.fn(),
    getBookingDetails: vi.fn(),
  },
}));

vi.mock('../../src/services/quotation/quotationClientService', () => ({
  quotationClientService: {
    getQuotations: vi.fn(),
    getQuotationById: vi.fn(),
  },
}));

describe('Module 37 — Customer Mobile Workspace, Requests & Project Tracking Test Suite', () => {
  let memoryStorage: MemoryStorageAdapter;
  let authStore: MobileAuthStore;

  beforeEach(() => {
    vi.clearAllMocks();
    mobileCustomerWorkspaceService.clearCache();
    memoryStorage = new MemoryStorageAdapter();
    authStore = new MobileAuthStore(memoryStorage);
  });

  describe('1. Project Status Helper Resolution', () => {
    it('should map project status codes to human readable labels', () => {
      expect(formatProjectStatusLabel('CREATED')).toBe('Project Initialized');
      expect(formatProjectStatusLabel('IN_PROGRESS')).toBe('Execution In Progress');
      expect(formatProjectStatusLabel('CUSTOMER_APPROVAL')).toBe('Awaiting Customer Approval');
      expect(formatProjectStatusLabel('COMPLETED')).toBe('Project Completed');
    });
  });

  describe('2. Customer Home Dashboard Workflows', () => {
    it('should load action items, active requests, active projects, and recent activity', async () => {
      vi.mocked(bookingApi.getMyBookings).mockResolvedValueOnce([
        {
          id: 'bkt_1',
          bookingNumber: 'REQ-101',
          customerId: 'c_1',
          providerId: 'p_1',
          categoryId: 1,
          bookingStatus: 'REQUESTED',
          preferredDate: '2026-10-01',
          preferredTime: '10:00',
          customerAddress: '123 Park Street',
          city: 'Hyderabad',
          state: 'Telangana',
          notes: 'Electrical wiring',
          estimatedBudget: 150000,
          createdAt: '2026-09-22T10:00:00Z',
          updatedAt: '2026-09-22T10:00:00Z',
          provider: { id: 'p_1', businessName: 'Apex Builders' } as any,
        },
      ]);

      vi.mocked(ProjectService.listProjects).mockResolvedValueOnce([
        {
          id: 'proj_99',
          requirementId: 101,
          customerId: 'c_1',
          providerId: 'p_1',
          quotationId: 501,
          status: 'IN_PROGRESS',
          createdAt: '2026-09-20T10:00:00Z',
          updatedAt: '2026-09-22T11:00:00Z',
          provider: { id: 'p_1', businessName: 'Apex Builders', fullName: 'Apex' },
          requirement: { id: 101, title: 'Villa Interior', description: 'Desc', location: 'Hyderabad' },
          quotation: { id: 501, totalAmount: 450000 },
          milestones: [{ id: 'm1', projectId: 'proj_99', name: 'Phase 1', completionPercentage: 50, budgetAllocation: 150000, status: 'IN_PROGRESS', createdAt: '' }],
        },
      ]);

      vi.mocked(quotationClientService.getQuotations).mockResolvedValueOnce([
        {
          id: 701,
          requirementId: 101,
          providerId: 'p_1',
          priceModel: 'FIXED',
          totalAmount: 300000,
          estimatedDurationDays: 30,
          status: 'SUBMITTED',
          createdAt: '2026-09-22T09:00:00Z',
          updatedAt: '2026-09-22T09:00:00Z',
          provider: { id: 'p_1', businessName: 'Apex Builders', contactPerson: 'Apex' },
        },
      ]);

      const controller = new CustomerHomeController();
      await controller.loadDashboard();

      const state = controller.getState();
      expect(state.overview?.actionItems.length).toBe(1);
      expect(state.overview?.actionItems[0].type).toBe('QUOTATION_REVIEW');
      expect(state.overview?.activeRequests.length).toBe(1);
      expect(state.overview?.activeProjects.length).toBe(1);

      const descriptor = renderCustomerHomeScreenDescriptor(state);
      expect(descriptor.name).toBe('CustomerHomeScreen');
      expect(descriptor.actionRequiredSection.items.length).toBe(1);
      expect(descriptor.activeProjectsSection.items.length).toBe(1);
    });

    it('should handle dashboard API errors cleanly without crashing', async () => {
      vi.mocked(bookingApi.getMyBookings).mockRejectedValueOnce(new Error('Network error'));
      vi.mocked(ProjectService.listProjects).mockRejectedValueOnce(new Error('Network error'));
      vi.mocked(quotationClientService.getQuotations).mockRejectedValueOnce(new Error('Network error'));

      const controller = new CustomerHomeController();
      await controller.loadDashboard();

      const state = controller.getState();
      expect(state.overview?.actionItems.length).toBe(0);
      expect(state.overview?.activeProjects.length).toBe(0);
    });
  });

  describe('3. Customer Requests Screen Workflows', () => {
    it('should render customer requests as mobile cards with status badges', async () => {
      vi.mocked(bookingApi.getMyBookings).mockResolvedValueOnce([
        {
          id: 'bkt_10',
          bookingNumber: 'REQ-200',
          customerId: 'c_1',
          providerId: 'p_1',
          categoryId: 2,
          bookingStatus: 'ACCEPTED',
          preferredDate: '2026-10-05',
          preferredTime: '11:00',
          customerAddress: '456 MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          createdAt: '2026-09-21T08:00:00Z',
          updatedAt: '2026-09-21T08:00:00Z',
          provider: { id: 'p_1', businessName: 'BuildCraft' } as any,
          category: { id: 2, name: 'Plumbing Services', slug: 'plumbing' } as any,
        },
      ]);

      const controller = new CustomerRequestsController();
      await controller.loadRequests();

      const state = controller.getState();
      expect(state.requests.length).toBe(1);
      expect(state.requests[0].statusLabel).toBe('Accepted by Contractor');

      const descriptor = renderCustomerRequestsScreenDescriptor(state);
      expect(descriptor.requestCards.length).toBe(1);
      expect(descriptor.requestCards[0].providerName).toBe('BuildCraft');
    });

    it('should render discovery CTA empty state when customer has no requests', async () => {
      vi.mocked(bookingApi.getMyBookings).mockResolvedValueOnce([]);

      const controller = new CustomerRequestsController();
      await controller.loadRequests();

      const descriptor = renderCustomerRequestsScreenDescriptor(controller.getState());
      expect(descriptor.emptyState).not.toBeNull();
      expect(descriptor.emptyState?.ctaLabel).toContain('Discover Services');
    });
  });

  describe('4. Customer Projects Screen Workflows', () => {
    it('should render active projects with contractor info and progress percentage', async () => {
      vi.mocked(ProjectService.listProjects).mockResolvedValueOnce([
        {
          id: 'proj_300',
          requirementId: 200,
          customerId: 'c_1',
          providerId: 'p_2',
          quotationId: 600,
          status: 'IN_PROGRESS',
          createdAt: '2026-09-15T10:00:00Z',
          updatedAt: '2026-09-22T10:00:00Z',
          provider: { id: 'p_2', businessName: 'StructurePro', fullName: 'Pro' },
          requirement: { id: 200, title: 'Full Villa Turnkey', description: 'Desc', location: 'Hyderabad' },
          quotation: { id: 600, totalAmount: 1200000 },
          milestones: [
            { id: 'm1', projectId: 'proj_300', name: 'Foundation', completionPercentage: 100, budgetAllocation: 400000, status: 'COMPLETED', createdAt: '' },
            { id: 'm2', projectId: 'proj_300', name: 'Brick Masonry', completionPercentage: 40, budgetAllocation: 400000, status: 'IN_PROGRESS', createdAt: '' },
          ],
        },
      ]);

      const controller = new CustomerProjectsController();
      await controller.loadProjects();

      const state = controller.getState();
      expect(state.projects.length).toBe(1);
      expect(state.projects[0].progressPercentage).toBe(70); // (100 + 40)/2

      const descriptor = renderCustomerProjectsScreenDescriptor(state);
      expect(descriptor.projectCards.length).toBe(1);
      expect(descriptor.projectCards[0].progressPercentage).toBe(70);
    });
  });

  describe('5. Customer Project Workspace Workflows', () => {
    it('should load project workspace details, milestones progress, and documents', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockResolvedValueOnce({
        id: 'proj_300',
        requirementId: 200,
        customerId: 'c_1',
        providerId: 'p_2',
        quotationId: 600,
        status: 'IN_PROGRESS',
        createdAt: '2026-09-15T10:00:00Z',
        updatedAt: '2026-09-22T10:00:00Z',
        provider: { id: 'p_2', businessName: 'StructurePro', fullName: 'Pro' },
        requirement: { id: 200, title: 'Full Villa Turnkey', description: 'Desc', location: 'Hyderabad' },
        quotation: { id: 600, totalAmount: 1200000 },
        milestones: [
          { id: 'm1', projectId: 'proj_300', name: 'Foundation', completionPercentage: 100, budgetAllocation: 400000, status: 'COMPLETED', createdAt: '' },
        ],
        documents: [
          { id: 'doc_1', projectId: 'proj_300', name: 'Architectural Blueprint', fileUrl: 'https://example.com/plan.pdf', fileType: 'PDF', createdAt: '2026-09-16T10:00:00Z' },
        ],
      });

      const controller = new CustomerProjectWorkspaceController('proj_300');
      await controller.loadProjectWorkspace();

      const state = controller.getState();
      expect(state.mobile?.providerName).toBe('StructurePro');

      const descriptor = renderCustomerProjectWorkspaceScreenDescriptor(state);
      expect(descriptor.milestonesContent.length).toBe(1);
      expect(descriptor.documentsContent.length).toBe(1);
      expect(descriptor.documentsContent[0].name).toBe('Architectural Blueprint');
    });
  });

  describe('6. Authentication Protection & Protected Route Redirects', () => {
    it('should preserve intended workspace target when unauthenticated', async () => {
      await authStore.logout();

      authStore.setPendingTarget({ routeName: 'CustomerProjectWorkspace', params: { projectId: 'proj_300' } });
      expect(authStore.getState().pendingTarget?.routeName).toBe('CustomerProjectWorkspace');
      expect(authStore.getState().pendingTarget?.params).toEqual({ projectId: 'proj_300' });
    });
  });
});
