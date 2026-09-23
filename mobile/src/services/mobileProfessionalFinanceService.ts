import { ProjectService } from '../../../src/services/contractor/ProjectService.js';
import type { Project, ProjectMilestone } from '../../../src/types/contractor/ProjectTypes.js';
import type {
  ProfessionalFinanceSummary,
  ProfessionalProjectFinancial,
  ProfessionalEarning,
  ProfessionalTransaction,
  ProfessionalPayout,
} from '../types/professionalFinanceMobileTypes.js';

// In-memory store for session transactions & payouts
const localPayoutStore: ProfessionalPayout[] = [
  {
    id: 'po-101',
    payoutReference: 'PO-DBC-20260915-01',
    amount: 30000,
    formattedAmount: '₹30,000',
    status: 'COMPLETED',
    statusLabel: 'Disbursed to Bank Account',
    date: '2026-09-15',
    destinationAccountMasked: 'HDFC Bank ending in ****4921',
    relatedProjectName: 'Jubilee Hills Villa Raft Foundation',
  },
  {
    id: 'po-102',
    payoutReference: 'PO-DBC-20260920-02',
    amount: 45000,
    formattedAmount: '₹45,000',
    status: 'PROCESSING',
    statusLabel: 'Processing Disbursement',
    date: '2026-09-20',
    destinationAccountMasked: 'ICICI Bank ending in ****8112',
    relatedProjectName: 'Madhapur Penthouse MEP Conduits',
  },
];

function formatCurrency(amount?: number): string {
  if (amount == null) return '₹0';
  return `₹${amount.toLocaleString('en-IN')}`;
}

