/**
 * Mobile Customer Requests Screen Component & Controller for DBC Mobile Application.
 * Displays customer's submitted project requests as mobile cards with status badges and actions.
 */

import { mobileRequestService } from '../../services/mobileRequestService';
import { mobileTheme } from '../../theme/themeTokens';
import { MobileProjectRequestDetails } from '../../types/requestMobileTypes';

export interface CustomerRequestsState {
  requests: MobileProjectRequestDetails[];
  isLoading: boolean;
  errorMessage: string | null;
}

export class CustomerRequestsController {
  private state: CustomerRequestsState = {
    requests: [],
    isLoading: false,
    errorMessage: null,
  };

  getState(): CustomerRequestsState {
    return { ...this.state };
  }

  async loadRequests(): Promise<void> {
    this.state.isLoading = true;
    this.state.errorMessage = null;

    try {
      this.state.requests = await mobileRequestService.getMyRequests();
    } catch (err: unknown) {
      this.state.errorMessage = err instanceof Error ? err.message : 'Unable to load project requests';
    } finally {
      this.state.isLoading = false;
    }
  }
}

export const renderCustomerRequestsScreenDescriptor = (state: CustomerRequestsState) => ({
  type: 'Screen',
  name: 'CustomerRequestsScreen',
  styles: {
    backgroundColor: mobileTheme.colors.background,
    padding: mobileTheme.spacing.lg,
  },
  header: {
    title: 'My Project Requests',
    subtitle: 'Track status and quotation proposals for submitted requests',
  },
  requestCards: state.requests.map((req) => ({
    id: req.id,
    bookingNumber: req.bookingNumber,
    providerName: req.providerName,
    categoryName: req.categoryName,
    status: req.status,
    statusLabel: req.statusLabel,
    preferredDate: req.preferredDate,
    city: req.city,
    estimatedBudget: req.estimatedBudget ? `₹${req.estimatedBudget.toLocaleString()}` : 'Custom Quote',
    submittedAt: req.createdAt ? req.createdAt.split('T')[0] : '',
    actionLabel: 'View Request Details',
    minHeight: mobileTheme.touchTargets.buttonHeight,
  })),
  emptyState: !state.isLoading && state.requests.length === 0 ? {
    title: "You haven't submitted any project requests yet.",
    subtitle: 'Browse professional contractors and start your first construction or renovation request.',
    ctaLabel: 'Discover Services & Contractors',
    targetRoute: 'MarketplaceHome',
    minHeight: mobileTheme.touchTargets.buttonHeight,
  } : null,
  loader: state.isLoading,
  errorBanner: state.errorMessage,
});
