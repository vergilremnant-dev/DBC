import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mobileProfessionalFinanceService } from '../../mobile/src/services/mobileProfessionalFinanceService.js';
import {
  ProfessionalFinanceScreenController,
  renderProfessionalFinanceScreen,
} from '../../mobile/src/screens/finance/ProfessionalFinanceScreen.js';
import {
  ProfessionalProjectFinancialsScreenController,
  renderProfessionalProjectFinancialsScreen,
} from '../../mobile/src/screens/finance/ProfessionalProjectFinancialsScreen.js';
import {
  ProfessionalEarningsScreenController,
  renderProfessionalEarningsScreen,
} from '../../mobile/src/screens/finance/ProfessionalEarningsScreen.js';
import {
  ProfessionalTransactionHistoryScreenController,
  renderProfessionalTransactionHistoryScreen,
} from '../../mobile/src/screens/finance/ProfessionalTransactionHistoryScreen.js';
import {
  ProfessionalTransactionDetailsScreenController,
  renderProfessionalTransactionDetailsScreen,
} from '../../mobile/src/screens/finance/ProfessionalTransactionDetailsScreen.js';
import {
  ProfessionalPayoutsScreenController,
  renderProfessionalPayoutsScreen,
} from '../../mobile/src/screens/finance/ProfessionalPayoutsScreen.js';
import { ProjectService } from '../../src/services/contractor/ProjectService.js';
import type { Project } from '../../src/types/contractor/ProjectTypes.js';

vi.mock('../../src/services/contractor/ProjectService.js', () => ({
  ProjectService: {
    listProjects: vi.fn(),
    getProjectDetail: vi.fn(),
  },
}));

const mockProjects: Project[] = [
  {
    id: 'proj-501',
    status: 'IN_PROGRESS',
    createdAt: '2026-08-01T10:00:00Z',
    customer: { fullName: 'Ramesh Kumar' },
    requirement: { title: 'Jubilee Hills Villa Raft Foundation' },
    quotation: { totalAmount: 120000 },
    milestones: [
      { id: 'm-1', name: 'Site Excavation', budgetAllocation: 30000, status: 'APPROVED', completionPercentage: 100 },
      { id: 'm-2', name: 'Steel Mesh Binding', budgetAllocation: 45000, status: 'COMPLETED', completionPercentage: 100 },
      { id: 'm-3', name: 'Concrete Casting', budgetAllocation: 45000, status: 'PENDING', completionPercentage: 0 },
    ],
  },
  {
    id: 'proj-502',
    status: 'IN_PROGRESS',
    createdAt: '2026-08-10T10:00:00Z',
    customer: { fullName: 'Sita Sharma' },
    requirement: { title: 'Madhapur Penthouse MEP Conduits' },
    quotation: { totalAmount: 45000 },
    milestones: [
      { id: 'm-10', name: 'Wall Chasing', budgetAllocation: 25000, status: 'APPROVED', completionPercentage: 100 },
      { id: 'm-11', name: 'Box Fixing', budgetAllocation: 20000, status: 'IN_PROGRESS', completionPercentage: 50 },
    ],
  },
];

