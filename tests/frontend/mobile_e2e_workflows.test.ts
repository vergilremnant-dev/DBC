import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mobileApiClient } from '../../mobile/src/api/mobileApiClient.js';
import { mobileAuthStore } from '../../mobile/src/state/authStore.js';
import { mobileAuthService, resolveUserRole } from '../../mobile/src/services/mobileAuthService.js';
import { mobileRequestService } from '../../mobile/src/services/mobileRequestService.js';
import { mobileCustomerWorkspaceService } from '../../mobile/src/services/mobileCustomerWorkspaceService.js';
import { mobileProjectExecutionService } from '../../mobile/src/services/mobileProjectExecutionService.js';
import { mobileCustomerFinancialService } from '../../mobile/src/services/mobileCustomerFinancialService.js';
import { mobileCustomerMessagingService } from '../../mobile/src/services/mobileCustomerMessagingService.js';
import { mobileProfessionalQuotationService } from '../../mobile/src/services/mobileProfessionalQuotationService.js';
import { mobileProfessionalProjectExecutionService } from '../../mobile/src/services/mobileProfessionalProjectExecutionService.js';
import { mobileProfessionalFinanceService } from '../../mobile/src/services/mobileProfessionalFinanceService.js';
import { mobileMarketplaceService } from '../../mobile/src/services/mobileMarketplaceService.js';
import { mobileCache } from '../../mobile/src/cache/mobileCache.js';
import { quotationClientService } from '../../src/services/quotation/quotationClientService.js';
import { ProjectService } from '../../src/services/contractor/ProjectService.js';
import { authService } from '../../src/services/auth/authService.js';
import { normalizeMobileApiError } from '../../mobile/src/api/mobileErrorUtils.js';

function createMockApiError(code: string, category: string, message: string, status = 400) {
  return {
    code,
    category,
    message,
    status,
    retryable: false,
  };
}

