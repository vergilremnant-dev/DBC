import { mobileProfessionalFinanceService } from '../../services/mobileProfessionalFinanceService.js';
import type {
  ProfessionalFinanceSummary,
  ProfessionalProjectFinancial,
  ProfessionalEarning,
  ProfessionalTransaction,
  ProfessionalPayout,
} from '../../types/professionalFinanceMobileTypes.js';

export type ProfessionalFinanceTab = 'SUMMARY' | 'PROJECTS' | 'EARNINGS' | 'TRANSACTIONS' | 'PAYOUTS';

export interface ProfessionalFinanceScreenProps {
  initialTab?: ProfessionalFinanceTab;
  onSelectProjectFinancial?: (projectId: string) => void;
  onSelectTransaction?: (transactionId: string) => void;
  onSelectPayout?: (payoutId: string) => void;
  onBack?: () => void;
}

export class ProfessionalFinanceScreenController {
  private props: ProfessionalFinanceScreenProps;
  private state: {
    activeTab: ProfessionalFinanceTab;
    summary: ProfessionalFinanceSummary | null;
    projectFinancials: ProfessionalProjectFinancial[];
    earnings: ProfessionalEarning[];
    transactions: ProfessionalTransaction[];
    payouts: ProfessionalPayout[];
    isLoading: boolean;
    error: string | null;
  };

  constructor(props: ProfessionalFinanceScreenProps) {
    this.props = props;
    this.state = {
      activeTab: props.initialTab || 'SUMMARY',
      summary: null,
      projectFinancials: [],
      earnings: [],
      transactions: [],
      payouts: [],
      isLoading: true,
      error: null,
    };
  }

  async init(): Promise<void> {
    await this.loadFinanceData();
  }

  async loadFinanceData(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const summary = await mobileProfessionalFinanceService.getProfessionalFinanceSummary();
      const projectFinancials = await mobileProfessionalFinanceService.getProfessionalProjectFinancials();
      const earnings = await mobileProfessionalFinanceService.getProfessionalEarnings();
      const transactions = await mobileProfessionalFinanceService.getProfessionalTransactions();
      const payouts = await mobileProfessionalFinanceService.getProfessionalPayouts();

      this.state.summary = summary;
      this.state.projectFinancials = projectFinancials;
      this.state.earnings = earnings;
      this.state.transactions = transactions;
      this.state.payouts = payouts;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load finance overview';
    } finally {
      this.state.isLoading = false;
    }
  }

  setTab(tab: ProfessionalFinanceTab): void {
    this.state.activeTab = tab;
  }

  getState() {
    return { ...this.state };
  }
}

