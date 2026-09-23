import { mobileAdminWorkspaceService } from '../../services/mobileAdminWorkspaceService.js';
import type { MobileAdminAuditLog } from '../../types/adminWorkspaceMobileTypes.js';

export interface AdminAuditLogScreenProps {
  onBack?: () => void;
}

export class AdminAuditLogScreenController {
  private props: AdminAuditLogScreenProps;
  private state: {
    logs: MobileAdminAuditLog[];
    isLoading: boolean;
    activeActionFilter: string;
    error: string | null;
  };

  constructor(props: AdminAuditLogScreenProps) {
    this.props = props;
    this.state = {
      logs: [],
      isLoading: true,
      activeActionFilter: 'ALL',
      error: null,
    };
  }

  async init(): Promise<void> {
    await this.loadAuditLogs();
  }

  async loadAuditLogs(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      let items = await mobileAdminWorkspaceService.getAuditLogs();

      if (this.state.activeActionFilter !== 'ALL') {
        items = items.filter((log) => log.action === this.state.activeActionFilter);
      }

      this.state.logs = items;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load platform audit logs';
    } finally {
      this.state.isLoading = false;
    }
  }

  setActionFilter(action: string): void {
    this.state.activeActionFilter = action;
    this.loadAuditLogs();
  }

  getState() {
    return { ...this.state };
  }
}

export function renderAdminAuditLogScreen(
  controller: AdminAuditLogScreenController,
  onBack?: () => void
): string {
  const { logs, isLoading, activeActionFilter, error } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Platform Audit Activity...</p>
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
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Governance & Security</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Platform Audit Logs (${logs.length})</h1>
        </div>
      </div>

      <!-- Action Filter Tabs -->
      <div class="flex gap-1.5 border-b border-stone-200 pb-2 overflow-x-auto">
        ${['ALL', 'VERIFY_PROVIDER', 'UPDATE_USER_STATUS']
          .map(
            (act) => `
          <button
            onclick="controller.setActionFilter('${act}')"
            class="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
              activeActionFilter === act
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }"
          >
            ${act.replace(/_/g, ' ')}
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

      <!-- Audit Logs List -->
      ${
        logs.length === 0
          ? `
        <div class="p-8 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
          <span class="text-3xl">📜</span>
          <p class="text-xs font-bold text-stone-800">No audit log records found.</p>
        </div>
      `
          : `
        <div class="space-y-3">
          ${logs
            .map(
              (log) => `
            <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-2 shadow-sm">
              <div class="flex items-center justify-between">
                <span class="font-mono text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                  ${log.action}
                </span>
                <span class="dbc-badge ${
                  log.status === 'SUCCESS'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : log.status === 'WARNING'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-rose-100 text-rose-800 border-rose-200'
                } text-[8px] font-bold uppercase">
                  ${log.status}
                </span>
              </div>

              <p class="text-xs text-stone-900 font-bold">${log.target}</p>

              <div class="flex items-center justify-between text-[10px] text-stone-500 font-medium pt-2 border-t border-stone-100">
                <span>Actor: <strong class="text-stone-800">${log.actorEmail}</strong></span>
                <span>${log.formattedDate}</span>
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
