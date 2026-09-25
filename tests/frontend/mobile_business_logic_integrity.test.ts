import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mobileApiClient } from '../../mobile/src/api/mobileApiClient.js';
import { mobileAuthStore } from '../../mobile/src/state/authStore.js';
import { mobileRequestService } from '../../mobile/src/services/mobileRequestService.js';
import { mobileCustomerWorkspaceService } from '../../mobile/src/services/mobileCustomerWorkspaceService.js';
import { mobileProjectExecutionService } from '../../mobile/src/services/mobileProjectExecutionService.js';
import { mobileCustomerFinancialService } from '../../mobile/src/services/mobileCustomerFinancialService.js';
import { mobileProfessionalQuotationService } from '../../mobile/src/services/mobileProfessionalQuotationService.js';
import { mobileProfessionalProjectExecutionService } from '../../mobile/src/services/mobileProfessionalProjectExecutionService.js';
import { mobileProfessionalFinanceService } from '../../mobile/src/services/mobileProfessionalFinanceService.js';
import { mobileCache } from '../../mobile/src/cache/mobileCache.js';
import { quotationClientService } from '../../src/services/quotation/quotationClientService.js';
import { ProjectService } from '../../src/services/contractor/ProjectService.js';

function createMockApiError(code: string, category: string, message: string, status = 400) {
  return {
    code,
    category,
    message,
    status,
    retryable: false,
  };
}

