/**
 * Mobile Project Request Details Screen Component & Controller for DBC Mobile Application.
 * Displays request status lifecycle, provider information, project scope, timeline,
 * cancellation action button, and link to associated quotation.
 */

import { mobileRequestService } from '../../services/mobileRequestService';
import { mobileTheme } from '../../theme/themeTokens';
import { MobileProjectRequestDetails } from '../../types/requestMobileTypes';

export interface ProjectRequestDetailsState {
  requestId: string;
  details: MobileProjectRequestDetails | null;
  isLoading: boolean;
  isCancelling: boolean;
  errorMessage: string | null;
  cancelSuccessMessage: string | null;
}

export class ProjectRequestDetailsController {
  private state: ProjectRequestDetailsState;

  constructor(requestId: string = '') {
    this.state = {
      requestId,
      details: null,
      isLoading: false,
      isCancelling: false,
      errorMessage: null,
      cancelSuccessMessage: null,
    };
  }

  getState(): ProjectRequestDetailsState {
    return { ...this.state };
  }

  async loadDetails(id?: string): Promise<void> {
    const targetId = id || this.state.requestId;
    if (!targetId) return;

    this.state.requestId = targetId;
    this.state.isLoading = true;
    this.state.errorMessage = null;

    try {
      this.state.details = await mobileRequestService.getProjectRequestDetails(targetId);
    } catch (err: unknown) {
      this.state.errorMessage = err instanceof Error ? err.message : 'Unable to load project request details';
    } finally {
      this.state.isLoading = false;
    }
  }

  async cancelRequest(): Promise<boolean> {
    if (!this.state.requestId || this.state.isCancelling) return false;

    this.state.isCancelling = true;
    this.state.errorMessage = null;

    try {
      const updated = await mobileRequestService.cancelProjectRequest(this.state.requestId);
      this.state.details = updated;
      this.state.cancelSuccessMessage = 'Project request has been cancelled.';
      return true;
    } catch (err: unknown) {
      this.state.errorMessage = err instanceof Error ? err.message : 'Failed to cancel project request';
      return false;
    } finally {
      this.state.isCancelling = false;
    }
  }
}

export const renderProjectRequestDetailsScreenDescriptor = (state: ProjectRequestDetailsState) => ({
  type: 'Screen',
  name: 'ProjectRequestDetailsScreen',
  styles: {
    backgroundColor: mobileTheme.colors.background,
    padding: mobileTheme.spacing.lg,
  },
  header: {
    requestNumber: state.details?.bookingNumber || `REQ-${state.requestId}`,
    statusBadge: {
      status: state.details?.status || 'REQUESTED',
      label: state.details?.statusLabel || 'Requested',
    },
    createdAt: state.details?.createdAt,
  },
  contractorSection: {
    title: 'Assigned Contractor Partner',
    providerName: state.details?.providerName || 'Contractor Partner',
    categoryName: state.details?.categoryName || 'General Construction',
    city: state.details?.providerCity || state.details?.city || 'Pan India',
    rating: state.details?.providerRating || 4.8,
  },
  projectScopeSection: {
    title: 'Project Scope & Notes',
    notes: state.details?.notes || 'No custom notes provided',
    estimatedBudget: state.details?.estimatedBudget ? `₹${state.details.estimatedBudget.toLocaleString()}` : 'Custom Quotation',
  },
  scheduleSection: {
    title: 'Schedule & Location',
    preferredDate: state.details?.preferredDate,
    preferredTime: state.details?.preferredTime,
    address: `${state.details?.customerAddress || ''}, ${state.details?.city || ''}, ${state.details?.state || ''}`,
  },
  actions: {
    canCancel: state.details?.status === 'REQUESTED',
    cancelButton: {
      label: state.isCancelling ? 'Cancelling Request...' : 'Cancel Request',
      disabled: state.isCancelling,
      minHeight: mobileTheme.touchTargets.minTouchArea,
      color: mobileTheme.colors.error,
    },
    viewQuotationButton: state.details?.quotationId ? {
      label: 'View Quotation Proposal',
      quotationId: state.details.quotationId,
      minHeight: mobileTheme.touchTargets.buttonHeight,
      backgroundColor: mobileTheme.colors.primary,
    } : null,
  },
  loader: state.isLoading,
  errorBanner: state.errorMessage,
  successBanner: state.cancelSuccessMessage,
});
