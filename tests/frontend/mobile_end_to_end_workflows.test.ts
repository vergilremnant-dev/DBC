import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mobileAuthStore } from '../../mobile/src/state/authStore.js';
import {
  determineInitialNavigationStack,
  resolvePostAuthNavigation,
} from '../../mobile/src/navigation/rootNavigation.js';
import { mobileDeepLinkService } from '../../mobile/src/services/mobileDeepLinkService.js';
import { mobileMarketplaceService } from '../../mobile/src/services/mobileMarketplaceService.js';
import { mobileRequestService } from '../../mobile/src/services/mobileRequestService.js';
import { mobileCustomerWorkspaceService } from '../../mobile/src/services/mobileCustomerWorkspaceService.js';
import { mobileProjectExecutionService } from '../../mobile/src/services/mobileProjectExecutionService.js';
import { mobileCustomerFinancialService } from '../../mobile/src/services/mobileCustomerFinancialService.js';
import { mobileCustomerMessagingService } from '../../mobile/src/services/mobileCustomerMessagingService.js';
import { mobileProfessionalWorkspaceService } from '../../mobile/src/services/mobileProfessionalWorkspaceService.js';
import { mobileProfessionalQuotationService } from '../../mobile/src/services/mobileProfessionalQuotationService.js';
import { mobileProfessionalProjectExecutionService } from '../../mobile/src/services/mobileProfessionalProjectExecutionService.js';
import { mobileProfessionalFinanceService } from '../../mobile/src/services/mobileProfessionalFinanceService.js';
import { mobileAdminWorkspaceService } from '../../mobile/src/services/mobileAdminWorkspaceService.js';
import { mobileNotificationService } from '../../mobile/src/services/mobileNotificationService.js';
import { mobileProfileService } from '../../mobile/src/services/mobileProfileService.js';
import { mobileSupportService } from '../../mobile/src/services/mobileSupportService.js';

vi.mock('../../src/services/booking/bookingService.js', () => ({
  bookingApi: {
    createBooking: vi.fn().mockImplementation(async (req) => ({
      id: 101,
      bookingNumber: 'REQ-101',
      serviceCategory: req.category || 'Construction',
      customerName: 'Vamsi Krishna',
      bookingStatus: 'REQUESTED',
      createdAt: '2026-09-24T10:00:00Z',
    })),
    getMyBookings: vi.fn().mockResolvedValue([
      {
        id: 101,
        bookingNumber: 'REQ-101',
        serviceCategory: 'Construction',
        customerName: 'Vamsi Krishna',
        bookingStatus: 'REQUESTED',
        createdAt: '2026-09-24T10:00:00Z',
      },
    ]),
    getProviderBookings: vi.fn().mockResolvedValue([
      {
        id: 101,
        bookingNumber: 'REQ-101',
        serviceCategory: 'Construction',
        customerName: 'Vamsi Krishna',
        bookingStatus: 'REQUESTED',
        createdAt: '2026-09-24T10:00:00Z',
      },
    ]),
    acceptBooking: vi.fn().mockResolvedValue({
      id: 101,
      bookingNumber: 'REQ-101',
      bookingStatus: 'ACCEPTED',
    }),
  },
}));

vi.mock('../../src/services/contractor/ProjectService.js', () => {
  const mockProjects = [
    {
      id: 'proj-501',
      status: 'IN_PROGRESS',
      createdAt: '2026-08-01T10:00:00Z',
      customer: { fullName: 'Vamsi Krishna' },
      provider: { businessName: 'Srinivas Builds' },
      requirement: { title: '3BHK Raft Foundation & Structural Build' },
      quotation: { totalAmount: 450000 },
      milestones: [
        { id: 'm-1', name: 'Site Excavation', budgetAllocation: 150000, status: 'APPROVED', completionPercentage: 100 },
        { id: 'm-2', name: 'Steel Mesh Binding', budgetAllocation: 150000, status: 'COMPLETED', completionPercentage: 85 },
        { id: 'm-3', name: 'Concrete Casting', budgetAllocation: 150000, status: 'PENDING', completionPercentage: 0 },
      ],
    },
  ];
  return {
    ProjectService: {
      listProjects: vi.fn().mockResolvedValue(mockProjects),
      getProjectDetail: vi.fn().mockImplementation(async (id) => mockProjects.find((p) => p.id === id) || mockProjects[0]),
    },
  };
});

