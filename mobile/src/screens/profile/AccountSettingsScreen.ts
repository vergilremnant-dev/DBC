import { mobileProfileService } from '../../services/mobileProfileService.js';
import type { MobileAccountSettings } from '../../types/mobileProfileTypes.js';

export interface AccountSettingsScreenProps {
  onNavigateTab?: (route: string) => void;
  onBack?: () => void;
}

export class AccountSettingsScreenController {
  private props: AccountSettingsScreenProps;
  private state: {
    settings: MobileAccountSettings | null;
    isLoading: boolean;
    error: string | null;
  };

  constructor(props: AccountSettingsScreenProps) {
    this.props = props;
    this.state = {
      settings: null,
      isLoading: true,
      error: null,
    };
  }

  async init(): Promise<void> {
    await this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const s = await mobileProfileService.getAccountSettings();
      this.state.settings = s;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load account settings';
    } finally {
      this.state.isLoading = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderAccountSettingsScreen(
  controller: AccountSettingsScreenController,
  onNavigateTab?: (route: string) => void,
  onBack?: () => void
): string {
  const { settings, isLoading, error } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Account Settings...</p>
      </div>
    `;
  }

  if (!settings) {
    return `
      <div class="mobile-container p-6 text-center space-y-4">
        <h2 class="text-base font-bold text-stone-800">Settings Unavailable</h2>
        ${
          onBack
            ? `<button onclick="onBack()" class="min-h-[44px] px-4 py-2 bg-stone-900 text-white font-bold rounded-xl text-xs">Back to Profile</button>`
            : ''
        }
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
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Account Preferences</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Account Settings</h1>
        </div>
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

      <!-- Account Info Card -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3 shadow-sm">
        <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider">Account Overview</h3>

        <div class="space-y-2 text-xs">
          <div class="flex justify-between py-1.5 border-b border-stone-100">
            <span class="text-stone-500 font-medium">Primary Email</span>
            <span class="font-bold text-stone-900">${settings.email}</span>
          </div>
          ${
            settings.phone
              ? `
            <div class="flex justify-between py-1.5 border-b border-stone-100">
              <span class="text-stone-500 font-medium">Contact Phone</span>
              <span class="font-bold text-stone-900">${settings.phone}</span>
            </div>
          `
              : ''
          }
          <div class="flex justify-between py-1.5 border-b border-stone-100">
            <span class="text-stone-500 font-medium">Account Role</span>
            <span class="font-bold text-stone-900 uppercase">${settings.role}</span>
          </div>
          <div class="flex justify-between py-1.5">
            <span class="text-stone-500 font-medium">Session Status</span>
            <span class="dbc-badge bg-emerald-100 text-emerald-800 border-emerald-200 text-[8px] font-bold uppercase">
              ${settings.sessionStatus}
            </span>
          </div>
        </div>
      </div>

      <!-- Shortcuts Card -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-2 shadow-sm">
        <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider mb-1">Quick Links</h3>

        <button
          onclick="${onNavigateTab ? `onNavigateTab('SecuritySettings')` : ''}"
          class="w-full min-h-[44px] px-3 py-2 flex items-center justify-between hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-800 transition"
        >
          <span>🔒 Security & OTP Verification</span>
          <span>→</span>
        </button>

        <button
          onclick="${onNavigateTab ? `onNavigateTab('NotificationPreferences')` : ''}"
          class="w-full min-h-[44px] px-3 py-2 flex items-center justify-between hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-800 transition"
        >
          <span>🔔 Notification Preferences</span>
          <span>→</span>
        </button>

        <button
          onclick="${onNavigateTab ? `onNavigateTab('HelpCenter')` : ''}"
          class="w-full min-h-[44px] px-3 py-2 flex items-center justify-between hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-800 transition"
        >
          <span>🎧 Help & Support Center</span>
          <span>→</span>
        </button>
      </div>
    </div>
  `;
}
