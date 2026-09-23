import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mobileProfessionalQuotationService } from '../../mobile/src/services/mobileProfessionalQuotationService.js';
import {
  ProfessionalQuotationsScreenController,
  renderProfessionalQuotationsScreen,
} from '../../mobile/src/screens/request/ProfessionalQuotationsScreen.js';
import {
  ProfessionalQuotationDetailsScreenController,
  renderProfessionalQuotationDetailsScreen,
} from '../../mobile/src/screens/request/ProfessionalQuotationDetailsScreen.js';
import {
  ProfessionalQuotationEditorScreenController,
  renderProfessionalQuotationEditorScreen,
} from '../../mobile/src/screens/request/ProfessionalQuotationEditorScreen.js';
import { quotationClientService } from '../../src/services/quotation/quotationClientService.js';
import type { Quotation } from '../../src/services/quotation/quotationClientService.js';

vi.mock('../../src/services/quotation/quotationClientService.js', () => ({
  quotationClientService: {
    getQuotations: vi.fn(),
    getQuotationById: vi.fn(),
    createQuotation: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

const mockRawQuotations: Quotation[] = [
  {
    id: 901,
    requirementId: 501,
    providerId: 'prov-101',
    priceModel: 'MILESTONE_BASED',
    totalAmount: 120000,
    estimatedDurationDays: 30,
    warrantyMonths: 12,
    status: 'SUBMITTED',
    createdAt: '2026-09-20T10:00:00Z',
    updatedAt: '2026-09-20T10:00:00Z',
    requirement: {
      id: 501,
      title: 'Civil Masonry & Raft Foundation',
      customer: { fullName: 'Ramesh Kumar' },
    },
    proposal: {
      title: 'Raft Foundation & RCC Casting Proposal',
      summary: 'Excavation, shuttering, steel rebar tying and M25 concrete casting.',
      scope: 'Site clearance, 5ft deep excavation, RCC column starter setup.',
      deliverables: 'Excavated plot, tied rebar mesh inspection, poured raft slab.',
    },
    milestones: [
      { id: 1, name: 'Excavation & PCC Bedding', cost: 40000, durationDays: 10 },
      { id: 2, name: 'RCC Casting & Curing Handover', cost: 80000, durationDays: 20 },
    ],
  },
  {
    id: 902,
    requirementId: 502,
    providerId: 'prov-101',
    priceModel: 'FIXED',
    totalAmount: 45000,
    estimatedDurationDays: 14,
    warrantyMonths: 6,
    status: 'DRAFT',
    createdAt: '2026-09-21T10:00:00Z',
    updatedAt: '2026-09-21T10:00:00Z',
    requirement: {
      id: 502,
      title: 'MEP Electrical Conduits Layout',
      customer: { fullName: 'Sita Sharma' },
    },
    proposal: {
      title: 'Penthouse Electrical Conduiting Draft',
      summary: 'Chasing walls, laying heavy-duty PVC conduits.',
      scope: 'Wall cutting for concealed pipes, DB box installation.',
      deliverables: 'Concealed conduit network ready for wire pulling.',
    },
    milestones: [
      { id: 10, name: 'Wall Chasing & PVC Pipe Laying', cost: 25000, durationDays: 7 },
      { id: 11, name: 'Metal Box Fixing & Finishing', cost: 20000, durationDays: 7 },
    ],
  },
];

describe('Module 42 — Professional Mobile Quotation Management & Proposal Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mobileProfessionalQuotationService.clearCache();
  });

  describe('1. Mobile Professional Quotation Service Adaptations', () => {
    it('fetches quotations from backend service and adapts domain models', async () => {
      vi.mocked(quotationClientService.getQuotations).mockResolvedValue(mockRawQuotations);

      const items = await mobileProfessionalQuotationService.getProfessionalQuotations();

      expect(items.length).toBe(2);
      expect(items[0].id).toBe(901);
      expect(items[0].requirementTitle).toBe('Civil Masonry & Raft Foundation');
      expect(items[0].customerName).toBe('Ramesh Kumar');
      expect(items[0].totalAmountFormatted).toBe('₹1,20,000');
      expect(items[0].isSubmittable).toBe(false);
      expect(items[0].isWithdrawable).toBe(true);

      expect(items[1].id).toBe(902);
      expect(items[1].status).toBe('DRAFT');
      expect(items[1].isSubmittable).toBe(true);
      expect(items[1].isEditable).toBe(true);
    });

    it('fetches detailed quotation proposal by ID', async () => {
      vi.mocked(quotationClientService.getQuotationById).mockResolvedValue(mockRawQuotations[0]);

      const item = await mobileProfessionalQuotationService.getQuotationDetails(901);

      expect(item.id).toBe(901);
      expect(item.proposal.title).toContain('Raft Foundation');
      expect(item.milestones.length).toBe(2);
    });

    it('handles 401 and 403 errors cleanly', async () => {
      vi.mocked(quotationClientService.getQuotations).mockRejectedValue(new Error('401 Session Expired'));

      await expect(mobileProfessionalQuotationService.getProfessionalQuotations()).rejects.toThrow(
        'UNAUTHORIZED_EXPIRED_SESSION'
      );
    });
  });

  describe('2. Professional Quotations List Screen', () => {
    it('renders quotation items and handles status filtering tabs', async () => {
      vi.mocked(quotationClientService.getQuotations).mockResolvedValue(mockRawQuotations);

      const controller = new ProfessionalQuotationsScreenController({});
      await controller.init();

      expect(controller.getState().quotations.length).toBe(2);

      // Render ALL filter
      let html = renderProfessionalQuotationsScreen(controller);
      expect(html).toContain('Quotation Management');
      expect(html).toContain('Q-#901');
      expect(html).toContain('Q-#902');

      // Filter DRAFT
      controller.setFilter('DRAFT');
      html = renderProfessionalQuotationsScreen(controller);
      expect(html).toContain('Q-#902');
      expect(html).not.toContain('Q-#901');

      // Filter SUBMITTED
      controller.setFilter('SUBMITTED');
      html = renderProfessionalQuotationsScreen(controller);
      expect(html).toContain('Q-#901');
      expect(html).not.toContain('Q-#902');
    });
  });

  describe('3. Professional Quotation Details & Proposal Actions', () => {
    it('renders proposal breakdown and handles submitting draft proposal', async () => {
      vi.mocked(quotationClientService.getQuotationById).mockResolvedValue(mockRawQuotations[1]);
      vi.mocked(quotationClientService.updateStatus).mockResolvedValue({
        ...mockRawQuotations[1],
        status: 'SUBMITTED',
      });

      const controller = new ProfessionalQuotationDetailsScreenController({ quotationId: 902 });
      await controller.init();

      expect(controller.getState().quotation?.isSubmittable).toBe(true);

      let html = renderProfessionalQuotationDetailsScreen(controller);
      expect(html).toContain('Submit to Customer');

      await controller.submitProposal();

      expect(quotationClientService.updateStatus).toHaveBeenCalledWith(902, 'SUBMITTED');
      expect(controller.getState().quotation?.status).toBe('SUBMITTED');
      expect(controller.getState().successMessage).toContain('submitted to customer successfully');
    });

    it('handles withdrawal of proposal with modal reason', async () => {
      vi.mocked(quotationClientService.getQuotationById).mockResolvedValue(mockRawQuotations[0]);
      vi.mocked(quotationClientService.updateStatus).mockResolvedValue({
        ...mockRawQuotations[0],
        status: 'WITHDRAWN',
      });

      const controller = new ProfessionalQuotationDetailsScreenController({ quotationId: 901 });
      await controller.init();

      controller.openWithdrawModal();
      expect(controller.getState().showWithdrawModal).toBe(true);

      controller.setWithdrawReason('Materials price increase required redesign');
      await controller.confirmWithdraw();

      expect(quotationClientService.updateStatus).toHaveBeenCalledWith(
        901,
        'WITHDRAWN',
        'Materials price increase required redesign'
      );
      expect(controller.getState().quotation?.status).toBe('WITHDRAWN');
      expect(controller.getState().showWithdrawModal).toBe(false);
    });
  });

  describe('4. 5-Step Mobile Quotation Proposal Wizard', () => {
    it('guides contractor through 5 steps, validates inputs and milestone allocation sum', async () => {
      const controller = new ProfessionalQuotationEditorScreenController({ requirementId: 501 });
      await controller.init();

      expect(controller.getState().form.step).toBe(1);

      // Step 1: Scope & Details
      controller.updateProposalField('title', 'Excavation & Raft Concrete Proposal');
      controller.nextStep();
      expect(controller.getState().form.step).toBe(2);

      // Step 2: Timeline & Schedule
      controller.updateForm('estimatedDurationDays', 25);
      controller.nextStep();
      expect(controller.getState().form.step).toBe(3);

      // Step 3: Pricing Model & Budget
      controller.updateForm('totalAmount', 100000);
      controller.nextStep();
      expect(controller.getState().form.step).toBe(4);

      // Step 4: Milestones - check sum mismatch validation
      controller.updateMilestone(0, 'cost', 40000);
      controller.updateMilestone(1, 'cost', 50000); // sum = 90,000 != 100,000
      expect(controller.validateCurrentStep()).toBe(false);
      expect(controller.getState().validationErrors.milestones).toContain('must match contract total');

      // Fix allocation match
      controller.updateMilestone(1, 'cost', 60000); // sum = 100,000 == 100,000
      expect(controller.validateCurrentStep()).toBe(true);

      controller.nextStep();
      expect(controller.getState().form.step).toBe(5);

      // Step 5: Render preview HTML
      const html = renderProfessionalQuotationEditorScreen(controller);
      expect(html).toContain('Step 5: Review Proposal Summary');
      expect(html).toContain('₹1,00,000');
      expect(html).toContain('Excavation & Raft Concrete Proposal');
    });

    it('supports saving proposal as draft and submitting proposal', async () => {
      vi.mocked(quotationClientService.createQuotation).mockResolvedValue({
        id: 999,
        requirementId: 501,
        providerId: 'prov-101',
        priceModel: 'MILESTONE_BASED',
        totalAmount: 100000,
        estimatedDurationDays: 30,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      vi.mocked(quotationClientService.updateStatus).mockResolvedValue({
        id: 999,
        requirementId: 501,
        providerId: 'prov-101',
        priceModel: 'MILESTONE_BASED',
        totalAmount: 100000,
        estimatedDurationDays: 30,
        status: 'SUBMITTED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const onSuccess = vi.fn();
      const controller = new ProfessionalQuotationEditorScreenController({
        requirementId: 501,
        onSuccess,
      });

      await controller.saveDraft();
      expect(quotationClientService.createQuotation).toHaveBeenCalled();

      await controller.submitQuotation();
      expect(quotationClientService.updateStatus).toHaveBeenCalled();
    });
  });
});
