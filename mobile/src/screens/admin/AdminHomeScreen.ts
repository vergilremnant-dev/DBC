import { mobileAdminWorkspaceService } from '../../services/mobileAdminWorkspaceService.js';
import type { AdminDashboardOverview } from '../../types/adminWorkspaceMobileTypes.js';

export interface AdminHomeScreenProps {
  onNavigateTab?: (route: string) => void;
  onSelectUser?: (userId: string) => void;
  onSelectProfessional?: (providerId: string) => void;
}

export class AdminHomeScreenController {
  private props: AdminHomeScreenProps;
  private state: {
    overview: AdminDashboardOverview | null;
    isLoading: boolean;
    error: string | null;
  };

  constructor(props: AdminHomeScreenProps) {
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
      const overview = await mobileAdminWorkspaceService.getAdminDashboardOverview();
      this.state.overview = overview;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load admin dashboard';
    } finally {
      this.state.isLoading = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderAdminHomeScreen(
  controller: AdminHomeScreenController,
  onNavigateTab?: (route: string) => void,
  onSelectUser?: (userId: string) => void,
  onSelectProfessional?: (providerId: string) => void
): string {
  const { overview, isLoading, error } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Platform Operational Console...</p>
      </div>
    `;
  }

  if (error || !overview) {
    return `
      <div class="mobile-container p-6 text-center space-y-4">
        <h2 class="text-base font-bold text-stone-800">Admin Console Error</h2>
        <p class="text-xs text-rose-600 font-semibold">${error || 'Unable to access platform metrics.'}</p>
        <button onclick="controller.loadDashboard()" class="min-h-[44px] px-4 py-2 bg-stone-900 text-white font-bold rounded-xl text-xs">Retry</button>
      </div>
    `;
  }

  const { metrics, actionItems, recentUsers, pendingProfessionals, recentAuditLogs } = overview;

  return `
    <div class="mobile-container p-4 space-y-5 select-none pb-24">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Platform Administration</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Platform Operations Console</h1>
        </div>
        <span class="dbc-badge bg-rose-100 text-rose-800 border-rose-200 text-[8px] font-bold uppercase">
          SUPER ADMIN
        </span>
      </div>

      <!-- Compact Metrics Grid -->
      <div class="grid grid-cols-3 gap-2">
        <div
          onclick="${onNavigateTab ? `onNavigateTab('AdminUsers')` : ''}"
          class="p-3 bg-stone-900 text-white rounded-2xl space-y-1 cursor-pointer hover:bg-stone-800 transition"
        >
          <span class="text-[9px] text-stone-400 uppercase font-bold block">Total Users</span>
          <span class="text-lg font-black text-white">${metrics.totalUsersCount}</span>
        </div>

        <div
          onclick="${onNavigateTab ? `onNavigateTab('AdminProfessionals')` : ''}"
          class="p-3 bg-emerald-900 text-white rounded-2xl space-y-1 cursor-pointer hover:bg-emerald-800 transition"
        >
          <span class="text-[9px] text-emerald-300 uppercase font-bold block">Trade Partners</span>
          <span class="text-lg font-black text-emerald-300">${metrics.professionalsCount}</span>
        </div>

        <div
          onclick="${onNavigateTab ? `onNavigateTab('AdminProjects')` : ''}"
          class="p-3 bg-stone-900 text-white rounded-2xl space-y-1 cursor-pointer hover:bg-stone-800 transition"
        >
          <span class="text-[9px] text-stone-400 uppercase font-bold block">Active Builds</span>
          <span class="text-lg font-black text-white">${metrics.activeProjectsCount}</span>
        </div>
      </div>

      <!-- Operational Action Required Cards -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider">Operational Attention Required</h3>
          <span class="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[9px]">${actionItems.length} Tasks</span>
        </div>

        <div class="space-y-2">
          ${actionItems
            .map(
              (item) => `
            <div class="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl space-y-1.5">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold text-stone-900">${item.title}</h4>
                <span class="dbc-badge bg-amber-200 text-amber-900 border-amber-300 text-[8px] font-bold uppercase">
                  ${item.priority}
                </span>
              </div>
              <p class="text-[11px] text-stone-600 font-medium">${item.description}</p>
              ${
                onNavigateTab
                  ? `<button
                      onclick="onNavigateTab('${item.targetRoute}')"
                      class="min-h-[44px] px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-lg text-[10.5px] transition block mt-1"
                    >
                      ${item.actionLabel} →
                    </button>`
                  : ''
              }
            </div>
          `
            )
            .join('')}
        </div>
      </div>

      <!-- Pending Provider Verification Cards -->
      ${
        pendingProfessionals.length > 0
          ? `
        <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider">Pending Verification Requests</h3>
            <span class="text-[10px] text-stone-500 font-semibold">${pendingProfessionals.length} Pending</span>
          </div>

          <div class="space-y-2">
            ${pendingProfessionals
              .map(
                (p) => `
              <div
                onclick="${onSelectProfessional ? `onSelectProfessional('${p.id}')` : ''}"
                class="p-3 bg-stone-50 border border-stone-150 rounded-xl flex items-center justify-between cursor-pointer hover:border-emerald-400 transition"
              >
                <div>
                  <h4 class="text-xs font-bold text-stone-900">${p.businessName}</h4>
                  <span class="text-[10px] text-stone-500 font-medium">${p.category} | ${p.contactPerson}</span>
                </div>
                <span class="dbc-badge bg-amber-100 text-amber-800 border-amber-200 text-[8px] font-bold uppercase">
                  Review
                </span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }

      <!-- Recent Platform Audit Log -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider">Recent Admin Audit Activity</h3>
          ${
            onNavigateTab
              ? `<button onclick="onNavigateTab('AdminAuditLog')" class="text-[10px] font-bold text-emerald-800">View All →</button>`
              : ''
          }
        </div>

        <div class="space-y-2">
          ${recentAuditLogs
            .slice(0, 3)
            .map(
              (log) => `
            <div class="p-2.5 bg-stone-50 border border-stone-150 rounded-xl space-y-1 text-xs">
              <div class="flex items-center justify-between">
                <span class="font-mono text-[9.5px] font-bold text-stone-500">${log.action}</span>
                <span class="text-[9.5px] text-stone-400">${log.formattedDate}</span>
              </div>
              <p class="text-stone-800 font-bold text-[11px]">${log.target}</p>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    </div>
  `;
}
