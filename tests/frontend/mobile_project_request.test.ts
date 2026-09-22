import { describe, it, expect, beforeEach, vi } from 'vitest';

import { mobileRequestService, formatCurrency, formatRequestStatusLabel, formatQuotationStatusLabel } from '../../mobile/src/services/mobileRequestService';
import { bookingApi } from '../../src/services/booking/bookingService';
import { quotationClientService } from '../../src/services/quotation/quotationClientService';
import { ProjectRequestFormController, renderProjectRequestFormDescriptor } from '../../mobile/src/screens/request/ProjectRequestFormScreen';
import { ProjectRequestDetailsController, renderProjectRequestDetailsScreenDescriptor } from '../../mobile/src/screens/request/ProjectRequestDetailsScreen';
import { QuotationDetailsController, renderQuotationDetailsScreenDescriptor } from '../../mobile/src/screens/request/QuotationDetailsScreen';

vi.mock('../../src/services/booking/bookingService', () => ({
  bookingApi: {
    createBooking: vi.fn(),
    getBookingDetails: vi.fn(),
    getMyBookings: vi.fn(),
    cancelBooking: vi.fn(),
  },
}));

vi.mock('../../src/services/quotation/quotationClientService', () => ({
  quotationClientService: {
    getQuotationById: vi.fn(),
    getQuotations: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

describe('Module 36 — Customer Project Request & Quotation Flow Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Form Helpers & Status Formatting', () => {
    it('should format currency amounts into Indian Rupee strings', () => {
      expect(formatCurrency(250000)).toContain('2,50,000');
      expect(formatCurrency(1500)).toContain('1,500');
    });

    it('should map request statuses to human readable labels', () => {
      expect(formatRequestStatusLabel('REQUESTED')).toBe('Project Requested');
      expect(formatRequestStatusLabel('ACCEPTED')).toBe('Accepted by Contractor');
      expect(formatRequestStatusLabel('IN_PROGRESS')).toBe('Work In Progress');
      expect(formatRequestStatusLabel('CANCELLED')).toBe('Cancelled');
    });

    it('should map quotation statuses to human readable labels', () => {
      expect(formatQuotationStatusLabel('SUBMITTED')).toBe('Quotation Submitted');
      expect(formatQuotationStatusLabel('ACCEPTED')).toBe('Quotation Accepted');
      expect(formatQuotationStatusLabel('REJECTED')).toBe('Declined');
    });
  });

  describe('2. Project Request Form Workflows', () => {
    it('should validate required fields before allowing submission', async () => {
      const controller = new ProjectRequestFormController({
        providerId: '',
        customerAddress: '',
      });

      const result = await controller.submitRequest();
      expect(result).toBeNull();
      expect(controller.getState().fieldErrors.providerId).toBeDefined();
      expect(controller.getState().fieldErrors.customerAddress).toBeDefined();
    });

    it('should navigate to review step when valid', () => {
      const controller = new ProjectRequestFormController({
        providerId: 'pro_101',
        providerName: 'Apex Builders',
        categoryId: 1,
        categoryName: 'Electrical Work',
        customerAddress: '123 Park Street',
        city: 'Hyderabad',
      });

      controller.setReviewStep(true);
      expect(controller.getState().isReviewStep).toBe(true);

      const descriptor = renderProjectRequestFormDescriptor(controller.getState());
      expect(descriptor.name).toBe('ProjectRequestReviewScreen');
      expect(descriptor.reviewItems.some((i) => i.value === 'Apex Builders')).toBe(true);
    });

    it('should submit request to backend API and render success screen', async () => {
      vi.mocked(bookingApi.createBooking).mockResolvedValueOnce({
        id: 'bkt_88',
        bookingNumber: 'REQ-2026-88',
        customerId: 'cust_1',
        providerId: 'pro_101',
        categoryId: 1,
        bookingStatus: 'REQUESTED',
        preferredDate: '2026-10-01',
        preferredTime: '10:00',
        customerAddress: '123 Park Street',
        city: 'Hyderabad',
        state: 'Telangana',
        notes: 'Villa electrical wiring',
        estimatedBudget: 150000,
        createdAt: '2026-09-22T10:00:00Z',
        updatedAt: '2026-09-22T10:00:00Z',
      });

      const controller = new ProjectRequestFormController({
        providerId: 'pro_101',
        providerName: 'Apex Builders',
        categoryId: 1,
        categoryName: 'Electrical Work',
        preferredDate: '2026-10-01',
        preferredTime: '10:00',
        customerAddress: '123 Park Street',
        city: 'Hyderabad',
        notes: 'Villa electrical wiring',
        estimatedBudget: 150000,
      });

      controller.setReviewStep(true);
      const details = await controller.submitRequest();

      expect(details).not.toBeNull();
      expect(details?.bookingNumber).toBe('REQ-2026-88');
      expect(bookingApi.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          providerId: 'pro_101',
          categoryId: 1,
          customerAddress: '123 Park Street',
          city: 'Hyderabad',
        })
      );

      const descriptor = renderProjectRequestFormDescriptor(controller.getState());
      expect(descriptor.name).toBe('ProjectRequestSuccessScreen');
      expect(descriptor.confirmation.title).toContain('Project Request Submitted');
    });
  });

  describe('3. Project Request Details & Cancellation', () => {
    it('should load project request details and allow cancellation when status is REQUESTED', async () => {
      vi.mocked(bookingApi.getBookingDetails).mockResolvedValueOnce({
        id: 'bkt_88',
        bookingNumber: 'REQ-2026-88',
        customerId: 'cust_1',
        providerId: 'pro_101',
        categoryId: 1,
        bookingStatus: 'REQUESTED',
        preferredDate: '2026-10-01',
        preferredTime: '10:00',
        customerAddress: '123 Park Street',
        city: 'Hyderabad',
        state: 'Telangana',
        notes: 'Villa wiring',
        estimatedBudget: 150000,
        createdAt: '2026-09-22T10:00:00Z',
        updatedAt: '2026-09-22T10:00:00Z',
        provider: { id: 'pro_101', businessName: 'Apex Builders', city: 'Hyderabad', rating: 4.9 } as any,
      });

      const controller = new ProjectRequestDetailsController('bkt_88');
      await controller.loadDetails();

      const state = controller.getState();
      expect(state.details?.providerName).toBe('Apex Builders');
      expect(state.details?.statusLabel).toBe('Project Requested');

      const descriptor = renderProjectRequestDetailsScreenDescriptor(state);
      expect(descriptor.actions.canCancel).toBe(true);

      // Test Cancel Action
      vi.mocked(bookingApi.cancelBooking).mockResolvedValueOnce({
        ...bookingApi.getBookingDetails as any,
        id: 'bkt_88',
        bookingStatus: 'CANCELLED',
      });

      const cancelSuccess = await controller.cancelRequest();
      expect(cancelSuccess).toBe(true);
      expect(controller.getState().details?.status).toBe('CANCELLED');
    });
  });

  describe('4. Quotation Details & Milestone Breakdown', () => {
    it('should load quotation proposal, total amount, and milestone cost breakdown', async () => {
      vi.mocked(quotationClientService.getQuotationById).mockResolvedValueOnce({
        id: 501,
        requirementId: 88,
        providerId: 'pro_101',
        priceModel: 'MILESTONE_BASED',
        totalAmount: 350000,
        estimatedDurationDays: 45,
        warrantyMonths: 12,
        status: 'SUBMITTED',
        createdAt: '2026-09-22T12:00:00Z',
        updatedAt: '2026-09-22T12:00:00Z',
        proposal: {
          title: 'Turnkey Electrical & Automation Proposal',
          summary: 'Complete conduit piping, DB dressing, and smart switches.',
          scope: 'Material supply + certified labor.',
          deliverables: '3 milestone handovers.',
        },
        milestones: [
          { id: 1, name: 'Conduit & Slab Piping', cost: 100000, durationDays: 15 },
          { id: 2, name: 'Wiring & DB Dressing', cost: 150000, durationDays: 20 },
          { id: 3, name: 'Fixtures & Testing', cost: 100000, durationDays: 10 },
        ],
        provider: { id: 'pro_101', businessName: 'Apex Builders', contactPerson: 'John', rating: 4.9 },
      });

      const controller = new QuotationDetailsController(501);
      await controller.loadQuotation();

      const state = controller.getState();
      expect(state.details?.formattedAmount).toContain('3,50,000');
      expect(state.details?.milestones.length).toBe(3);
      expect(state.details?.isCustomerActionable).toBe(true);

      const descriptor = renderQuotationDetailsScreenDescriptor(state);
      expect(descriptor.financialSummaryCard.totalAmountFormatted).toContain('3,50,000');
      expect(descriptor.milestonesSection.items.length).toBe(3);
      expect(descriptor.actionFooter.isActionable).toBe(true);
    });

    it('should process quotation acceptance successfully', async () => {
      vi.mocked(quotationClientService.getQuotationById).mockResolvedValue({
        id: 501,
        requirementId: 88,
        providerId: 'pro_101',
        priceModel: 'FIXED',
        totalAmount: 200000,
        estimatedDurationDays: 30,
        status: 'ACCEPTED',
        createdAt: '2026-09-22T12:00:00Z',
        updatedAt: '2026-09-22T12:00:00Z',
        proposal: { title: 'Fixed Proposal', summary: 'Summary', scope: 'Scope', deliverables: 'Del' },
      });
      vi.mocked(quotationClientService.updateStatus).mockResolvedValueOnce({} as any);

      const controller = new QuotationDetailsController(501);
      await controller.loadQuotation();

      const success = await controller.acceptQuotation();
      expect(success).toBe(true);
      expect(quotationClientService.updateStatus).toHaveBeenCalledWith(501, 'ACCEPTED');
      expect(controller.getState().successMessage).toContain('accepted');
    });

    it('should process quotation rejection with optional reason', async () => {
      vi.mocked(quotationClientService.getQuotationById).mockResolvedValue({
        id: 501,
        requirementId: 88,
        providerId: 'pro_101',
        priceModel: 'FIXED',
        totalAmount: 200000,
        estimatedDurationDays: 30,
        status: 'REJECTED',
        createdAt: '2026-09-22T12:00:00Z',
        updatedAt: '2026-09-22T12:00:00Z',
        proposal: { title: 'Fixed Proposal', summary: 'Summary', scope: 'Scope', deliverables: 'Del' },
      });
      vi.mocked(quotationClientService.updateStatus).mockResolvedValueOnce({} as any);

      const controller = new QuotationDetailsController(501);
      await controller.loadQuotation();
      controller.setRejectReason('Budget constraints');

      const success = await controller.rejectQuotation();
      expect(success).toBe(true);
      expect(quotationClientService.updateStatus).toHaveBeenCalledWith(501, 'REJECTED', 'Budget constraints');
    });
  });
});
