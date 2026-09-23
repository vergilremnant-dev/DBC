import { mobileProfessionalFinanceService } from '../../services/mobileProfessionalFinanceService.js';
import type { ProfessionalTransaction } from '../../types/professionalFinanceMobileTypes.js';

export interface ProfessionalTransactionDetailsScreenProps {
  transactionId: string;
  onBack?: () => void;
}

export class ProfessionalTransactionDetailsScreenController {
  private props: ProfessionalTransactionDetailsScreenProps;
  private state: {
    transaction: ProfessionalTransaction | null;
    isLoading: boolean;
    error: string | null;
  };

  constructor(props: ProfessionalTransactionDetailsScreenProps) {
    this.props = props;
    this.state = {
      transaction: null,
      isLoading: true,
      error: null,
    };
  }

  async init(): Promise<void> {
    await this.loadDetails();
  }

  async loadDetails(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const tx = await mobileProfessionalFinanceService.getProfessionalTransactionDetails(this.props.transactionId);
      this.state.transaction = tx;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load transaction details';
    } finally {
      this.state.isLoading = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderProfessionalTransactionDetailsScreen(
  controller: ProfessionalTransactionDetailsScreenController,
  onBack?: () => void
): string {
  const { transaction, isLoading, error } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Transaction Record...</p>
      </div>
    `;
  }

  if (!transaction) {
    return `
      <div class="mobile-container p-6 text-center space-y-4">
        <h2 class="text-base font-bold text-stone-800">Transaction Not Found</h2>
        ${
          onBack
            ? `<button onclick="onBack()" class="min-h-[44px] px-4 py-2 bg-stone-900 text-white font-bold rounded-xl text-xs">Return to Finance</button>`
            : ''
        }
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
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Transaction Receipt</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Transaction Details</h1>
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

      <!-- Financial Receipt Card -->
      <div class="p-5 bg-white border border-stone-200 rounded-2xl space-y-4 shadow-sm">
        <div class="flex items-center justify-between border-b border-stone-150 pb-3">
          <div>
            <span class="text-[10px] text-stone-400 font-bold uppercase block">Reference ID</span>
            <span class="text-xs font-mono font-bold text-stone-900">${transaction.transactionReference}</span>
          </div>
          <span class="dbc-badge bg-emerald-100 text-emerald-800 border-emerald-200 text-[8px] font-bold uppercase">
            ${transaction.status}
          </span>
        </div>

        <div class="p-4 bg-emerald-900 text-white rounded-xl text-center space-y-1">
          <span class="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">Disbursed Amount</span>
          <span class="text-2xl font-black">${transaction.formattedAmount}</span>
        </div>

        <div class="space-y-2 text-xs">
          <div class="flex justify-between py-1 border-b border-stone-100">
            <span class="text-stone-500 font-medium">Project Name</span>
            <span class="font-bold text-stone-800">${transaction.projectName}</span>
          </div>
          ${
            transaction.milestoneName
              ? `
            <div class="flex justify-between py-1 border-b border-stone-100">
              <span class="text-stone-500 font-medium">Stage / Milestone</span>
              <span class="font-bold text-stone-800">${transaction.milestoneName}</span>
            </div>
          `
              : ''
          }
          <div class="flex justify-between py-1 border-b border-stone-100">
            <span class="text-stone-500 font-medium">Transaction Date</span>
            <span class="font-bold text-stone-800">${transaction.date}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-stone-100">
            <span class="text-stone-500 font-medium">Disbursement Method</span>
            <span class="font-bold text-stone-800">${transaction.paymentMethod}</span>
          </div>
          ${
            transaction.invoiceNumber
              ? `
            <div class="flex justify-between py-1">
              <span class="text-stone-500 font-medium">Invoice Number</span>
              <span class="font-bold text-stone-800">${transaction.invoiceNumber}</span>
            </div>
          `
              : ''
          }
        </div>

        ${
          transaction.receiptUrl
            ? `
          <div class="pt-2">
            <a
              href="${transaction.receiptUrl}"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full min-h-[44px] flex items-center justify-center bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs transition"
            >
              Download PDF Voucher / Invoice ↗
            </a>
          </div>
        `
            : ''
        }
      </div>
    </div>
  `;
}