export function renderProfessionalFinanceScreen(
  controller: ProfessionalFinanceScreenController,
  onSelectProjectFinancial?: (projectId: string) => void,
  onSelectTransaction?: (transactionId: string) => void,
  onSelectPayout?: (payoutId: string) => void,
  onBack?: () => void
): string {
  const { activeTab, summary, projectFinancials, earnings, transactions, payouts, isLoading, error } =
    controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Trade Partner Financials...</p>
      </div>
    `;
  }

  return `
    <div class="mobile-container p-4 space-y-5 select-none pb-24">
      <!-- Header -->
      <div class="flex items-center gap-3">
        ${
          onBack
            ? `<button onclick="onBack()" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold">←</button>`
            : ''
        }
        <div>
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Commercial & Earnings</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Trade Partner Finance Console</h1>
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

      <!-- Financial Metrics Console Header Card -->
      ${
        summary
          ? `
        <div class="p-4 bg-emerald-950 text-white rounded-2xl space-y-3 shadow-md">
          <div class="flex items-center justify-between text-xs">
            <span class="text-emerald-300 font-semibold uppercase text-[10px] tracking-wider">Total Contracted Earnings</span>
            <span class="px-2.5 py-0.5 bg-emerald-850 text-emerald-200 rounded-full font-bold text-[10px]">${summary.currency} INR</span>
          </div>

          <div class="text-3xl font-black font-serif text-emerald-400">${summary.formattedEarnings}</div>

          <div class="grid grid-cols-3 gap-2 pt-3 border-t border-emerald-900 text-center">
            <div class="p-2 bg-emerald-900/60 rounded-xl">
              <span class="text-[9px] text-emerald-300 uppercase font-bold block">Received</span>
              <span class="text-xs font-black text-white">${summary.formattedReceived}</span>
            </div>
            <div class="p-2 bg-emerald-900/60 rounded-xl">
              <span class="text-[9px] text-amber-300 uppercase font-bold block">Pending</span>
              <span class="text-xs font-black text-amber-300">${summary.formattedPending}</span>
            </div>
            <div class="p-2 bg-emerald-900/60 rounded-xl">
              <span class="text-[9px] text-emerald-300 uppercase font-bold block">Active Portfolio</span>
              <span class="text-xs font-black text-white">${summary.formattedActiveValue}</span>
            </div>
          </div>
        </div>
      `
          : ''
      }

      <!-- Finance Section Tabs -->
      <div class="flex gap-1.5 border-b border-stone-200 pb-2 overflow-x-auto">
        ${[
          { id: 'SUMMARY', label: 'Projects' },
          { id: 'EARNINGS', label: 'Earnings' },
          { id: 'TRANSACTIONS', label: 'Transactions' },
          { id: 'PAYOUTS', label: 'Payouts' },
        ]
          .map(
            (tab) => `
          <button
            onclick="controller.setTab('${tab.id}')"
            class="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
              activeTab === tab.id
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }"
          >
            ${tab.label}
          </button>
        `
          )
          .join('')}
      </div>

      <!-- Tab Content Area -->
      <div>
        ${
          activeTab === 'SUMMARY'
            ? `
          <div class="space-y-3">
            <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider">Project Financial Breakdown (${projectFinancials.length})</h3>
            ${
              projectFinancials.length === 0
                ? `<p class="text-xs text-stone-500 font-medium py-2">No active project financials available.</p>`
                : projectFinancials
                    .map(
                      (p) => `
                  <div
                    onclick="${onSelectProjectFinancial ? `onSelectProjectFinancial('${p.projectId}')` : ''}"
                    class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3 hover:border-emerald-400 cursor-pointer transition min-h-[44px]"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <h4 class="text-xs font-black text-stone-900">${p.projectName}</h4>
                        <span class="text-[10.5px] text-stone-500 font-semibold block">Client: ${p.customerName}</span>
                      </div>
                      <span class="dbc-badge bg-emerald-100 text-emerald-800 border-emerald-200 text-[8px] font-bold uppercase shrink-0">
                        ${p.financialStatus.replace('_', ' ')}
                      </span>
                    </div>

                    <div class="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                      <div class="p-2 bg-stone-50 border border-stone-150 rounded-xl">
                        <span class="text-[9px] text-stone-400 uppercase font-bold block">Contract</span>
                        <span class="font-black text-stone-900">${p.formattedContractValue}</span>
                      </div>
                      <div class="p-2 bg-emerald-50 border border-emerald-150 rounded-xl">
                        <span class="text-[9px] text-emerald-700 uppercase font-bold block">Received</span>
                        <span class="font-black text-emerald-800">${p.formattedAmountReceived}</span>
                      </div>
                      <div class="p-2 bg-amber-50 border border-amber-150 rounded-xl">
                        <span class="text-[9px] text-amber-700 uppercase font-bold block">Pending</span>
                        <span class="font-black text-amber-800">${p.formattedPendingBalance}</span>
                      </div>
                    </div>
                  </div>
                `
                    )
                    .join('')
            }
          </div>
        `
            : activeTab === 'EARNINGS'
            ? `
          <div class="space-y-3">
            <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider">Milestone Revenue & Earnings (${earnings.length})</h3>
            ${
              earnings.length === 0
                ? `<p class="text-xs text-stone-500 font-medium py-2">No milestone earnings recorded yet.</p>`
                : earnings
                    .map(
                      (e) => `
                  <div class="p-3.5 bg-white border border-stone-200 rounded-2xl space-y-2">
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <h4 class="text-xs font-bold text-stone-900">${e.milestoneName || e.projectName}</h4>
                        <span class="text-[10px] text-stone-500 font-semibold block">${e.projectName}</span>
                      </div>
                      <span class="text-xs font-black text-emerald-800">${e.formattedAmount}</span>
                    </div>

                    <div class="flex items-center justify-between text-[10px] text-stone-500 font-medium pt-1">
                      <span>Date: <strong>${e.date}</strong></span>
                      <span class="dbc-badge ${
                        e.status === 'DISBURSED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      } text-[8px] font-bold uppercase">
                        ${e.statusLabel}
                      </span>
                    </div>
                  </div>
                `
                    )
                    .join('')
            }
          </div>
        `
            : activeTab === 'TRANSACTIONS'
            ? `
          <div class="space-y-3">
            <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider">Transaction History (${transactions.length})</h3>
            ${
              transactions.length === 0
                ? `<p class="text-xs text-stone-500 font-medium py-2">No financial transactions recorded.</p>`
                : transactions
                    .map(
                      (t) => `
                  <div
                    onclick="${onSelectTransaction ? `onSelectTransaction('${t.id}')` : ''}"
                    class="p-3.5 bg-white border border-stone-200 rounded-2xl space-y-2 hover:border-emerald-400 cursor-pointer transition min-h-[44px]"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <span class="text-[9.5px] font-mono text-stone-400 font-bold">${t.transactionReference}</span>
                        <h4 class="text-xs font-bold text-stone-900">${t.projectName}</h4>
                      </div>
                      <span class="text-xs font-black text-emerald-800">${t.formattedAmount}</span>
                    </div>

                    <div class="flex items-center justify-between text-[10px] text-stone-500 font-medium pt-1">
                      <span>${t.paymentMethod}</span>
                      <span class="dbc-badge bg-emerald-100 text-emerald-800 border-emerald-200 text-[8px] font-bold uppercase">
                        ${t.status}
                      </span>
                    </div>
                  </div>
                `
                    )
                    .join('')
            }
          </div>
        `
            : activeTab === 'PAYOUTS'
            ? `
          <div class="space-y-3">
            <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider">Bank Payouts (${payouts.length})</h3>
            ${
              payouts.length === 0
                ? `<p class="text-xs text-stone-500 font-medium py-2">No payouts recorded.</p>`
                : payouts
                    .map(
                      (po) => `
                  <div
                    onclick="${onSelectPayout ? `onSelectPayout('${po.id}')` : ''}"
                    class="p-4 bg-white border border-stone-200 rounded-2xl space-y-2 hover:border-emerald-400 cursor-pointer transition min-h-[44px]"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <span class="text-[9.5px] font-mono text-stone-400 font-bold">${po.payoutReference}</span>
                        <h4 class="text-xs font-bold text-stone-900">${po.destinationAccountMasked}</h4>
                      </div>
                      <span class="text-xs font-black text-emerald-800">${po.formattedAmount}</span>
                    </div>

                    <div class="flex items-center justify-between text-[10px] text-stone-500 font-medium pt-1">
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
                    .join('')
            }
          </div>
        `
            : ''
        }
      </div>
    </div>
  `;
}