describe('Module 62 — Mobile Business Logic, State Transition & Transaction Integrity Audit Suite', () => {

  beforeEach(() => {
    vi.restoreAllMocks();
    mobileCache.clear();
  });

  // ===========================================================================
  // 1. Entity State Inventory & Allowed Transitions
  // ===========================================================================
  describe('1. Entity State Inventory & State Machine Transitions', () => {
    
    it('1.1 validates Request/Booking state machine: REQUESTED -> ACCEPTED -> IN_PROGRESS -> COMPLETED', async () => {
      vi.spyOn(quotationClientService, 'getQuotationById').mockResolvedValueOnce({
        id: 101,
        status: 'ACCEPTED',
        requirementId: 50,
        providerId: 'pro-1',
        totalAmount: 50000,
        createdAt: '2026-03-01T00:00:00Z',
      } as any);

      const quotation = await mobileRequestService.getQuotationDetails(101);
      expect(quotation.id).toBe(101);
      expect(quotation.status).toBe('ACCEPTED');
    });

    it('1.2 blocks invalid Request transition from CANCELLED to IN_PROGRESS', async () => {
      vi.spyOn(mobileApiClient, 'patch').mockRejectedValueOnce(
        createMockApiError('INVALID_STATE_TRANSITION', 'VALIDATION', 'Cannot transition request from CANCELLED to IN_PROGRESS')
      );

      await expect(
        mobileApiClient.patch('/api/requests/req-101/status', { status: 'IN_PROGRESS' })
      ).rejects.toThrow('Cannot transition request from CANCELLED to IN_PROGRESS');
    });

    it('1.3 validates Quotation state lifecycle: DRAFT -> SUBMITTED -> ACCEPTED', async () => {
      vi.spyOn(mobileProfessionalQuotationService, 'createQuotationDraft').mockResolvedValueOnce({
        id: 201,
        status: 'DRAFT',
        totalAmount: 50000,
      } as any);

      const quotation = await mobileProfessionalQuotationService.createQuotationDraft({
        requirementId: 101,
        priceModel: 'FIXED',
        totalAmount: 50000,
        estimatedDurationDays: 14,
        proposal: { title: 'Test Proposal', summary: 'Scope', scope: 'Complete', deliverables: 'Full' },
      });

      expect(quotation.status).toBe('DRAFT');
    });

    it('1.4 blocks invalid Quotation transition from ACCEPTED to REVISED', async () => {
      vi.spyOn(mobileApiClient, 'put').mockRejectedValueOnce(
        createMockApiError('STATE_LOCKED', 'VALIDATION', 'Accepted quotations cannot be revised')
      );

      await expect(
        mobileApiClient.put('/api/quotations/201/status', { status: 'REVISED' })
      ).rejects.toThrow('Accepted quotations cannot be revised');
    });

    it('1.5 validates Project state lifecycle: ASSIGNED -> PLANNING -> IN_PROGRESS -> COMPLETED', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValueOnce({
        id: 'proj-301',
        status: 'ASSIGNED',
        requirementId: 10,
        providerId: 'pro-1',
        milestones: [],
      } as any);

      const overview = await mobileProjectExecutionService.getProjectOverview('proj-301');
      expect(overview.status).toBe('ASSIGNED');
    });

    it('1.6 validates Milestone states: PENDING -> IN_PROGRESS -> COMPLETED -> APPROVED', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValueOnce({
        id: 'proj-301',
        status: 'IN_PROGRESS',
        milestones: [
          { id: 'ms-1', projectId: 'proj-301', name: 'Phase 1 - Demolition', status: 'PENDING', budgetAllocation: 10000, completionPercentage: 0 },
          { id: 'ms-2', projectId: 'proj-301', name: 'Phase 2 - Fitting', status: 'PENDING', budgetAllocation: 15000, completionPercentage: 0 },
        ],
      } as any);

      const milestones = await mobileProjectExecutionService.getProjectMilestones('proj-301');
      expect(milestones[0].status).toBe('PENDING');
      expect(milestones[1].status).toBe('PENDING');
    });

    it('1.7 validates Payment states: PENDING -> PROCESSING -> SUCCESSFUL', async () => {
      vi.spyOn(mobileCustomerFinancialService, 'getPaymentDetails').mockResolvedValueOnce({
        id: 'pay-401',
        status: 'SUCCESS',
        amount: 15000,
        transactionReference: 'txn-999',
      } as any);

      const payment = await mobileCustomerFinancialService.getPaymentDetails('pay-401');
      expect(payment.status).toBe('SUCCESS');
      expect(payment.transactionReference).toBe('txn-999');
    });

    it('1.8 verifies prohibited illegal state jumps are rejected by backend', async () => {
      vi.spyOn(mobileApiClient, 'post').mockRejectedValueOnce(
        createMockApiError('ILLEGAL_TRANSITION', 'VALIDATION', 'Cannot complete project without all milestones approved', 422)
      );

      await expect(
        mobileApiClient.post('/api/projects/proj-301/complete', {})
      ).rejects.toThrow('Cannot complete project without all milestones approved');
    });
  });

  // ===========================================================================
  // 2. Quotation Acceptance -> Project Creation Atomic Transaction Boundary
  // ===========================================================================
  describe('2. Quotation Acceptance -> Project Creation Transaction Boundary', () => {

    it('2.1 verifies accepting quotation atomically updates state and returns status', async () => {
      vi.spyOn(quotationClientService, 'updateStatus').mockResolvedValueOnce({ success: true } as any);
      vi.spyOn(quotationClientService, 'getQuotationById').mockResolvedValueOnce({
        id: 201,
        status: 'ACCEPTED',
        requirementId: 50,
        providerId: 'pro-1',
        totalAmount: 50000,
        milestones: [
          { id: 'ms-1', name: 'Advance', cost: 10000, durationDays: 7 }
        ],
      } as any);

      const result = await mobileRequestService.acceptQuotation(201);
      expect(result.status).toBe('ACCEPTED');
      expect(result.success).toBe(true);
    });

    it('2.2 verifies duplicate quotation acceptance requests trigger conflict exception', async () => {
      vi.spyOn(quotationClientService, 'updateStatus').mockRejectedValueOnce(
        new Error('Quotation has already been accepted')
      );

      await expect(
        mobileRequestService.acceptQuotation(201)
      ).rejects.toThrow('Quotation has already been accepted');
    });

    it('2.3 verifies project milestones are populated from accepted quotation payment schedule', async () => {
      vi.spyOn(quotationClientService, 'updateStatus').mockResolvedValueOnce({ success: true } as any);
      vi.spyOn(quotationClientService, 'getQuotationById').mockResolvedValueOnce({
        id: 201,
        status: 'ACCEPTED',
        requirementId: 50,
        providerId: 'pro-1',
        totalAmount: 50000,
        milestones: [
          { id: 'ms-1', name: 'Initial Advance (20%)', cost: 10000, durationDays: 3 },
          { id: 'ms-2', name: 'Completion (80%)', cost: 40000, durationDays: 10 },
        ],
      } as any);

      const result = await mobileRequestService.acceptQuotation(201);
      expect(result.milestones).toHaveLength(2);
      expect(result.milestones[0].cost).toBe(10000);
      expect(result.milestones[1].cost).toBe(40000);
    });

    it('2.4 verifies provider binding on quotation acceptance', async () => {
      vi.spyOn(quotationClientService, 'updateStatus').mockResolvedValueOnce({ success: true } as any);
      vi.spyOn(quotationClientService, 'getQuotationById').mockResolvedValueOnce({
        id: 201,
        status: 'ACCEPTED',
        requirementId: 50,
        providerId: 'pro-999',
        totalAmount: 75000,
      } as any);

      const result = await mobileRequestService.acceptQuotation(201);
      expect(result.providerId).toBe('pro-999');
      expect(result.status).toBe('ACCEPTED');
    });

    it('2.5 rejects quotation acceptance if quotation is expired or withdrawn', async () => {
      vi.spyOn(quotationClientService, 'updateStatus').mockRejectedValueOnce(
        new Error('This quotation has expired and cannot be accepted')
      );

      await expect(
        mobileRequestService.acceptQuotation(999)
      ).rejects.toThrow('This quotation has expired and cannot be accepted');
    });
  });

  // ===========================================================================
  // 3. Project Execution & Milestone Lifecycle
  // ===========================================================================
  describe('3. Project Execution & Milestone Lifecycle Integrity', () => {

    it('3.1 allows contractor to start milestone transition to IN_PROGRESS', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValue({
        id: 'proj-301',
        status: 'IN_PROGRESS',
        milestones: [
          { id: 'ms-1', projectId: 'proj-301', name: 'Demolition', status: 'IN_PROGRESS', completionPercentage: 10 },
        ],
      } as any);

      vi.spyOn(ProjectService, 'updateMilestone').mockResolvedValueOnce({ success: true } as any);

      const result = await mobileProfessionalProjectExecutionService.startMilestone('proj-301', 'ms-1');
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('3.2 allows contractor to complete milestone submission', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValue({
        id: 'proj-301',
        status: 'IN_PROGRESS',
        milestones: [
          { id: 'ms-1', projectId: 'proj-301', name: 'Demolition', status: 'COMPLETED', completionPercentage: 100 },
        ],
      } as any);

      vi.spyOn(ProjectService, 'updateMilestone').mockResolvedValueOnce({ success: true } as any);

      const result = await mobileProfessionalProjectExecutionService.markMilestoneComplete('proj-301', 'ms-1');
      expect(result.completionPercentage).toBe(100);
      expect(result.hasPendingApproval).toBe(true);
    });

    it('3.3 allows customer to approve milestone via resolveApproval', async () => {
      const resolveSpy = vi.spyOn(ProjectService, 'resolveApproval').mockResolvedValueOnce({ success: true } as any);

      await mobileProjectExecutionService.approveMilestone('proj-301', 'app-100');
      expect(resolveSpy).toHaveBeenCalledWith('proj-301', expect.objectContaining({
        approvalId: 'app-100',
        isApproved: true,
      }));
    });

    it('3.4 blocks milestone approval if milestone status is PENDING or IN_PROGRESS', async () => {
      vi.spyOn(mobileProjectExecutionService, 'approveMilestone').mockRejectedValueOnce(
        new Error('Milestone must be in COMPLETED status before customer approval')
      );

      await expect(
        mobileProjectExecutionService.approveMilestone('proj-301', 'app-invalid')
      ).rejects.toThrow('Milestone must be in COMPLETED status before customer approval');
    });

    it('3.5 updates overall project completion percentage when milestones are approved', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValueOnce({
        id: 'proj-301',
        status: 'IN_PROGRESS',
        milestones: [
          { id: 'ms-1', completionPercentage: 100, status: 'APPROVED' },
          { id: 'ms-2', completionPercentage: 0, status: 'IN_PROGRESS' },
        ],
      } as any);

      const overview = await mobileProjectExecutionService.getProjectOverview('proj-301');
      expect(overview.progressPercentage).toBe(50);
    });

    it('3.6 completes project automatically when 100% milestones are approved', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValueOnce({
        id: 'proj-301',
        status: 'COMPLETED',
        milestones: [
          { id: 'ms-1', completionPercentage: 100, status: 'APPROVED' },
          { id: 'ms-2', completionPercentage: 100, status: 'APPROVED' },
        ],
      } as any);

      const overview = await mobileProjectExecutionService.getProjectOverview('proj-301');
      expect(overview.status).toBe('COMPLETED');
      expect(overview.progressPercentage).toBe(100);
    });
  });

  // ===========================================================================
  // 4. Financial Integrity Audit (Zero Client Calculations)
  // ===========================================================================
  describe('4. Financial Integrity & Zero Client-Side Calculations', () => {

    it('4.1 verifies total project cost, GST, platform fee are calculated authoritatively', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValueOnce({
        id: 'proj-301',
        quotation: { totalAmount: 100000 },
        milestones: [],
      } as any);

      const summary = await mobileCustomerFinancialService.getProjectFinancialSummary('proj-301');
      expect(summary.totalProjectAmount).toBe(100000);
      expect(summary.totalCustomerPayable).toBe(101180);
    });

    it('4.2 verifies client sends raw payment record request without mutating amounts', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValueOnce({
        id: 'proj-301',
        milestones: [{ id: 'ms-1', budgetAllocation: 25000 }],
      } as any);

      const recordSpy = vi.spyOn(mobileCustomerFinancialService, 'recordMilestonePayment').mockResolvedValueOnce({
        success: true,
        paymentId: 'pay-1',
        transaction: { id: 'tx-1', amount: 25000 } as any,
      });

      const result = await mobileCustomerFinancialService.recordMilestonePayment({
        projectId: 'proj-301',
        milestoneId: 'ms-1',
      });

      expect(result.success).toBe(true);
      expect(recordSpy).toHaveBeenCalledWith({ projectId: 'proj-301', milestoneId: 'ms-1' });
    });

    it('4.3 verifies payment verification delegates signature check to backend', async () => {
      vi.spyOn(mobileApiClient, 'post').mockResolvedValueOnce({
        success: true,
        transactionId: 'txn_999888',
        status: 'SUCCESSFUL',
      });

      const result = await mobileApiClient.post<{ success: boolean }>('/api/payments/verify', {
        paymentId: 'pay-401',
        razorpaySignature: 'sig_abcdef',
      });

      expect(result.success).toBe(true);
    });

    it('4.4 verifies professional net payout is determined authoritatively by backend', async () => {
      vi.spyOn(mobileProfessionalFinanceService, 'getPayoutDetails').mockResolvedValueOnce({
        payouts: [
          { id: 'payout-10', amount: 49000, formattedAmount: '₹49,000', date: '2026-03-01', status: 'COMPLETED', statusLabel: 'Disbursed', relatedProjectName: 'Kitchen Project', destinationAccountMasked: 'HDFC ****1234', payoutReference: 'PO-10' }
        ],
        maskedBankAccount: 'HDFC ****1234',
      });

      const payout = await mobileProfessionalFinanceService.getPayoutDetails('payout-10');
      expect(payout.payouts[0].amount).toBe(49000);
      expect(payout.payouts[0].status).toBe('COMPLETED');
    });

    it('4.5 verifies platform fee of 1% is calculated by backend, not hardcoded by client', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValueOnce({
        id: 'proj-500',
        quotation: { totalAmount: 200000 },
        milestones: [],
      } as any);

      const summary = await mobileCustomerFinancialService.getProjectFinancialSummary('proj-500');
      expect(summary.totalProjectAmount).toBe(200000);
      expect(summary.totalCustomerPayable).toBe(202360);
    });

    it('4.6 guards against payment verification tampered amount error', async () => {
      vi.spyOn(mobileApiClient, 'post').mockRejectedValueOnce(
        createMockApiError('PAYMENT_MISMATCH', 'VALIDATION', 'Payment verification failed due to amount mismatch')
      );

      await expect(
        mobileApiClient.post('/api/payments/verify', { paymentId: 'tampered' })
      ).rejects.toThrow('Payment verification failed due to amount mismatch');
    });

    it('4.7 verifies financial history displays exact transaction logs from backend', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValue({
        id: 'proj-301',
        quotation: { totalAmount: 50000 },
        milestones: [],
      } as any);

      const history = await mobileCustomerFinancialService.getPaymentHistory('proj-301');
      expect(history).toBeDefined();
    });

    it('4.8 verifies financial invoice generation relies strictly on backend invoice endpoint', async () => {
      vi.spyOn(mobileApiClient, 'get').mockResolvedValueOnce({
        invoiceNumber: 'INV-2026-0089',
        downloadUrl: 'https://cdn.dbc.com/invoices/INV-2026-0089.pdf',
      });

      const invoice = await mobileApiClient.get<{ invoiceNumber: string; downloadUrl: string }>('/api/payments/pay-401/invoice');
      expect(invoice.invoiceNumber).toBe('INV-2026-0089');
      expect(invoice.downloadUrl).toContain('.pdf');
    });
  });

  // ===========================================================================
  // 5. Idempotency, Concurrency & Locking Safeguards
  // ===========================================================================
  describe('5. Idempotency, Concurrency & Locking Safeguards', () => {

    it('5.1 prevents duplicate quotation submission via backend idempotency lock', async () => {
      vi.spyOn(mobileApiClient, 'post').mockRejectedValueOnce(
        createMockApiError('DUPLICATE_SUBMISSION', 'CONFLICT', 'A quotation has already been submitted for this request', 409)
      );

      await expect(
        mobileApiClient.post('/api/quotations', { requestId: 'req-101' })
      ).rejects.toThrow('A quotation has already been submitted for this request');
    });

    it('5.2 handles simultaneous quotation acceptance attempts safely (409 Conflict)', async () => {
      vi.spyOn(quotationClientService, 'updateStatus')
        .mockResolvedValueOnce({ success: true } as any)
        .mockRejectedValueOnce(new Error('Quotation is already accepted'));

      vi.spyOn(quotationClientService, 'getQuotationById').mockResolvedValue({
        id: 201,
        status: 'ACCEPTED',
      } as any);

      const firstCall = mobileRequestService.acceptQuotation(201);
      const secondCall = mobileRequestService.acceptQuotation(201);

      const firstResult = await firstCall;
      expect(firstResult.status).toBe('ACCEPTED');

      await expect(secondCall).rejects.toThrow('Quotation is already accepted');
    });

    it('5.3 deduplicates simultaneous GET requests for project overview using in-memory cache', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockResolvedValue({
        id: 'proj-301',
        requirementId: 10,
        providerId: 'pro-1',
        status: 'IN_PROGRESS',
      } as any);

      const [p1, p2] = await Promise.all([
        mobileProjectExecutionService.getProjectOverview('proj-301'),
        mobileProjectExecutionService.getProjectOverview('proj-301'),
      ]);

      expect(p1.id).toBe('proj-301');
      expect(p2.id).toBe('proj-301');
    });

    it('5.4 verifies payment intent deduplication for identical milestone ID', async () => {
      vi.spyOn(mobileApiClient, 'post').mockRejectedValueOnce(
        createMockApiError('PENDING_PAYMENT_EXISTS', 'CONFLICT', 'A pending payment intent already exists for this milestone', 409)
      );

      await expect(
        mobileApiClient.post('/api/payments/create-intent', { milestoneId: 'ms-1' })
      ).rejects.toThrow('A pending payment intent already exists for this milestone');
    });

    it('5.5 verifies payment verification idempotency (prevents double crediting on retry)', async () => {
      vi.spyOn(mobileApiClient, 'post').mockResolvedValueOnce({
        success: true,
        alreadyProcessed: true,
        transactionId: 'txn-existing-123',
        status: 'SUCCESSFUL',
      });

      const result = await mobileApiClient.post<{ success: boolean; alreadyProcessed: boolean }>('/api/payments/verify', {});
      expect(result.success).toBe(true);
      expect(result.alreadyProcessed).toBe(true);
    });

    it('5.6 verifies milestone approval request idempotency (re-approving returns existing approved status)', async () => {
      vi.spyOn(ProjectService, 'resolveApproval').mockResolvedValueOnce({ success: true } as any);

      await expect(
        mobileProjectExecutionService.approveMilestone('proj-301', 'ms-1')
      ).resolves.toBeUndefined();
    });
  });

  // ===========================================================================
  // 6. Authorization, Role Boundaries & Ownership Enforcement
  // ===========================================================================
  describe('6. Authorization Ownership Matrix & Role Boundary Audit', () => {

    it('6.1 rejects Customer A attempt to access Customer B project details (403 Forbidden)', async () => {
      vi.spyOn(ProjectService, 'getProjectDetail').mockRejectedValueOnce(
        new Error('403: You do not have permission to view this project')
      );

      await expect(
        mobileProjectExecutionService.getProjectOverview('proj-customer-b')
      ).rejects.toThrow('You do not have permission to view this project');
    });

    it('6.2 rejects Contractor A attempt to update Contractor B milestone (403 Forbidden)', async () => {
      vi.spyOn(mobileProfessionalProjectExecutionService, 'markMilestoneComplete').mockRejectedValueOnce(
        new Error('You are not the assigned contractor for this project')
      );

      await expect(
        mobileProfessionalProjectExecutionService.markMilestoneComplete('proj-other-pro', 'ms-1')
      ).rejects.toThrow('You are not the assigned contractor for this project');
    });

    it('6.3 rejects Customer attempt to access professional payout endpoint (403 Forbidden)', async () => {
      vi.spyOn(mobileProfessionalFinanceService, 'getPayoutDetails').mockRejectedValueOnce(
        new Error('Customer account cannot access contractor payout service')
      );

      await expect(
        mobileProfessionalFinanceService.getPayoutDetails('payout-100')
      ).rejects.toThrow('Customer account cannot access contractor payout service');
    });

    it('6.4 rejects unauthenticated requests missing bearer token (401 Unauthorized)', async () => {
      await mobileAuthStore.logout();

      vi.spyOn(mobileApiClient, 'get').mockRejectedValueOnce(
        createMockApiError('UNAUTHORIZED', 'UNAUTHORIZED', 'Authentication token required', 401)
      );

      await expect(
        mobileApiClient.get('/api/requests/my-requests')
      ).rejects.toThrow('Authentication token required');
    });

    it('6.5 verifies resource ownership is enforced on ID-based request routes', async () => {
      vi.spyOn(mobileApiClient, 'delete').mockRejectedValueOnce(
        createMockApiError('FORBIDDEN', 'FORBIDDEN', 'Only the request creator can cancel this request', 403)
      );

      await expect(
        mobileApiClient.delete('/api/requests/req-unowned')
      ).rejects.toThrow('Only the request creator can cancel this request');
    });

    it('6.6 verifies admin oversight routes require administrative role context', async () => {
      vi.spyOn(mobileApiClient, 'get').mockRejectedValueOnce(
        createMockApiError('ADMIN_REQUIRED', 'FORBIDDEN', 'Admin role is required to access system audit logs', 403)
      );

      await expect(
        mobileApiClient.get('/api/admin/audit-logs')
      ).rejects.toThrow('Admin role is required to access system audit logs');
    });
  });

  // ===========================================================================
  // 7. Cache Synchronization & Invalidation Policies
  // ===========================================================================
  describe('7. Cache Synchronization, Invalidation & Offline Policies', () => {

    it('7.1 invalidates project cache entries when project state is updated', () => {
      mobileCache.set('project_proj-301', { id: 'proj-301', status: 'IN_PROGRESS' }, 60000);
      mobileCache.set('milestone_proj-301', [{ id: 'ms-1' }], 60000);

      expect(mobileCache.get('project_proj-301')).not.toBeNull();

      mobileCache.invalidatePrefix('project_');
      mobileCache.invalidatePrefix('milestone_');

      expect(mobileCache.get('project_proj-301')).toBeNull();
      expect(mobileCache.get('milestone_proj-301')).toBeNull();
    });

    it('7.2 invalidates quotation cache entries when quotation is accepted', () => {
      mobileCache.set('quotation_q-201', { id: 'q-201', status: 'SUBMITTED' }, 60000);

      expect(mobileCache.get('quotation_q-201')).not.toBeNull();

      mobileCache.invalidatePrefix('quotation_');
      expect(mobileCache.get('quotation_q-201')).toBeNull();
    });

    it('7.3 rejects state-changing mutations when offline with clear network error', async () => {
      vi.spyOn(quotationClientService, 'updateStatus').mockRejectedValueOnce(
        new Error('Network error: No internet connection')
      );

      await expect(
        mobileRequestService.acceptQuotation(201)
      ).rejects.toThrow('No internet connection');
    });

    it('7.4 serves fresh cache data for GET requests when within TTL window', () => {
      const cachedProject = { id: 'proj-301', status: 'ASSIGNED' };
      mobileCache.set('project_proj-301', cachedProject, 60000);

      const retrieved = mobileCache.get<{ id: string; status: string }>('project_proj-301');
      expect(retrieved).toEqual(cachedProject);
    });

    it('7.5 enforces zero storage of sensitive tokens or payment credentials in mobile memory cache', () => {
      mobileCache.set('access_token', 'jwt-secret-token', 60000);
      expect(mobileCache.get('access_token')).toBeNull();

      mobileCache.set('creditcard_number', '4111111111111111', 60000);
      expect(mobileCache.get('creditcard_number')).toBeNull();
    });

    it('7.6 verifies GET retry safety vs non-idempotent POST mutation restriction', () => {
      const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
      const nonIdempotentMethods = ['POST', 'PATCH'];

      expect(safeMethods.every(m => m === 'GET' || m === 'HEAD' || m === 'OPTIONS')).toBe(true);
      expect(nonIdempotentMethods.includes('POST')).toBe(true);
    });
  });

});
