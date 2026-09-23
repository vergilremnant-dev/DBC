import { mobileAdminWorkspaceService } from '../../services/mobileAdminWorkspaceService.js';
import type { MobileAdminRequest } from '../../types/adminWorkspaceMobileTypes.js';

export interface AdminRequestsScreenProps {
  onBack?: () => void;
}

export class AdminRequestsScreenController {
  private props: AdminRequestsScreenProps;
  private state: {
    requests: MobileAdminRequest[];
    isLoading: boolean;
    activeStatus: string;
    searchQuery: string;
    error: string | null;
  };

  constructor(props: AdminRequestsScreenProps) {
    this.props = props;
    this.state = {
      requests: [],
      isLoading: true,
      activeStatus: 'ALL',
      searchQuery: '',
      error: null,
    };
  }

  async init(): Promise<void> {
    await this.loadRequests();
  }

  async loadRequests(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      let items = await mobileAdminWorkspaceService.getAdminRequests();

      if (this.state.searchQuery) {
        const q = this.state.searchQuery.toLowerCase();
        items = items.filter(
          (r) =>
            r.bookingNumber.toLowerCase().includes(q) ||
            r.customerName.toLowerCase().includes(q) ||
            (r.providerName && r.providerName.toLowerCase().includes(q)) ||
            r.serviceCategory.toLowerCase().includes(q)
        );
      }

      if (this.state.activeStatus !== 'ALL') {
        items = items.filter((r) => r.status === this.state.activeStatus);
      }

      this.state.requests = items;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load project requests';
    } finally {
      this.state.isLoading = false;
    }
  }

  setStatusFilter(status: string): void {
    this.state.activeStatus = status;
    this.loadRequests();
  }

  setSearchQuery(query: string): void {
    this.state.searchQuery = query;
    this.loadRequests();
  }

  getState() {
    return { ...this.state };
  }
}

export function renderAdminRequestsScreen(
  controller: AdminRequestsScreenController,
  onBack?: () => void
): string {
  const { requests, isLoading, activeStatus, searchQuery, error } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Platform Requests...</p>
      </div>
    `;
  }

  return `
    <div class="mobile-container p-4 space-y-4 select-none pb-24">
      <!-- Header -->
      <div class="flex items-center gap-3">
        ${
          onBack
            ? `<button onclick="onBack()" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold">←</button>`
            : ''
        }
        <div>
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Operational Overview</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Project Requests (${requests.length})</h1>
        </div>
      </div>

      <!-- Search Input -->
      <div>
        <input
          type="text"
          value="${searchQuery}"
          onchange="controller.setSearchQuery(this.value)"
          placeholder="Search by request #, customer, contractor..."
          class="w-full min-h-[44px] px-3.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
        />
      </div>

      <!-- Status Filter Tabs -->
      <div class="flex gap-1.5 border-b border-stone-200 pb-2 overflow-x-auto">
        ${['ALL', 'REQUESTED', 'ACCEPTED', 'COMPLETED']
          .map(
            (s) => `
          <button
            onclick="controller.setStatusFilter('${s}')"
            class="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
              activeStatus === s
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }"
          >
            ${s}
          </button>
        `
          )
          .join('')}
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

      <!-- Requests List -->
      ${
        requests.length === 0
          ? `
        <div class="p-8 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
          <span class="text-3xl">📋</span>
          <p class="text-xs font-bold text-stone-800">No project requests found.</p>
        </div>
      `
          : `
        <div class="space-y-3">
          ${requests
            .map(
              (r) => `
            <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-2.5 shadow-sm">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <span class="text-[10px] font-mono font-bold text-stone-500">${r.bookingNumber}</span>
                  <h4 class="text-xs font-black text-stone-900">${r.serviceCategory}</h4>
                </div>
                <span class="dbc-badge ${
                  r.status === 'REQUESTED'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : r.status === 'ACCEPTED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-stone-100 text-stone-800 border-stone-200'
                } text-[8px] font-bold uppercase shrink-0">
                  ${r.statusLabel}
                </span>
              </div>

              <div class="space-y-1 text-xs">
                <div class="flex justify-between text-[11px] text-stone-600">
                  <span>Customer: <strong class="text-stone-800 font-bold">${r.customerName}</strong></span>
                  <span>Est. Budget: <strong class="text-emerald-800 font-bold">${r.budgetFormatted}</strong></span>
                </div>
                ${
                  r.providerName
                    ? `<div class="text-[11px] text-stone-600">Contractor: <strong class="text-stone-800 font-bold">${r.providerName}</strong></div>`
                    : ''
                }
              </div>

              <div class="flex items-center justify-between text-[10px] text-stone-400 font-medium pt-2 border-t border-stone-100">
                <span>Submitted: ${r.submittedDate}</span>
                <span class="text-stone-600 font-bold">Platform Managed</span>
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
