import { mobileProfessionalFinanceService } from '../../services/mobileProfessionalFinanceService.js';
import type { ProfessionalProjectFinancial } from '../../types/professionalFinanceMobileTypes.js';

export interface ProfessionalProjectFinancialsScreenProps {
  projectId?: string;
  onBack?: () => void;
}

export class ProfessionalProjectFinancialsScreenController {
  private props: ProfessionalProjectFinancialsScreenProps;
  private state: {
    financials: ProfessionalProjectFinancial[];
    isLoading: boolean;
    error: string | null;
  };

  constructor(props: ProfessionalProjectFinancialsScreenProps) {
    this.props = props;
    this.state = {
      financials: [],
      isLoading: true,
      error: null,
    };
  }

  async init(): Promise<void> {
    await this.loadFinancials();
  }

  async loadFinancials(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const items = await mobileProfessionalFinanceService.getProfessionalProjectFinancials(this.props.projectId);
      this.state.financials = items;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load project financials';
    } finally {
      this.state.isLoading = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderProfessionalProjectFinancialsScreen(
  controller: ProfessionalProjectFinancialsScreenController,
  onBack?: () => void
): string {
  const { financials, isLoading, error } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Project Financial Breakdown...</p>
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
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Project Commercials</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Project Financials Breakdown</h1>
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
        financials.length === 0
          ? `
        <div class="p-8 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
          <span class="text-3xl">📊</span>
          <p class="text-xs font-bold text-stone-800">No project financials available.</p>
        </div>
      `
          : `
        <div class="space-y-4">
          ${financials
            .map(
              (p) => `
            <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3 shadow-sm">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <span class="text-[9.5px] font-mono text-stone-400 font-bold">PROJ-#${p.projectId}</span>
                  <h3 class="text-xs font-black text-stone-900">${p.projectName}</h3>
                  <span class="text-[10.5px] text-stone-500 font-semibold block">Client: ${p.customerName}</span>
                </div>
                <span class="dbc-badge bg-emerald-100 text-emerald-800 border-emerald-200 text-[8px] font-bold uppercase shrink-0">
                  ${p.financialStatus.replace('_', ' ')}
                </span>
              </div>

              <!-- Contract Financial Breakdown Table -->
              <div class="p-3 bg-stone-50 border border-stone-150 rounded-xl space-y-2 text-xs">
                <div class="flex items-center justify-between border-b border-stone-200 pb-1.5">
                  <span class="text-stone-500 font-medium">Total Contract Value</span>
                  <span class="font-black text-stone-900">${p.formattedContractValue}</span>
                </div>
                <div class="flex items-center justify-between border-b border-stone-200 pb-1.5">
                  <span class="text-emerald-700 font-medium">Amount Received / Settled</span>
                  <span class="font-black text-emerald-800">${p.formattedAmountReceived}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-amber-700 font-medium">Remaining Pending Balance</span>
                  <span class="font-black text-amber-800">${p.formattedPendingBalance}</span>
                </div>
              </div>

              <div class="flex items-center justify-between text-[10.5px] text-stone-500 font-semibold pt-1">
                <span>Milestones: <strong>${p.completedMilestoneCount} of ${p.milestoneCount} Completed</strong></span>
                <span class="text-emerald-800 font-bold">Escrow Protected</span>
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
