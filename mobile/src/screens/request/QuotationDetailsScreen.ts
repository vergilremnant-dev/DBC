/**
 * Mobile Quotation Details Screen Component & Controller for DBC Mobile Application.
 * Displays quotation proposal scope, financial total, milestone breakdown, and Accept/Reject actions.
 */

import { mobileRequestService } from '../../services/mobileRequestService';
import { mobileTheme } from '../../theme/themeTokens';
import { MobileQuotationDetails } from '../../types/requestMobileTypes';

export interface QuotationDetailsState {
  quotationId: number;
  details: MobileQuotationDetails | null;
  isLoading: boolean;
  isSubmittingAction: boolean;
  rejectReason: string;
  isRejectModalOpen: boolean;
  errorMessage: string | null;
  successMessage: string | null;
}

export class QuotationDetailsController {
  private state: QuotationDetailsState;

  constructor(quotationId: number = 0) {
    this.state = {
      quotationId,
      details: null,
      isLoading: false,
      isSubmittingAction: false,
      rejectReason: '',
      isRejectModalOpen: false,
      errorMessage: null,
      successMessage: null,
    };
  }

  getState(): QuotationDetailsState {
    return { ...this.state };
  }

  setRejectReason(reason: string) {
    this.state.rejectReason = reason;
  }

  toggleRejectModal(isOpen: boolean) {
    this.state.isRejectModalOpen = isOpen;
  }

  async loadQuotation(id?: number): Promise<void> {
    const targetId = id || this.state.quotationId;
    if (!targetId) return;

    this.state.quotationId = targetId;
    this.state.isLoading = true;
    this.state.errorMessage = null;

    try {
      this.state.details = await mobileRequestService.getQuotationDetails(targetId);
    } catch (err: unknown) {
      this.state.errorMessage = err instanceof Error ? err.message : 'Unable to load quotation details';
    } finally {
      this.state.isLoading = false;
    }
  }

  async acceptQuotation(): Promise<boolean> {
    if (!this.state.quotationId || this.state.isSubmittingAction) return false;

    this.state.isSubmittingAction = true;
    this.state.errorMessage = null;

    try {
      const updated = await mobileRequestService.acceptQuotation(this.state.quotationId);
      this.state.details = updated;
      this.state.successMessage = 'Quotation accepted! The contractor will initiate project setup.';
      return true;
    } catch (err: unknown) {
      this.state.errorMessage = err instanceof Error ? err.message : 'Failed to accept quotation';
      return false;
    } finally {
      this.state.isSubmittingAction = false;
    }
  }

  async rejectQuotation(): Promise<boolean> {
    if (!this.state.quotationId || this.state.isSubmittingAction) return false;

    this.state.isSubmittingAction = true;
    this.state.errorMessage = null;

    try {
      const updated = await mobileRequestService.rejectQuotation(
        this.state.quotationId,
        this.state.rejectReason
      );
      this.state.details = updated;
      this.state.isRejectModalOpen = false;
      this.state.successMessage = 'Quotation proposal has been declined.';
      return true;
    } catch (err: unknown) {
      this.state.errorMessage = err instanceof Error ? err.message : 'Failed to decline quotation';
      return false;
    } finally {
      this.state.isSubmittingAction = false;
    }
  }
}

export const renderQuotationDetailsScreenDescriptor = (state: QuotationDetailsState) => ({
  type: 'Screen',
  name: 'QuotationDetailsScreen',
  styles: {
    backgroundColor: mobileTheme.colors.background,
    padding: mobileTheme.spacing.lg,
  },
  header: {
    title: state.details?.proposal.title || `Quotation #${state.quotationId}`,
    statusBadge: {
      status: state.details?.status || 'SUBMITTED',
      label: state.details?.statusLabel || 'Submitted',
    },
    providerName: state.details?.providerName || 'Contractor Partner',
    rating: state.details?.providerRating || 4.9,
    submittedAt: state.details?.createdAt,
  },
  financialSummaryCard: {
    totalAmountLabel: 'Total Project Amount',
    totalAmountFormatted: state.details?.formattedAmount || '₹0',
    pricingModel: state.details?.priceModel || 'FIXED',
    estimatedDuration: state.details ? `${state.details.estimatedDurationDays} Days` : 'N/A',
    warranty: state.details?.warrantyMonths ? `${state.details.warrantyMonths} Months Warranty` : undefined,
  },
  proposalSection: {
    summary: state.details?.proposal.summary,
    scope: state.details?.proposal.scope,
    deliverables: state.details?.proposal.deliverables,
    assumptions: state.details?.proposal.assumptions,
    exclusions: state.details?.proposal.exclusions,
  },
  milestonesSection: {
    title: 'Milestone Cost Breakdown',
    items: (state.details?.milestones || []).map((m, idx) => ({
      index: idx + 1,
      name: m.name,
      description: m.description,
      costFormatted: `₹${m.cost.toLocaleString()}`,
      durationDays: m.durationDays,
    })),
  },
  actionFooter: {
    isActionable: state.details?.isCustomerActionable ?? false,
    acceptButton: {
      label: state.isSubmittingAction ? 'Processing...' : 'Accept Quotation Proposal',
      disabled: state.isSubmittingAction,
      minHeight: mobileTheme.touchTargets.buttonHeight,
      backgroundColor: mobileTheme.colors.success,
    },
    rejectButton: {
      label: 'Decline Quotation',
      disabled: state.isSubmittingAction,
      minHeight: mobileTheme.touchTargets.minTouchArea,
      color: mobileTheme.colors.error,
    },
  },
  rejectModal: {
    isOpen: state.isRejectModalOpen,
    title: 'Decline Quotation Proposal',
    reasonInput: state.rejectReason,
    placeholder: 'Optional reason for declining proposal...',
    confirmButtonLabel: 'Confirm Decline',
  },
  loader: state.isLoading,
  errorBanner: state.errorMessage,
  successBanner: state.successMessage,
});
