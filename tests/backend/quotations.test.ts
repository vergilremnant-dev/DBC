import { describe, it, expect, vi } from 'vitest';
import { isValidTransition } from '../../api-lib/services/quotationWorkflow.js';
import { calculateAndValidatePricing } from '../../api-lib/services/pricingEngine.js';
import { createQuotation } from '../../api-lib/services/quotationService.js';
import { db } from '../../api-lib/utils/db.js';
import { PricingModel, QuotationStatus } from '@prisma/client';

vi.mock('../../api-lib/utils/db.js', () => {
  return {
    db: {
      requirement: {
        findUnique: vi.fn(),
      },
      quotation: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      providerProfile: {
        findUnique: vi.fn(),
      },
      conversation: {
        findMany: vi.fn(),
      },
      proposal: {
        create: vi.fn(),
      },
      quotationMilestone: {
        createMany: vi.fn(),
      },
      quotationAttachment: {
        createMany: vi.fn(),
      },
      quotationHistory: {
        create: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(db)),
    },
  };
});

describe('Quotation Workflow Engine', () => {
  it('should validate allowed status transitions', () => {
    expect(isValidTransition(QuotationStatus.DRAFT, QuotationStatus.SUBMITTED)).toBe(true);
    expect(isValidTransition(QuotationStatus.SUBMITTED, QuotationStatus.VIEWED)).toBe(true);
    expect(isValidTransition(QuotationStatus.UNDER_REVIEW, QuotationStatus.ACCEPTED)).toBe(true);
    expect(isValidTransition(QuotationStatus.NEGOTIATION, QuotationStatus.REVISED)).toBe(true);
  });

  it('should reject invalid status transitions', () => {
    expect(isValidTransition(QuotationStatus.ACCEPTED, QuotationStatus.DRAFT)).toBe(false);
    expect(isValidTransition(QuotationStatus.REJECTED, QuotationStatus.SUBMITTED)).toBe(false);
  });
});

describe('Pricing Engine Calculations', () => {
  it('should validate and sum milestone pricing correctly', () => {
    const sum = calculateAndValidatePricing({
      priceModel: PricingModel.MILESTONE_BASED,
      totalAmount: 1500,
      milestones: [
        { cost: 500 },
        { cost: 1000 },
      ],
    });
    expect(sum).toBe(1500);
  });

  it('should throw error if milestones total sum does not match quotation totalAmount', () => {
    expect(() =>
      calculateAndValidatePricing({
        priceModel: PricingModel.MILESTONE_BASED,
        totalAmount: 1500,
        milestones: [
          { cost: 500 },
          { cost: 800 },
        ],
      })
    ).toThrow('Total amount (1500) does not match the sum of milestones cost (1300)');
  });
});

describe('Quotation Service Mock Tests', () => {
  it('should create quotation draft successfully', async () => {
    // An open (published) request for the professional's own service, which they may quote.
    vi.spyOn(db.requirement, 'findUnique').mockResolvedValue({ id: 10, status: 'PUBLISHED', serviceCategoryId: 2 } as any);
    vi.spyOn(db.providerProfile, 'findUnique').mockResolvedValue({ categoryId: 2 } as any);
    vi.spyOn(db.conversation, 'findMany').mockResolvedValue([] as any);
    vi.spyOn(db.quotation, 'findFirst').mockResolvedValue(null);
    const mockCreate = vi.spyOn(db.quotation, 'create').mockResolvedValueOnce({
      id: 99,
      requirementId: 10,
      providerId: 'prov-id',
      priceModel: PricingModel.FIXED,
      totalAmount: 2500,
      estimatedDurationDays: 30,
      status: QuotationStatus.DRAFT,
    } as any);

    const result = await createQuotation('prov-id', 'user-123', {
      requirementId: 10,
      priceModel: PricingModel.FIXED,
      totalAmount: 2500,
      estimatedDurationDays: 30,
      proposal: {
        title: 'Project Proposal',
        summary: 'Executive summary details',
        scope: 'Full scope details',
        deliverables: 'Deliverables list',
      },
    });

    expect(result).toBeDefined();
    expect(result.id).toBe(99);
    expect(result.status).toBe(QuotationStatus.DRAFT);
    expect(mockCreate).toHaveBeenCalled();
  });

  it('refuses quotations on requests that are closed or not visible to the professional', async () => {
    vi.spyOn(db.requirement, 'findUnique').mockResolvedValue({ id: 11, status: 'QUOTATION_ACCEPTED', serviceCategoryId: 2 } as any);
    const input = { requirementId: 11, priceModel: PricingModel.FIXED, totalAmount: 100, estimatedDurationDays: 3, proposal: { title: 't', summary: 's', scope: 's', deliverables: 'd' } };
    await expect(createQuotation('prov-id', 'user-123', input)).rejects.toThrow(/no longer accepting/);
    vi.spyOn(db.requirement, 'findUnique').mockResolvedValue({ id: 11, status: 'PUBLISHED', serviceCategoryId: 9 } as any);
    vi.spyOn(db.providerProfile, 'findUnique').mockResolvedValue({ categoryId: 2 } as any);
    vi.spyOn(db.conversation, 'findMany').mockResolvedValue([] as any);
    vi.spyOn(db.quotation, 'findFirst').mockResolvedValue(null);
    await expect(createQuotation('prov-id', 'user-123', input)).rejects.toThrow(/Unauthorized/);
  });
});
