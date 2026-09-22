export type MobilePaymentStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'APPROVED'
  | 'PAID'
  | 'DUE'
  | 'SCHEDULED';

export interface MobilePaymentBreakdown {
  baseAmount: number;
  platformFee: number;
  taxAmount: number;
  totalPayable: number;
  feePercentage: number;
  taxPercentage: number;
  feeDescription: string;
  taxDescription: string;
}

export interface MobileProjectFinancialSummary {
  projectId: string;
  projectName?: string;
  quotationId?: number;
  totalProjectAmount: number;
  totalPlatformFee: number;
  totalTaxAmount: number;
  totalCustomerPayable: number;
  amountPaid: number;
  remainingBalance: number;
  paymentStatus: 'UP_TO_DATE' | 'PAYMENT_DUE' | 'PARTIALLY_PAID' | 'COMPLETED' | 'UNPAID';
  currency: string;
  breakdown: MobilePaymentBreakdown;
  milestoneCount: number;
  paidMilestoneCount: number;
}

export interface MobileMilestonePayment {
  milestoneId: string;
  projectId: string;
  milestoneName: string;
  description?: string;
  status: string;
  baseAmount: number;
  platformFee: number;
  taxAmount: number;
  totalPayable: number;
  paymentStatus: MobilePaymentStatus;
  isActionable: boolean;
  dueDate?: string;
  paidDate?: string;
  transactionId?: string;
  completionPercentage?: number;
}

export interface MobileTransaction {
  id: string;
  transactionReference: string;
  projectId: string;
  projectName?: string;
  milestoneId?: string;
  milestoneName: string;
  amount: number;
  status: MobilePaymentStatus;
  date: string;
  paymentMethod?: string;
  receiptUrl?: string;
  invoiceNumber?: string;
}
