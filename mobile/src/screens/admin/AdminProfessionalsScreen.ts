import { mobileAdminWorkspaceService } from '../../services/mobileAdminWorkspaceService.js';
import type { MobileAdminProfessional, AdminVerificationStatus } from '../../types/adminWorkspaceMobileTypes.js';

export interface AdminProfessionalsScreenProps {
  onSelectProfessional?: (providerId: string) => void;
  onBack?: () => void;
}

export class AdminProfessionalsScreenController {
  private props: AdminProfessionalsScreenProps;
  private state: {
    professionals: MobileAdminProfessional[];
    isLoading: boolean;
    isUpdating: boolean;
    activeStatus: 'ALL' | AdminVerificationStatus;
    searchQuery: string;
    selectedProvider: MobileAdminProfessional | null;
    showVerifyModal: boolean;
    pendingStatus: 'VERIFIED' | 'PENDING' | 'REJECTED' | null;
    error: string | null;
    statusMessage: string | null;
  };

  constructor(props: AdminProfessionalsScreenProps) {
    this.props = props;
    this.state = {
      professionals: [],
      isLoading: true,
      isUpdating: false,
      activeStatus: 'ALL',
      searchQuery: '',
      selectedProvider: null,
      showVerifyModal: false,
      pendingStatus: null,
      error: null,
      statusMessage: null,
    };
  }

  async init(): Promise<void> {
    await this.loadProfessionals();
  }

  async loadProfessionals(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const items = await mobileAdminWorkspaceService.getProfessionals({
        search: this.state.searchQuery,
        verificationStatus: this.state.activeStatus,
      });
      this.state.professionals = items;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load trade partners';
    } finally {
      this.state.isLoading = false;
    }
  }

  setStatusFilter(status: 'ALL' | AdminVerificationStatus): void {
    this.state.activeStatus = status;
    this.loadProfessionals();
  }

  setSearchQuery(query: string): void {
    this.state.searchQuery = query;
    this.loadProfessionals();
  }

  openVerifyModal(provider: MobileAdminProfessional, status: 'VERIFIED' | 'PENDING' | 'REJECTED'): void {
    this.state.selectedProvider = provider;
    this.state.pendingStatus = status;
    this.state.showVerifyModal = true;
  }

  closeVerifyModal(): void {
    this.state.showVerifyModal = false;
    this.state.selectedProvider = null;
    this.state.pendingStatus = null;
  }

  async confirmVerification(): Promise<void> {
    if (!this.state.selectedProvider || !this.state.pendingStatus || this.state.isUpdating) return;

    this.state.isUpdating = true;
    this.state.error = null;
    try {
      await mobileAdminWorkspaceService.verifyProfessional(
        this.state.selectedProvider.id,
        this.state.pendingStatus
      );
      this.state.showVerifyModal = false;
      await this.loadProfessionals();
      this.state.statusMessage = `Provider verification status set to ${this.state.pendingStatus}.`;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Failed to update verification status';
    } finally {
      this.state.isUpdating = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderAdminProfessionalsScreen(
  controller: AdminProfessionalsScreenController,
  onSelectProfessional?: (providerId: string) => void,
  onBack?: () => void
): string {
  const { professionals, isLoading, isUpdating, activeStatus, searchQuery, selectedProvider, showVerifyModal, pendingStatus, error, statusMessage } =
    controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Trade Partner Operations...</p>
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
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Contractor Oversight</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Trade Partners (${professionals.length})</h1>
        </div>
      </div>

      <!-- Search Input -->
      <div>
        <input
          type="text"
          value="${searchQuery}"
          onchange="controller.setSearchQuery(this.value)"
          placeholder="Search by business or contact person..."
          class="w-full min-h-[44px] px-3.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
        />
      </div>

      <!-- Filter Tabs -->
      <div class="flex gap-1.5 border-b border-stone-200 pb-2 overflow-x-auto">
        ${['ALL', 'VERIFIED', 'PENDING', 'REJECTED']
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
            ${s}
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

      ${
        statusMessage
          ? `
        <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
          ${statusMessage}
        </div>
      `
          : ''
      }

      <!-- Professionals List -->
      ${
        professionals.length === 0
          ? `
        <div class="p-8 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
          <span class="text-3xl">👷</span>
          <p class="text-xs font-bold text-stone-800">No trade partners found.</p>
        </div>
      `
          : `
        <div class="space-y-3">
          ${professionals
            .map(
              (p) => `
            <div
              class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3 shadow-sm hover:border-emerald-400 transition"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h3 class="text-xs font-black text-stone-900">${p.businessName}</h3>
                  <span class="text-[10.5px] text-stone-500 font-semibold block">Lead: ${p.contactPerson} (${p.category})</span>
                </div>
                <span class="dbc-badge ${
                  p.verificationStatus === 'VERIFIED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : p.verificationStatus === 'REJECTED'
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                } text-[8px] font-bold uppercase shrink-0">
                  ${p.verificationStatus}
                </span>
              </div>

              <!-- Admin Verification Actions -->
              <div class="flex items-center gap-2 pt-2 border-t border-stone-100">
                ${
                  p.verificationStatus !== 'VERIFIED'
                    ? `<button
                        onclick="controller.openVerifyModal(${JSON.stringify(p).replace(/"/g, '&quot;')}, 'VERIFIED')"
                        class="flex-1 min-h-[44px] py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition"
                      >
                        Approve Credentials
                      </button>`
                    : `<button
                        onclick="controller.openVerifyModal(${JSON.stringify(p).replace(/"/g, '&quot;')}, 'REJECTED')"
                        class="flex-1 min-h-[44px] py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition border border-rose-200"
                      >
                        Suspend / Reject
                      </button>`
                }
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      `
      }

      <!-- Verification Confirmation Modal -->
      ${
        showVerifyModal && selectedProvider
          ? `
        <div class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h3 class="text-sm font-black text-stone-900">Confirm Verification Action</h3>
            <p class="text-xs text-stone-600">
              Are you sure you want to set verification status for <strong>${selectedProvider.businessName}</strong> to <strong>${pendingStatus}</strong>?
            </p>

            <div class="flex items-center gap-2 pt-2">
              <button
                onclick="controller.closeVerifyModal()"
                class="flex-1 min-h-[44px] py-2 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onclick="controller.confirmVerification()"
                ${isUpdating ? 'disabled' : ''}
                class="flex-1 min-h-[44px] py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
              >
                ${isUpdating ? 'Updating...' : 'Confirm Verification'}
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