vi.mock('../../src/services/quotation/quotationClientService.js', () => {
  const mockQuote = {
    id: 301,
    requirementId: 101,
    providerId: 'prov-101',
    totalAmount: 450000,
    status: 'SUBMITTED',
    createdAt: '2026-09-24T10:00:00Z',
    updatedAt: '2026-09-24T10:00:00Z',
    provider: { businessName: 'Srinivas Builds', rating: 4.9 },
    proposal: { title: 'Proposal', summary: 'Summary' },
    milestones: [],
  };
  return {
    quotationClientService: {
      getQuotationsForRequirement: vi.fn().mockResolvedValue([mockQuote]),
      getQuotationById: vi.fn().mockResolvedValue(mockQuote),
      acceptQuotation: vi.fn().mockResolvedValue({ success: true, quotationId: 301, status: 'ACCEPTED' }),
      updateStatus: vi.fn().mockResolvedValue({ ...mockQuote, status: 'ACCEPTED' }),
      createQuotation: vi.fn().mockImplementation(async (payload) => ({
        id: 301,
        requirementId: payload.requirementId,
        totalAmount: payload.totalPrice,
        status: 'SUBMITTED',
      })),
    },
  };
});

vi.mock('../../src/services/admin/adminService.js', () => ({
  adminService: {
    getUsers: vi.fn().mockResolvedValue({
      users: [
        { id: 'u-101', fullName: 'Vamsi Krishna', email: 'vamsi.k@example.com', role: 'customer', status: 'PENDING' },
      ],
    }),
    getProviders: vi.fn().mockResolvedValue({
      providers: [
        {
          id: 'prov-101',
          businessName: 'Srinivas Builds',
          contactPerson: 'Srinivas Rao',
          email: 'srinivas@example.com',
          category: { name: 'Construction' },
          verificationStatus: 'PENDING',
        },
      ],
    }),
    updateUser: vi.fn().mockResolvedValue({ success: true }),
    verifyProvider: vi.fn().mockResolvedValue({ success: true }),
    getBookings: vi.fn().mockResolvedValue({ bookings: [] }),
  },
}));

