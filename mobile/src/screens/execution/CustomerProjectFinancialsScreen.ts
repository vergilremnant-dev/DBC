import { mobileCustomerFinancialService } from '../../services/mobileCustomerFinancialService.js';
import type { MobileProjectFinancialSummary } from '../../types/customerFinancialMobileTypes.js';

export interface CustomerProjectFinancialsScreenProps {
  projectId: string;
  onNavigateToMilestones?: (projectId: string) => void;
  onNavigateToHistory?: (projectId: string) => void;
  onBack?: () => void;
}

export class CustomerProjectFinancialsScreenController {
  private props: CustomerProjectFinancialsScreenProps;
  private state: {
    summary: MobileProjectFinancialSummary | null;
    isLoading: boolean;
    error: string | null;
    isBreakdownExpanded: boolean;
  };

  constructor(props: CustomerProjectFinancialsScreenProps) {
    this.props = props;
    this.state = {
      summary: null,
      isLoading: true,
      error: null,
      isBreakdownExpanded: false,
    };
  }

  async init(): Promise<void> {
    await this.loadFinancialSummary();
  }

  async loadFinancialSummary(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const summary = await mobileCustomerFinancialService.getProjectFinancialSummary(this.props.projectId);
      this.state.summary = summary;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load project financials';
      if (
        this.state.error.includes('UNAUTHORIZED') ||
        this.state.error.includes('ACCESS_DENIED') ||
        this.state.error.includes('NOT_FOUND')
      ) {
        this.state.summary = null;
      }
    } finally {
      this.state.isLoading = false;
    }
  }

  toggleBreakdown(): void {
    this.state.isBreakdownExpanded = !this.state.isBreakdownExpanded;
  }

  getState() {
    return { ...this.state };
  }
}

