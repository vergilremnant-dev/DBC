import { mobileProfessionalQuotationService } from '../../services/mobileProfessionalQuotationService.js';
import type { MobileQuotationItem } from '../../types/professionalQuotationMobileTypes.js';

export interface ProfessionalQuotationDetailsScreenProps {
  quotationId: number;
  onEditQuotation?: (quotationId: number) => void;
  onBack?: () => void;
}

export class ProfessionalQuotationDetailsScreenController {
  private props: ProfessionalQuotationDetailsScreenProps;
  private state: {
    quotation: MobileQuotationItem | null;
    isLoading: boolean;
    isSubmitting: boolean;
    isWithdrawing: boolean;
    withdrawReason: string;
    showWithdrawModal: boolean;
    error: string | null;
    successMessage: string | null;
  };

  constructor(props: ProfessionalQuotationDetailsScreenProps) {
    this.props = props;
    this.state = {
      quotation: null,
      isLoading: true,
      isSubmitting: false,
      isWithdrawing: false,
      withdrawReason: '',
      showWithdrawModal: false,
      error: null,
      successMessage: null,
    };
  }

  async init(): Promise<void> {
    await this.loadDetails();
  }

  async loadDetails(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const q = await mobileProfessionalQuotationService.getQuotationDetails(this.props.quotationId);
      this.state.quotation = q;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load quotation details';
    } finally {
      this.state.isLoading = false;
    }
  }

  async submitProposal(): Promise<void> {
    if (!this.state.quotation || this.state.isSubmitting) return;
    this.state.isSubmitting = true;
    this.state.error = null;
    try {
      const updated = await mobileProfessionalQuotationService.submitQuotation(this.props.quotationId);
      this.state.quotation = updated;
      this.state.successMessage = 'Quotation proposal submitted to customer successfully!';
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Failed to submit proposal';
    } finally {
      this.state.isSubmitting = false;
    }
  }

  openWithdrawModal(): void {
    this.state.showWithdrawModal = true;
    this.state.withdrawReason = '';
  }

  closeWithdrawModal(): void {
    this.state.showWithdrawModal = false;
  }

  setWithdrawReason(reason: string): void {
    this.state.withdrawReason = reason;
  }

  async confirmWithdraw(): Promise<void> {
    if (!this.state.quotation || this.state.isWithdrawing) return;
    this.state.isWithdrawing = true;
    this.state.error = null;
    try {
      const updated = await mobileProfessionalQuotationService.withdrawQuotation(
        this.props.quotationId,
        this.state.withdrawReason
      );
      this.state.quotation = updated;
      this.state.showWithdrawModal = false;
      this.state.successMessage = 'Quotation proposal withdrawn successfully.';
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Failed to withdraw proposal';
    } finally {
      this.state.isWithdrawing = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderProfessionalQuotationDetailsScreen(
  controller: ProfessionalQuotationDetailsScreenController,
  onEditQuotation?: (quotationId: number) => void,
  onBack?: () => void
): string {
  const { quotation, isLoading, isSubmitting, isWithdrawing, withdrawReason, showWithdrawModal, error, successMessage } =
    controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Quotation Proposal Details...</p>
      </div>
    `;
  }

  if (!quotation) {
    return `
      <div class="mobile-container p-6 text-center space-y-4">
        <h2 class="text-base font-bold text-stone-800">Quotation Not Found</h2>
        <p class="text-xs text-stone-500">${error || 'The requested quotation could not be located.'}</p>
        ${
          onBack
            ? `<button onclick="onBack()" class="min-h-[44px] px-4 py-2 bg-stone-900 text-white font-bold rounded-xl text-xs">Return to Quotations</button>`
            : ''
        }
      </div>
    `;
  }

  const { proposal, milestones } = quotation;

  return `
    <div class="mobile-container p-4 space-y-5 select-none pb-24">
      <!-- Header -->
      <div class="flex items-center gap-3">
        ${
          onBack
            ? `<button onclick="onBack()" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold">←</button>`
            : ''
        }
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-mono text-stone-400 font-bold">Q-#${quotation.id}</span>
            <span class="dbc-badge ${
              quotation.status === 'ACCEPTED'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                : quotation.status === 'REJECTED' || quotation.status === 'WITHDRAWN'
                ? 'bg-rose-100 text-rose-800 border-rose-200'
                : quotation.status === 'DRAFT'
                ? 'bg-stone-100 text-stone-700 border-stone-200'
                : 'bg-amber-100 text-amber-800 border-amber-200'
            } text-[8px] font-bold uppercase">
              ${quotation.statusLabel}
            </span>
          </div>
          <h1 class="text-base font-bold text-stone-900 font-serif mt-0.5">${quotation.requirementTitle}</h1>
          <span class="text-[11px] text-stone-500 font-semibold block">Client: ${quotation.customerName}</span>
        </div>
      </div>

      ${
        error
          ? `
        <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800">
          ${error}
        </div>
      `
          : ''
      }

      ${
        successMessage
          ? `
        <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
          ${successMessage}
        </div>
      `
          : ''
      }

      <!-- Financial Overview Card -->
      <div class="p-4 bg-emerald-900 text-white rounded-2xl space-y-3 shadow-md">
        <div class="flex items-center justify-between text-xs">
          <span class="text-emerald-300 font-semibold uppercase text-[10px] tracking-wider">Total Contract Estimate</span>
          <span class="px-2.5 py-0.5 bg-emerald-800 text-emerald-200 rounded-full font-bold text-[10px]">${quotation.priceModel.replace('_', ' ')}</span>
        </div>
        <div class="text-2xl font-black font-serif">${quotation.totalAmountFormatted}</div>
        <div class="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-800 text-[11px] text-emerald-200">
          <div>
            <span class="text-emerald-400 block text-[9.5px] font-bold uppercase">Duration</span>
            <span class="font-bold">${quotation.estimatedDurationDays} Construction Days</span>
          </div>
          <div>
            <span class="text-emerald-400 block text-[9.5px] font-bold uppercase">Warranty</span>
            <span class="font-bold">${quotation.warrantyMonths ? `${quotation.warrantyMonths} Months` : 'Standard Warranty'}</span>
          </div>
        </div>
      </div>

      <!-- Scope of Work & Proposal Details -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
        <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider">Technical Scope & Deliverables</h3>
        
        <div class="space-y-2 text-xs">
          <div>
            <span class="text-[10px] font-bold uppercase text-stone-400 block">Proposal Title</span>
            <p class="font-bold text-stone-800">${proposal.title}</p>
          </div>
          <div>
            <span class="text-[10px] font-bold uppercase text-stone-400 block">Summary</span>
            <p class="text-stone-600 font-medium leading-relaxed">${proposal.summary}</p>
          </div>
          <div>
            <span class="text-[10px] font-bold uppercase text-stone-400 block">Detailed Scope</span>
            <p class="text-stone-600 font-medium leading-relaxed">${proposal.scope}</p>
          </div>
          <div>
            <span class="text-[10px] font-bold uppercase text-stone-400 block">Key Deliverables</span>
            <p class="text-stone-600 font-medium leading-relaxed">${proposal.deliverables}</p>
          </div>
          ${
            proposal.assumptions
              ? `
            <div>
              <span class="text-[10px] font-bold uppercase text-stone-400 block">Assumptions</span>
              <p class="text-stone-600 font-medium leading-relaxed">${proposal.assumptions}</p>
            </div>
          `
              : ''
          }
          ${
            proposal.exclusions
              ? `
            <div>
              <span class="text-[10px] font-bold uppercase text-stone-400 block">Exclusions</span>
              <p class="text-stone-600 font-medium leading-relaxed">${proposal.exclusions}</p>
            </div>
          `
              : ''
          }
        </div>
      </div>

      <!-- Milestone Payment Breakdown -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider">Milestone Breakdown (${milestones.length})</h3>
          <span class="text-[10px] font-bold text-stone-500">Allocated: ₹${milestones.reduce((acc, m) => acc + m.cost, 0).toLocaleString('en-IN')}</span>
        </div>

        ${
          milestones.length === 0
            ? `<p class="text-xs text-stone-500 font-medium py-2">No milestone breakdown specified.</p>`
            : `
          <div class="space-y-2">
            ${milestones
              .map(
                (m, idx) => `
              <div class="p-3 bg-stone-50 border border-stone-150 rounded-xl space-y-1">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-stone-900">${idx + 1}. ${m.name}</span>
                  <span class="text-xs font-black text-emerald-800">₹${m.cost.toLocaleString('en-IN')}</span>
                </div>
                ${m.description ? `<p class="text-[11px] text-stone-600 font-medium">${m.description}</p>` : ''}
                ${m.durationDays ? `<span class="text-[10px] text-stone-400 font-semibold block">Duration: ${m.durationDays} days</span>` : ''}
              </div>
            `
              )
              .join('')}
          </div>
        `
        }
      </div>

      <!-- Action Buttons Sticky Bar -->
      <div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-200 flex items-center gap-2 max-w-md mx-auto z-20">
        ${
          quotation.isEditable && onEditQuotation
            ? `<button
                onclick="onEditQuotation(${quotation.id})"
                class="flex-1 min-h-[44px] py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition"
              >
                Edit Proposal
              </button>`
            : ''
        }

        ${
          quotation.isSubmittable
            ? `<button
                onclick="controller.submitProposal()"
                ${isSubmitting ? 'disabled' : ''}
                class="flex-1 min-h-[44px] py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
              >
                ${isSubmitting ? 'Submitting...' : 'Submit to Customer'}
              </button>`
            : ''
        }

        ${
          quotation.isWithdrawable
            ? `<button
                onclick="controller.openWithdrawModal()"
                class="min-h-[44px] px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition border border-rose-200"
              >
                Withdraw Proposal
              </button>`
            : ''
        }
      </div>

      <!-- Withdraw Modal -->
      ${
        showWithdrawModal
          ? `
        <div class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h3 class="text-sm font-black text-stone-900">Withdraw Quotation Proposal</h3>
            <p class="text-xs text-stone-600">Are you sure you want to withdraw proposal Q-#${quotation.id}? Please state a reason for withdrawal.</p>

            <textarea
              onchange="controller.setWithdrawReason(this.value)"
              placeholder="e.g. Scope parameters changed or schedule conflict."
              class="w-full min-h-[80px] p-3 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
            >${withdrawReason}</textarea>

            <div class="flex items-center gap-2 pt-2">
              <button
                onclick="controller.closeWithdrawModal()"
                class="flex-1 min-h-[44px] py-2 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onclick="controller.confirmWithdraw()"
                ${isWithdrawing ? 'disabled' : ''}
                class="flex-1 min-h-[44px] py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
              >
                ${isWithdrawing ? 'Withdrawing...' : 'Confirm Withdraw'}
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
