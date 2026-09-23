import { mobileProfessionalFinanceService } from '../../services/mobileProfessionalFinanceService.js';
import type { ProfessionalTransaction } from '../../types/professionalFinanceMobileTypes.js';

export interface ProfessionalTransactionHistoryScreenProps {
  onSelectTransaction?: (transactionId: string) => void;
  onBack?: () => void;
}

export class ProfessionalTransactionHistoryScreenController {
  private props: ProfessionalTransactionHistoryScreenProps;
  private state: {
    transactions: ProfessionalTransaction[];
    isLoading: boolean;
    error: string | null;
  };

  constructor(props: ProfessionalTransactionHistoryScreenProps) {
    this.props = props;
    this.state = {
      transactions: [],
      isLoading: true,
      error: null,
    };
  }

  async init(): Promise<void> {
    await this.loadTransactions();
  }

  async loadTransactions(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const items = await mobileProfessionalFinanceService.getProfessionalTransactions();
      this.state.transactions = items;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load transactions';
    } finally {
      this.state.isLoading = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderProfessionalTransactionHistoryScreen(
  controller: ProfessionalTransactionHistoryScreenController,
  onSelectTransaction?: (transactionId: string) => void,
  onBack?: () => void
): string {
  const { transactions, isLoading, error } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Transaction History...</p>
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
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Financial Ledger</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Transaction History</h1>
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
        transactions.length === 0
          ? `
        <div class="p-8 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
          <span class="text-3xl">🧾</span>
          <p class="text-xs font-bold text-stone-800">No transactions recorded.</p>
        </div>
      `
          : `
        <div class="space-y-3">
          ${transactions
            .map(
              (t) => `
            <div
              onclick="${onSelectTransaction ? `onSelectTransaction('${t.id}')` : ''}"
              class="p-4 bg-white border border-stone-200 rounded-2xl space-y-2 hover:border-emerald-400 cursor-pointer transition min-h-[44px]"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <span class="text-[9.5px] font-mono text-stone-400 font-bold">${t.transactionReference}</span>
                  <h4 class="text-xs font-bold text-stone-900">${t.projectName}</h4>
                </div>
                <span class="text-sm font-black text-emerald-800">${t.formattedAmount}</span>
              </div>

              <div class="flex items-center justify-between text-[10.5px] text-stone-500 font-medium pt-1 border-t border-stone-100">
                <span>Method: <strong>${t.paymentMethod}</strong></span>
                <span class="dbc-badge bg-emerald-100 text-emerald-800 border-emerald-200 text-[8px] font-bold uppercase">
                  ${t.status}
                </span>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      `
      }
    </div>
  `;
}
