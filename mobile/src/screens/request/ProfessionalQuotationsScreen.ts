import { mobileProfessionalQuotationService } from '../../services/mobileProfessionalQuotationService.js';
import type { MobileQuotationItem, MobileQuotationStatus } from '../../types/professionalQuotationMobileTypes.js';

export interface ProfessionalQuotationsScreenProps {
  requirementId?: number;
  onSelectQuotation?: (quotationId: number) => void;
  onCreateQuotation?: (requirementId?: number) => void;
  onBack?: () => void;
}

export class ProfessionalQuotationsScreenController {
  private props: ProfessionalQuotationsScreenProps;
  private state: {
    quotations: MobileQuotationItem[];
    isLoading: boolean;
    error: string | null;
    activeFilter: 'ALL' | 'DRAFT' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
  };

  constructor(props: ProfessionalQuotationsScreenProps) {
    this.props = props;
    this.state = {
      quotations: [],
      isLoading: true,
      error: null,
      activeFilter: 'ALL',
    };
  }

  async init(): Promise<void> {
    await this.loadQuotations();
  }

  async loadQuotations(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const items = await mobileProfessionalQuotationService.getProfessionalQuotations({
        requirementId: this.props.requirementId,
      });
      this.state.quotations = items;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load quotations';
    } finally {
      this.state.isLoading = false;
    }
  }

  setFilter(filter: 'ALL' | 'DRAFT' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED'): void {
    this.state.activeFilter = filter;
  }

  getState() {
    return { ...this.state };
  }
}

export function renderProfessionalQuotationsScreen(
  controller: ProfessionalQuotationsScreenController,
  onSelectQuotation?: (quotationId: number) => void,
  onCreateQuotation?: (requirementId?: number) => void,
  onBack?: () => void
): string {
  const { quotations, isLoading, error, activeFilter } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Quotations & Proposals...</p>
      </div>
    `;
  }

  const filteredQuotations = quotations.filter((q) => {
    if (activeFilter === 'DRAFT') return q.status === 'DRAFT';
    if (activeFilter === 'SUBMITTED') return q.status === 'SUBMITTED' || q.status === 'VIEWED' || q.status === 'UNDER_REVIEW' || q.status === 'NEGOTIATION' || q.status === 'REVISED';
    if (activeFilter === 'ACCEPTED') return q.status === 'ACCEPTED';
    if (activeFilter === 'REJECTED') return q.status === 'REJECTED';
    return true;
  });

  return `
    <div class="mobile-container p-4 space-y-5 select-none">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          ${
            onBack
              ? `<button onclick="onBack()" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold">←</button>`
              : ''
          }
          <div>
            <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Proposals & Bids</span>
            <h1 class="text-base font-bold text-stone-900 font-serif">Quotation Management</h1>
          </div>
        </div>
        ${
          onCreateQuotation
            ? `<button onclick="onCreateQuotation()" class="min-h-[44px] px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                <span>+</span> New Proposal
              </button>`
            : ''
        }
      </div>

      <!-- Filter Tabs -->
      <div class="flex gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
        ${['ALL', 'DRAFT', 'SUBMITTED', 'ACCEPTED', 'REJECTED']
          .map(
            (f) => `
          <button
            onclick="controller.setFilter('${f}')"
            class="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
              activeFilter === f
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }"
          >
            ${f}
          </button>
        `
          )
          .join('')}
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

      <!-- Quotation List -->
      ${
        filteredQuotations.length === 0
          ? `
        <div class="p-8 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
          <span class="text-3xl">📋</span>
          <p class="text-xs font-bold text-stone-800">No quotations found in this category.</p>
          <p class="text-[11px] text-stone-500 font-medium">Create a formal proposal for accepted client requests to outline scope, pricing and timeline.</p>
        </div>
      `
          : `
        <div class="space-y-3">
          ${filteredQuotations
            .map(
              (q) => `
            <div
              onclick="${onSelectQuotation ? `onSelectQuotation(${q.id})` : ''}"
              class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3 hover:border-emerald-400 cursor-pointer transition min-h-[44px]"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <span class="text-[10px] font-mono text-stone-400 font-bold">Q-#${q.id}</span>
                  <h3 class="text-xs font-black text-stone-900">${q.requirementTitle}</h3>
                  <span class="text-[10.5px] text-stone-500 font-semibold block mt-0.5">Client: ${q.customerName}</span>
                </div>
                <span class="dbc-badge ${
                  q.status === 'ACCEPTED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : q.status === 'REJECTED' || q.status === 'WITHDRAWN'
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : q.status === 'DRAFT'
                    ? 'bg-stone-100 text-stone-700 border-stone-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                } text-[8px] font-bold uppercase shrink-0">
                  ${q.statusLabel}
                </span>
              </div>

              <div class="p-3 bg-stone-50 border border-stone-150 rounded-xl flex items-center justify-between text-xs font-bold text-stone-800">
                <div>
                  <span class="text-[10px] text-stone-400 uppercase font-bold block">Total Amount</span>
                  <span class="text-emerald-800 text-sm font-black">${q.totalAmountFormatted}</span>
                </div>
                <div class="text-right">
                  <span class="text-[10px] text-stone-400 uppercase font-bold block">Pricing Model</span>
                  <span class="text-stone-700 font-semibold text-[11px]">${q.priceModel.replace('_', ' ')}</span>
                </div>
              </div>

              <div class="flex items-center justify-between text-[11px] text-stone-500 font-medium pt-1">
                <span>Duration: <strong>${q.estimatedDurationDays} Days</strong></span>
                <span>Updated: <strong>${q.updatedAt}</strong></span>
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