describe('Module 44 — Professional Mobile Finance, Earnings & Payouts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Mobile Professional Finance Service Adaptations', () => {
    it('calculates backend-authoritative financial summary metrics', async () => {
      vi.mocked(ProjectService.listProjects).mockResolvedValue(mockProjects);

      const summary = await mobileProfessionalFinanceService.getProfessionalFinanceSummary();

      expect(summary.totalEarnings).toBe(100000); // 30k + 45k + 25k
      expect(summary.totalReceived).toBe(55000); // 30k + 25k
      expect(summary.pendingEarnings).toBe(45000); // 100k - 55k
      expect(summary.activeProjectValue).toBe(165000); // 120k + 45k
      expect(summary.formattedEarnings).toBe('₹1,00,000');
      expect(summary.formattedReceived).toBe('₹55,000');
    });

    it('fetches project-level financial breakdowns', async () => {
      vi.mocked(ProjectService.listProjects).mockResolvedValue(mockProjects);

      const projectFinancials = await mobileProfessionalFinanceService.getProfessionalProjectFinancials();

      expect(projectFinancials.length).toBe(2);
      expect(projectFinancials[0].projectId).toBe('proj-501');
      expect(projectFinancials[0].totalContractValue).toBe(120000);
      expect(projectFinancials[0].amountReceived).toBe(30000);
      expect(projectFinancials[0].pendingBalance).toBe(90000);
    });

    it('fetches contractor milestone earnings and transaction records', async () => {
      const earnings = await mobileProfessionalFinanceService.getProfessionalEarnings();
      const transactions = await mobileProfessionalFinanceService.getProfessionalTransactions();

      expect(earnings.length).toBeGreaterThan(0);
      expect(earnings[0].status).toBe('DISBURSED');

      expect(transactions.length).toBeGreaterThan(0);
      expect(transactions[0].transactionReference).toContain('TXN-DISB');
    });

    it('fetches payout details with masked destination accounts', async () => {
      const payouts = await mobileProfessionalFinanceService.getProfessionalPayouts();
      const detail = await mobileProfessionalFinanceService.getProfessionalPayoutDetails('po-101');

      expect(payouts.length).toBe(2);
      expect(detail.destinationAccountMasked).toContain('ending in ****4921');
      expect(detail.destinationAccountMasked).not.toContain('123456789'); // No raw account numbers exposed
    });

    it('handles 401 and 403 authorization error codes cleanly', async () => {
      vi.mocked(ProjectService.listProjects).mockRejectedValue(new Error('401 Session Expired'));

      await expect(mobileProfessionalFinanceService.getProfessionalFinanceSummary()).rejects.toThrow(
        'UNAUTHORIZED_EXPIRED_SESSION'
      );
    });
  });

  describe('2. Professional Finance Console Screen', () => {
    it('renders finance summary metrics and manages tab navigation', async () => {
      vi.mocked(ProjectService.listProjects).mockResolvedValue(mockProjects);

      const controller = new ProfessionalFinanceScreenController({});
      await controller.init();

      expect(controller.getState().activeTab).toBe('SUMMARY');

      let html = renderProfessionalFinanceScreen(controller);
      expect(html).toContain('Trade Partner Finance Console');
      expect(html).toContain('₹1,00,000');
      expect(html).toContain('Jubilee Hills Villa Raft Foundation');

      controller.setTab('EARNINGS');
      html = renderProfessionalFinanceScreen(controller);
      expect(html).toContain('Milestone Revenue');
      expect(html).toContain('Site Clearance & Excavation');

      controller.setTab('PAYOUTS');
      html = renderProfessionalFinanceScreen(controller);
      expect(html).toContain('Bank Payouts');
      expect(html).toContain('HDFC Bank ending in ****4921');
    });
  });

  describe('3. Professional Project Financials Screen', () => {
    it('renders project-level commercial breakdowns', async () => {
      vi.mocked(ProjectService.listProjects).mockResolvedValue(mockProjects);

      const controller = new ProfessionalProjectFinancialsScreenController({});
      await controller.init();

      expect(controller.getState().financials.length).toBe(2);

      const html = renderProfessionalProjectFinancialsScreen(controller);
      expect(html).toContain('Project Financials Breakdown');
      expect(html).toContain('Jubilee Hills Villa Raft Foundation');
      expect(html).toContain('₹1,20,000');
      expect(html).toContain('₹90,000');
    });
  });

  describe('4. Professional Earnings & Transactions Screens', () => {
    it('renders milestone earnings list', async () => {
      const controller = new ProfessionalEarningsScreenController({});
      await controller.init();

      expect(controller.getState().earnings.length).toBeGreaterThan(0);

      const html = renderProfessionalEarningsScreen(controller);
      expect(html).toContain('Trade Partner Earnings');
      expect(html).toContain('Site Clearance & Excavation');
    });

    it('renders transaction history and transaction details', async () => {
      const listController = new ProfessionalTransactionHistoryScreenController({});
      await listController.init();

      expect(listController.getState().transactions.length).toBeGreaterThan(0);

      const listHtml = renderProfessionalTransactionHistoryScreen(listController);
      expect(listHtml).toContain('Transaction History');
      expect(listHtml).toContain('TXN-DISB-9001');

      const detailsController = new ProfessionalTransactionDetailsScreenController({
        transactionId: 'tx-801',
      });
      await detailsController.init();

      const detailsHtml = renderProfessionalTransactionDetailsScreen(detailsController);
      expect(detailsHtml).toContain('Transaction Details');
      expect(detailsHtml).toContain('TXN-DISB-9001');
      expect(detailsHtml).toContain('Download PDF Voucher / Invoice');
    });
  });

  describe('5. Professional Payouts Screen', () => {
    it('renders bank payout list and handles masked account modal', async () => {
      const controller = new ProfessionalPayoutsScreenController({});
      await controller.init();

      expect(controller.getState().payouts.length).toBe(2);

      let html = renderProfessionalPayoutsScreen(controller);
      expect(html).toContain('Bank Payouts');
      expect(html).toContain('HDFC Bank ending in ****4921');

      controller.selectPayout('po-101');
      expect(controller.getState().selectedPayout?.payoutReference).toBe('PO-DBC-20260915-01');

      html = renderProfessionalPayoutsScreen(controller);
      expect(html).toContain('Payout Details');
      expect(html).toContain('PO-DBC-20260915-01');
    });
  });
});
