import { mobileProfileService } from '../../services/mobileProfileService.js';
import type { MobileSecuritySettings } from '../../types/mobileProfileTypes.js';

export interface SecuritySettingsScreenProps {
  onBack?: () => void;
}

export class SecuritySettingsScreenController {
  private props: SecuritySettingsScreenProps;
  private state: {
    security: MobileSecuritySettings | null;
    isLoading: boolean;
    error: string | null;
  };

  constructor(props: SecuritySettingsScreenProps) {
    this.props = props;
    this.state = {
      security: null,
      isLoading: true,
      error: null,
    };
  }

  async init(): Promise<void> {
    await this.loadSecuritySettings();
  }

  async loadSecuritySettings(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const s = await mobileProfileService.getSecuritySettings();
      this.state.security = s;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load security settings';
    } finally {
      this.state.isLoading = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderSecuritySettingsScreen(
  controller: SecuritySettingsScreenController,
  onBack?: () => void
): string {
  const { security, isLoading, error } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Security Overview...</p>
      </div>
    `;
  }

  if (!security) {
    return `
      <div class="mobile-container p-6 text-center space-y-4">
        <h2 class="text-base font-bold text-stone-800">Security Info Unavailable</h2>
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
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Account Protection</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Security & Verification</h1>
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

      <!-- Authentication Model Card -->
      <div class="p-5 bg-stone-900 text-white rounded-2xl space-y-3 shadow-md">
        <div class="flex items-center justify-between">
          <span class="dbc-badge bg-emerald-500 text-white border-emerald-400 text-[8px] font-bold uppercase">
            OTP VERIFIED
          </span>
          <span class="text-[10px] text-stone-400 font-mono">ENCRYPTED SESSION</span>
        </div>

        <div>
          <h2 class="text-sm font-bold text-white">Login & Verification Model</h2>
          <p class="text-xs text-stone-300 font-medium mt-1">
            Your DBC account is protected using 6-digit email OTP verification without passwords.
          </p>
        </div>
      </div>

      <!-- Security Details Card -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3 shadow-sm">
        <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider">Active Session Security</h3>

        <div class="space-y-2 text-xs">
          <div class="flex justify-between py-1.5 border-b border-stone-100">
            <span class="text-stone-500 font-medium">Verified Email</span>
            <span class="font-bold text-stone-900">${security.verifiedContact}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-stone-100">
            <span class="text-stone-500 font-medium">Session Token Status</span>
            <span class="font-bold text-emerald-700">Encrypted JWT Bearer</span>
          </div>
          <div class="flex justify-between py-1.5">
            <span class="text-stone-500 font-medium">Active Devices</span>
            <span class="font-bold text-stone-900">${security.activeSessionsCount} Device</span>
          </div>
        </div>
      </div>
    </div>
  `;
}
