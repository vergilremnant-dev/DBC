import { mobileProfessionalWorkspaceService } from '../../services/mobileProfessionalWorkspaceService.js';
import type { MobileProfessionalRequest } from '../../types/professionalWorkspaceMobileTypes.js';

export interface ProfessionalRequestsScreenProps {
  onSelectRequest?: (requestId: string) => void;
  onBack?: () => void;
}

export class ProfessionalRequestsScreenController {
  private props: ProfessionalRequestsScreenProps;
  private state: {
    requests: MobileProfessionalRequest[];
    isLoading: boolean;
    error: string | null;
    activeFilter: 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
  };

  constructor(props: ProfessionalRequestsScreenProps) {
    this.props = props;
    this.state = {
      requests: [],
      isLoading: true,
      error: null,
      activeFilter: 'ALL',
    };
  }

  async init(): Promise<void> {
    await this.loadRequests();
  }

  async loadRequests(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const requests = await mobileProfessionalWorkspaceService.getProfessionalRequests();
      this.state.requests = requests;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load project requests';
    } finally {
      this.state.isLoading = false;
    }
  }

  setFilter(filter: 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'): void {
    this.state.activeFilter = filter;
  }

  getState() {
    return { ...this.state };
  }
}

export function renderProfessionalRequestsScreen(
  controller: ProfessionalRequestsScreenController,
  onSelectRequest?: (requestId: string) => void,
  onBack?: () => void
): string {
  const { requests, isLoading, error, activeFilter } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Customer Requests...</p>
      </div>
    `;
  }

  const filteredRequests = requests.filter((r) => {
    if (activeFilter === 'PENDING') return r.isActionable || r.status === 'REQUESTED';
    if (activeFilter === 'ACCEPTED') return r.status === 'ACCEPTED';
    if (activeFilter === 'REJECTED') return r.status === 'REJECTED';
    return true;
  });

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
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Client Engagements</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Customer Project Requests</h1>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="flex gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
        ${['ALL', 'PENDING', 'ACCEPTED', 'REJECTED']
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

      <!-- Requests Cards -->
      ${
        filteredRequests.length === 0
          ? `
        <div class="p-8 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
          <span class="text-3xl">📥</span>
          <p class="text-xs font-bold text-stone-800">No project requests found.</p>
          <p class="text-[11px] text-stone-500 font-medium">Customer project requests will appear here when clients select your business.</p>
        </div>
      `
          : `
        <div class="space-y-3">
          ${filteredRequests
            .map(
              (r) => `
            <div
              onclick="${onSelectRequest ? `onSelectRequest('${r.id}')` : ''}"
              class="p-4 bg-white border border-stone-200 rounded-2xl space-y-2.5 hover:border-emerald-400 cursor-pointer transition min-h-[44px]"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-mono text-stone-400 font-bold">${r.bookingNumber}</span>
                    <h3 class="text-xs font-black text-stone-900">${r.serviceCategory}</h3>
                  </div>
                  <span class="text-[10.5px] text-stone-500 font-semibold block mt-0.5">Customer: ${r.customerName}</span>
                </div>
                <span class="dbc-badge ${
                  r.isActionable ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                } text-[8px] font-bold uppercase shrink-0">
                  ${r.statusLabel}
                </span>
              </div>

              <div class="p-2.5 bg-stone-50 border border-stone-150 rounded-xl flex items-center justify-between text-[11px] font-semibold text-stone-700">
                <span>Budget: <strong>${r.budgetFormatted}</strong></span>
                <span>Timeline: <strong>${r.preferredTimeline}</strong></span>
              </div>

              <p class="text-[11px] text-stone-600 font-medium line-clamp-2">${r.notes}</p>
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
