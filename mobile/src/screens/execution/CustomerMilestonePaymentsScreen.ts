import { mobileCustomerFinancialService } from '../../services/mobileCustomerFinancialService.js';
import type { MobileMilestonePayment } from '../../types/customerFinancialMobileTypes.js';

export interface CustomerMilestonePaymentsScreenProps {
  projectId: string;
  onBack?: () => void;
  onPaymentSuccess?: (milestoneId: string, ref: string) => void;
}

export class CustomerMilestonePaymentsScreenController {
  private props: CustomerMilestonePaymentsScreenProps;
  private state: {
    milestones: MobileMilestonePayment[];
    isLoading: boolean;
    error: string | null;
    selectedMilestone: MobileMilestonePayment | null;
    isCheckoutOpen: boolean;
    isProcessing: boolean;
    successMessage: string | null;
  };

  constructor(props: CustomerMilestonePaymentsScreenProps) {
    this.props = props;
    this.state = {
      milestones: [],
      isLoading: true,
      error: null,
      selectedMilestone: null,
      isCheckoutOpen: false,
      isProcessing: false,
      successMessage: null,
    };
  }

  async init(): Promise<void> {
    await this.loadMilestones();
  }

  async loadMilestones(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const milestones = await mobileCustomerFinancialService.getMilestonePayments(this.props.projectId);
      this.state.milestones = milestones;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load milestone payments';
    } finally {
      this.state.isLoading = false;
    }
  }

  openCheckout(milestone: MobileMilestonePayment): void {
    if (!milestone.isActionable || this.state.isProcessing) return;
    this.state.selectedMilestone = milestone;
    this.state.isCheckoutOpen = true;
    this.state.successMessage = null;
  }

  closeCheckout(): void {
    if (this.state.isProcessing) return;
    this.state.isCheckoutOpen = false;
    this.state.selectedMilestone = null;
  }

  async processPaymentSuccess(): Promise<void> {
    if (!this.state.selectedMilestone || this.state.isProcessing) return;
    this.state.isProcessing = true;

    try {
      const milestone = this.state.selectedMilestone;
      const res = await mobileCustomerFinancialService.recordMilestonePayment(
        this.props.projectId,
        milestone.milestoneId
      );

      this.state.successMessage = `Payment of ₹${milestone.totalPayable.toLocaleString()} for "${milestone.milestoneName}" locked safely in DBC Escrow!`;
      this.state.isCheckoutOpen = false;
      this.state.selectedMilestone = null;

      await this.loadMilestones();

      if (this.props.onPaymentSuccess) {
        this.props.onPaymentSuccess(milestone.milestoneId, res.transaction.transactionReference);
      }
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Payment recording failed';
    } finally {
      this.state.isProcessing = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderCustomerMilestonePaymentsScreen(
  controller: CustomerMilestonePaymentsScreenController,
  onBack?: () => void
): string {
  const { milestones, isLoading, error, isCheckoutOpen, selectedMilestone, isProcessing, successMessage } =
    controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Milestone Schedule...</p>
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
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Payment Schedule</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Milestone Payments</h1>
        </div>
      </div>

      ${
        successMessage
          ? `
        <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
          <span class="text-emerald-700 text-lg">✓</span>
          <div>
            <strong class="text-xs font-bold text-emerald-900 block">Payment Confirmed</strong>
            <p class="text-[11px] text-emerald-800 font-medium">${successMessage}</p>
          </div>
        </div>
      `
          : ''
      }

      ${
        error
          ? `
        <div class="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-800">
          ${error}
        </div>
      `
          : ''
      }

      <!-- Milestone Cards List -->
      ${
        milestones.length === 0
          ? `
        <div class="p-8 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
          <span class="text-3xl">💳</span>
          <p class="text-xs font-bold text-stone-800">No milestone payment schedule set up.</p>
          <p class="text-[11px] text-stone-500 font-medium">Milestones will appear here once finalized by the contractor.</p>
        </div>
      `
          : `
        <div class="space-y-4">
          ${milestones
            .map((m, idx) => {
              const isPaid = m.paymentStatus === 'PAID';
              const isDue = m.paymentStatus === 'DUE';

              return `
              <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3 hover:border-emerald-300 transition">
                <div class="flex items-start justify-between gap-2">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-stone-400">#${idx + 1}</span>
                      <h3 class="text-xs font-black text-stone-900">${m.milestoneName}</h3>
                    </div>
                    ${m.description ? `<p class="text-[11px] text-stone-500 font-medium line-clamp-2">${m.description}</p>` : ''}
                  </div>
                  
                  <span class="dbc-badge text-[8px] py-0.5 uppercase font-bold shrink-0 ${
                    isPaid
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : isDue
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-stone-100 text-stone-600 border-stone-200'
                  }">
                    ${isPaid ? 'PAID' : isDue ? 'PAYMENT DUE' : 'SCHEDULED'}
                  </span>
                </div>

                <!-- Financial Breakdown per milestone -->
                <div class="p-3 bg-stone-50 border border-stone-150 rounded-xl space-y-1.5 text-[11px] font-semibold text-stone-700">
                  <div class="flex justify-between">
                    <span>Base Milestone Value</span>
                    <strong class="text-stone-900">₹${m.baseAmount.toLocaleString()}</strong>
                  </div>
                  <div class="flex justify-between text-stone-500">
                    <span>Escrow Fee (1%) + GST (18%)</span>
                    <strong class="text-stone-900">₹${(m.platformFee + m.taxAmount).toLocaleString()}</strong>
                  </div>
                  <div class="flex justify-between pt-1 border-t border-stone-200/50 text-xs font-bold text-stone-900">
                    <span>Total Payable</span>
                    <strong class="text-emerald-800 font-serif">₹${m.totalPayable.toLocaleString()}</strong>
                  </div>
                </div>

                <!-- Payment Action Button -->
                <div class="pt-1">
                  ${
                    isPaid
                      ? `
                    <div class="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                      <span>✓ Milestone Funds Paid in Escrow</span>
                      <span class="text-[10px] text-emerald-700 font-mono">${m.paidDate || 'Paid'}</span>
                    </div>
                  `
                      : `
                    <button
                      onclick="controller.openCheckout(controller.getState().milestones[${idx}])"
                      ${isProcessing ? 'disabled' : ''}
                      class="w-full min-h-[44px] dbc-btn dbc-btn-md ${isDue ? 'dbc-btn-primary' : 'dbc-btn-secondary bg-stone-100 hover:bg-stone-200 text-stone-800'} font-bold text-xs"
                    >
                      ${isProcessing ? 'Processing Payment...' : `Pay Milestone ₹${m.totalPayable.toLocaleString()}`}
                    </button>
                  `
                  }
                </div>
              </div>
            `;
            })
            .join('')}
        </div>
      `
      }

      <!-- Simulated Checkout Modal Overlay (Mobile Friendly) -->
      ${
        isCheckoutOpen && selectedMilestone
          ? `
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 select-none">
          <div class="bg-white w-full max-w-md rounded-3xl p-6 relative shadow-2xl border border-stone-150 space-y-5 text-left text-xs font-semibold text-stone-700">
            <button
              onclick="controller.closeCheckout()"
              class="absolute top-4 right-4 h-11 w-11 flex items-center justify-center rounded-full bg-stone-50 text-stone-400 hover:text-stone-700 transition"
              aria-label="Close modal"
            >
              ✕
            </button>

            <div class="space-y-1">
              <span class="text-[9px] font-black uppercase text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                Secure Escrow Checkout
              </span>
              <h2 class="text-base font-bold text-stone-900 font-serif mt-2">
                ${selectedMilestone.milestoneName}
              </h2>
              <p class="text-[10px] text-stone-400 font-medium">Verify pricing coordinates before triggering payment lock.</p>
            </div>

            <!-- Ledger Breakdown -->
            <div class="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
              <div class="flex justify-between text-stone-600">
                <span>Milestone Value</span>
                <strong class="text-stone-900">₹${selectedMilestone.baseAmount.toLocaleString()}</strong>
              </div>
              <div class="flex justify-between text-stone-600">
                <span>1% Escrow Verification Fee</span>
                <strong class="text-stone-900">₹${selectedMilestone.platformFee.toLocaleString()}</strong>
              </div>
              <div class="flex justify-between text-stone-600 pb-2 border-b border-stone-200/50">
                <span>18% GST on Escrow Fee</span>
                <strong class="text-stone-900">₹${selectedMilestone.taxAmount.toLocaleString()}</strong>
              </div>
              <div class="flex justify-between items-center pt-1 text-sm font-bold text-stone-900">
                <span>Total Amount Due</span>
                <span class="text-lg font-extrabold text-emerald-800 font-serif">
                  ₹${selectedMilestone.totalPayable.toLocaleString()}
                </span>
              </div>
            </div>

            <div class="p-3 bg-emerald-50/60 border border-emerald-150 rounded-xl flex items-start gap-2 text-[10px] text-emerald-800 font-medium">
              <span>🛡️</span>
              <span>Funds are locked securely in DBC smart escrow until final milestone sign-off.</span>
            </div>

            <button
              onclick="controller.processPaymentSuccess()"
              ${isProcessing ? 'disabled' : ''}
              class="w-full min-h-[44px] dbc-btn dbc-btn-xl dbc-btn-primary"
            >
              ${isProcessing ? 'Locking Funds in Escrow...' : `Pay & Lock ₹${selectedMilestone.totalPayable.toLocaleString()}`}
            </button>
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;
}
