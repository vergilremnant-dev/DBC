import { mobileProfessionalFinanceService } from '../../services/mobileProfessionalFinanceService.js';
import type { ProfessionalEarning } from '../../types/professionalFinanceMobileTypes.js';

export interface ProfessionalEarningsScreenProps {
  onBack?: () => void;
}

export class ProfessionalEarningsScreenController {
  private props: ProfessionalEarningsScreenProps;
  private state: {
    earnings: ProfessionalEarning[];
    isLoading: boolean;
    error: string | null;
  };

  constructor(props: ProfessionalEarningsScreenProps) {
    this.props = props;
    this.state = {
      earnings: [],
      isLoading: true,
      error: null,
    };
  }

  async init(): Promise<void> {
    await this.loadEarnings();
  }

  async loadEarnings(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const items = await mobileProfessionalFinanceService.getProfessionalEarnings();
      this.state.earnings = items;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load earnings';
    } finally {
      this.state.isLoading = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderProfessionalEarningsScreen(
  controller: ProfessionalEarningsScreenController,
  onBack?: () => void
): string {
  const { earnings, isLoading, error } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Milestone Earnings...</p>
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
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Milestone Revenue</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Trade Partner Earnings</h1>
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
        earnings.length === 0
          ? `
        <div class="p-8 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
          <span class="text-3xl">💰</span>
          <p class="text-xs font-bold text-stone-800">No earnings recorded yet.</p>
        </div>
      `
          : `
        <div class="space-y-3">
          ${earnings
            .map(
              (e) => `
            <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-2 shadow-sm">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h4 class="text-xs font-black text-stone-900">${e.milestoneName || e.projectName}</h4>
                  <span class="text-[10.5px] text-stone-500 font-semibold block">${e.projectName}</span>
                </div>
                <span class="text-sm font-black text-emerald-800">${e.formattedAmount}</span>
              </div>

              <div class="flex items-center justify-between text-[10.5px] text-stone-500 font-medium pt-1 border-t border-stone-100">
                <span>Release Date: <strong>${e.date}</strong></span>
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
            .join('')}
        </div>
      `
      }
    </div>
  `;
}