describe('Module 50 — Mobile End-to-End Workflow Validation & Business Logic Audit', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mobileCustomerWorkspaceService.clearCache();
    mobileProfessionalWorkspaceService.clearCache();
    mobileProfileService.clearCache();
    mobileSupportService.clearLocalIssues();
  });

  describe('1. Customer End-to-End Journey Verification', () => {
    it('executes customer flow from discovery to request, quotation review, project, and payments', async () => {
      // 1. Session Setup
      await mobileAuthStore.setSession(
        { id: 'u-cust-101', email: 'vamsi.k@example.com', name: 'Vamsi Krishna', role: 'customer' },
        'token_cust_101'
      );
      expect(determineInitialNavigationStack(mobileAuthStore.getState())).toBe('CustomerTab');

      // 2. Marketplace Discovery
      const categories = await mobileMarketplaceService.getCategories();
      expect(categories.length).toBeGreaterThan(0);
      const searchRes = await mobileMarketplaceService.searchProfessionals({ categorySlug: categories[0].slug });
      expect(searchRes.items).toBeDefined();

      // 3. Project Request Creation
      const requestRes = await mobileRequestService.submitProjectRequest({
        title: '3BHK Raft Foundation & Structural Build',
        category: categories[0].name,
        city: 'Hyderabad',
        description: 'Constructing 2400 sqft residential villa foundation stage.',
      });
      expect(requestRes.id || requestRes.requestId).toBeDefined();

      // 4. Quotation Proposal Review
      const quotes = await mobileRequestService.getQuotationsForRequest(requestRes.id);
      expect(quotes.length).toBeGreaterThan(0);
      const targetQuote = quotes[0];
      expect(targetQuote.id).toBeDefined();

      // 5. Quotation Acceptance Workflow
      const acceptRes = await mobileRequestService.acceptQuotation(targetQuote.id);
      expect(acceptRes.success).toBe(true);

      // 6. Customer Project Workspace Tracking
      const projects = await mobileCustomerWorkspaceService.getMyProjects('active');
      expect(projects.length).toBeGreaterThan(0);
      const activeProject = projects[0];

      // 7. Project Milestones & Financial Breakdown
      const milestones = await mobileProjectExecutionService.getProjectMilestones(activeProject.id);
      expect(milestones.length).toBeGreaterThan(0);

      const financials = await mobileCustomerFinancialService.getProjectFinancials(activeProject.id);
      expect(financials.totalAmount).toBeGreaterThan(0);
      expect(financials.paidAmount).toBeLessThanOrEqual(financials.totalAmount);

      // 8. Milestone Payment Submission
      const paymentRes = await mobileCustomerFinancialService.recordMilestonePayment({
        projectId: activeProject.id,
        milestoneId: milestones[0].id,
        amount: milestones[0].amount,
        paymentMethod: 'UPI Escrow',
      });
      expect(paymentRes.paymentId).toBeDefined();

      // 9. Contextual Project Messaging
      const conversation = await mobileCustomerMessagingService.getOrCreateProjectConversation(activeProject.id);
      expect(conversation.threadId).toBeDefined();

      const sendRes = await mobileCustomerMessagingService.sendMessage({
        threadId: conversation.threadId,
        content: 'Site excavation completed on schedule. Proceeding with steel binding.',
      });
      expect(sendRes.id).toBeDefined();
    });
  });

  describe('2. Professional End-to-End Journey Verification', () => {
    it('executes contractor flow from dashboard leads to 5-step proposal, active project, and finance', async () => {
      // 1. Session Setup
      await mobileAuthStore.setSession(
        { id: 'u-contractor-201', email: 'srinivas.builds@example.com', name: 'Srinivas Rao', role: 'contractor' },
        'token_contractor_201'
      );
      expect(determineInitialNavigationStack(mobileAuthStore.getState())).toBe('ProfessionalTab');

      // 2. Professional Dashboard Console
      const dashboard = await mobileProfessionalWorkspaceService.getDashboardSummary();
      expect(dashboard.metrics.activeProjectsCount).toBeGreaterThanOrEqual(0);
      expect(dashboard.metrics.openLeadsCount).toBeGreaterThanOrEqual(0);

      // 3. Open Leads & Request Acceptance
      const leads = await mobileProfessionalWorkspaceService.getOpenLeads();
      expect(leads.length).toBeGreaterThan(0);
      const lead = leads[0];

      const acceptLeadRes = await mobileProfessionalWorkspaceService.acceptProjectRequest(lead.id);
      expect(acceptLeadRes.success).toBe(true);

      // 4. 5-Step Quotation Wizard Submission
      const proposal = await mobileProfessionalQuotationService.submitQuotationProposal({
        requirementId: 101,
        totalPrice: 450000,
        timelineWeeks: 8,
        scopeDeliverables: ['Excavation', 'Raft Concrete Slab', 'Column Curing'],
        milestones: [
          { title: 'Excavation & PCC', amount: 150000, durationWeeks: 2 },
          { title: 'Steel Reinforcement', amount: 150000, durationWeeks: 3 },
          { title: 'Slab Casting', amount: 150000, durationWeeks: 3 },
        ],
      });
      expect(proposal.quotationId).toBeDefined();

      // 5. Active Project Execution & Milestone Progress Slider
      const activeProjects = await mobileProfessionalProjectExecutionService.getProfessionalProjects();
      expect(activeProjects.length).toBeGreaterThan(0);
      const proj = activeProjects[0];

      const milestones = await mobileProfessionalProjectExecutionService.getProjectMilestones(proj.id);
      expect(milestones.length).toBeGreaterThan(0);

      const updateProgressRes = await mobileProfessionalProjectExecutionService.updateMilestoneProgress(
        proj.id,
        milestones[0].id,
        85
      );
      expect(updateProgressRes.progressPercentage).toBe(85);

      // 6. Professional Finance & Milestone Earnings
      const financeSummary = await mobileProfessionalFinanceService.getFinanceSummary();
      expect(financeSummary.totalEarnings).toBeGreaterThanOrEqual(0);

      const earnings = await mobileProfessionalFinanceService.getMilestoneEarnings();
      expect(earnings.length).toBeGreaterThan(0);

      const payouts = await mobileProfessionalFinanceService.getPayoutDetails();
      expect(payouts.maskedBankAccount).toBeDefined();
    });
  });

  describe('3. Admin Operations & Security Journey Verification', () => {
    it('executes admin flow for user moderation, trade partner verification, and audit logs', async () => {
      // 1. Session Setup
      await mobileAuthStore.setSession(
        { id: 'u-admin-301', email: 'admin@dbc.com', name: 'Platform Admin', role: 'admin' },
        'token_admin_301'
      );

      // 2. Admin Workspace Dashboard
      const stats = await mobileAdminWorkspaceService.getOperationalStats();
      expect(stats.totalUsers).toBeGreaterThan(0);

      // 3. User Directory & Moderation
      const users = await mobileAdminWorkspaceService.getUsers();
      expect(users.length).toBeGreaterThan(0);
      const userToModerate = users[0];

      const modRes = await mobileAdminWorkspaceService.updateUserStatus(userToModerate.id, 'ACTIVE');
      expect(modRes.status).toBe('ACTIVE');

      // 4. Trade Partner Credential Verification
      const partners = await mobileAdminWorkspaceService.getTradePartners('PENDING');
      expect(partners.length).toBeGreaterThan(0);

      const verifyRes = await mobileAdminWorkspaceService.verifyTradePartner(partners[0].id, 'VERIFIED');
      expect(verifyRes.verificationStatus).toBe('VERIFIED');

      // 5. Audit Log Inspector
      const logs = await mobileAdminWorkspaceService.getAuditLogs();
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('4. Auth Handoff & Pending Target Restoration', () => {
    it('preserves deep link target when unauthenticated and restores target after OTP login', async () => {
      await mobileAuthStore.logout();

      // Deep link while unauthenticated
      const target = mobileDeepLinkService.resolveDeepLink('/project/proj-777/financials', 'customer');
      const evalRes = mobileDeepLinkService.evaluateTargetAccess(target, mobileAuthStore.getState());

      expect(evalRes.canNavigate).toBe(false);
      expect(evalRes.redirectedToAuth).toBe(true);
      expect(mobileAuthStore.getState().pendingTarget?.urlPath).toBe('/project/proj-777/financials');

      // Post-Auth Restoration
      await mobileAuthStore.setSession(
        { id: 'u-cust-999', email: 'restored@example.com', name: 'Restored User', role: 'customer' },
        'token_restored'
      );

      const postAuth = resolvePostAuthNavigation(mobileAuthStore.getState());
      expect(postAuth.pendingTarget?.route).toBe('CustomerProjectFinancials');

      const cleared = mobileAuthStore.clearPendingTarget();
      expect(cleared?.route).toBe('CustomerProjectFinancials');
      expect(mobileAuthStore.getState().pendingTarget).toBeNull();
    });
  });

  describe('5. Authorization Matrix & Security Boundary Verification', () => {
    it('blocks customers and contractors from accessing admin routes', async () => {
      await mobileAuthStore.setSession(
        { id: 'u-cust-1', email: 'c@example.com', name: 'Customer', role: 'customer' },
        'token_c'
      );

      const adminTarget = mobileDeepLinkService.resolveDeepLink('/admin/users/u-100', 'customer');
      const evalCustomer = mobileDeepLinkService.evaluateTargetAccess(adminTarget, mobileAuthStore.getState());

      expect(evalCustomer.canNavigate).toBe(false);
      expect(evalCustomer.reason).toBe('UNAUTHORIZED_ROLE_MISMATCH');

      await mobileAuthStore.setSession(
        { id: 'u-contractor-1', email: 'p@example.com', name: 'Contractor', role: 'contractor' },
        'token_p'
      );

      const evalContractor = mobileDeepLinkService.evaluateTargetAccess(adminTarget, mobileAuthStore.getState());
      expect(evalContractor.canNavigate).toBe(false);
      expect(evalContractor.reason).toBe('UNAUTHORIZED_ROLE_MISMATCH');
    });
  });

  describe('6. Mutation Safety & Stale Data Refresh Verification', () => {
    it('invalidates cache and refreshes state cleanly after mutations', async () => {
      await mobileAuthStore.setSession(
        { id: 'u-cust-1', email: 'c@example.com', name: 'Customer', role: 'customer' },
        'token_c'
      );

      const initialProjects = await mobileCustomerWorkspaceService.getMyProjects();
      expect(initialProjects).toBeDefined();

      mobileCustomerWorkspaceService.clearCache();
      const refreshedProjects = await mobileCustomerWorkspaceService.getMyProjects();
      expect(refreshedProjects.length).toBe(initialProjects.length);
    });

    it('marks all notifications read and updates unread count', async () => {
      await mobileAuthStore.setSession(
        { id: 'u-cust-1', email: 'c@example.com', name: 'Customer', role: 'customer' },
        'token_c'
      );

      const listBefore = await mobileNotificationService.getNotifications('customer');
      expect(listBefore.length).toBeGreaterThan(0);

      await mobileNotificationService.markAllAsRead('customer');
      const unreadCount = await mobileNotificationService.getUnreadCount('customer');
      expect(unreadCount).toBe(0);
    });
  });
});
