import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mobileCustomerFinancialService } from '../../mobile/src/services/mobileCustomerFinancialService.js';
import {
  CustomerProjectFinancialsScreenController,
  renderCustomerProjectFinancialsScreen,
} from '../../mobile/src/screens/execution/CustomerProjectFinancialsScreen.js';
import {
  CustomerMilestonePaymentsScreenController,
  renderCustomerMilestonePaymentsScreen,
} from '../../mobile/src/screens/execution/CustomerMilestonePaymentsScreen.js';
import {
  CustomerPaymentHistoryScreenController,
  renderCustomerPaymentHistoryScreen,
} from '../../mobile/src/screens/execution/CustomerPaymentHistoryScreen.js';
import {
  CustomerPaymentDetailsScreenController,
  renderCustomerPaymentDetailsScreen,
} from '../../mobile/src/screens/execution/CustomerPaymentDetailsScreen.js';
import { ProjectService } from '../../src/services/contractor/ProjectService.js';
import type { Project } from '../../src/types/contractor/ProjectTypes.js';

// Mock ProjectService
vi.mock('../../src/services/contractor/ProjectService.js', () => ({
  ProjectService: {
    getProjectDetail: vi.fn(),
    listProjects: vi.fn(),
    resolveApproval: vi.fn(),
  },
}));

const mockProject: Project = {
  id: 'proj-financial-101',
  requirementId: 88,
  customerId: 'cust-101',
  providerId: 'prov-202',
  quotationId: 501,
  status: 'IN_PROGRESS',
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-15T10:00:00Z',
  requirement: {
    id: 88,
    title: 'Greenhills Villa Construction',
    description: '4 BHK Duplex Villa Construction',
    location: 'Bangalore',
  },
  quotation: {
    id: 501,
    totalAmount: 100000,
    warrantyMonths: 12,
  },
  milestones: [
    {
      id: 'm1',
      projectId: 'proj-financial-101',
      name: 'Foundation & Excavation',
      budgetAllocation: 40000,
      completionPercentage: 100,
      status: 'APPROVED',
      createdAt: '2026-09-01T10:00:00Z',
    },
    {
      id: 'm2',
      projectId: 'proj-financial-101',
      name: 'Superstructure Framing',
      budgetAllocation: 60000,
      completionPercentage: 50,
      status: 'IN_PROGRESS',
      createdAt: '2026-09-05T10:00:00Z',
    },
  ],
};