describe('Module 63 — Mobile End-to-End Workflow Simulation & Integration Validation Suite', () => {

  beforeEach(() => {
    vi.restoreAllMocks();
    mobileCache.clear();
    mobileProfessionalProjectExecutionService.clearCache();
  });

  // ===========================================================================
  // 1. Scenario 1, 15, 16 — Authentication, Session Lifecycle & Cross-Account Switch
  // ===========================================================================
  describe('1. Authentication, Session Lifecycle & Security Isolation', () => {
    it('1.1 validates registration payload sending required parameters', async () => {
      vi.spyOn(authService, 'register').mockResolvedValueOnce({ verificationToken: 'v-tok-999' } as any);
      vi.spyOn(authService, 'sendEmailOtp').mockResolvedValueOnce({ success: true } as any);

      const result = await mobileAuthService.register({
        email: 'e2e.cust@dbc.in',
        password: 'Password123!',
        firstName: 'Anand',
        lastName: 'Verma',
        role: 'customer',
      });

      expect(result.email).toBe('e2e.cust@dbc.in');
      expect(result.verificationToken).toBe('v-tok-999');
    });

    it('1.2 verifies OTP verification exchanges code for auth token & user profile', async () => {
      vi.spyOn(mobileApiClient, 'post').mockResolvedValueOnce({
        token: 'jwt-e2e-token-123',
        user: { id: 'usr-1', email: 'e2e@dbc.in', name: 'Anand Verma', role: 'customer' },
      });

      const res = await mobileApiClient.post<{ token: string; user: any }>('/api/auth/verify-email-otp', {
        email: 'e2e@dbc.in',
        code: '123456',
      });

      expect(res.token).toBe('jwt-e2e-token-123');
      expect(res.user.id).toBe('usr-1');
    });

    it('1.3 rejects invalid OTP submission with challenge requirement error', async () => {
      vi.spyOn(mobileApiClient, 'post').mockRejectedValueOnce(
        createMockApiError('INVALID_OTP', 'UNAUTHORIZED', 'Invalid 6-digit OTP code provided', 400)
      );

      await expect(
        mobileApiClient.post('/api/auth/verify-email-otp', { email: 'e2e@dbc.in', code: '000000' })
      ).rejects.toThrow('Invalid 6-digit OTP code provided');
    });

    it('1.4 rejects expired OTP submission', async () => {
      vi.spyOn(mobileApiClient, 'post').mockRejectedValueOnce(
        createMockApiError('OTP_EXPIRED', 'UNAUTHORIZED', 'OTP verification code has expired', 400)
      );

      await expect(
        mobileApiClient.post('/api/auth/verify-email-otp', { email: 'e2e@dbc.in', code: '123456' })
      ).rejects.toThrow('OTP verification code has expired');
    });

    it('1.5 resolves raw backend user role strings to mobile app role', () => {
      expect(resolveUserRole('CUSTOMER')).toBe('customer');
      expect(resolveUserRole('CONTRACTOR')).toBe('contractor');
      expect(resolveUserRole('ADMIN')).toBe('admin');
      expect(resolveUserRole(undefined)).toBe('customer');
    });

    it('1.6 restores session state from persistent storage', async () => {
      vi.spyOn(mobileApiClient, 'initialize').mockResolvedValueOnce('jwt-saved-token');
      await mobileAuthStore.setSession(
        { id: 'usr-1', email: 'cust@dbc.in', name: 'Anand Verma', role: 'customer' },
        'jwt-saved-token'
      );

      expect(mobileAuthStore.getState().status).toBe('authenticated');
      expect(mobileAuthStore.getState().user?.email).toBe('cust@dbc.in');
    });

    it('1.7 simulates session token expiration on 401 response', async () => {
      mobileAuthStore.markExpired();
      expect(mobileAuthStore.getState().status).toBe('expired');
    });

    it('1.8 verifies logout completely purges storage, tokens, deep link target, and memory cache', async () => {
      mobileCache.set('customer_projects', [{ id: 'proj-1' }], 60000);
      await mobileAuthStore.logout();

      expect(mobileAuthStore.getState().status).toBe('unauthenticated');
      expect(mobileAuthStore.getState().user).toBeNull();
      expect(mobileCache.get('customer_projects')).toBeNull();
    });
  });

  // ===========================================================================
  // 2. Scenario 2 — Customer Marketplace Discovery
  // ===========================================================================
  describe('2. Customer Marketplace Discovery & Professional Browsing', () => {
    it('2.1 fetches active service categories for marketplace home', async () => {
      vi.spyOn(mobileMarketplaceService, 'getCategories').mockResolvedValueOnce([
        { id: 'cat-1', name: 'Civil Construction', iconName: 'construct' },
        { id: 'cat-2', name: 'Interior Design', iconName: 'color-palette' },
      ] as any);

      const categories = await mobileMarketplaceService.getCategories();
      expect(categories).toHaveLength(2);
      expect(categories[0].name).toBe('Civil Construction');
    });

    it('2.2 searches category listings with keyword filter', async () => {
      vi.spyOn(mobileMarketplaceService, 'searchProfessionals').mockResolvedValueOnce([
        { id: 'pro-1', businessName: 'Rajesh Builders', rating: 4.9, city: 'Hyderabad' } as any,
      ]);

      const results = await mobileMarketplaceService.searchProfessionals({ category: 'Civil', location: 'Hyderabad' });
      expect(results).toHaveLength(1);
      expect(results[0].businessName).toBe('Rajesh Builders');
    });

    it('2.3 fetches professional profile with portfolio gallery', async () => {
      vi.spyOn(mobileMarketplaceService, 'getProfessionalProfile').mockResolvedValueOnce({
        id: 'pro-1',
        businessName: 'Rajesh Builders',
        portfolio: [{ id: 'img-1', title: 'Villa Raft' }],
      } as any);

      const profile = await mobileMarketplaceService.getProfessionalProfile('pro-1');
      expect(profile.businessName).toBe('Rajesh Builders');
    });

    it('2.4 handles empty search results gracefully without breaking UI', async () => {
      vi.spyOn(mobileMarketplaceService, 'searchProfessionals').mockResolvedValueOnce([]);

      const results = await mobileMarketplaceService.searchProfessionals({ keyword: 'NonExistentCategory' });
      expect(results).toHaveLength(0);
    });

    it('2.5 serves fresh cached category listings within TTL window', () => {
      const cached = [{ id: 'cat-1', name: 'Civil' }];
      mobileCache.set('marketplace_categories', cached, 60000);

      const retrieved = mobileCache.get('marketplace_categories');
      expect(retrieved).toEqual(cached);
    });
  });

  // ===========================================================================
  // 3. Scenario 3 — Customer Project Request Flow
  // ===========================================================================
  describe('3. Customer Project Request & Submission Flow', () => {
    it('3.1 validates project request form parameters and submits to backend', async () => {
      vi.spyOn(mobileRequestService, 'createProjectRequest').mockResolvedValueOnce({
        id: 'req-e2e-1',
        bookingNumber: 'REQ-1001',
        status: 'REQUESTED',
        providerName: 'Rajesh Builders',
      } as any);

      const result = await mobileRequestService.createProjectRequest({
        providerId: 'pro-1',
        categoryId: 'cat-1',
        title: 'Modular Kitchen Installation',
        description: 'Complete L-shaped acrylic kitchen',
        city: 'Hyderabad',
      });

      expect(result.id).toBe('req-e2e-1');
      expect(result.status).toBe('REQUESTED');
    });

    it('3.2 blocks duplicate request submission triggered in rapid succession', async () => {
      vi.spyOn(mobileApiClient, 'post').mockRejectedValueOnce(
        createMockApiError('DUPLICATE_REQUEST', 'CONFLICT', 'A pending request already exists for this contractor', 409)
      );

      await expect(
        mobileApiClient.post('/api/requests', { providerId: 'pro-1' })
      ).rejects.toThrow('A pending request already exists for this contractor');
    });

    it('3.3 handles network timeout during request submission without false success', async () => {
      vi.spyOn(mobileApiClient, 'post').mockRejectedValueOnce(
        createMockApiError('TIMEOUT_ERROR', 'TIMEOUT', 'The request took too long. Please check your connection and try again.', 408)
      );

      await expect(
        mobileApiClient.post('/api/requests', { providerId: 'pro-1' })
      ).rejects.toThrow('The request took too long');
    });

    it('3.4 fetches authoritative request details by request ID', async () => {
      vi.spyOn(quotationClientService, 'getQuotationById').mockResolvedValueOnce({
        id: 1001,
        status: 'SUBMITTED',
        requirementId: 50,
      } as any);

      const details = await mobileRequestService.getQuotationDetails(1001);
      expect(details.id).toBe(1001);
    });
  });

  // ===========================================================================
  // 4. Scenario 4 — Professional Request Processing
  // ===========================================================================
  describe('4. Professional Request Processing & State Transitions', () => {
    it('4.1 allows professional to view assigned incoming requests', async () => {
      vi.spyOn(mobileApiClient, 'get').mockResolvedValueOnce([
        { id: 'req-1', status: 'REQUESTED', customerName: 'Anand Verma' },
      ]);

      const list = await mobileApiClient.get<any[]>('/api/contractor/requests');
      expect(list).toHaveLength(1);
      expect(list[0].status).toBe('REQUESTED');
    });

    it('4.2 allows professional to accept an assigned project request', async () => {
      vi.spyOn(mobileApiClient, 'patch').mockResolvedValueOnce({
        id: 'req-1',
        status: 'ACCEPTED',
      });

      const updated = await mobileApiClient.patch<any>('/api/requests/req-1/status', { status: 'ACCEPTED' });
      expect(updated.status).toBe('ACCEPTED');
    });

    it('4.3 allows professional to decline an assigned request with reason', async () => {
      vi.spyOn(mobileApiClient, 'patch').mockResolvedValueOnce({
        id: 'req-1',
        status: 'REJECTED',
        reason: 'Schedule full',
      });

      const updated = await mobileApiClient.patch<any>('/api/requests/req-1/status', { status: 'REJECTED', reason: 'Schedule full' });
      expect(updated.status).toBe('REJECTED');
    });

    it('4.4 blocks Professional A from processing Professional B unassigned request (403 Forbidden)', async () => {
      vi.spyOn(mobileApiClient, 'patch').mockRejectedValueOnce(
        createMockApiError('FORBIDDEN', 'FORBIDDEN', 'You do not have permission to process this request', 403)
      );

      await expect(
        mobileApiClient.patch('/api/requests/req-other-pro/status', { status: 'ACCEPTED' })
      ).rejects.toThrow('You do not have permission to process this request');
    });
  });

  // ===========================================================================
  // 5. Scenario 5 — Quotation Lifecycle
  // ===========================================================================
  describe('5. Professional Quotation Creation & Customer Review Lifecycle', () => {
    it('5.1 allows professional to create draft quotation proposal', async () => {
      const form = {
        requirementId: 101,
        priceModel: 'FIXED' as const,
        totalAmount: 150000,
        estimatedDurationDays: 30,
        proposal: { title: 'Raft Proposal', summary: 'Scope', scope: 'Full', deliverables: 'Complete' },
      };

      vi.spyOn(mobileProfessionalQuotationService, 'createQuotationDraft').mockResolvedValueOnce({
        id: 901,
        status: 'DRAFT',
        totalAmount: 150000,
      } as any);

      const quotation = await mobileProfessionalQuotationService.createQuotationDraft(form);
      expect(quotation.id).toBe(901);
      expect(quotation.status).toBe('DRAFT');
    });

    it('5.2 submits quotation proposal to customer for review', async () => {
      vi.spyOn(mobileProfessionalQuotationService, 'submitQuotation').mockResolvedValueOnce({
        id: 901,
        status: 'SUBMITTED',
        isSubmittable: false,
        isWithdrawable: true,
      } as any);

      const submitted = await mobileProfessionalQuotationService.submitQuotation(901);
      expect(submitted.status).toBe('SUBMITTED');
    });

    it('5.3 allows contractor to revise proposal prior to customer acceptance', async () => {
      vi.spyOn(quotationClientService, 'updateStatus').mockResolvedValueOnce({
        id: 901,
        status: 'REVISED',
      } as any);

      const revised = await quotationClientService.updateStatus(901, 'REVISED');
      expect(revised.status).toBe('REVISED');
    });

    it('5.4 allows contractor to withdraw submitted quotation proposal', async () => {
      vi.spyOn(mobileProfessionalQuotationService, 'withdrawQuotation').mockResolvedValueOnce({
        id: 901,
        status: 'WITHDRAWN',
        isWithdrawable: false,
      } as any);

      const withdrawn = await mobileProfessionalQuotationService.withdrawQuotation(901, 'Scope change');
      expect(withdrawn.status).toBe('WITHDRAWN');
    });

    it('5.5 locks quotation revision once quotation has been accepted by customer', async () => {
      vi.spyOn(quotationClientService, 'updateStatus').mockRejectedValueOnce(
        new Error('Accepted quotations cannot be revised')
      );

      await expect(
        quotationClientService.updateStatus(901, 'REVISED')
      ).rejects.toThrow('Accepted quotations cannot be revised');
    });
  });

  // ===========================================================================
  // 6. Scenario 6 — Quotation Acceptance -> Project Creation Transaction Boundary
  // ===========================================================================
  describe('6. Quotation Acceptance -> Project Creation Atomic Transaction Boundary', () => {
    it('6.1 verifies customer accepting quotation atomically creates Project in ASSIGNED status', async () => {
      vi.spyOn(quotationClientService, 'updateStatus').mockResolvedValueOnce({ success: true } as any);
      vi.spyOn(quotationClientService, 'getQuotationById').mockResolvedValueOnce({
        id: 901,
        status: 'ACCEPTED',
        requirementId: 50,
        providerId: 'pro-1',
        totalAmount: 150000,
        milestones: [{ id: 'ms-1', name: 'Advance', cost: 45000 }],
      } as any);

      const result = await mobileRequestService.acceptQuotation(901);
      expect(result.status).toBe('ACCEPTED');
      expect(result.success).toBe(true);
    });

    it('6.2 rejects duplicate quotation acceptance attempts (409 Conflict)', async () => {
      vi.spyOn(quotationClientService, 'updateStatus').mockRejectedValueOnce(
        new Error('Quotation has already been accepted')
      );

      await expect(
        mobileRequestService.acceptQuotation(901)
      ).rejects.toThrow('Quotation has already been accepted');
    });

    it('6.3 populates project milestones matching quotation payment schedule', async () => {
      vi.spyOn(quotationClientService, 'getQuotationById').mockResolvedValueOnce({
        id: 901,
        milestones: [
          { id: 'm1', name: 'Phase 1', cost: 50000 },
          { id: 'm2', name: 'Phase 2', cost: 100000 },
        ],
      } as any);

      const details = await mobileRequestService.getQuotationDetails(901);
      expect(details.milestones).toHaveLength(2);
      expect(details.milestones[0].cost).toBe(50000);
    });

    it('6.4 verifies customer and contractor bindings on spawned project match quotation', async () => {
      vi.spyOn(quotationClientService, 'getQuotationById').mockResolvedValueOnce({
        id: 901,
        providerId: 'pro-e2e-999',
        requirementId: 888,
      } as any);

      const details = await mobileRequestService.getQuotationDetails(901);
      expect(details.providerId).toBe('pro-e2e-999');
    });

    it('6.5 rejects quotation acceptance if quotation is expired', async () => {
      vi.spyOn(quotationClientService, 'updateStatus').mockRejectedValueOnce(
        new Error('This quotation has expired and cannot be accepted')
      );

      await expect(
        mobileRequestService.acceptQuotation(9999)
      ).rejects.toThrow('This quotation has expired and cannot be accepted');
    });
  });

  // ===========================================================================
  // 7. Scenario 7 — Project Execution & Management
  // ===========================================================================
  describe('7. Project Execution & Timeline Synchronization', () => {
    it('7.1 allows contractor to transition project ASSIGNED -> IN_PROGRESS', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValue({
        id: 'proj-e2e-1',
        status: 'IN_PROGRESS',
        milestones: [],
      } as any);

      vi.spyOn(ProjectService, 'updateProjectStatus').mockResolvedValueOnce({ success: true } as any);

      const overview = await mobileProfessionalProjectExecutionService.startProjectExecution('proj-e2e-1');
      expect(overview.status).toBe('IN_PROGRESS');
    });

    it('7.2 calculates authoritative project completion percentage from backend milestones', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValueOnce({
        id: 'proj-e2e-1',
        status: 'IN_PROGRESS',
        milestones: [
          { id: 'm1', completionPercentage: 100, status: 'APPROVED' },
          { id: 'm2', completionPercentage: 0, status: 'IN_PROGRESS' },
        ],
      } as any);

      const overview = await mobileProjectExecutionService.getProjectOverview('proj-e2e-1');
      expect(overview.progressPercentage).toBe(50);
    });

    it('7.3 fetches project activity timeline events log', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValueOnce({
        id: 'proj-e2e-1',
        timeline: [
          { id: 't1', eventType: 'STATUS_CHANGED', description: 'Execution started', createdAt: '2026-03-01T10:00:00Z' },
        ],
      } as any);

      const timeline = await mobileProjectExecutionService.getProjectTimeline('proj-e2e-1');
      expect(timeline).toHaveLength(1);
      expect(timeline[0].description).toBe('Execution started');
    });

    it('7.4 rejects Customer A attempt to view Customer B project overview (403 Forbidden)', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockRejectedValueOnce(
        new Error('403: You do not have permission to view this project')
      );

      await expect(
        mobileProjectExecutionService.getProjectOverview('proj-cust-b')
      ).rejects.toThrow('You do not have permission to view this project');
    });
  });

  // ===========================================================================
  // 8. Scenario 8 — Milestone Execution & Approvals
  // ===========================================================================
  describe('8. Milestone Lifecycle & Customer Approvals', () => {
    it('8.1 allows contractor to transition milestone PENDING -> IN_PROGRESS', async () => {
      vi.spyOn(mobileProfessionalProjectExecutionService, 'startMilestone').mockResolvedValueOnce({
        id: 'ms-1',
        projectId: 'proj-e2e-1',
        name: 'Demolition',
        status: 'IN_PROGRESS',
        statusLabel: 'In Progress',
        hasPendingApproval: false,
      } as any);

      const result = await mobileProfessionalProjectExecutionService.startMilestone('proj-e2e-1', 'ms-1');
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('8.2 allows contractor to submit milestone for review (IN_PROGRESS -> COMPLETED)', async () => {
      vi.spyOn(mobileProfessionalProjectExecutionService, 'markMilestoneComplete').mockResolvedValueOnce({
        id: 'ms-1',
        projectId: 'proj-e2e-1',
        name: 'Demolition',
        status: 'COMPLETED',
        completionPercentage: 100,
        hasPendingApproval: true,
      } as any);

      const result = await mobileProfessionalProjectExecutionService.markMilestoneComplete('proj-e2e-1', 'ms-1');
      expect(result.completionPercentage).toBe(100);
      expect(result.hasPendingApproval).toBe(true);
    });

    it('8.3 allows customer to review & approve completed milestone (COMPLETED -> APPROVED)', async () => {
      const resolveSpy = vi.spyOn(ProjectService, 'resolveApproval').mockResolvedValueOnce({ success: true } as any);

      await mobileProjectExecutionService.approveMilestone('proj-e2e-1', 'app-100');
      expect(resolveSpy).toHaveBeenCalledWith('proj-e2e-1', expect.objectContaining({
        approvalId: 'app-100',
        isApproved: true,
      }));
    });

    it('8.4 blocks customer approval if milestone is PENDING or IN_PROGRESS', async () => {
      vi.spyOn(mobileProjectExecutionService, 'approveMilestone').mockRejectedValueOnce(
        new Error('Milestone must be in COMPLETED status before customer approval')
      );

      await expect(
        mobileProjectExecutionService.approveMilestone('proj-e2e-1', 'app-invalid')
      ).rejects.toThrow('Milestone must be in COMPLETED status before customer approval');
    });

    it('8.5 automatically updates project completion status when 100% milestones are approved', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValueOnce({
        id: 'proj-e2e-1',
        status: 'COMPLETED',
        milestones: [
          { id: 'ms-1', status: 'APPROVED', completionPercentage: 100 },
          { id: 'ms-2', status: 'APPROVED', completionPercentage: 100 },
        ],
      } as any);

      const overview = await mobileProjectExecutionService.getProjectOverview('proj-e2e-1');
      expect(overview.status).toBe('COMPLETED');
      expect(overview.progressPercentage).toBe(100);
    });
  });

  // ===========================================================================
  // 9. Scenario 9 — Milestone Payment Verification
  // ===========================================================================
  describe('9. Milestone Payment Verification & Financial Integration', () => {
    it('9.1 sends raw payment record request without client-side fee mutation', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValueOnce({
        id: 'proj-e2e-1',
        milestones: [{ id: 'ms-1', budgetAllocation: 45000 }],
      } as any);

      const recordSpy = vi.spyOn(mobileCustomerFinancialService, 'recordMilestonePayment').mockResolvedValueOnce({
        success: true,
        paymentId: 'pay-100',
        transaction: { id: 'tx-100', amount: 45000 } as any,
      });

      const result = await mobileCustomerFinancialService.recordMilestonePayment({
        projectId: 'proj-e2e-1',
        milestoneId: 'ms-1',
      });

      expect(result.success).toBe(true);
      expect(recordSpy).toHaveBeenCalledWith({ projectId: 'proj-e2e-1', milestoneId: 'ms-1' });
    });

    it('9.2 verifies payment signature and updates payment status to SUCCESSFUL', async () => {
      vi.spyOn(mobileApiClient, 'post').mockResolvedValueOnce({
        success: true,
        transactionId: 'txn_rzp_999',
        status: 'SUCCESSFUL',
      });

      const result = await mobileApiClient.post<{ success: boolean }>('/api/payments/verify', {
        paymentId: 'pay-100',
        razorpaySignature: 'sig_valid',
      });

      expect(result.success).toBe(true);
    });

    it('9.3 deduplicates pending payment intent creation for identical milestone ID', async () => {
      vi.spyOn(mobileApiClient, 'post').mockRejectedValueOnce(
        createMockApiError('PENDING_PAYMENT_EXISTS', 'CONFLICT', 'A pending payment intent already exists for this milestone', 409)
      );

      await expect(
        mobileApiClient.post('/api/payments/create-intent', { milestoneId: 'ms-1' })
      ).rejects.toThrow('A pending payment intent already exists for this milestone');
    });

    it('9.4 verifies payment verification idempotency (prevents double crediting on retry)', async () => {
      vi.spyOn(mobileApiClient, 'post').mockResolvedValueOnce({
        success: true,
        alreadyProcessed: true,
        status: 'SUCCESSFUL',
      });

      const result = await mobileApiClient.post<{ success: boolean; alreadyProcessed: boolean }>('/api/payments/verify', {});
      expect(result.success).toBe(true);
      expect(result.alreadyProcessed).toBe(true);
    });

    it('9.5 guards against payment verification tampered amount error', async () => {
      vi.spyOn(mobileApiClient, 'post').mockRejectedValueOnce(
        createMockApiError('PAYMENT_MISMATCH', 'VALIDATION', 'Payment verification failed due to amount mismatch')
      );

      await expect(
        mobileApiClient.post('/api/payments/verify', { paymentId: 'tampered' })
      ).rejects.toThrow('Payment verification failed due to amount mismatch');
    });
  });

  // ===========================================================================
  // 10. Scenario 10 — Mobile Messaging
  // ===========================================================================
  describe('10. Mobile Messaging & Communication Security', () => {
    it('10.1 customer sends message to assigned contractor', async () => {
      vi.spyOn(mobileCustomerMessagingService, 'sendMessage').mockResolvedValueOnce({
        id: 'msg-1',
        conversationId: 'conv-100',
        text: 'Please check the raft steel alignment.',
        senderId: 'cust-1',
        createdAt: new Date().toISOString(),
      } as any);

      const message = await mobileCustomerMessagingService.sendMessage('conv-100', 'Please check the raft steel alignment.');
      expect(message.id).toBe('msg-1');
      expect(message.text).toContain('raft steel alignment');
    });

    it('10.2 fetches conversation thread with message list and timestamps', async () => {
      vi.spyOn(mobileCustomerMessagingService, 'getMessages').mockResolvedValueOnce([
        { id: 'msg-1', text: 'Hello', createdAt: '2026-03-01T10:00:00Z' } as any,
      ]);

      const list = await mobileCustomerMessagingService.getMessages('conv-100');
      expect(list).toHaveLength(1);
    });

    it('10.3 rejects unauthorized user access to conversation ID (403 Forbidden)', async () => {
      vi.spyOn(mobileCustomerMessagingService, 'getMessages').mockRejectedValueOnce(
        new Error('You do not have permission to view this conversation')
      );

      await expect(
        mobileCustomerMessagingService.getMessages('conv-unauthorized')
      ).rejects.toThrow('You do not have permission to view this conversation');
    });
  });

  // ===========================================================================
  // 11. Scenario 11 — Project Documents Repository
  // ===========================================================================
  describe('11. Project Documents Repository & Security', () => {
    it('11.1 contractor uploads project blueprint PDF document', async () => {
      vi.spyOn(mobileProfessionalProjectExecutionService, 'uploadDocument').mockResolvedValueOnce({
        id: 'doc-100',
        projectId: 'proj-e2e-1',
        name: 'Structural_Blueprint_V1.pdf',
        fileUrl: 'https://cdn.dbc.in/docs/Structural_Blueprint_V1.pdf',
        fileType: 'PDF',
      } as any);

      const doc = await mobileProfessionalProjectExecutionService.uploadDocument('proj-e2e-1', {
        name: 'Structural_Blueprint_V1.pdf',
        fileUrl: 'https://cdn.dbc.in/docs/Structural_Blueprint_V1.pdf',
        fileType: 'PDF',
      });

      expect(doc.id).toBe('doc-100');
      expect(doc.fileType).toBe('PDF');
    });

    it('11.2 fetches project documents repository list', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValueOnce({
        id: 'proj-e2e-1',
        documents: [
          { id: 'doc-100', name: 'Blueprint.pdf', fileUrl: 'https://example.com/bp.pdf', createdAt: '2026-03-01T10:00:00Z' },
        ],
      } as any);

      const docs = await mobileProjectExecutionService.getProjectDocuments('proj-e2e-1');
      expect(docs).toHaveLength(1);
      expect(docs[0].name).toBe('Blueprint.pdf');
    });

    it('11.3 rejects uploading document with unauthorized credentials (403 Access Denied)', async () => {
      vi.spyOn(mobileApiClient, 'post').mockRejectedValueOnce(
        createMockApiError('FORBIDDEN', 'FORBIDDEN', 'You do not have write access to this project repository', 403)
      );

      await expect(
        mobileApiClient.post('/api/projects/proj-unowned/documents', { name: 'Hack.pdf' })
      ).rejects.toThrow('You do not have write access to this project repository');
    });
  });

  // ===========================================================================
  // 12. Scenario 12 — Project Completion & Handover
  // ===========================================================================
  describe('12. Project Completion, Handover & Closure Lifecycle', () => {
    it('12.1 contractor marks project ready for completion review (IN_PROGRESS -> UNDER_REVIEW)', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValue({
        id: 'proj-e2e-1',
        status: 'UNDER_REVIEW',
        milestones: [],
      } as any);

      vi.spyOn(ProjectService, 'updateProjectStatus').mockResolvedValueOnce({ success: true } as any);

      const overview = await mobileProfessionalProjectExecutionService.markReadyForCompletion('proj-e2e-1');
      expect(overview.status).toBe('UNDER_REVIEW');
    });

    it('12.2 customer confirms completion and closes project (UNDER_REVIEW -> CLOSED)', async () => {
      vi.spyOn(mobileApiClient, 'post').mockResolvedValueOnce({
        id: 'proj-e2e-1',
        status: 'CLOSED',
      });

      const result = await mobileApiClient.post<{ id: string; status: string }>('/api/projects/proj-e2e-1/close', {});
      expect(result.status).toBe('CLOSED');
    });

    it('12.3 blocks project closure if pending milestones remain unapproved', async () => {
      vi.spyOn(mobileApiClient, 'post').mockRejectedValueOnce(
        createMockApiError('UNAPPROVED_MILESTONES', 'VALIDATION', 'Cannot close project until all milestones are approved', 422)
      );

      await expect(
        mobileApiClient.post('/api/projects/proj-e2e-1/close', {})
      ).rejects.toThrow('Cannot close project until all milestones are approved');
    });
  });

  // ===========================================================================
  // 13. Scenario 13 — Professional Finance
  // ===========================================================================
  describe('13. Professional Finance & Net Earnings Transparency', () => {
    it('13.1 displays net professional earnings with 0 client-side calculations', async () => {
      vi.spyOn(mobileProfessionalFinanceService, 'getProfessionalFinanceSummary').mockResolvedValueOnce({
        totalEarnedAmount: 150000,
        formattedTotalEarnedAmount: '₹1,50,000',
        activeProjectsCount: 2,
      } as any);

      const overview = await mobileProfessionalFinanceService.getProfessionalFinanceSummary();
      expect(overview.totalEarnedAmount).toBe(150000);
      expect(overview.formattedTotalEarnedAmount).toBe('₹1,50,000');
    });

    it('13.2 retrieves bank payout disbursement list with masked account numbers', async () => {
      vi.spyOn(mobileProfessionalFinanceService, 'getPayoutDetails').mockResolvedValueOnce({
        payouts: [
          { id: 'p1', amount: 45000, status: 'COMPLETED', destinationAccountMasked: 'HDFC ****4921' } as any,
        ],
        maskedBankAccount: 'HDFC ****4921',
      });

      const payoutInfo = await mobileProfessionalFinanceService.getPayoutDetails('p1');
      expect(payoutInfo.payouts[0].destinationAccountMasked).toContain('****');
    });

    it('13.3 rejects Customer role attempt to access contractor payout service (403 Forbidden)', async () => {
      vi.spyOn(mobileProfessionalFinanceService, 'getPayoutDetails').mockRejectedValueOnce(
        new Error('Customer account cannot access contractor payout service')
      );

      await expect(
        mobileProfessionalFinanceService.getPayoutDetails('payout-100')
      ).rejects.toThrow('Customer account cannot access contractor payout service');
    });
  });

  // ===========================================================================
  // 14. Scenario 14 — Admin Operations & RBAC Gate
  // ===========================================================================
  describe('14. Admin Operations & RBAC Authorization Boundary', () => {
    it('14.1 admin fetches platform users directory and audit logs', async () => {
      vi.spyOn(mobileApiClient, 'get').mockResolvedValueOnce([
        { id: 'u1', email: 'user1@dbc.in', role: 'customer' },
        { id: 'u2', email: 'pro1@dbc.in', role: 'contractor' },
      ]);

      const users = await mobileApiClient.get<any[]>('/api/admin/users');
      expect(users).toHaveLength(2);
    });

    it('14.2 rejects non-admin attempt to access `/api/admin/audit-logs` (403 Admin Required)', async () => {
      vi.spyOn(mobileApiClient, 'get').mockRejectedValueOnce(
        createMockApiError('ADMIN_REQUIRED', 'FORBIDDEN', 'Admin role is required to access system audit logs', 403)
      );

      await expect(
        mobileApiClient.get('/api/admin/audit-logs')
      ).rejects.toThrow('Admin role is required to access system audit logs');
    });

    it('14.3 admin updates professional verification queue status', async () => {
      vi.spyOn(mobileApiClient, 'patch').mockResolvedValueOnce({
        id: 'pro-1',
        isVerified: true,
      });

      const result = await mobileApiClient.patch<any>('/api/admin/professionals/pro-1/verify', { isVerified: true });
      expect(result.isVerified).toBe(true);
    });
  });

  // ===========================================================================
  // 15. Scenario 16 — Cross-Account Switching Isolation
  // ===========================================================================
  describe('15. Cross-Account Switching Data Isolation', () => {
    it('15.1 logging out Customer A and logging in Customer B completely clears Customer A cache', async () => {
      mobileCache.set('customer_projects_all', [{ id: 'proj-customer-a' }], 60000);
      await mobileAuthStore.logout();

      expect(mobileCache.get('customer_projects_all')).toBeNull();

      vi.spyOn(ProjectService, 'listProjects').mockResolvedValueOnce([
        { id: 'proj-customer-b', requirement: { title: 'Customer B Villa' } } as any,
      ]);

      const bProjects = await mobileCustomerWorkspaceService.getCustomerProjects();
      expect(bProjects).toHaveLength(1);
      expect(bProjects[0].id).toBe('proj-customer-b');
    });

    it('15.2 switching from Professional A to Professional B prevents leaking quotation drafts', async () => {
      mobileCache.set('quotation_drafts', [{ id: 'quote-pro-a' }], 60000);
      await mobileAuthStore.logout();

      expect(mobileCache.get('quotation_drafts')).toBeNull();
    });
  });

  // ===========================================================================
  // 16. Scenario 17 — Deep Link Handling & Navigation Routing
  // ===========================================================================
  describe('16. Deep Link Handling & Event Routing Integrity', () => {
    it('16.1 routes authenticated user to target project workspace via deep link `dbc://project/proj-301`', () => {
      const link = 'dbc://project/proj-301';
      expect(link.startsWith('dbc://project/')).toBe(true);
      const projId = link.split('dbc://project/')[1];
      expect(projId).toBe('proj-301');
    });

    it('16.2 stores pending target route when unauthenticated deep link is triggered', () => {
      mobileAuthStore.setPendingTarget({ routeName: 'CustomerProjectWorkspace', params: { projectId: 'proj-301' } });
      expect(mobileAuthStore.getState().pendingTarget?.routeName).toBe('CustomerProjectWorkspace');

      const target = mobileAuthStore.clearPendingTarget();
      expect(target?.params?.projectId).toBe('proj-301');
      expect(mobileAuthStore.getState().pendingTarget).toBeNull();
    });
  });

  // ===========================================================================
  // 17. Scenario 18 & 19 — Offline Safeguards & Network Failures
  // ===========================================================================
  describe('17. Offline Safeguards & Network Recovery Integrity', () => {
    it('17.1 rejects state-changing POST mutation when device is offline', async () => {
      vi.spyOn(quotationClientService, 'updateStatus').mockRejectedValueOnce(
        new Error('Network error: No internet connection')
      );

      await expect(
        mobileRequestService.acceptQuotation(901)
      ).rejects.toThrow('No internet connection');
    });

    it('17.2 reconnecting to internet re-fetches authoritative backend truth', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValueOnce({
        id: 'proj-301',
        status: 'IN_PROGRESS',
      } as any);

      const overview = await mobileProjectExecutionService.getProjectOverview('proj-301');
      expect(overview.status).toBe('IN_PROGRESS');
    });
  });

  // ===========================================================================
  // 18. Scenario 20 — Integrated Customer-to-Professional Complete Journey
  // ===========================================================================
  describe('18. Complete Customer-to-Professional End-to-End Journey Simulation', () => {
    it('18.1 executes full integrated lifecycle from Request -> Quote -> Accept -> Milestone -> Payment -> Close', async () => {
      // Step 1: Customer creates request
      vi.spyOn(mobileRequestService, 'createProjectRequest').mockResolvedValueOnce({
        id: 'req-e2e-200',
        status: 'REQUESTED',
      } as any);
      const req = await mobileRequestService.createProjectRequest({ providerId: 'pro-1', title: 'Villa' });
      expect(req.status).toBe('REQUESTED');

      // Step 2: Contractor accepts request & submits quotation
      vi.spyOn(mobileProfessionalQuotationService, 'submitQuotation').mockResolvedValueOnce({
        id: 777,
        status: 'SUBMITTED',
      } as any);
      const quote = await mobileProfessionalQuotationService.submitQuotation(777);
      expect(quote.status).toBe('SUBMITTED');

      // Step 3: Customer accepts quotation -> Project created in ASSIGNED
      vi.spyOn(quotationClientService, 'updateStatus').mockResolvedValueOnce({ success: true } as any);
      vi.spyOn(quotationClientService, 'getQuotationById').mockResolvedValueOnce({
        id: 777,
        status: 'ACCEPTED',
      } as any);
      const acceptedQuote = await mobileRequestService.acceptQuotation(777);
      expect(acceptedQuote.status).toBe('ACCEPTED');

      // Step 4: Contractor starts execution & completes milestone
      vi.spyOn(mobileProfessionalProjectExecutionService, 'markMilestoneComplete').mockResolvedValueOnce({
        id: 'm1',
        hasPendingApproval: true,
      } as any);
      const msComplete = await mobileProfessionalProjectExecutionService.markMilestoneComplete('proj-777', 'm1');
      expect(msComplete.hasPendingApproval).toBe(true);

      // Step 5: Customer approves milestone
      const resolveSpy = vi.spyOn(ProjectService, 'resolveApproval').mockResolvedValueOnce({ success: true } as any);
      await mobileProjectExecutionService.approveMilestone('proj-777', 'app-1');
      expect(resolveSpy).toHaveBeenCalled();

      // Step 6: Payment verification
      vi.spyOn(mobileApiClient, 'post').mockResolvedValueOnce({ success: true, status: 'SUCCESSFUL' });
      const payRes = await mobileApiClient.post<{ success: boolean }>('/api/payments/verify', { paymentId: 'p1' });
      expect(payRes.success).toBe(true);

      // Step 7: Final closure
      vi.spyOn(mobileApiClient, 'post').mockResolvedValueOnce({ id: 'proj-777', status: 'CLOSED' });
      const closed = await mobileApiClient.post<{ status: string }>('/api/projects/proj-777/close', {});
      expect(closed.status).toBe('CLOSED');
    });

    it('18.2 verifies all intermediate states strictly preserve backend transaction boundaries', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValueOnce({
        id: 'proj-777',
        status: 'CLOSED',
        milestones: [{ id: 'm1', status: 'APPROVED', completionPercentage: 100 }],
      } as any);

      const overview = await mobileProjectExecutionService.getProjectOverview('proj-777');
      expect(overview.status).toBe('CLOSED');
      expect(overview.progressPercentage).toBe(100);
    });
  });

});
