import type {
  QuotationStatus,
  PricingModel,
  QuotationProposal,
  QuotationMilestone,
} from '../../../src/services/quotation/quotationClientService.js';

export type MobileQuotationStatus = QuotationStatus;
export type MobilePricingModel = PricingModel;
export type MobileQuotationProposal = QuotationProposal;
export type MobileQuotationMilestone = QuotationMilestone;

export interface MobileQuotationItem {
  id: number;
  requirementId: number;
  requirementTitle: string;
  customerName: string;
  providerId: string;
  priceModel: MobilePricingModel;
  totalAmount: number;
  totalAmountFormatted: string;
  estimatedDurationDays: number;
  warrantyMonths?: number;
  status: MobileQuotationStatus;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
  proposal: MobileQuotationProposal;
  milestones: MobileQuotationMilestone[];
  isEditable: boolean;
  isWithdrawable: boolean;
  isSubmittable: boolean;
}

export interface MobileCreateQuotationForm {
  requirementId: number;
  priceModel: MobilePricingModel;
  totalAmount: number;
  estimatedDurationDays: number;
  warrantyMonths?: number;
  proposal: MobileQuotationProposal;
  milestones: MobileQuotationMilestone[];
  step: 1 | 2 | 3 | 4 | 5;
}
