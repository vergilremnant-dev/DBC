import { mobileProfessionalWorkspaceService } from '../../services/mobileProfessionalWorkspaceService.js';
import type { MobileProfessionalLead } from '../../types/professionalWorkspaceMobileTypes.js';

export interface ProfessionalLeadsScreenProps {
  onBack?: () => void;
  onExpressInterest?: (leadId: string) => void;
}

export class ProfessionalLeadsScreenController {
  private props: ProfessionalLeadsScreenProps;
  private state: {
    leads: MobileProfessionalLead[];
    isLoading: boolean;
    error: string | null;
    actionMessage: string | null;
  };

  constructor(props: ProfessionalLeadsScreenProps) {
    this.props = props;
    this.state = {
      leads: [],
      isLoading: true,
      error: null,
      actionMessage: null,
    };
  }

  async init(): Promise<void> {
    await this.loadLeads();
  }

  async loadLeads(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const leads = await mobileProfessionalWorkspaceService.getProfessionalLeads();
      this.state.leads = leads;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load open leads';
    } finally {
      this.state.isLoading = false;
    }
  }

  expressInterest(leadId: string): void {
    const lead = this.state.leads.find((l) => l.id === leadId);
    if (!lead) return;
    this.state.actionMessage = `Interest expressed for "${lead.title}". Customer notified!`;
    if (this.props.onExpressInterest) {
      this.props.onExpressInterest(leadId);
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderProfessionalLeadsScreen(
  controller: ProfessionalLeadsScreenController,
  onBack?: () => void
): string {
  const { leads, isLoading, error, actionMessage } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Marketplace Leads...</p>
      </div>
    `;
  }

  return `
    <div class="mobile-container p-4 space-y-5 select-none">
      <!-- Header -->
      <div class="flex items-center gap-3">
        ${
          onBack
            ? `<button onclick="onBack()" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold">←</button>`
            : ''
        }
        <div>
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Public Marketplace</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Open Project Leads</h1>
        </div>
      </div>

      ${
        actionMessage
          ? `
        <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5">
          <span class="text-emerald-700 text-base">✓</span>
          <p class="text-xs font-bold text-emerald-900">${actionMessage}</p>
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

      <!-- Leads Cards List -->
      ${
        leads.length === 0
          ? `
        <div class="p-8 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
          <span class="text-3xl">💼</span>
          <p class="text-xs font-bold text-stone-800">No open leads matching your trade.</p>
          <p class="text-[11px] text-stone-500 font-medium">Relevant project requirements will appear here when posted by customers.</p>
        </div>
      `
          : `
        <div class="space-y-3">
          ${leads
            .map(
              (l) => `
            <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3 hover:border-emerald-400 transition">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <span class="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">${l.category}</span>
                  <h3 class="text-xs font-black text-stone-900 mt-1">${l.title}</h3>
                </div>
                <span class="text-[10px] text-stone-400 font-semibold shrink-0">${l.postedDate}</span>
              </div>

              <div class="p-2.5 bg-stone-50 border border-stone-150 rounded-xl flex items-center justify-between text-[11px] font-semibold text-stone-700">
                <span>Location: <strong>${l.location}</strong></span>
                <span>Budget: <strong>${l.budgetFormatted}</strong></span>
              </div>

              <button
                onclick="controller.expressInterest('${l.id}')"
                class="w-full min-h-[44px] dbc-btn dbc-btn-md dbc-btn-primary font-bold text-xs"
              >
                Express Interest & Submit Proposal →
              </button>
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
