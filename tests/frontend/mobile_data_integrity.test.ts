import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectService } from '../../src/services/contractor/ProjectService.js';
import { adminService } from '../../src/services/admin/adminService.js';
import { bookingApi } from '../../src/services/booking/bookingService.js';
import { quotationClientService } from '../../src/services/quotation/quotationClientService.js';
import { mobileCustomerWorkspaceService } from '../../mobile/src/services/mobileCustomerWorkspaceService.js';
import { mobileProfessionalWorkspaceService } from '../../mobile/src/services/mobileProfessionalWorkspaceService.js';
import { mobileProfessionalProjectExecutionService } from '../../mobile/src/services/mobileProfessionalProjectExecutionService.js';
import { mobileProjectExecutionService } from '../../mobile/src/services/mobileProjectExecutionService.js';
import { mobileCustomerFinancialService } from '../../mobile/src/services/mobileCustomerFinancialService.js';
import { mobileProfessionalFinanceService } from '../../mobile/src/services/mobileProfessionalFinanceService.js';
import { mobileAdminWorkspaceService } from '../../mobile/src/services/mobileAdminWorkspaceService.js';
import { mobileCustomerMessagingService } from '../../mobile/src/services/mobileCustomerMessagingService.js';
import { mobileRequestService } from '../../mobile/src/services/mobileRequestService.js';
import { mobileSupportService } from '../../mobile/src/services/mobileSupportService.js';
import type { Project } from '../../src/types/contractor/ProjectTypes.js';

vi.mock('../../src/services/contractor/ProjectService.js', () => ({
  ProjectService: {
    listProjects: vi.fn(),
    getProjectDetail: vi.fn(),
  },
}));

vi.mock('../../src/services/admin/adminService.js', () => ({
  adminService: {
    getUsers: vi.fn(),
    getProviders: vi.fn(),
    getBookings: vi.fn(),
    updateUser: vi.fn(),
    verifyProvider: vi.fn(),
  },
}));

vi.mock('../../src/services/booking/bookingService.js', () => ({
  bookingApi: {
    createBooking: vi.fn(),
    getMyBookings: vi.fn(),
    getBookingDetails: vi.fn(),
    cancelBooking: vi.fn(),
    getProviderBookings: vi.fn(),
  },
}));

vi.mock('../../src/services/quotation/quotationClientService.js', () => ({
  quotationClientService: {
    getQuotationsForRequirement: vi.fn(),
    getQuotationById: vi.fn(),
    acceptQuotation: vi.fn(),
    updateStatus: vi.fn(),
    createQuotation: vi.fn(),
  },
}));

