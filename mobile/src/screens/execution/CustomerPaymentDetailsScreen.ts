import { mobileCustomerFinancialService } from '../../services/mobileCustomerFinancialService.js';
import type { MobileTransaction } from '../../types/customerFinancialMobileTypes.js';

export interface CustomerPaymentDetailsScreenProps {
  transactionId: string;
  onBack?: () => void;
}

export class CustomerPaymentDetailsScreenController {
  private props: CustomerPaymentDetailsScreenProps;
  private state: {
    transaction: MobileTransaction | null;
    isLoading: boolean;
    error: string | null;
    receiptMessage: string | null;
  };

  constructor(props: CustomerPaymentDetailsScreenProps) {
    this.props = props;
    this.state = {
      transaction: null,
      isLoading: true,
      error: null,
      receiptMessage: null,
    };
  }

  async init(): Promise<void> {
    await this.loadTransactionDetails();
  }

  async loadTransactionDetails(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const tx = await mobileCustomerFinancialService.getPaymentDetails(this.props.transactionId);
      this.state.transaction = tx;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load payment details';
    } finally {
      this.state.isLoading = false;
    }
  }

  openReceipt(): void {
    if (!this.state.transaction) return;
    this.state.receiptMessage = `Downloading Invoice & Escrow Receipt (${this.state.transaction.invoiceNumber || 'INV-DBC'}). Link: ${this.state.transaction.receiptUrl}`;
  }

  clearReceiptMessage(): void {
    this.state.receiptMessage = null;
  }

  getState() {
    return { ...this.state };
  }
}

export function renderCustomerPaymentDetailsScreen(
  controller: CustomerPaymentDetailsScreenController,
  onBack?: () => void
): string {
  const { transaction, isLoading, error, receiptMessage } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Transaction Details...</p>
      </div>
    `;
  }

  if (error || !transaction) {
    return `
      <div class="mobile-container p-4 space-y-4">
        <div class="flex items-center gap-3">
          <button onclick="${onBack ? 'onBack()' : 'history.back()'}" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold">
            ←
          </button>
          <h1 class="text-base font-bold text-stone-900 font-serif">Payment Record</h1>
        </div>
        <div class="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2">
          <p class="text-xs font-bold text-rose-800">${error || 'Transaction record not found.'}</p>
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
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Transaction Receipt</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">${transaction.invoiceNumber || 'Payment Record'}</h1>
        </div>
      </div>

      ${
        receiptMessage
          ? `
        <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
          <strong class="text-xs font-bold text-emerald-900 block">Receipt Access Ready</strong>
          <p class="text-[11px] text-emerald-800 font-medium">${receiptMessage}</p>
          <button onclick="controller.clearReceiptMessage()" class="text-[10px] font-bold text-emerald-700 underline pt-1">
            Dismiss
          </button>
        </div>
      `
          : ''
      }

      <!-- Detailed Receipt Card -->
      <div class="p-5 bg-white border border-stone-200 rounded-3xl space-y-4 shadow-sm">
        <div class="flex items-center justify-between pb-3 border-b border-stone-150">
          <div class="space-y-0.5">
            <span class="text-[8px] font-black uppercase text-stone-400 tracking-wider">Transaction Reference</span>
            <strong class="text-xs font-mono font-bold text-stone-900 block">${transaction.transactionReference}</strong>
          </div>
          <span class="dbc-badge bg-emerald-100 text-emerald-800 border-emerald-200 text-[9px] font-bold uppercase">
            ${transaction.status}
          </span>
        </div>

        <div class="space-y-3 text-xs font-semibold text-stone-700">
          <div class="flex justify-between">
            <span class="text-stone-500">Payment Target</span>
            <strong class="text-stone-900 truncate max-w-[180px]">${transaction.milestoneName}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-stone-500">Project</span>
            <strong class="text-stone-900 truncate max-w-[180px]">${transaction.projectName || 'DBC Construction'}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-stone-500">Billing Date</span>
            <strong class="text-stone-900">${transaction.date}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-stone-500">Payment Method</span>
            <strong class="text-stone-900">${transaction.paymentMethod || 'DBC Escrow'}</strong>
          </div>
          <div class="flex justify-between items-center pt-3 border-t border-stone-150 text-sm font-bold text-stone-900">
            <span>Total Paid</span>
            <strong class="text-xl font-extrabold text-emerald-800 font-serif">₹${transaction.amount.toLocaleString()}</strong>
          </div>
        </div>

        <!-- Receipt Action Button -->
        <button
          onclick="controller.openReceipt()"
          class="w-full min-h-[44px] dbc-btn dbc-btn-xl dbc-btn-primary font-bold text-xs"
        >
          View / Download Receipt & Invoice
        </button>
      </div>

      <!-- Trust Note -->
      <div class="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex items-start gap-2.5 text-[10.5px] text-stone-600 font-medium">
        <span>🛡️</span>
        <span>Payment details are recorded on server-backed ledger. Sensitive card credentials are never stored.</span>
      </div>
    </div>
  `;
}
