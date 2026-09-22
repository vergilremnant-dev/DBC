import { ProjectService } from '../../../src/services/contractor/ProjectService.js';
import type { Project, ProjectMilestone } from '../../../src/types/contractor/ProjectTypes.js';
import type {
  MobileProjectFinancialSummary,
  MobileMilestonePayment,
  MobilePaymentBreakdown,
  MobileTransaction,
  MobilePaymentStatus,
} from '../types/customerFinancialMobileTypes.js';

// In-memory transaction log for mobile session payment tracking
const transactionStore: Record<string, MobileTransaction[]> = {};

function calculateBreakdown(baseAmount: number): MobilePaymentBreakdown {
  const platformFee = Math.round(baseAmount * 0.01); // 1% DBC Escrow Fee
  const taxAmount = Math.round(platformFee * 0.18); // 18% GST on platform fee
  const totalPayable = baseAmount + platformFee + taxAmount;

  return {
    baseAmount,
    platformFee,
    taxAmount,
    totalPayable,
    feePercentage: 1,
    taxPercentage: 18,
    feeDescription: '1% DBC Escrow & Verification Fee',
    taxDescription: '18% GST on Platform Fee',
  };
}

export const mobileCustomerFinancialService = {
  async getProjectFinancialSummary(projectId: string): Promise<MobileProjectFinancialSummary> {
    try {
      const project: Project = await ProjectService.getProjectDetail(projectId);
      const milestones = project.milestones || [];
      const projectTransactions = transactionStore[projectId] || [];

      let totalBaseAmount = project.quotation?.totalAmount || 0;
      if (totalBaseAmount === 0 && milestones.length > 0) {
        totalBaseAmount = milestones.reduce((sum, m) => sum + (m.budgetAllocation || 0), 0);
      }

      const overallBreakdown = calculateBreakdown(totalBaseAmount);

      // Determine paid milestones
      let amountPaid = 0;
      let paidMilestoneCount = 0;
      let hasDuePayment = false;

      milestones.forEach((m) => {
        const isRecordedTxPaid = projectTransactions.some(
          (tx) => tx.milestoneId === m.id && tx.status === 'SUCCESS'
        );
        const isBackendPaid = m.status === 'APPROVED' || m.status === 'COMPLETED' || m.status === 'PAID';

        if (isBackendPaid || isRecordedTxPaid) {
          paidMilestoneCount++;
          const mBreakdown = calculateBreakdown(m.budgetAllocation || 0);
          amountPaid += mBreakdown.totalPayable;
        } else if (m.status === 'IN_PROGRESS' || m.status === 'COMPLETED') {
          hasDuePayment = true;
        }
      });

      const remainingBalance = Math.max(0, overallBreakdown.totalPayable - amountPaid);

      let paymentStatus: 'UP_TO_DATE' | 'PAYMENT_DUE' | 'PARTIALLY_PAID' | 'COMPLETED' | 'UNPAID' = 'UP_TO_DATE';
      if (milestones.length > 0 && paidMilestoneCount === milestones.length) {
        paymentStatus = 'COMPLETED';
      } else if (hasDuePayment) {
        paymentStatus = 'PAYMENT_DUE';
      } else if (amountPaid > 0) {
        paymentStatus = 'PARTIALLY_PAID';
      } else if (amountPaid === 0 && overallBreakdown.totalPayable > 0) {
        paymentStatus = 'UNPAID';
      }

      const projectName = project.requirement?.title || `Project #${project.id}`;

      return {
        projectId,
        projectName,
        quotationId: project.quotationId,
        totalProjectAmount: totalBaseAmount,
        totalPlatformFee: overallBreakdown.platformFee,
        totalTaxAmount: overallBreakdown.taxAmount,
        totalCustomerPayable: overallBreakdown.totalPayable,
        amountPaid,
        remainingBalance,
        paymentStatus,
        currency: '₹',
        breakdown: overallBreakdown,
        milestoneCount: milestones.length,
        paidMilestoneCount,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error('UNAUTHORIZED_EXPIRED_SESSION');
      }
      if (error instanceof Error && (error.message.includes('403') || error.message.includes('Access denied'))) {
        throw new Error('ACCESS_DENIED_FINANCIALS');
      }
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('not found'))) {
        throw new Error('PROJECT_NOT_FOUND');
      }
      throw new Error(error instanceof Error ? error.message : 'Unable to load project financials');
    }
  },

  async getMilestonePayments(projectId: string): Promise<MobileMilestonePayment[]> {
    try {
      const project: Project = await ProjectService.getProjectDetail(projectId);
      const milestones: ProjectMilestone[] = project.milestones || [];
      const projectTransactions = transactionStore[projectId] || [];

      return milestones.map((m) => {
        const recordedTx = projectTransactions.find((tx) => tx.milestoneId === m.id);
        const isPaid = m.status === 'APPROVED' || m.status === 'COMPLETED' || m.status === 'PAID' || recordedTx?.status === 'SUCCESS';
        const isDue = m.status === 'IN_PROGRESS' || m.status === 'COMPLETED';

        const baseAmount = m.budgetAllocation || 0;
        const breakdown = calculateBreakdown(baseAmount);

        let paymentStatus: MobilePaymentStatus = 'SCHEDULED';
        if (isPaid) {
          paymentStatus = 'PAID';
        } else if (isDue) {
          paymentStatus = 'DUE';
        }

        const isActionable = !isPaid;

        return {
          milestoneId: m.id,
          projectId,
          milestoneName: m.name,
          description: m.description,
          status: m.status,
          baseAmount,
          platformFee: breakdown.platformFee,
          taxAmount: breakdown.taxAmount,
          totalPayable: breakdown.totalPayable,
          paymentStatus,
          isActionable,
          dueDate: m.plannedEnd,
          paidDate: isPaid ? (recordedTx?.date || new Date().toISOString().split('T')[0]) : undefined,
          transactionId: recordedTx?.transactionReference,
          completionPercentage: m.completionPercentage,
        };
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unable to load milestone payments');
    }
  },

  async getMilestonePaymentDetails(projectId: string, milestoneId: string): Promise<MobileMilestonePayment> {
    const list = await this.getMilestonePayments(projectId);
    const item = list.find((m) => m.milestoneId === milestoneId);
    if (!item) {
      throw new Error('Milestone payment details not found');
    }
    return item;
  },

  async getPaymentHistory(projectId: string): Promise<MobileTransaction[]> {
    try {
      const summary = await this.getProjectFinancialSummary(projectId);
      const milestones = await this.getMilestonePayments(projectId);
      const recorded = transactionStore[projectId] || [];

      // Include paid milestones as transactions if not already in recorded store
      const allTransactions: MobileTransaction[] = [...recorded];

      milestones.forEach((m) => {
        if ((m.paymentStatus === 'PAID' || m.paymentStatus === 'APPROVED') && !allTransactions.some((tx) => tx.milestoneId === m.milestoneId)) {
          allTransactions.push({
            id: `tx-${m.milestoneId}`,
            transactionReference: `TXN-RZP-${m.milestoneId.slice(-6)}`,
            projectId,
            projectName: summary.projectName,
            milestoneId: m.milestoneId,
            milestoneName: m.milestoneName,
            amount: m.totalPayable,
            status: 'SUCCESS',
            date: m.paidDate || new Date().toISOString().split('T')[0],
            paymentMethod: 'DBC Escrow (Razorpay)',
            invoiceNumber: `INV-${m.milestoneId.slice(-6)}`,
            receiptUrl: `/api/projects/${projectId}/receipts/inv-${m.milestoneId.slice(-6)}.pdf`,
          });
        }
      });

      return allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unable to load payment history');
    }
  },

  async getPaymentDetails(transactionId: string): Promise<MobileTransaction> {
    for (const pid of Object.keys(transactionStore)) {
      const tx = transactionStore[pid].find((t) => t.id === transactionId || t.transactionReference === transactionId);
      if (tx) return tx;
    }

    // Fallback: search across active projects
    const projects = await ProjectService.listProjects();
    for (const p of projects) {
      const history = await this.getPaymentHistory(p.id);
      const found = history.find((t) => t.id === transactionId || t.transactionReference === transactionId);
      if (found) return found;
    }

    throw new Error('Transaction details not found');
  },

  async recordMilestonePayment(
    projectId: string,
    milestoneId: string,
    transactionRef?: string
  ): Promise<{ success: boolean; transaction: MobileTransaction }> {
    try {
      const project = await ProjectService.getProjectDetail(projectId);
      const milestone = (project.milestones || []).find((m) => m.id === milestoneId);
      if (!milestone) {
        throw new Error('Target milestone not found for payment');
      }

      const breakdown = calculateBreakdown(milestone.budgetAllocation || 0);
      const ref = transactionRef || `TXN-RZP-${Date.now().toString().slice(-8)}`;
      const txId = `tx-${Date.now()}`;

      const newTx: MobileTransaction = {
        id: txId,
        transactionReference: ref,
        projectId,
        projectName: project.requirement?.title || `Project #${projectId}`,
        milestoneId,
        milestoneName: milestone.name,
        amount: breakdown.totalPayable,
        status: 'SUCCESS',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'DBC Escrow (Razorpay)',
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        receiptUrl: `/api/projects/${projectId}/receipts/inv-${txId}.pdf`,
      };

      if (!transactionStore[projectId]) {
        transactionStore[projectId] = [];
      }
      transactionStore[projectId].push(newTx);

      // Attempt to resolve approval on backend if milestone was pending approval
      try {
        await ProjectService.resolveApproval(projectId, {
          approvalId: milestone.id,
          isApproved: true,
          remarks: 'Milestone payment completed via DBC Mobile Escrow',
        });
      } catch {
        // Approval auto-resolution fallback
      }

      return { success: true, transaction: newTx };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to record milestone payment');
    }
  },

  clearFinancialCache(): void {
    Object.keys(transactionStore).forEach((key) => delete transactionStore[key]);
  },
};
