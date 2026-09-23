export type ProfessionalFinancialStatus = 'UP_TO_DATE' | 'PAYMENT_PENDING' | 'DISBURSED' | 'IN_PROGRESS';
export type ProfessionalEarningStatus = 'EARNED' | 'PENDING_RELEASE' | 'DISBURSED';
export type ProfessionalTransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED';
export type ProfessionalPayoutStatus = 'COMPLETED' | 'PROCESSING' | 'PENDING' | 'FAILED';

export interface ProfessionalFinanceSummary {
  totalEarnings: number;
  formattedEarnings: string;
  totalReceived: number;
  formattedReceived: string;
  pendingEarnings: number;
  formattedPending: string;
  activeProjectValue: number;
  formattedActiveValue: string;
  currency: string;
  recentTransactionsCount: number;
  updatedAt: string;
}

export interface ProfessionalProjectFinancial {
  projectId: string;
  projectName: string;
  customerName: string;
  totalContractValue: number;
  formattedContractValue: string;
  amountReceived: number;
  formattedAmountReceived: string;
  pendingBalance: number;
  formattedPendingBalance: string;
  milestoneCount: number;
  completedMilestoneCount: number;
  financialStatus: ProfessionalFinancialStatus;
}

export interface ProfessionalEarning {
  id: string;
  projectId: string;
  projectName: string;
  milestoneId?: string;
  milestoneName?: string;
  amount: number;
  formattedAmount: string;
  date: string;
  status: ProfessionalEarningStatus;
  statusLabel: string;
}

export interface ProfessionalTransaction {
  id: string;
  transactionReference: string;
  projectId: string;
  projectName: string;
  milestoneName?: string;
  amount: number;
  formattedAmount: string;
  type: 'PAYOUT' | 'MILESTONE_RELEASE' | 'ADVANCE';
  status: ProfessionalTransactionStatus;
  date: string;
  paymentMethod: string;
  invoiceNumber?: string;
  receiptUrl?: string;
}

export interface ProfessionalPayout {
  id: string;
  payoutReference: string;
  amount: number;
  formattedAmount: string;
  status: ProfessionalPayoutStatus;
  statusLabel: string;
  date: string;
  destinationAccountMasked: string;
  relatedProjectName?: string;
}
