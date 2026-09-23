import { mobileProfessionalWorkspaceService } from '../../services/mobileProfessionalWorkspaceService.js';
import type { MobileProfessionalRequest } from '../../types/professionalWorkspaceMobileTypes.js';

export interface ProfessionalRequestDetailsScreenProps {
  requestId: string;
  onBack?: () => void;
  onPrepareQuotation?: (requestId: string) => void;
  onMessageCustomer?: (customerId: string) => void;
}

export class ProfessionalRequestDetailsScreenController {
  private props: ProfessionalRequestDetailsScreenProps;
  private state: {
    request: MobileProfessionalRequest | null;
    isLoading: boolean;
    error: string | null;
    isProcessing: boolean;
    statusMessage: string | null;
    declineReason: string;
    isDeclineModalOpen: boolean;
  };

  constructor(props: ProfessionalRequestDetailsScreenProps) {
    this.props = props;
    this.state = {
      request: null,
      isLoading: true,
      error: null,
      isProcessing: false,
      statusMessage: null,
      declineReason: '',
      isDeclineModalOpen: false,
    };
  }

  async init(): Promise<void> {
    await this.loadRequestDetails();
  }

  async loadRequestDetails(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const details = await mobileProfessionalWorkspaceService.getProfessionalRequestDetails(this.props.requestId);
      this.state.request = details;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load request details';
    } finally {
      this.state.isLoading = false;
    }
  }

  async handleAccept(): Promise<void> {
    if (this.state.isProcessing || !this.state.request) return;
    this.state.isProcessing = true;
    this.state.statusMessage = null;

    try {
      const res = await mobileProfessionalWorkspaceService.acceptRequest(this.props.requestId);
      this.state.request = res.request;
      this.state.statusMessage = 'Request accepted successfully! You can now prepare a commercial quotation.';
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Acceptance failed';
    } finally {
      this.state.isProcessing = false;
    }
  }

  openDeclineModal(): void {
    this.state.isDeclineModalOpen = true;
  }

  closeDeclineModal(): void {
    this.state.isDeclineModalOpen = false;
  }

  setDeclineReason(reason: string): void {
    this.state.declineReason = reason;
  }

  async handleDecline(): Promise<void> {
    if (this.state.isProcessing || !this.state.request) return;
    this.state.isProcessing = true;
    this.state.statusMessage = null;

    try {
      const res = await mobileProfessionalWorkspaceService.declineRequest(
        this.props.requestId,
        this.state.declineReason
      );
      this.state.request = res.request;
      this.state.isDeclineModalOpen = false;
      this.state.statusMessage = 'Project request declined.';
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Decline action failed';
    } finally {
      this.state.isProcessing = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderProfessionalRequestDetailsScreen(
  controller: ProfessionalRequestDetailsScreenController,
  onBack?: () => void,
  onPrepareQuotation?: (requestId: string) => void,
  onMessageCustomer?: (customerId: string) => void
): string {
  const { request, isLoading, error, isProcessing, statusMessage, isDeclineModalOpen, declineReason } =
    controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Request Details...</p>
      </div>
    `;
  }

  if (error || !request) {
    return `
      <div class="mobile-container p-4 space-y-4">
        <div class="flex items-center gap-3">
          <button onclick="${onBack ? 'onBack()' : 'history.back()'}" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold">
            ←
          </button>
          <h1 class="text-base font-bold text-stone-900 font-serif">Request Details</h1>
        </div>
        <div class="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
          <p class="text-xs font-bold text-rose-800">${error || 'Request details unavailable.'}</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="mobile-container p-4 space-y-5 select-none">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <button onclick="${onBack ? 'onBack()' : 'history.back()'}" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold" aria-label="Go Back">
          ←
        </button>
        <div>
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Project Request</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">${request.bookingNumber}</h1>
        </div>
      </div>

      ${
        statusMessage
          ? `
        <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5">
          <span class="text-emerald-700 text-base">✓</span>
          <p class="text-xs font-bold text-emerald-900">${statusMessage}</p>
        </div>
      `
          : ''
      }

      <!-- Detailed Request Card -->
      <div class="p-5 bg-white border border-stone-200 rounded-3xl space-y-4 shadow-sm">
        <div class="flex items-center justify-between pb-3 border-b border-stone-150">
          <div>
            <h2 class="text-sm font-black text-stone-900">${request.serviceCategory}</h2>
            <span class="text-[10.5px] text-stone-500 font-semibold block mt-0.5">Submitted by ${request.customerName}</span>
          </div>
          <span class="dbc-badge ${
            request.isActionable ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
          } text-[9px] font-bold uppercase">
            ${request.statusLabel}
          </span>
        </div>

        <div class="space-y-3 text-xs font-semibold text-stone-700">
          <div class="flex justify-between">
            <span class="text-stone-500">Estimated Budget</span>
            <strong class="text-stone-900 font-serif text-sm">${request.budgetFormatted}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-stone-500">Preferred Timeline</span>
            <strong class="text-stone-900">${request.preferredTimeline}</strong>
          </div>
          ${request.location ? `<div class="flex justify-between"><span class="text-stone-500">Site Location</span><strong class="text-stone-900">${request.location}</strong></div>` : ''}
          <div class="flex justify-between">
            <span class="text-stone-500">Submission Date</span>
            <strong class="text-stone-900">${request.submittedDate}</strong>
          </div>
        </div>

        <div class="pt-3 border-t border-stone-150 space-y-1">
          <span class="text-[9px] font-black uppercase text-stone-400">Requirement Notes & Scope</span>
          <p class="text-xs text-stone-800 font-medium leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200/60">
            ${request.notes}
          </p>
        </div>

        <!-- Contextual Action Buttons -->
        <div class="pt-2 space-y-2">
          ${
            request.isActionable
              ? `
            <button
              onclick="controller.handleAccept()"
              ${isProcessing ? 'disabled' : ''}
              class="w-full min-h-[44px] dbc-btn dbc-btn-xl dbc-btn-primary font-bold text-xs"
            >
              ${isProcessing ? 'Processing Acceptance...' : 'Accept Project Request'}
            </button>

            <button
              onclick="controller.openDeclineModal()"
              ${isProcessing ? 'disabled' : ''}
              class="w-full min-h-[44px] dbc-btn dbc-btn-md dbc-btn-secondary bg-stone-100 text-rose-700 hover:bg-stone-200 border border-stone-300 font-bold text-xs"
            >
              Decline Request
            </button>
          `
              : request.status === 'ACCEPTED'
              ? `
            <button
              onclick="${onPrepareQuotation ? `onPrepareQuotation('${request.id}')` : ''}"
              class="w-full min-h-[44px] dbc-btn dbc-btn-xl dbc-btn-primary font-bold text-xs"
            >
              Prepare Commercial Quotation →
            </button>

            <button
              onclick="${onMessageCustomer ? `onMessageCustomer('${request.customerName}')` : ''}"
              class="w-full min-h-[44px] dbc-btn dbc-btn-md dbc-btn-secondary bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-300 font-bold text-xs"
            >
              Message Customer Partner 💬
            </button>
          `
              : `
            <div class="p-3 bg-stone-100 text-stone-600 rounded-xl text-center text-xs font-semibold">
              Request Status: ${request.statusLabel}
            </div>
          `
          }
        </div>
      </div>

      <!-- Decline Modal Overlay -->
      ${
        isDeclineModalOpen
          ? `
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 select-none">
          <div class="bg-white w-full max-w-md rounded-3xl p-6 relative shadow-2xl border border-stone-150 space-y-4 text-left text-xs font-semibold text-stone-700">
            <h2 class="text-base font-bold text-stone-900 font-serif">Decline Project Request</h2>
            <p class="text-[11px] text-stone-500 font-medium">Please provide an optional reason for declining this request.</p>

            <textarea
              placeholder="Reason for declining (optional)..."
              rows="3"
              oninput="controller.setDeclineReason(this.value)"
              class="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none"
            >${declineReason}</textarea>

            <div class="flex gap-2 pt-2">
              <button
                onclick="controller.handleDecline()"
                ${isProcessing ? 'disabled' : ''}
                class="flex-1 min-h-[44px] dbc-btn dbc-btn-md dbc-btn-danger border border-rose-200 bg-rose-50 text-rose-700 font-bold text-xs"
              >
                ${isProcessing ? 'Declining...' : 'Confirm Decline'}
              </button>
              <button
                onclick="controller.closeDeclineModal()"
                class="flex-1 min-h-[44px] dbc-btn dbc-btn-md dbc-btn-secondary bg-stone-100 text-stone-700 font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;
}
