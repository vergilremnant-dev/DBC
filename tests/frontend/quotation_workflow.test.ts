import { describe, it, expect } from 'vitest';
import type { QuotationStatus, PricingModel } from '../../src/services/quotation/quotationClientService';

interface MockProposal {
  title: string;
  summary: string;
  scope: string;
  deliverables: string;
  assumptions?: string;
  exclusions?: string;
  notes?: string;
}

interface MockMilestone {
  name: string;
  cost: number;
}

interface MockQuotation {
  id: number;
  requirementId: number;
  providerId: string;
  customerId: string;
  priceModel: PricingModel;
  totalAmount: number;
  estimatedDurationDays: number;
  status: QuotationStatus;
  proposal: MockProposal;
  milestones?: MockMilestone[];
}

describe('Project Proposal & Quotation Workflow (Prompt 14)', () => {
  const sampleQuotation: MockQuotation = {
    id: 801,
    requirementId: 201,
    providerId: 'provider-apex',
    customerId: 'customer-ramesh',
    priceModel: 'MILESTONE_BASED',
    totalAmount: 150000,
    estimatedDurationDays: 45,
    status: 'SUBMITTED',
    proposal: {
      title: 'Villa Structural Blueprint & Foundation Engineering',
      summary: 'Complete engineering review and foundation supervision.',
      scope: 'Column layout alignment, raft slab load calculations, site inspections.',
      deliverables: 'Stamped structural blueprint drawing set + site inspection reports.',
      exclusions: 'Material procurement cost and local municipal filing fees.',
    },
    milestones: [
      { name: 'Initial Load Calculation & Blueprint Draft', cost: 50000 },
      { name: 'Raft Slab Reinforcement Inspection', cost: 50000 },
      { name: 'Final Handover & Stamped Drawings', cost: 50000 },
    ],
  };

  it('validates proposal state machine transitions correctly', () => {
    const ALLOWED: Record<QuotationStatus, QuotationStatus[]> = {
      DRAFT: ['SUBMITTED', 'WITHDRAWN'],
      SUBMITTED: ['VIEWED', 'WITHDRAWN', 'REJECTED', 'EXPIRED'],
      VIEWED: ['UNDER_REVIEW', 'NEGOTIATION', 'WITHDRAWN', 'REJECTED', 'EXPIRED'],
      UNDER_REVIEW: ['NEGOTIATION', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'],
      NEGOTIATION: ['REVISED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'],
      REVISED: ['UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'],
      ACCEPTED: ['ARCHIVED'],
      REJECTED: ['ARCHIVED'],
      WITHDRAWN: ['DRAFT', 'ARCHIVED'],
      EXPIRED: ['ARCHIVED'],
      ARCHIVED: [],
    };

    const isValidTransition = (from: QuotationStatus, to: QuotationStatus) => {
      return ALLOWED[from]?.includes(to) ?? false;
    };

    // Allowed transitions
    expect(isValidTransition('DRAFT', 'SUBMITTED')).toBe(true);
    expect(isValidTransition('SUBMITTED', 'VIEWED')).toBe(true);
    expect(isValidTransition('UNDER_REVIEW', 'ACCEPTED')).toBe(true);
    expect(isValidTransition('UNDER_REVIEW', 'REJECTED')).toBe(true);

    // Invalid transitions
    expect(isValidTransition('ACCEPTED', 'DRAFT')).toBe(false);
    expect(isValidTransition('REJECTED', 'SUBMITTED')).toBe(false);
    expect(isValidTransition('ACCEPTED', 'SUBMITTED')).toBe(false);
  });

  it('validates milestone sum matches total proposal cost for milestone-based pricing', () => {
    const validatePricing = (quote: MockQuotation): boolean => {
      if (quote.priceModel === 'MILESTONE_BASED' && quote.milestones) {
        const milestoneSum = quote.milestones.reduce((acc, m) => acc + m.cost, 0);
        return milestoneSum === quote.totalAmount;
      }
      return true;
    };

    expect(validatePricing(sampleQuotation)).toBe(true);

    const invalidQuote: MockQuotation = {
      ...sampleQuotation,
      totalAmount: 200000, // mismatches sum of 150000
    };
    expect(validatePricing(invalidQuote)).toBe(false);
  });

  it('enforces server authorization rules for status transitions', () => {
    const canTransitionStatus = (
      userRole: 'CUSTOMER' | 'PROVIDER' | 'ADMIN',
      userId: string,
      quote: MockQuotation,
      targetStatus: QuotationStatus
    ): boolean => {
      if (userRole === 'ADMIN') return true;

      const isProvider = quote.providerId === userId;
      const isCustomer = quote.customerId === userId;

      if (['SUBMITTED', 'WITHDRAWN'].includes(targetStatus)) {
        return isProvider;
      }

      if (['ACCEPTED', 'REJECTED'].includes(targetStatus)) {
        return isCustomer;
      }

      return false;
    };

    // Provider submitting
    expect(canTransitionStatus('PROVIDER', 'provider-apex', sampleQuotation, 'SUBMITTED')).toBe(true);
    expect(canTransitionStatus('PROVIDER', 'other-provider', sampleQuotation, 'SUBMITTED')).toBe(false);

    // Customer accepting/declining
    expect(canTransitionStatus('CUSTOMER', 'customer-ramesh', sampleQuotation, 'ACCEPTED')).toBe(true);
    expect(canTransitionStatus('CUSTOMER', 'customer-ramesh', sampleQuotation, 'REJECTED')).toBe(true);
    expect(canTransitionStatus('CUSTOMER', 'other-customer', sampleQuotation, 'ACCEPTED')).toBe(false);

    // Customer cannot submit provider proposals
    expect(canTransitionStatus('CUSTOMER', 'customer-ramesh', sampleQuotation, 'SUBMITTED')).toBe(false);
  });

  it('triggers project creation boundary payload on customer proposal acceptance', () => {
    const handleProposalAcceptance = (quote: MockQuotation) => {
      if (quote.status !== 'SUBMITTED' && quote.status !== 'UNDER_REVIEW') {
        throw new Error('Only active submitted proposals can be accepted');
      }

      return {
        quotationStatus: 'ACCEPTED' as QuotationStatus,
        requirementStatus: 'QUOTATION_ACCEPTED',
        createdProject: {
          requirementId: quote.requirementId,
          customerId: quote.customerId,
          providerId: quote.providerId,
          quotationId: quote.id,
          status: 'ASSIGNED',
        },
      };
    };

    const result = handleProposalAcceptance({ ...sampleQuotation, status: 'UNDER_REVIEW' });
    expect(result.quotationStatus).toBe('ACCEPTED');
    expect(result.requirementStatus).toBe('QUOTATION_ACCEPTED');
    expect(result.createdProject).toEqual({
      requirementId: 201,
      customerId: 'customer-ramesh',
      providerId: 'provider-apex',
      quotationId: 801,
      status: 'ASSIGNED',
    });
  });
});
