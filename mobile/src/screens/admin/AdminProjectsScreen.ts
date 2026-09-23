import { mobileAdminWorkspaceService } from '../../services/mobileAdminWorkspaceService.js';
import type { MobileAdminProject } from '../../types/adminWorkspaceMobileTypes.js';

export interface AdminProjectsScreenProps {
  onBack?: () => void;
}

export class AdminProjectsScreenController {
  private props: AdminProjectsScreenProps;
  private state: {
    projects: MobileAdminProject[];
    isLoading: boolean;
    activeStatus: string;
    searchQuery: string;
    error: string | null;
  };

  constructor(props: AdminProjectsScreenProps) {
    this.props = props;
    this.state = {
      projects: [],
      isLoading: true,
      activeStatus: 'ALL',
      searchQuery: '',
      error: null,
    };
  }

  async init(): Promise<void> {
    await this.loadProjects();
  }

  async loadProjects(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      let items = await mobileAdminWorkspaceService.getAdminProjects();

      if (this.state.searchQuery) {
        const q = this.state.searchQuery.toLowerCase();
        items = items.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.customerName.toLowerCase().includes(q) ||
            p.providerName.toLowerCase().includes(q)
        );
      }

      if (this.state.activeStatus !== 'ALL') {
        items = items.filter((p) => p.status === this.state.activeStatus);
      }

      this.state.projects = items;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load platform projects';
    } finally {
      this.state.isLoading = false;
    }
  }

  setStatusFilter(status: string): void {
    this.state.activeStatus = status;
    this.loadProjects();
  }

  setSearchQuery(query: string): void {
    this.state.searchQuery = query;
    this.loadProjects();
  }

  getState() {
    return { ...this.state };
  }
}

export function renderAdminProjectsScreen(
  controller: AdminProjectsScreenController,
  onBack?: () => void
): string {
  const { projects, isLoading, activeStatus, searchQuery, error } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Active Construction Builds...</p>
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
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Project Portfolio Oversight</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Platform Projects (${projects.length})</h1>
        </div>
      </div>

      <!-- Search Input -->
      <div>
        <input
          type="text"
          value="${searchQuery}"
          onchange="controller.setSearchQuery(this.value)"
          placeholder="Search by project name, customer, contractor..."
          class="w-full min-h-[44px] px-3.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
        />
      </div>

      <!-- Status Filter Tabs -->
      <div class="flex gap-1.5 border-b border-stone-200 pb-2 overflow-x-auto">
        ${['ALL', 'IN_PROGRESS', 'COMPLETED']
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
            ${s.replace('_', ' ')}
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

      <!-- Projects List -->
      ${
        projects.length === 0
          ? `
        <div class="p-8 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
          <span class="text-3xl">🏗️</span>
          <p class="text-xs font-bold text-stone-800">No active or completed projects found.</p>
        </div>
      `
          : `
        <div class="space-y-3">
          ${projects
            .map(
              (p) => `
            <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3 shadow-sm">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h4 class="text-xs font-black text-stone-900 font-serif">${p.title}</h4>
                  <span class="text-[10.5px] text-stone-500 font-semibold block">Client: ${p.customerName}</span>
                </div>
                <span class="dbc-badge ${
                  p.status === 'IN_PROGRESS'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-stone-100 text-stone-800 border-stone-200'
                } text-[8px] font-bold uppercase shrink-0">
                  ${p.statusLabel}
                </span>
              </div>

              <div class="space-y-1.5">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-stone-600 font-medium">Contractor: <strong class="text-stone-900 font-bold">${p.providerName}</strong></span>
                  <span class="text-emerald-800 font-bold font-mono">${p.budgetFormatted}</span>
                </div>

                <!-- Progress Bar -->
                <div class="space-y-1">
                  <div class="flex justify-between text-[10px] text-stone-500 font-bold">
                    <span>Overall Progress</span>
                    <span>${p.progressPercentage}%</span>
                  </div>
                  <div class="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-emerald-700 rounded-full transition-all duration-300"
                      style="width: ${p.progressPercentage}%"
                    ></div>
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between text-[10px] text-stone-400 font-medium pt-2 border-t border-stone-100">
                <span>Start Date: ${p.startDate}</span>
                <span class="text-stone-600 font-bold">Execution Tracked</span>
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
