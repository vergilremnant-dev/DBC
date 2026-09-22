/**
 * DBC Mobile Project Request & Quotation Types.
 * Domain models for request forms, request details, quotations, pricing models, and status mappings.
 */

import { BookingStatus } from '../../src/types/booking/bookingTypes';
import { PricingModel, QuotationStatus } from '../../src/services/quotation/quotationClientService';

export type MobileRequestStatus = BookingStatus;
export type MobileQuotationStatus = QuotationStatus;
export type MobilePricingModel = PricingModel;

export interface MobileProjectRequestForm {
  providerId: string;
  providerName?: string;
  categoryId: number;
  categoryName?: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTime: string; // HH:mm
  customerAddress: string;
  city: string;
  state: string;
  notes?: string;
  estimatedBudget?: number;
}

export interface MobileProjectRequestDetails {
  id: string;
  bookingNumber: string;
  customerId: string;
  providerId: string;
  providerName: string;
  providerCity?: string;
  providerRating?: number;
  categoryId: number;
  categoryName: string;
  status: MobileRequestStatus;
  statusLabel: string;
  preferredDate: string;
  preferredTime: string;
  customerAddress: string;
  city: string;
  state: string;
  notes?: string;
  estimatedBudget?: number;
  createdAt: string;
  updatedAt: string;
  quotationId?: number;
}

export interface MobileQuotationMilestone {
  id?: number;
  name: string;
  description?: string;
  cost: number;
  durationDays?: number;
  dueAt?: string;
}

export interface MobileQuotationDetails {
  id: number;
  requirementId: number;
  bookingId?: string;
  providerId: string;
  providerName: string;
  providerRating?: number;
  priceModel: MobilePricingModel;
  totalAmount: number;
  formattedAmount: string;
  estimatedDurationDays: number;
  warrantyMonths?: number;
  status: MobileQuotationStatus;
  statusLabel: string;
  createdAt: string;
  updatedAt: string;
  proposal: {
    title: string;
    summary: string;
    scope: string;
    deliverables: string;
    assumptions?: string;
    exclusions?: string;
    notes?: string;
  };
  milestones: MobileQuotationMilestone[];
  isCustomerActionable: boolean;
}
