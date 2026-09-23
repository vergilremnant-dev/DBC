import { mobileProfessionalFinanceService } from '../../services/mobileProfessionalFinanceService.js';
import type { ProfessionalPayout } from '../../types/professionalFinanceMobileTypes.js';

export interface ProfessionalPayoutsScreenProps {
  onSelectPayout?: (payoutId: string) => void;
  onBack?: () => void;
}

export class ProfessionalPayoutsScreenController {
  private props: ProfessionalPayoutsScreenProps;
  private state: {
    payouts: ProfessionalPayout[];
    selectedPayout: ProfessionalPayout | null;
    isLoading: boolean;
    error: string | null;
  };

  constructor(props: ProfessionalPayoutsScreenProps) {
    this.props = props;
    this.state = {
      payouts: [],
      selectedPayout: null,
      isLoading: true,
      error: null,
    };
  }

  async init(): Promise<void> {
    await this.loadPayouts();
  }

  async loadPayouts(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const items = await mobileProfessionalFinanceService.getProfessionalPayouts();
      this.state.payouts = items;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load payouts';
    } finally {
      this.state.isLoading = false;
    }
  }

  selectPayout(payoutId: string): void {
    const found = this.state.payouts.find((p) => p.id === payoutId);
    if (found) {
      this.state.selectedPayout = found;
      if (this.props.onSelectPayout) this.props.onSelectPayout(payoutId);
    }
  }

  closePayoutDetails(): void {
    this.state.selectedPayout = null;
  }

  getState() {
    return { ...this.state };
  }
}

export function renderProfessionalPayoutsScreen(
  controller: ProfessionalPayoutsScreenController,
  onSelectPayout?: (payoutId: string) => void,
  onBack?: () => void
): string {
  const { payouts, selectedPayout, isLoading, error } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Bank Payouts...</p>
      </div>
    `;
  }

  return `
    <div class="mobile-container p-4 space-y-5 select-none pb-20">
      <!-- Header -->
      <div class="flex items-center gap-3">
        ${
          onBack
            ? `<button onclick="onBack()" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold">←</button>`
            : ''
        }
        <div>
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Settlements & Disbursements</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Bank Payouts</h1>
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
        payouts.length === 0
          ? `
        <div class="p-8 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
          <span class="text-3xl">🏦</span>
          <p class="text-xs font-bold text-stone-800">No bank payouts recorded.</p>
        </div>
      `
          : `
        <div class="space-y-3">
          ${payouts
            .map(
              (po) => `
            <div
              onclick="controller.selectPayout('${po.id}')"
              class="p-4 bg-white border border-stone-200 rounded-2xl space-y-2 hover:border-emerald-400 cursor-pointer transition min-h-[44px]"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <span class="text-[9.5px] font-mono text-stone-400 font-bold">${po.payoutReference}</span>
                  <h4 class="text-xs font-bold text-stone-900">${po.destinationAccountMasked}</h4>
                </div>
                <span class="text-sm font-black text-emerald-800">${po.formattedAmount}</span>
              </div>

              <div class="flex items-center justify-between text-[10px] text-stone-500 font-medium pt-1 border-t border-stone-100">
                <span>Date: <strong>${po.date}</strong></span>
                <span class="dbc-badge ${
                  po.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                } text-[8px] font-bold uppercase">
                  ${po.statusLabel}
                </span>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      `
      }

      <!-- Selected Payout Details Modal -->
      ${
        selectedPayout
          ? `
        <div class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4">
            <div class="flex items-center justify-between border-b border-stone-150 pb-2">
              <h3 class="text-sm font-black text-stone-900">Payout Details</h3>
              <button onclick="controller.closePayoutDetails()" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-500 font-bold">✕</button>
            </div>

            <div class="p-3.5 bg-emerald-900 text-white rounded-xl text-center space-y-1">
              <span class="text-[10px] text-emerald-300 font-bold uppercase block">Payout Amount</span>
              <div class="text-2xl font-black">${selectedPayout.formattedAmount}</div>
            </div>

            <div class="space-y-2 text-xs">
              <div class="flex justify-between py-1 border-b border-stone-100">
                <span class="text-stone-500 font-medium">Payout Reference</span>
                <span class="font-mono font-bold text-stone-800">${selectedPayout.payoutReference}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-stone-100">
                <span class="text-stone-500 font-medium">Destination Bank</span>
                <span class="font-bold text-stone-800">${selectedPayout.destinationAccountMasked}</span>
              </div>
              <div class="flex justify-between py-1 border-b border-stone-100">
                <span class="text-stone-500 font-medium">Disbursement Status</span>
                <span class="font-bold text-emerald-800">${selectedPayout.statusLabel}</span>
              </div>
              ${
                selectedPayout.relatedProjectName
                  ? `
                <div class="flex justify-between py-1">
                  <span class="text-stone-500 font-medium">Project</span>
                  <span class="font-bold text-stone-800">${selectedPayout.relatedProjectName}</span>
                </div>
              `
                  : ''
              }
            </div>

            <button
              onclick="controller.closePayoutDetails()"
              class="w-full min-h-[44px] py-2 bg-stone-900 text-white font-bold rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;
}
