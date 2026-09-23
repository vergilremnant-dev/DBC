import { mobileProfileService } from '../../services/mobileProfileService.js';
import type { MobileUserProfile } from '../../types/mobileProfileTypes.js';

export interface MobileProfileScreenProps {
  userRole?: 'customer' | 'contractor' | 'admin';
  onNavigateTab?: (route: string, params?: any) => void;
  onLogoutSuccess?: () => void;
  onBack?: () => void;
}

export class MobileProfileScreenController {
  private props: MobileProfileScreenProps;
  private state: {
    profile: MobileUserProfile | null;
    isLoading: boolean;
    showLogoutModal: boolean;
    isLoggingOut: boolean;
    error: string | null;
    statusMessage: string | null;
  };

  constructor(props: MobileProfileScreenProps) {
    this.props = props;
    this.state = {
      profile: null,
      isLoading: true,
      showLogoutModal: false,
      isLoggingOut: false,
      error: null,
      statusMessage: null,
    };
  }

  async init(): Promise<void> {
    await this.loadProfile();
  }

  async loadProfile(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const p = await mobileProfileService.getCurrentProfile();
      this.state.profile = p;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load profile';
    } finally {
      this.state.isLoading = false;
    }
  }

  promptLogout(): void {
    this.state.showLogoutModal = true;
  }

  closeLogoutModal(): void {
    this.state.showLogoutModal = false;
  }

  async confirmLogout(): Promise<void> {
    if (this.state.isLoggingOut) return;

    this.state.isLoggingOut = true;
    try {
      await mobileProfileService.logout();
      this.state.showLogoutModal = false;
      if (this.props.onLogoutSuccess) {
        this.props.onLogoutSuccess();
      }
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Failed to log out';
    } finally {
      this.state.isLoggingOut = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderMobileProfileScreen(
  controller: MobileProfileScreenController,
  onNavigateTab?: (route: string, params?: any) => void,
  onLogoutSuccess?: () => void,
  onBack?: () => void
): string {
  const { profile, isLoading, showLogoutModal, isLoggingOut, error, statusMessage } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Account Profile...</p>
      </div>
    `;
  }

  if (!profile) {
    return `
      <div class="mobile-container p-6 text-center space-y-4">
        <h2 class="text-base font-bold text-stone-800">Profile Unavailable</h2>
        <p class="text-xs text-rose-600 font-semibold">${error || 'Please sign in to access your profile.'}</p>
        <button onclick="controller.loadProfile()" class="min-h-[44px] px-4 py-2 bg-stone-900 text-white font-bold rounded-xl text-xs">Retry</button>
      </div>
    `;
  }

  const role = profile.role;

  return `
    <div class="mobile-container p-4 space-y-5 select-none pb-24">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          ${
            onBack
              ? `<button onclick="onBack()" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold">←</button>`
              : ''
          }
          <div>
            <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Account Overview</span>
            <h1 class="text-base font-bold text-stone-900 font-serif">Account Profile</h1>
          </div>
        </div>

        <span class="dbc-badge ${
          role === 'admin'
            ? 'bg-rose-100 text-rose-800 border-rose-200'
            : role === 'contractor'
            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
            : 'bg-stone-100 text-stone-800 border-stone-200'
        } text-[8px] font-bold uppercase">
          ${role}
        </span>
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
        statusMessage
          ? `
        <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
          ${statusMessage}
        </div>
      `
          : ''
      }

      <!-- Profile Card -->
      <div class="p-5 bg-white border border-stone-200 rounded-2xl space-y-4 shadow-sm">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xl uppercase overflow-hidden shrink-0 border border-stone-300">
            ${
              profile.avatarUrl
                ? `<img src="${profile.avatarUrl}" alt="${profile.name}" class="w-full h-full object-cover" />`
                : profile.name.slice(0, 2)
            }
          </div>

          <div class="flex-1 min-w-0">
            <h2 class="text-sm font-black text-stone-900 truncate">${profile.name}</h2>
            <p class="text-xs text-stone-500 font-medium truncate">${profile.email}</p>
            ${profile.phone ? `<p class="text-[11px] text-stone-400 font-mono">${profile.phone}</p>` : ''}
          </div>
        </div>

        ${
          profile.businessName
            ? `
          <div class="p-3 bg-stone-50 border border-stone-150 rounded-xl space-y-1">
            <span class="text-[9.5px] uppercase font-bold text-stone-400 block">Trade Business</span>
            <p class="text-xs font-bold text-stone-900">${profile.businessName}</p>
            <p class="text-[10.5px] text-stone-500 font-medium">${profile.category || 'Civil Contractor'}</p>
          </div>
        `
            : ''
        }

        <button
          onclick="${onNavigateTab ? `onNavigateTab('EditProfile')` : ''}"
          class="w-full min-h-[44px] py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs transition"
        >
          Edit Profile Info
        </button>
      </div>

      <!-- Role-Aware Account Section Navigation Links -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-2 shadow-sm">
        <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider mb-2">Account Management</h3>

        ${
          role === 'customer'
            ? `
          <div class="space-y-1">
            <button onclick="${onNavigateTab ? `onNavigateTab('CustomerRequests')` : ''}" class="w-full min-h-[44px] px-3 py-2 flex items-center justify-between hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-800 transition">
              <span>📋 My Requests</span>
              <span>→</span>
            </button>
            <button onclick="${onNavigateTab ? `onNavigateTab('CustomerProjects')` : ''}" class="w-full min-h-[44px] px-3 py-2 flex items-center justify-between hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-800 transition">
              <span>🏗️ My Projects</span>
              <span>→</span>
            </button>
            <button onclick="${onNavigateTab ? `onNavigateTab('CustomerMessages')` : ''}" class="w-full min-h-[44px] px-3 py-2 flex items-center justify-between hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-800 transition">
              <span>💬 Messages</span>
              <span>→</span>
            </button>
            <button onclick="${onNavigateTab ? `onNavigateTab('Notifications')` : ''}" class="w-full min-h-[44px] px-3 py-2 flex items-center justify-between hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-800 transition">
              <span>🔔 Notifications</span>
              <span>→</span>
            </button>
          </div>
        `
            : role === 'contractor'
            ? `
          <div class="space-y-1">
            <button onclick="${onNavigateTab ? `onNavigateTab('ProfessionalRequests')` : ''}" class="w-full min-h-[44px] px-3 py-2 flex items-center justify-between hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-800 transition">
              <span>📥 Project Requests</span>
              <span>→</span>
            </button>
            <button onclick="${onNavigateTab ? `onNavigateTab('ProfessionalLeads')` : ''}" class="w-full min-h-[44px] px-3 py-2 flex items-center justify-between hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-800 transition">
              <span>⚡ Open Leads</span>
              <span>→</span>
            </button>
            <button onclick="${onNavigateTab ? `onNavigateTab('ProfessionalQuotations')` : ''}" class="w-full min-h-[44px] px-3 py-2 flex items-center justify-between hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-800 transition">
              <span>📑 Proposals & Quotes</span>
              <span>→</span>
            </button>
            <button onclick="${onNavigateTab ? `onNavigateTab('ProfessionalProjects')` : ''}" class="w-full min-h-[44px] px-3 py-2 flex items-center justify-between hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-800 transition">
              <span>🔨 Active Projects</span>
              <span>→</span>
            </button>
            <button onclick="${onNavigateTab ? `onNavigateTab('ProfessionalFinance')` : ''}" class="w-full min-h-[44px] px-3 py-2 flex items-center justify-between hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-800 transition">
              <span>💰 Finance & Earnings</span>
              <span>→</span>
            </button>
          </div>
        `
            : `
          <div class="space-y-1">
            <button onclick="${onNavigateTab ? `onNavigateTab('AdminUsers')` : ''}" class="w-full min-h-[44px] px-3 py-2 flex items-center justify-between hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-800 transition">
              <span>👥 Platform Users</span>
              <span>→</span>
            </button>
            <button onclick="${onNavigateTab ? `onNavigateTab('AdminProfessionals')` : ''}" class="w-full min-h-[44px] px-3 py-2 flex items-center justify-between hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-800 transition">
              <span>👷 Trade Partners</span>
              <span>→</span>
            </button>
            <button onclick="${onNavigateTab ? `onNavigateTab('AdminProjects')` : ''}" class="w-full min-h-[44px] px-3 py-2 flex items-center justify-between hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-800 transition">
              <span>🏗️ Platform Projects</span>
              <span>→</span>
            </button>
            <button onclick="${onNavigateTab ? `onNavigateTab('AdminHome')` : ''}" class="w-full min-h-[44px] px-3 py-2 flex items-center justify-between hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-800 transition">
              <span>⚙️ Operational Console</span>
              <span>→</span>
            </button>
          </div>
        `
        }
      </div>

      <!-- Settings & Security Group -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-1 shadow-sm">
        <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider mb-2">Settings & Security</h3>

        <button onclick="${onNavigateTab ? `onNavigateTab('AccountSettings')` : ''}" class="w-full min-h-[44px] px-3 py-2 flex items-center justify-between hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-800 transition">
          <span>⚙️ Account Settings</span>
          <span>→</span>
        </button>

        <button onclick="${onNavigateTab ? `onNavigateTab('SecuritySettings')` : ''}" class="w-full min-h-[44px] px-3 py-2 flex items-center justify-between hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-800 transition">
          <span>🔒 Security & OTP Verification</span>
          <span>→</span>
        </button>

        <button onclick="${onNavigateTab ? `onNavigateTab('NotificationPreferences')` : ''}" class="w-full min-h-[44px] px-3 py-2 flex items-center justify-between hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-800 transition">
          <span>🔔 Notification Preferences</span>
          <span>→</span>
        </button>
      </div>

      <!-- Sign Out Action -->
      <div class="pt-2">
        <button
          onclick="controller.promptLogout()"
          class="w-full min-h-[44px] py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs transition shadow-sm"
        >
          Sign Out of Account
        </button>
      </div>

      <!-- Logout Confirmation Modal -->
      ${
        showLogoutModal
          ? `
        <div class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h3 class="text-sm font-black text-stone-900">Confirm Sign Out</h3>
            <p class="text-xs text-stone-600">
              Are you sure you want to log out? Your active encrypted session token will be invalidated and you will be returned to the login screen.
            </p>

            <div class="flex items-center gap-2 pt-2">
              <button
                onclick="controller.closeLogoutModal()"
                class="flex-1 min-h-[44px] py-2 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onclick="controller.confirmLogout()"
                ${isLoggingOut ? 'disabled' : ''}
                class="flex-1 min-h-[44px] py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
              >
                ${isLoggingOut ? 'Logging Out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;
}
