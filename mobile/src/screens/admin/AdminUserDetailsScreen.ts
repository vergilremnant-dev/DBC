import { mobileAdminWorkspaceService } from '../../services/mobileAdminWorkspaceService.js';
import type { MobileAdminUser, AdminUserStatus } from '../../types/adminWorkspaceMobileTypes.js';

export interface AdminUserDetailsScreenProps {
  userId: string;
  onBack?: () => void;
}

export class AdminUserDetailsScreenController {
  private props: AdminUserDetailsScreenProps;
  private state: {
    user: MobileAdminUser | null;
    isLoading: boolean;
    isUpdating: boolean;
    showConfirmModal: boolean;
    pendingStatus: AdminUserStatus | null;
    error: string | null;
    statusMessage: string | null;
  };

  constructor(props: AdminUserDetailsScreenProps) {
    this.props = props;
    this.state = {
      user: null,
      isLoading: true,
      isUpdating: false,
      showConfirmModal: false,
      pendingStatus: null,
      error: null,
      statusMessage: null,
    };
  }

  async init(): Promise<void> {
    await this.loadUserDetails();
  }

  async loadUserDetails(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const u = await mobileAdminWorkspaceService.getUserDetails(this.props.userId);
      this.state.user = u;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load user details';
    } finally {
      this.state.isLoading = false;
    }
  }

  promptStatusChange(status: AdminUserStatus): void {
    this.state.pendingStatus = status;
    this.state.showConfirmModal = true;
  }

  closeConfirmModal(): void {
    this.state.showConfirmModal = false;
    this.state.pendingStatus = null;
  }

  async confirmStatusChange(): Promise<void> {
    if (!this.state.pendingStatus || this.state.isUpdating || !this.state.user) return;

    this.state.isUpdating = true;
    this.state.error = null;
    try {
      const updated = await mobileAdminWorkspaceService.updateUserStatus(this.props.userId, this.state.pendingStatus);
      this.state.user = updated;
      this.state.showConfirmModal = false;
      this.state.statusMessage = `User status updated to ${this.state.pendingStatus}.`;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Failed to update user status';
    } finally {
      this.state.isUpdating = false;
      this.state.pendingStatus = null;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderAdminUserDetailsScreen(
  controller: AdminUserDetailsScreenController,
  onBack?: () => void
): string {
  const { user, isLoading, isUpdating, showConfirmModal, pendingStatus, error, statusMessage } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading User Account...</p>
      </div>
    `;
  }

  if (!user) {
    return `
      <div class="mobile-container p-6 text-center space-y-4">
        <h2 class="text-base font-bold text-stone-800">User Not Found</h2>
        ${
          onBack
            ? `<button onclick="onBack()" class="min-h-[44px] px-4 py-2 bg-stone-900 text-white font-bold rounded-xl text-xs">Return to User Directory</button>`
            : ''
        }
      </div>
    `;
  }

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
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Account Overview</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">${user.fullName}</h1>
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

      <!-- User Information Card -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="dbc-badge bg-stone-900 text-white border-stone-800 text-[8px] font-bold uppercase">
            ROLE: ${user.role}
          </span>
          <span class="dbc-badge ${
            user.status === 'ACTIVE'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : user.status === 'SUSPENDED'
              ? 'bg-rose-100 text-rose-800 border-rose-200'
              : 'bg-amber-100 text-amber-800 border-amber-200'
          } text-[8px] font-bold uppercase">
            ${user.status}
          </span>
        </div>

        <div class="space-y-2 text-xs">
          <div class="flex justify-between py-1 border-b border-stone-100">
            <span class="text-stone-500 font-medium">Full Name</span>
            <span class="font-bold text-stone-900">${user.fullName}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-stone-100">
            <span class="text-stone-500 font-medium">Email Address</span>
            <span class="font-bold text-stone-900">${user.email}</span>
          </div>
          ${
            user.phoneNumber
              ? `
            <div class="flex justify-between py-1 border-b border-stone-100">
              <span class="text-stone-500 font-medium">Phone Number</span>
              <span class="font-bold text-stone-900">${user.phoneNumber}</span>
            </div>
          `
              : ''
          }
          <div class="flex justify-between py-1">
            <span class="text-stone-500 font-medium">Registration Date</span>
            <span class="font-bold text-stone-900">${user.createdAt}</span>
          </div>
        </div>
      </div>

      <!-- Administrative Status Actions Card -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
        <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider">Account State Actions</h3>

        <div class="grid grid-cols-1 gap-2">
          ${
            user.status !== 'ACTIVE'
              ? `<button
                  onclick="controller.promptStatusChange('ACTIVE')"
                  class="min-h-[44px] py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition"
                >
                  Activate Account
                </button>`
              : ''
          }

          ${
            user.status !== 'SUSPENDED'
              ? `<button
                  onclick="controller.promptStatusChange('SUSPENDED')"
                  class="min-h-[44px] py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition"
                >
                  Suspend Account
                </button>`
              : ''
          }
        </div>
      </div>

      <!-- Confirmation Modal -->
      ${
        showConfirmModal
          ? `
        <div class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h3 class="text-sm font-black text-stone-900">Confirm Account Action</h3>
            <p class="text-xs text-stone-600">
              Are you sure you want to change user status for <strong>${user.fullName}</strong> to <strong>${pendingStatus}</strong>?
            </p>

            <div class="flex items-center gap-2 pt-2">
              <button
                onclick="controller.closeConfirmModal()"
                class="flex-1 min-h-[44px] py-2 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onclick="controller.confirmStatusChange()"
                ${isUpdating ? 'disabled' : ''}
                class="flex-1 min-h-[44px] py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
              >
                ${isUpdating ? 'Updating...' : 'Confirm Action'}
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
