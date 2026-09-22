import { mobileCustomerFinancialService } from '../../services/mobileCustomerFinancialService.js';
import type { MobileTransaction } from '../../types/customerFinancialMobileTypes.js';

export interface CustomerPaymentHistoryScreenProps {
  projectId: string;
  onSelectTransaction?: (transactionId: string) => void;
  onBack?: () => void;
}

export class CustomerPaymentHistoryScreenController {
  private props: CustomerPaymentHistoryScreenProps;
  private state: {
    transactions: MobileTransaction[];
    isLoading: boolean;
    error: string | null;
  };

  constructor(props: CustomerPaymentHistoryScreenProps) {
    this.props = props;
    this.state = {
      transactions: [],
      isLoading: true,
      error: null,
    };
  }

  async init(): Promise<void> {
    await this.loadHistory();
  }

  async loadHistory(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const history = await mobileCustomerFinancialService.getPaymentHistory(this.props.projectId);
      this.state.transactions = history;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load payment history';
    } finally {
      this.state.isLoading = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderCustomerPaymentHistoryScreen(
  controller: CustomerPaymentHistoryScreenController,
  onSelectTransaction?: (transactionId: string) => void,
  onBack?: () => void
): string {
  const { transactions, isLoading, error } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Payment History...</p>
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
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Financial Records</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Payment & Billing History</h1>
        </div>
      </div>

      ${
        error
          ? `
        <div class="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-800">
          ${error}
        </div>
      `
          : ''
      }

      <!-- Transactions List -->
      ${
        transactions.length === 0
          ? `
        <div class="p-8 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
          <span class="text-3xl">📜</span>
          <p class="text-xs font-bold text-stone-800">No payment records found.</p>
          <p class="text-[11px] text-stone-500 font-medium">Completed milestone transactions will be cataloged here automatically.</p>
        </div>
      `
          : `
        <div class="space-y-3">
          ${transactions
            .map(
              (tx) => `
            <div
              onclick="${onSelectTransaction ? `onSelectTransaction('${tx.id}')` : ''}"
              class="p-4 bg-white border border-stone-200 rounded-2xl space-y-2.5 hover:border-emerald-300 cursor-pointer transition min-h-[44px]"
            >
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="text-xs font-black text-stone-900">${tx.milestoneName}</h3>
                  <span class="text-[10px] font-mono text-stone-400 block mt-0.5">${tx.transactionReference}</span>
                </div>
                <span class="dbc-badge bg-emerald-100 text-emerald-800 border-emerald-200 text-[8px] uppercase font-bold">
                  ${tx.status}
                </span>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-stone-100 text-xs font-bold text-stone-800">
                <span class="text-[11px] text-stone-500 font-medium">${tx.date}</span>
                <span class="text-emerald-800 font-serif font-extrabold text-sm">₹${tx.amount.toLocaleString()}</span>
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
