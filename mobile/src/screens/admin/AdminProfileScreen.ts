import { mobileAdminWorkspaceService } from '../../services/mobileAdminWorkspaceService.js';

export interface AdminProfileScreenProps {
  onLogout?: () => void;
  onBack?: () => void;
}

export class AdminProfileScreenController {
  private props: AdminProfileScreenProps;
  private state: {
    adminEmail: string;
    roleLabel: string;
    isClearingCache: boolean;
    statusMessage: string | null;
  };

  constructor(props: AdminProfileScreenProps) {
    this.props = props;
    this.state = {
      adminEmail: 'admin@dbc.in',
      roleLabel: 'Super Platform Administrator',
      isClearingCache: false,
      statusMessage: null,
    };
  }

  async clearAdminCache(): Promise<void> {
    this.state.isClearingCache = true;
    try {
      mobileAdminWorkspaceService.clearCache();
      this.state.statusMessage = 'Platform local admin cache successfully cleared.';
    } catch {
      this.state.statusMessage = 'Failed to clear cache.';
    } finally {
      this.state.isClearingCache = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderAdminProfileScreen(
  controller: AdminProfileScreenController,
  onLogout?: () => void,
  onBack?: () => void
): string {
  const { adminEmail, roleLabel, isClearingCache, statusMessage } = controller.getState();

  return `
    <div class="mobile-container p-4 space-y-5 select-none pb-24">
      <!-- Header -->
      <div class="flex items-center gap-3">
        ${
          onBack
            ? `<button onclick="onBack()" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold">←</button>`
            : ''
        }
        <div>
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Account & Operations</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Admin Console Settings</h1>
        </div>
      </div>

      ${
        statusMessage
          ? `
        <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
          ${statusMessage}
        </div>
      `
          : ''
      }

      <!-- Admin Identity Card -->
      <div class="p-5 bg-stone-900 text-white rounded-2xl space-y-3 shadow-md">
        <div class="flex items-center justify-between">
          <span class="dbc-badge bg-rose-500 text-white border-rose-400 text-[8px] font-bold uppercase">
            SUPER ADMIN
          </span>
          <span class="text-[10px] text-stone-400 font-mono">ID: ADMIN-001</span>
        </div>

        <div>
          <h2 class="text-sm font-bold text-white">${adminEmail}</h2>
          <span class="text-xs text-stone-300 font-medium">${roleLabel}</span>
        </div>
      </div>

      <!-- System & Security Overview Card -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3 shadow-sm">
        <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider">Operational Security Overview</h3>

        <div class="space-y-2 text-xs">
          <div class="flex justify-between py-1.5 border-b border-stone-100">
            <span class="text-stone-500 font-medium">Session Status</span>
            <span class="font-bold text-emerald-700">Authenticated (Encrypted JWT)</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-stone-100">
            <span class="text-stone-500 font-medium">Sensitive Data Exposure</span>
            <span class="font-bold text-stone-800">Masked (No Secrets Disclosed)</span>
          </div>
          <div class="flex justify-between py-1.5">
            <span class="text-stone-500 font-medium">RBAC Guard</span>
            <span class="font-bold text-stone-800">Strict Role: admin</span>
          </div>
        </div>
      </div>

      <!-- Workspace Cache Maintenance -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
        <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider">Maintenance Actions</h3>
        <button
          onclick="controller.clearAdminCache()"
          ${isClearingCache ? 'disabled' : ''}
          class="w-full min-h-[44px] py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition border border-stone-300"
        >
          ${isClearingCache ? 'Clearing Cache...' : 'Clear Local Admin Cache'}
        </button>
      </div>

      <!-- Logout Action -->
      <div class="pt-2">
        <button
          onclick="${onLogout ? 'onLogout()' : ''}"
          class="w-full min-h-[44px] py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs transition shadow-sm"
        >
          Sign Out of Admin Console
        </button>
      </div>
    </div>
  `;
}
