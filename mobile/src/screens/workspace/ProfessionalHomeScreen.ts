import { mobileProfessionalWorkspaceService } from '../../services/mobileProfessionalWorkspaceService.js';
import type { ProfessionalDashboardOverview } from '../../types/professionalWorkspaceMobileTypes.js';

export interface ProfessionalHomeScreenProps {
  onNavigateToRequestDetails?: (requestId: string) => void;
  onNavigateToProjects?: () => void;
  onNavigateToRequests?: () => void;
  onNavigateToLeads?: () => void;
}

export class ProfessionalHomeScreenController {
  private props: ProfessionalHomeScreenProps;
  private state: {
    overview: ProfessionalDashboardOverview | null;
    isLoading: boolean;
    error: string | null;
  };

  constructor(props: ProfessionalHomeScreenProps) {
    this.props = props;
    this.state = {
      overview: null,
      isLoading: true,
      error: null,
    };
  }

  async init(): Promise<void> {
    await this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const overview = await mobileProfessionalWorkspaceService.getProfessionalDashboardOverview();
      this.state.overview = overview;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load professional dashboard';
      if (
        this.state.error.includes('UNAUTHORIZED') ||
        this.state.error.includes('ACCESS_DENIED')
      ) {
        this.state.overview = null;
      }
    } finally {
      this.state.isLoading = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderProfessionalHomeScreen(
  controller: ProfessionalHomeScreenController,
  onNavigateToRequestDetails?: (requestId: string) => void,
  onNavigateToProjects?: () => void,
  onNavigateToRequests?: () => void,
  onNavigateToLeads?: () => void
): string {
  const { overview, isLoading, error } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Trade Partner Dashboard...</p>
      </div>
    `;
  }

  if (error || !overview) {
    return `
      <div class="mobile-container p-4 space-y-4">
        <div class="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <span class="text-2xl">⚠️</span>
          <p class="text-xs font-bold text-rose-800">${error || 'Unable to load professional workspace.'}</p>
          <button onclick="controller.loadDashboard()" class="min-h-[44px] px-4 py-2 bg-rose-700 text-white font-bold text-xs rounded-xl hover:bg-rose-800">
            Retry Dashboard Lookup
          </button>
        </div>
      </div>
    `;
  }

  const { metrics, actionItems, activeProjects, recentRequests, openLeads, recentActivity } = overview;

  return `
    <div class="mobile-container p-4 space-y-5 select-none">
      <!-- Header Banner -->
      <div class="flex items-center justify-between">
        <div>
          <span class="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Trade Partner Workspace
          </span>
          <h1 class="text-base font-bold text-stone-900 font-serif mt-1">Professional Console</h1>
        </div>
        <span class="w-10 h-10 rounded-full bg-stone-900 text-white flex items-center justify-center text-sm font-bold shadow-md">
          🔨
        </span>
      </div>

      <!-- Compact Metrics Grid -->
      <div class="grid grid-cols-2 gap-3">
        <div class="p-3.5 bg-stone-900 text-white rounded-2xl space-y-1 shadow-md">
          <span class="text-[9px] font-extrabold uppercase text-stone-400">Active Projects</span>
          <div class="text-2xl font-black font-serif text-emerald-400">${metrics.activeProjectsCount}</div>
          <span class="text-[9.5px] text-stone-400 font-medium block">In Progress Builds</span>
        </div>

        <div class="p-3.5 bg-white border border-stone-200 rounded-2xl space-y-1 shadow-xs">
          <span class="text-[9px] font-extrabold uppercase text-stone-400">Pending Requests</span>
          <div class="text-2xl font-black font-serif text-amber-600">${metrics.pendingRequestsCount}</div>
          <span class="text-[9.5px] text-stone-500 font-medium block">Action Required</span>
        </div>

        <div class="p-3.5 bg-white border border-stone-200 rounded-2xl space-y-1 shadow-xs">
          <span class="text-[9px] font-extrabold uppercase text-stone-400">Open Leads</span>
          <div class="text-2xl font-black font-serif text-blue-600">${metrics.openLeadsCount}</div>
          <span class="text-[9.5px] text-stone-500 font-medium block">Bidding Opportunities</span>
        </div>

        <div class="p-3.5 bg-white border border-stone-200 rounded-2xl space-y-1 shadow-xs">
          <span class="text-[9px] font-extrabold uppercase text-stone-400">Quotations</span>
          <div class="text-2xl font-black font-serif text-stone-900">${metrics.pendingQuotationsCount}</div>
          <span class="text-[9.5px] text-stone-500 font-medium block">Proposals Pending</span>
        </div>
      </div>

      <!-- Action Required Section -->
      ${
        actionItems.length > 0
          ? `
        <div class="space-y-3">
          <h2 class="text-xs font-black uppercase tracking-wider text-stone-900">Action Required</h2>
          <div class="space-y-2.5">
            ${actionItems
              .map(
                (act) => `
              <div class="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 text-xs">
                <div class="flex items-center justify-between">
                  <strong class="font-bold text-amber-900">${act.title}</strong>
                  <span class="dbc-badge bg-amber-100 text-amber-800 border-amber-200 text-[8px] font-bold uppercase">
                    ${act.priority} PRIORITY
                  </span>
                </div>
                <p class="text-[11px] text-amber-800 font-medium leading-relaxed">${act.description}</p>
                <button
                  onclick="${onNavigateToRequestDetails ? `onNavigateToRequestDetails('${act.targetId}')` : ''}"
                  class="w-full min-h-[44px] dbc-btn dbc-btn-md dbc-btn-primary text-xs font-bold"
                >
                  ${act.actionLabel} →
                </button>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }

      <!-- Active Projects Section -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-black uppercase tracking-wider text-stone-900">Active Construction Builds</h2>
          <button onclick="${onNavigateToProjects ? 'onNavigateToProjects()' : ''}" class="text-[11px] font-bold text-emerald-700 hover:underline">
            View All (${activeProjects.length}) →
          </button>
        </div>

        <div class="space-y-3">
          ${activeProjects
            .slice(0, 2)
            .map(
              (p) => `
            <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-2.5 shadow-xs">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="text-xs font-black text-stone-900">${p.title}</h3>
                  <span class="text-[10.5px] text-stone-500 font-semibold block mt-0.5">Customer: ${p.customerName}</span>
                </div>
                <span class="dbc-badge bg-emerald-100 text-emerald-800 border-emerald-200 text-[8px] font-bold uppercase">
                  ${p.statusLabel}
                </span>
              </div>

              <!-- Progress bar -->
              <div class="space-y-1">
                <div class="flex justify-between text-[10px] font-bold text-stone-600">
                  <span>Progress: ${p.progressPercentage}%</span>
                  <span class="truncate max-w-[150px]">Target: ${p.currentMilestoneName}</span>
                </div>
                <div class="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div class="h-full bg-emerald-600 rounded-full" style="width: ${p.progressPercentage}%"></div>
                </div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Recent Customer Requests Section -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-xs font-black uppercase tracking-wider text-stone-900">Recent Customer Requests</h2>
          <button onclick="${onNavigateToRequests ? 'onNavigateToRequests()' : ''}" class="text-[11px] font-bold text-emerald-700 hover:underline">
            View Requests (${recentRequests.length}) →
          </button>
        </div>

        <div class="space-y-2.5">
          ${recentRequests
            .slice(0, 2)
            .map(
              (r) => `
            <div
              onclick="${onNavigateToRequestDetails ? `onNavigateToRequestDetails('${r.id}')` : ''}"
              class="p-4 bg-white border border-stone-200 rounded-2xl space-y-2 hover:border-emerald-400 transition cursor-pointer min-h-[44px]"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-xs font-black text-stone-900">${r.serviceCategory}</h3>
                  <span class="text-[10px] text-stone-500 font-semibold block mt-0.5">${r.customerName} • ${r.submittedDate}</span>
                </div>
                <span class="dbc-badge ${r.isActionable ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'} text-[8px] font-bold uppercase">
                  ${r.statusLabel}
                </span>
              </div>
              <p class="text-[11px] text-stone-600 font-medium line-clamp-1 border-t border-stone-100 pt-1.5">${r.notes}</p>
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Open Leads Opportunity Entry -->
      <div class="p-4 bg-gradient-to-r from-emerald-900 to-stone-900 text-white rounded-2xl space-y-2 flex items-center justify-between">
        <div class="space-y-0.5">
          <span class="text-[8px] font-black uppercase text-emerald-400 tracking-wider">Public Marketplace Bids</span>
          <h3 class="text-xs font-bold text-white">${openLeads.length} Open Project Leads Available</h3>
          <p class="text-[10px] text-stone-300 font-medium">Review customer requirements and express interest.</p>
        </div>
        <button
          onclick="${onNavigateToLeads ? 'onNavigateToLeads()' : ''}"
          class="min-h-[44px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shrink-0"
        >
          Explore Leads →
        </button>
      </div>

      <!-- Recent Activity Log -->
      <div class="dbc-card space-y-3">
        <h2 class="text-xs font-black uppercase tracking-wider text-stone-900">Recent Activity Stream</h2>
        <div class="space-y-2">
          ${recentActivity
            .map(
              (act) => `
            <div class="flex items-start gap-2.5 text-xs font-medium text-stone-700 pb-2 border-b border-stone-100 last:border-0 last:pb-0">
              <span class="text-emerald-700 text-sm">⏱️</span>
              <div>
                <strong class="text-stone-900 block text-[11px]">${act.title}</strong>
                <p class="text-[10.5px] text-stone-500 font-normal">${act.desc}</p>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    </div>
  `;
}