describe('Module 39 — Mobile Customer Financials, Payments & Milestone Payment Experience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mobileCustomerFinancialService.clearFinancialCache();
  });

  describe('1. Backend-Authoritative Financial Summary & Breakdown', () => {
    it('calculates project totals, 1% platform fee, and 18% GST accurately from backend project quotation', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockResolvedValue(mockProject);

      const summary = await mobileCustomerFinancialService.getProjectFinancialSummary('proj-financial-101');

      expect(summary.projectId).toBe('proj-financial-101');
      expect(summary.totalProjectAmount).toBe(100000);
      expect(summary.breakdown.platformFee).toBe(1000); // 1% of 100,000
      expect(summary.breakdown.taxAmount).toBe(180); // 18% of 1,000
      expect(summary.totalCustomerPayable).toBe(101180);

      // Milestone m1 (40,000) is APPROVED -> paid breakdown = 40000 + 400 + 72 = 40472
      expect(summary.amountPaid).toBe(40472);
      expect(summary.remainingBalance).toBe(60708);
      expect(summary.paymentStatus).toBe('PAYMENT_DUE');
    });

    it('renders CustomerProjectFinancialsScreen cleanly with overview cards and breakdown', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockResolvedValue(mockProject);

      const controller = new CustomerProjectFinancialsScreenController({ projectId: 'proj-financial-101' });
      await controller.init();

      expect(controller.getState().isLoading).toBe(false);
      expect(controller.getState().summary?.totalCustomerPayable).toBe(101180);

      const html = renderCustomerProjectFinancialsScreen(controller);
      expect(html).toContain('Greenhills Villa Construction');
      expect(html).toContain('1,01,180');
      expect(html).toContain('PAYMENT DUE');
      expect(html).toContain('DBC Escrow Protection Guarantee');
    });
  });

  describe('2. Milestone Payment Schedule & Actions', () => {
    it('returns milestone payments with accurate fee breakdown and actionable state', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockResolvedValue(mockProject);

      const milestones = await mobileCustomerFinancialService.getMilestonePayments('proj-financial-101');

      expect(milestones).toHaveLength(2);
      expect(milestones[0].milestoneName).toBe('Foundation & Excavation');
      expect(milestones[0].paymentStatus).toBe('PAID');
      expect(milestones[0].isActionable).toBe(false);

      expect(milestones[1].milestoneName).toBe('Superstructure Framing');
      expect(milestones[1].paymentStatus).toBe('DUE');
      expect(milestones[1].isActionable).toBe(true);
      expect(milestones[1].totalPayable).toBe(60708); // 60000 + 600 + 108
    });

    it('handles checkout opening and prevents duplicate payment submission', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockResolvedValue(mockProject);

      const controller = new CustomerMilestonePaymentsScreenController({ projectId: 'proj-financial-101' });
      await controller.init();

      const state = controller.getState();
      const dueMilestone = state.milestones.find((m) => m.isActionable);
      expect(dueMilestone).toBeDefined();

      if (dueMilestone) {
        controller.openCheckout(dueMilestone);
        expect(controller.getState().isCheckoutOpen).toBe(true);
        expect(controller.getState().selectedMilestone?.milestoneId).toBe('m2');

        vi.mocked(ProjectService.resolveApproval).mockResolvedValue({ success: true });
        await controller.processPaymentSuccess();

        expect(controller.getState().isCheckoutOpen).toBe(false);
        expect(controller.getState().successMessage).toContain('Payment of ₹60,708 for "Superstructure Framing" locked safely');
      }
    });
  });

  describe('3. Payment History & Transaction Details', () => {
    it('retrieves transaction history and opens payment details', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockResolvedValue(mockProject);

      // Record a payment first
      const recordRes = await mobileCustomerFinancialService.recordMilestonePayment('proj-financial-101', 'm2', 'TXN-RZP-990011');
      expect(recordRes.success).toBe(true);
      expect(recordRes.transaction.transactionReference).toBe('TXN-RZP-990011');

      const history = await mobileCustomerFinancialService.getPaymentHistory('proj-financial-101');
      expect(history.length).toBeGreaterThan(0);
      expect(history.some((tx) => tx.transactionReference === 'TXN-RZP-990011')).toBe(true);

      const detailsController = new CustomerPaymentDetailsScreenController({
        transactionId: recordRes.transaction.id,
      });
      await detailsController.init();

      expect(detailsController.getState().transaction?.transactionReference).toBe('TXN-RZP-990011');
      const html = renderCustomerPaymentDetailsScreen(detailsController);
      expect(html).toContain('TXN-RZP-990011');
      expect(html).toContain('Superstructure Framing');
    });

    it('triggers receipt/invoice download message', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockResolvedValue(mockProject);
      const recordRes = await mobileCustomerFinancialService.recordMilestonePayment('proj-financial-101', 'm2');

      const detailsController = new CustomerPaymentDetailsScreenController({
        transactionId: recordRes.transaction.id,
      });
      await detailsController.init();

      detailsController.openReceipt();
      expect(detailsController.getState().receiptMessage).toContain('Downloading Invoice & Escrow Receipt');
    });
  });

  describe('4. Security & Authorization Error Handling', () => {
    it('handles 401 unauthorized errors gracefully by setting error state', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockRejectedValue(new Error('401 Session Expired'));

      const controller = new CustomerProjectFinancialsScreenController({ projectId: 'proj-financial-101' });
      await controller.init();

      expect(controller.getState().isLoading).toBe(false);
      expect(controller.getState().summary).toBeNull();
      expect(controller.getState().error).toContain('UNAUTHORIZED_EXPIRED_SESSION');

      const html = renderCustomerProjectFinancialsScreen(controller);
      expect(html).toContain('UNAUTHORIZED_EXPIRED_SESSION');
    });

    it('handles 403 access denied errors gracefully', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockRejectedValue(new Error('403 Access denied'));

      const controller = new CustomerProjectFinancialsScreenController({ projectId: 'proj-financial-101' });
      await controller.init();

      expect(controller.getState().error).toContain('ACCESS_DENIED_FINANCIALS');
    });
  });
});
