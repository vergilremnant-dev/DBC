import { axiosClient } from '../auth/axiosClient';

export type QuotationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VIEWED'
  | 'UNDER_REVIEW'
  | 'NEGOTIATION'
  | 'REVISED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'EXPIRED'
  | 'ARCHIVED';

export type PricingModel = 'FIXED' | 'MILESTONE_BASED' | 'HOURLY_ESTIMATE' | 'UNIT_PRICE';

export interface QuotationProposal {
  title: string;
  summary: string;
  scope: string;
  deliverables: string;
  assumptions?: string;
  exclusions?: string;
  notes?: string;
}

export interface QuotationMilestone {
  id?: number;
  name: string;
  description?: string;
  cost: number;
  durationDays?: number;
  dueAt?: string;
}

export interface Quotation {
  id: number;
  requirementId: number;
  providerId: string;
  priceModel: PricingModel;
  totalAmount: number;
  estimatedDurationDays: number;
  warrantyMonths?: number;
  status: QuotationStatus;
  createdAt: string;
  updatedAt: string;
  proposal?: QuotationProposal;
  milestones?: QuotationMilestone[];
  provider?: {
    id: string;
    businessName: string;
    contactPerson: string;
    rating?: number;
  };
  requirement?: {
    id: number;
    title: string;
    city?: string;
    category?: { name: string };
    customer?: { fullName: string };
  };
}

export interface CreateQuotationPayload {
  requirementId: number;
  priceModel: PricingModel;
  totalAmount: number;
  estimatedDurationDays: number;
  warrantyMonths?: number;
  proposal: QuotationProposal;
  milestones?: QuotationMilestone[];
}

export const quotationClientService = {
  /**
   * Fetch quotations (filtered by requirementId or status)
   */
  async getQuotations(params?: { requirementId?: number; status?: QuotationStatus }): Promise<Quotation[]> {
    const query = new URLSearchParams();
    if (params?.requirementId) query.set('requirementId', String(params.requirementId));
    if (params?.status) query.set('status', params.status);

    const endpoint = `/api/quotations${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await axiosClient.get<{ success: boolean; data: Quotation[] }>(endpoint);
    return res.data.data || [];
  },

  /**
   * Get single quotation details
   */
  async getQuotationById(id: number): Promise<Quotation> {
    const res = await axiosClient.get<{ success: boolean; data: Quotation }>(`/api/quotations/${id}`);
    return res.data.data;
  },

  /**
   * Create new quotation draft or proposal
   */
  async createQuotation(payload: CreateQuotationPayload): Promise<Quotation> {
    const res = await axiosClient.post<{ success: boolean; data: Quotation }>('/api/quotations', payload);
    return res.data.data;
  },

  /**
   * Transition quotation status (e.g. SUBMITTED, ACCEPTED, REJECTED)
   */
  async updateStatus(id: number, status: QuotationStatus, reason?: string): Promise<Quotation> {
    const res = await axiosClient.put<{ success: boolean; data: Quotation }>(`/api/quotations/${id}/status`, { status, reason });
    return res.data.data;
  },
};
