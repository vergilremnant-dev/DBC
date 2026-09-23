import { mobileProfileService } from '../../services/mobileProfileService.js';
import type { MobileNotificationPreferences } from '../../types/mobileProfileTypes.js';

export interface NotificationPreferencesScreenProps {
  onNavigateTab?: (route: string) => void;
  onBack?: () => void;
}

export class NotificationPreferencesScreenController {
  private props: NotificationPreferencesScreenProps;
  private state: {
    prefs: MobileNotificationPreferences;
    isLoading: boolean;
    isUpdating: boolean;
    error: string | null;
    statusMessage: string | null;
  };

  constructor(props: NotificationPreferencesScreenProps) {
    this.props = props;
    this.state = {
      prefs: {
        projectUpdates: true,
        messages: true,
        quotationUpdates: true,
        paymentUpdates: true,
      },
      isLoading: true,
      isUpdating: false,
      error: null,
      statusMessage: null,
    };
  }

  async init(): Promise<void> {
    await this.loadPreferences();
  }

  async loadPreferences(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const p = await mobileProfileService.getNotificationPreferences();
      this.state.prefs = p;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load notification preferences';
    } finally {
      this.state.isLoading = false;
    }
  }

  async togglePreference(key: keyof MobileNotificationPreferences): Promise<void> {
    const newValue = !this.state.prefs[key];
    this.state.prefs[key] = newValue;
    this.state.isUpdating = true;
    try {
      await mobileProfileService.updateNotificationPreferences({ [key]: newValue });
      this.state.statusMessage = 'Notification preferences updated.';
    } catch (err) {
      this.state.prefs[key] = !newValue; // Revert
      this.state.error = err instanceof Error ? err.message : 'Failed to update preference';
    } finally {
      this.state.isUpdating = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderNotificationPreferencesScreen(
  controller: NotificationPreferencesScreenController,
  onNavigateTab?: (route: string) => void,
  onBack?: () => void
): string {
  const { prefs, isLoading, error, statusMessage } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Preferences...</p>
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
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Alert Settings</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Notification Preferences</h1>
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

      ${
        statusMessage
          ? `
        <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
          ${statusMessage}
        </div>
      `
          : ''
      }

      <!-- Notification Category Toggles Card -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3 shadow-sm">
        <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider">Notification Subscriptions</h3>

        <div class="space-y-2">
          <!-- Project Updates -->
          <div class="flex items-center justify-between p-3 bg-stone-50 border border-stone-150 rounded-xl min-h-[44px]">
            <div>
              <h4 class="text-xs font-bold text-stone-900">Project Updates</h4>
              <p class="text-[10px] text-stone-500 font-medium">Milestones, timeline & site progress</p>
            </div>
            <button
              onclick="controller.togglePreference('projectUpdates')"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[44px] ${
                prefs.projectUpdates ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-600'
              }"
            >
              ${prefs.projectUpdates ? 'ON' : 'OFF'}
            </button>
          </div>

          <!-- Messages -->
          <div class="flex items-center justify-between p-3 bg-stone-50 border border-stone-150 rounded-xl min-h-[44px]">
            <div>
              <h4 class="text-xs font-bold text-stone-900">Messages & Conversations</h4>
              <p class="text-[10px] text-stone-500 font-medium">Direct chats with contractors/clients</p>
            </div>
            <button
              onclick="controller.togglePreference('messages')"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[44px] ${
                prefs.messages ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-600'
              }"
            >
              ${prefs.messages ? 'ON' : 'OFF'}
            </button>
          </div>

          <!-- Quotations & Bids -->
          <div class="flex items-center justify-between p-3 bg-stone-50 border border-stone-150 rounded-xl min-h-[44px]">
            <div>
              <h4 class="text-xs font-bold text-stone-900">Quotations & Proposals</h4>
              <p class="text-[10px] text-stone-500 font-medium">New bids, proposals & scope updates</p>
            </div>
            <button
              onclick="controller.togglePreference('quotationUpdates')"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[44px] ${
                prefs.quotationUpdates ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-600'
              }"
            >
              ${prefs.quotationUpdates ? 'ON' : 'OFF'}
            </button>
          </div>

          <!-- Payments & Receipts -->
          <div class="flex items-center justify-between p-3 bg-stone-50 border border-stone-150 rounded-xl min-h-[44px]">
            <div>
              <h4 class="text-xs font-bold text-stone-900">Payments & Escrow</h4>
              <p class="text-[10px] text-stone-500 font-medium">Milestone invoices & receipt updates</p>
            </div>
            <button
              onclick="controller.togglePreference('paymentUpdates')"
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[44px] ${
                prefs.paymentUpdates ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-600'
              }"
            >
              ${prefs.paymentUpdates ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>

      <!-- Navigation Link to Notification Center -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl shadow-sm">
        <button
          onclick="${onNavigateTab ? `onNavigateTab('Notifications')` : ''}"
          class="w-full min-h-[44px] px-3 py-2 flex items-center justify-between bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition"
        >
          <span>Open Notification Center Console</span>
          <span>→</span>
        </button>
      </div>
    </div>
  `;
}
