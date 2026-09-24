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
        recentTransactionsCount: projects.length,
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

      if (!projects || projects.length === 0) {
        return [];
      }

      return projects.map((p) => {
        const milestones = p.milestones || [];
        const contractTotal = p.quotation?.totalAmount || 0;

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
        if (received === contractTotal && contractTotal > 0) finStatus = 'DISBURSED';
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
    try {
      const projects = await ProjectService.listProjects();
      const earnings: ProfessionalEarning[] = [];

      projects.forEach((p) => {
        (p.milestones || []).forEach((m, idx) => {
          if (m.status === 'APPROVED' || m.status === 'COMPLETED') {
            earnings.push({
              id: `earn-${p.id}-${m.id || idx}`,
              projectId: p.id,
              projectName: p.requirement?.title || `Project #${p.id}`,
              milestoneId: m.id,
              milestoneName: m.name,
              amount: m.budgetAllocation || 0,
              formattedAmount: formatCurrency(m.budgetAllocation),
              date: m.actualEnd || m.plannedEnd || new Date().toISOString().split('T')[0],
              status: m.status === 'APPROVED' ? 'DISBURSED' : 'PENDING_RELEASE',
              statusLabel: m.status === 'APPROVED' ? 'Disbursed to Bank' : 'Awaiting Customer Approval',
            });
          }
        });
      });

      return earnings;
    } catch {
      return [];
    }
  },

  async getProfessionalTransactions(): Promise<ProfessionalTransaction[]> {
    try {
      const projects = await ProjectService.listProjects();
      const transactions: ProfessionalTransaction[] = [];

      projects.forEach((p) => {
        (p.milestones || []).forEach((m, idx) => {
          if (m.status === 'APPROVED' || m.status === 'COMPLETED') {
            transactions.push({
              id: `tx-${p.id}-${m.id || idx}`,
              transactionReference: `TXN-DISB-${String(m.id || idx).slice(-6)}`,
              projectId: p.id,
              projectName: p.requirement?.title || `Project #${p.id}`,
              milestoneName: m.name,
              amount: m.budgetAllocation || 0,
              formattedAmount: formatCurrency(m.budgetAllocation),
              type: m.status === 'APPROVED' ? 'PAYOUT' : 'MILESTONE_RELEASE',
              status: 'SUCCESS',
              date: m.actualEnd || new Date().toISOString().split('T')[0],
              paymentMethod: m.status === 'APPROVED' ? 'Direct Bank Transfer (NEFT)' : 'DBC Escrow Release',
              invoiceNumber: `INV-PRO-${p.id}`,
              receiptUrl: `/api/projects/${p.id}/receipts/inv-pro-${p.id}.pdf`,
            });
          }
        });
      });

      return transactions;
    } catch {
      return [];
    }
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

  async getFinanceSummary(): Promise<ProfessionalFinanceSummary> {
    return this.getProfessionalFinanceSummary();
  },

  async getMilestoneEarnings(): Promise<ProfessionalEarning[]> {
    return this.getProfessionalEarnings();
  },

  async getPayoutDetails(): Promise<{ maskedBankAccount: string; payouts: ProfessionalPayout[] }> {
    const list = await this.getProfessionalPayouts();
    return {
      maskedBankAccount: 'HDFC Bank ending in ****4921',
      payouts: list,
    };
  },
};