describe('Module 51 — Mobile Data Integrity, Mock Data Removal & Backend Truth Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mobileCustomerWorkspaceService.clearCache();
    mobileProfessionalWorkspaceService.clearCache();
    mobileAdminWorkspaceService.clearCache();
    mobileSupportService.clearLocalIssues();
  });

  describe('1. Empty Backend Response Handling (No Fabricated Fallback Data)', () => {
    it('returns empty array [] when backend has no projects for customer', async () => {
      vi.mocked(ProjectService.listProjects).mockResolvedValue([]);

      const projects = await mobileCustomerWorkspaceService.getMyProjects();

      expect(projects).toEqual([]);
      expect(projects.length).toBe(0);
    });

    it('returns empty array [] when backend has no projects for professional', async () => {
      vi.mocked(ProjectService.listProjects).mockResolvedValue([]);

      const projects = await mobileProfessionalProjectExecutionService.getProfessionalProjects();

      expect(projects).toEqual([]);
      expect(projects.length).toBe(0);
    });

    it('returns empty array [] when backend has no project financials', async () => {
      vi.mocked(ProjectService.listProjects).mockResolvedValue([]);

      const financials = await mobileProfessionalFinanceService.getProfessionalProjectFinancials();

      expect(financials).toEqual([]);
      expect(financials.length).toBe(0);
    });

    it('returns empty array [] when backend has no users for admin', async () => {
      vi.mocked(adminService.getUsers).mockResolvedValue({ users: [] });

      const users = await mobileAdminWorkspaceService.getUsers();

      expect(users).toEqual([]);
      expect(users.length).toBe(0);
    });

    it('returns empty array [] when backend has no trade partners for admin', async () => {
      vi.mocked(adminService.getProviders).mockResolvedValue({ providers: [] });

      const providers = await mobileAdminWorkspaceService.getProfessionals();

      expect(providers).toEqual([]);
      expect(providers.length).toBe(0);
    });

    it('returns empty array [] when backend has no booking requests for admin', async () => {
      vi.mocked(adminService.getBookings).mockResolvedValue({ bookings: [] });

      const requests = await mobileAdminWorkspaceService.getAdminRequests();

      expect(requests).toEqual([]);
      expect(requests.length).toBe(0);
    });

    it('returns empty array [] when backend has no quotations for a request', async () => {
      vi.mocked(quotationClientService.getQuotationsForRequirement).mockResolvedValue([]);

      const quotes = await mobileRequestService.getQuotationsForRequest(101);

      expect(quotes).toEqual([]);
      expect(quotes.length).toBe(0);
    });
  });

  describe('2. Network / API Error Handling (No Suppressed Errors or Invented Data)', () => {
    it('re-throws error when project detail lookup fails', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockRejectedValue(new Error('Project not found'));

      await expect(mobileProjectExecutionService.fetchProject('proj-999')).rejects.toThrow('Project not found');
    });

    it('re-throws error when creating project request fails on network error', async () => {
      vi.mocked(bookingApi.createBooking).mockRejectedValue(new Error('Network error: 500 Internal Server Error'));

      await expect(
        mobileRequestService.createProjectRequest({
          title: 'Villa Build',
          categoryName: 'Civil',
          city: 'Hyderabad',
          description: 'Foundation work',
        })
      ).rejects.toThrow('Network error: 500 Internal Server Error');
    });

    it('returns empty array [] cleanly when fetching quotations encounters network failure', async () => {
      vi.mocked(quotationClientService.getQuotationsForRequirement).mockRejectedValue(new Error('500 Error'));

      const quotes = await mobileRequestService.getQuotationsForRequest(101);

      expect(quotes).toEqual([]);
    });
  });

  describe('3. Session & Authorization Error Code Propagation', () => {
    it('propagates 401 session expiration error in professional finance service', async () => {
      vi.mocked(ProjectService.listProjects).mockRejectedValue(new Error('401 Session Expired'));

      await expect(mobileProfessionalFinanceService.getProfessionalFinanceSummary()).rejects.toThrow(
        'UNAUTHORIZED_EXPIRED_SESSION'
      );
    });

    it('propagates 401 session expiration error in admin workspace service', async () => {
      vi.mocked(adminService.getUsers).mockRejectedValue(new Error('401 Session Expired'));

      await expect(mobileAdminWorkspaceService.getUsers()).rejects.toThrow('UNAUTHORIZED_EXPIRED_SESSION');
    });

    it('propagates 403 access denied error in admin workspace service', async () => {
      vi.mocked(adminService.getUsers).mockRejectedValue(new Error('403 Access denied'));

      await expect(mobileAdminWorkspaceService.getUsers()).rejects.toThrow('ACCESS_DENIED_ADMIN');
    });
  });

  describe('4. Backend ID Preservation & Financial Authority', () => {
    it('preserves exact backend project ID and derives financial figures directly from milestones', async () => {
      const mockProject: Project = {
        id: 'real-backend-proj-888',
        status: 'IN_PROGRESS',
        createdAt: '2026-09-01T10:00:00Z',
        customer: { fullName: 'Real Customer' },
        requirement: { title: 'Commercial Complex Build' },
        quotation: { totalAmount: 500000 },
        milestones: [
          { id: 'm-real-1', name: 'Foundation', budgetAllocation: 200000, status: 'APPROVED', completionPercentage: 100 },
          { id: 'm-real-2', name: 'Superstructure', budgetAllocation: 300000, status: 'IN_PROGRESS', completionPercentage: 50 },
        ],
      };

      vi.mocked(ProjectService.listProjects).mockResolvedValue([mockProject]);

      const summary = await mobileProfessionalFinanceService.getProfessionalFinanceSummary();

      expect(summary.totalEarnings).toBe(200000);
      expect(summary.totalReceived).toBe(200000);
      expect(summary.activeProjectValue).toBe(500000);

      const financials = await mobileProfessionalFinanceService.getProfessionalProjectFinancials();
      expect(financials[0].projectId).toBe('real-backend-proj-888');
      expect(financials[0].totalContractValue).toBe(500000);
      expect(financials[0].amountReceived).toBe(200000);
      expect(financials[0].pendingBalance).toBe(300000);
    });

    it('identifies local support inquiry references explicitly', async () => {
      const issue = await mobileSupportService.createSupportTicket({
        category: 'Billing',
        subject: 'Invoice Discrepancy',
        description: 'Discrepancy in milestone 2 release note.',
      });

      expect(issue.ticketId).toMatch(/^SUP-\d{6}$/);
      expect(issue.responseNote).toContain('Local Reference:');
      expect(issue.responseNote).not.toContain('persistent backend ticket ID');
    });
  });
});