export function renderCustomerProjectFinancialsScreen(
  controller: CustomerProjectFinancialsScreenController,
  onNavigateToMilestones?: (projectId: string) => void,
  onNavigateToHistory?: (projectId: string) => void,
  onBack?: () => void
): string {
  const { summary, isLoading, error, isBreakdownExpanded } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Project Financials...</p>
      </div>
    `;
  }

  if (error || !summary) {
    return `
      <div class="mobile-container p-4 space-y-4">
        <div class="flex items-center gap-3">
          <button onclick="${onBack ? 'onBack()' : 'history.back()'}" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold">
            ←
          </button>
          <h1 class="text-base font-bold text-stone-900 font-serif">Project Financials</h1>
        </div>
        <div class="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <span class="text-2xl">⚠️</span>
          <p class="text-xs font-bold text-rose-800">${error || 'Unable to load financial details.'}</p>
          <button onclick="controller.loadFinancialSummary()" class="min-h-[44px] px-4 py-2 bg-rose-700 text-white font-bold text-xs rounded-xl hover:bg-rose-800">
            Retry Financial Lookup
          </button>
        </div>
      </div>
    `;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '<span class="dbc-badge bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">ALL SETTLED</span>';
      case 'PAYMENT_DUE':
        return '<span class="dbc-badge bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold">PAYMENT DUE</span>';
      case 'PARTIALLY_PAID':
        return '<span class="dbc-badge bg-blue-100 text-blue-800 border-blue-200 text-[10px] font-bold">PARTIALLY PAID</span>';
      case 'UNPAID':
        return '<span class="dbc-badge bg-stone-100 text-stone-700 border-stone-300 text-[10px] font-bold">UNPAID</span>';
      default:
        return '<span class="dbc-badge bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">UP TO DATE</span>';
    }
  };

  return `
    <div class="mobile-container p-4 space-y-5 select-none">
      <!-- Top Navigation Bar -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="${onBack ? 'onBack()' : 'history.back()'}" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold" aria-label="Go Back">
            ←
          </button>
          <div>
            <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Financial Overview</span>
            <h1 class="text-base font-bold text-stone-900 font-serif truncate max-w-[200px]">${summary.projectName}</h1>
          </div>
        </div>
        ${getStatusBadge(summary.paymentStatus)}
      </div>

      <!-- Financial Summary Dashboard Cards -->
      <div class="p-5 bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-3xl space-y-4 shadow-xl border border-stone-700">
        <span class="text-[9px] font-black uppercase tracking-wider text-emerald-400">Total Customer Payable</span>
        <div class="text-3xl font-black font-serif tracking-tight text-white">
          ₹${summary.totalCustomerPayable.toLocaleString()}
        </div>

        <div class="grid grid-cols-2 gap-3 pt-3 border-t border-stone-700/60">
          <div class="space-y-0.5">
            <span class="text-[9px] font-bold uppercase text-stone-400">Amount Paid</span>
            <span class="text-base font-extrabold text-emerald-400 block">₹${summary.amountPaid.toLocaleString()}</span>
          </div>
          <div class="space-y-0.5">
            <span class="text-[9px] font-bold uppercase text-stone-400">Remaining Balance</span>
            <span class="text-base font-extrabold text-amber-400 block">₹${summary.remainingBalance.toLocaleString()}</span>
          </div>
        </div>

        <div class="pt-2 text-[10px] text-stone-400 flex justify-between font-semibold">
          <span>Milestones Paid: <strong>${summary.paidMilestoneCount} / ${summary.milestoneCount}</strong></span>
          <span>Escrow Protected</span>
        </div>
      </div>

      <!-- Expandable Financial Breakdown Accordion -->
      <div class="dbc-card space-y-3">
        <button
          onclick="controller.toggleBreakdown()"
          class="w-full flex items-center justify-between text-left min-h-[44px]"
        >
          <div class="flex items-center gap-2">
            <span class="text-base">📋</span>
            <h3 class="text-xs font-black uppercase tracking-wider text-stone-900">Commercial Payment Breakdown</h3>
          </div>
          <span class="text-stone-400 font-bold text-sm">${isBreakdownExpanded ? '▲' : '▼'}</span>
        </button>

        ${
          isBreakdownExpanded
            ? `
          <div class="space-y-2.5 pt-2 border-t border-stone-200/60 text-xs font-semibold text-stone-700">
            <div class="flex justify-between">
              <span>Base Project Quotation Value</span>
              <strong class="text-stone-900">₹${summary.totalProjectAmount.toLocaleString()}</strong>
            </div>
            <div class="flex justify-between text-stone-600">
              <span>${summary.breakdown.feeDescription}</span>
              <strong class="text-stone-900">₹${summary.totalPlatformFee.toLocaleString()}</strong>
            </div>
            <div class="flex justify-between text-stone-600 pb-2 border-b border-stone-200/40">
              <span>${summary.breakdown.taxDescription}</span>
              <strong class="text-stone-900">₹${summary.totalTaxAmount.toLocaleString()}</strong>
            </div>
            <div class="flex justify-between pt-1 text-sm font-bold text-stone-900">
              <span>Total Customer Payable</span>
              <strong class="text-emerald-800 font-serif">₹${summary.totalCustomerPayable.toLocaleString()}</strong>
            </div>
          </div>
        `
            : ''
        }
      </div>

      <!-- DBC Escrow Trust Assurance Card -->
      <div class="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
        <span class="text-emerald-700 text-base mt-0.5">🛡️</span>
        <div class="space-y-1">
          <strong class="text-xs font-bold text-emerald-900 block">DBC Escrow Protection Guarantee</strong>
          <p class="text-[11px] text-emerald-800 font-medium leading-relaxed">
            All payments are held securely in DBC smart escrow. Funds are released to the contractor only upon your milestone approval sign-off.
          </p>
        </div>
      </div>

      <!-- Quick Action Navigation CTAs -->
      <div class="space-y-2 pt-1">
        <button
          onclick="${onNavigateToMilestones ? `onNavigateToMilestones('${summary.projectId}')` : ''}"
          class="w-full min-h-[44px] dbc-btn dbc-btn-xl dbc-btn-primary flex items-center justify-between"
        >
          <span>Milestone Payment Schedule</span>
          <span class="font-bold">→</span>
        </button>

        <button
          onclick="${onNavigateToHistory ? `onNavigateToHistory('${summary.projectId}')` : ''}"
          class="w-full min-h-[44px] dbc-btn dbc-btn-xl dbc-btn-secondary bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 flex items-center justify-between"
        >
          <span>Payment History & Receipts</span>
          <span class="font-bold">→</span>
        </button>
      </div>
    </div>
  `;
}