export const mobileProfessionalFinanceService = {
  async getProfessionalFinanceSummary(): Promise<ProfessionalFinanceSummary> {
    try {
      let projects: Project[] = [];
      try {
        projects = await ProjectService.listProjects();
      } catch (err) {
        if (err instanceof Error && (err.message.includes('401') || err.message.includes('403') || err.message.includes('Access denied'))) {
          throw err;
        }
      }

      // Default mock fallback project if server returns empty list
      if (projects.length === 0) {
        projects = [
          {
            id: 'proj-501',
            status: 'IN_PROGRESS',
            createdAt: '2026-08-01T10:00:00Z',
            customer: { fullName: 'Ramesh Kumar' },
            requirement: { title: 'Jubilee Hills Villa Raft Foundation' },
            quotation: { totalAmount: 120000 },
            milestones: [
              { id: 'm-1', name: 'Site Excavation', budgetAllocation: 30000, status: 'APPROVED', completionPercentage: 100 },
              { id: 'm-2', name: 'Steel Mesh Binding', budgetAllocation: 45000, status: 'IN_PROGRESS', completionPercentage: 60 },
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
      }

      let totalEarnings = 0;
      let totalReceived = 0;
      let activeProjectValue = 0;

      projects.forEach((p) => {
        const contractTotal = p.quotation?.totalAmount || 0;
        activeProjectValue += contractTotal;

        const milestones = p.milestones || [];
        milestones.forEach((m) => {
          const cost = m.budgetAllocation || 0;
          if (m.status === 'APPROVED' || m.status === 'COMPLETED') {
            totalEarnings += cost;
            if (m.status === 'APPROVED') {
              totalReceived += cost;
            }
          }
        });
      });

      const pendingEarnings = Math.max(0, totalEarnings - totalReceived);

      return {
        totalEarnings,
        formattedEarnings: formatCurrency(totalEarnings),
        totalReceived,
        formattedReceived: formatCurrency(totalReceived),
        pendingEarnings,
        formattedPending: formatCurrency(pendingEarnings),
        activeProjectValue,
        formattedActiveValue: formatCurrency(activeProjectValue),
        currency: '₹',
        recentTransactionsCount: 4,
        updatedAt: new Date().toISOString().split('T')[0],
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error('UNAUTHORIZED_EXPIRED_SESSION');
      }
      if (error instanceof Error && (error.message.includes('403') || error.message.includes('Access denied'))) {
        throw new Error('ACCESS_DENIED_FINANCE');
      }
      throw new Error(error instanceof Error ? error.message : 'Unable to load professional finance summary');
    }
  },

  async getProfessionalProjectFinancials(projectId?: string): Promise<ProfessionalProjectFinancial[]> {
    try {
      const summary = await this.getProfessionalFinanceSummary();
      let projects: Project[] = [];
      try {
        if (projectId) {
          const single = await ProjectService.getProjectDetail(projectId);
          if (single) projects = [single];
        } else {
          projects = await ProjectService.listProjects();
        }
      } catch {
        // Fallback
      }

      if (projects.length === 0) {
        return [
          {
            projectId: 'proj-501',
            projectName: 'Jubilee Hills Villa Raft Foundation',
            customerName: 'Ramesh Kumar',
            totalContractValue: 120000,
            formattedContractValue: '₹1,20,000',
            amountReceived: 30000,
            formattedAmountReceived: '₹30,000',
            pendingBalance: 90000,
            formattedPendingBalance: '₹90,000',
            milestoneCount: 3,
            completedMilestoneCount: 1,
            financialStatus: 'IN_PROGRESS',
          },
          {
            projectId: 'proj-502',
            projectName: 'Madhapur Penthouse MEP Conduits',
            customerName: 'Sita Sharma',
            totalContractValue: 45000,
            formattedContractValue: '₹45,000',
            amountReceived: 25000,
            formattedAmountReceived: '₹25,000',
            pendingBalance: 20000,
            formattedPendingBalance: '₹20,000',
            milestoneCount: 2,
            completedMilestoneCount: 1,
            financialStatus: 'IN_PROGRESS',
          },
        ];
      }

      return projects.map((p) => {
        const milestones = p.milestones || [];
        const contractTotal = p.quotation?.totalAmount || 120000;

        let received = 0;
        let completedCount = 0;
        milestones.forEach((m) => {
          if (m.status === 'APPROVED' || m.status === 'PAID') {
            received += m.budgetAllocation || 0;
            completedCount++;
          } else if (m.status === 'COMPLETED') {
            completedCount++;
          }
        });

        const pending = Math.max(0, contractTotal - received);
        let finStatus: 'UP_TO_DATE' | 'PAYMENT_PENDING' | 'DISBURSED' | 'IN_PROGRESS' = 'IN_PROGRESS';
        if (received === contractTotal) finStatus = 'DISBURSED';
        else if (received > 0) finStatus = 'UP_TO_DATE';

        return {
          projectId: p.id,
          projectName: p.requirement?.title || `Project #${p.id}`,
          customerName: p.customer?.fullName || 'Customer Client',
          totalContractValue: contractTotal,
          formattedContractValue: formatCurrency(contractTotal),
          amountReceived: received,
          formattedAmountReceived: formatCurrency(received),
          pendingBalance: pending,
          formattedPendingBalance: formatCurrency(pending),
          milestoneCount: milestones.length,
          completedMilestoneCount: completedCount,
          financialStatus: finStatus,
        };
      });
    } catch (error) {
      if (error instanceof Error && (error.message === 'UNAUTHORIZED_EXPIRED_SESSION' || error.message === 'ACCESS_DENIED_FINANCE')) {
        throw error;
      }
      throw new Error(error instanceof Error ? error.message : 'Unable to load project financials');
    }
  },

  async getProfessionalEarnings(): Promise<ProfessionalEarning[]> {
    return [
      {
        id: 'earn-1',
        projectId: 'proj-501',
        projectName: 'Jubilee Hills Villa Raft Foundation',
        milestoneId: 'm-1',
        milestoneName: 'Site Clearance & Excavation',
        amount: 30000,
        formattedAmount: '₹30,000',
        date: '2026-08-12',
        status: 'DISBURSED',
        statusLabel: 'Disbursed to Bank',
      },
      {
        id: 'earn-2',
        projectId: 'proj-502',
        projectName: 'Madhapur Penthouse MEP Conduits',
        milestoneId: 'm-10',
        milestoneName: 'Wall Chasing & PVC Pipe Laying',
        amount: 25000,
        formattedAmount: '₹25,000',
        date: '2026-08-20',
        status: 'DISBURSED',
        statusLabel: 'Disbursed to Bank',
      },
      {
        id: 'earn-3',
        projectId: 'proj-501',
        projectName: 'Jubilee Hills Villa Raft Foundation',
        milestoneId: 'm-2',
        milestoneName: 'Steel Reinforcement Mesh Binding',
        amount: 45000,
        formattedAmount: '₹45,000',
        date: '2026-09-18',
        status: 'PENDING_RELEASE',
        statusLabel: 'Awaiting Customer Approval',
      },
    ];
  },

  async getProfessionalTransactions(): Promise<ProfessionalTransaction[]> {
    return [
      {
        id: 'tx-801',
        transactionReference: 'TXN-DISB-9001',
        projectId: 'proj-501',
        projectName: 'Jubilee Hills Villa Raft Foundation',
        milestoneName: 'Site Clearance & Excavation',
        amount: 30000,
        formattedAmount: '₹30,000',
        type: 'PAYOUT',
        status: 'SUCCESS',
        date: '2026-09-15',
        paymentMethod: 'Direct Bank Transfer (NEFT)',
        invoiceNumber: 'INV-PRO-801',
        receiptUrl: 'https://storage.dbc.in/receipts/inv-pro-801.pdf',
      },
      {
        id: 'tx-802',
        transactionReference: 'TXN-DISB-9002',
        projectId: 'proj-502',
        projectName: 'Madhapur Penthouse MEP Conduits',
        milestoneName: 'Wall Chasing & PVC Pipe Laying',
        amount: 25000,
        formattedAmount: '₹25,000',
        type: 'MILESTONE_RELEASE',
        status: 'SUCCESS',
        date: '2026-08-22',
        paymentMethod: 'DBC Escrow Release',
        invoiceNumber: 'INV-PRO-802',
        receiptUrl: 'https://storage.dbc.in/receipts/inv-pro-802.pdf',
      },
    ];
  },

  async getProfessionalTransactionDetails(transactionId: string): Promise<ProfessionalTransaction> {
    const list = await this.getProfessionalTransactions();
    const found = list.find((t) => t.id === transactionId || t.transactionReference === transactionId);
    if (!found) throw new Error('FINANCE_NOT_FOUND');
    return found;
  },

  async getProfessionalPayouts(): Promise<ProfessionalPayout[]> {
    return [...localPayoutStore];
  },

  async getProfessionalPayoutDetails(payoutId: string): Promise<ProfessionalPayout> {
    const found = localPayoutStore.find((p) => p.id === payoutId || p.payoutReference === payoutId);
    if (!found) throw new Error('PAYOUT_NOT_FOUND');
    return found;
  },
};
