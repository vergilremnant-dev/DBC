import { mobileAdminWorkspaceService } from '../../services/mobileAdminWorkspaceService.js';
import type { MobileAdminUser, AdminUserRole } from '../../types/adminWorkspaceMobileTypes.js';

export interface AdminUsersScreenProps {
  onSelectUser?: (userId: string) => void;
  onBack?: () => void;
}

export class AdminUsersScreenController {
  private props: AdminUsersScreenProps;
  private state: {
    users: MobileAdminUser[];
    isLoading: boolean;
    activeRole: 'ALL' | AdminUserRole;
    searchQuery: string;
    error: string | null;
  };

  constructor(props: AdminUsersScreenProps) {
    this.props = props;
    this.state = {
      users: [],
      isLoading: true,
      activeRole: 'ALL',
      searchQuery: '',
      error: null,
    };
  }

  async init(): Promise<void> {
    await this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const users = await mobileAdminWorkspaceService.getUsers({
        search: this.state.searchQuery,
        role: this.state.activeRole,
      });
      this.state.users = users;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load platform users';
    } finally {
      this.state.isLoading = false;
    }
  }

  setRoleFilter(role: 'ALL' | AdminUserRole): void {
    this.state.activeRole = role;
    this.loadUsers();
  }

  setSearchQuery(query: string): void {
    this.state.searchQuery = query;
    this.loadUsers();
  }

  getState() {
    return { ...this.state };
  }
}

export function renderAdminUsersScreen(
  controller: AdminUsersScreenController,
  onSelectUser?: (userId: string) => void,
  onBack?: () => void
): string {
  const { users, isLoading, activeRole, searchQuery, error } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Platform Users...</p>
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
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">User Directory</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Platform Users (${users.length})</h1>
        </div>
      </div>

      <!-- Search Input -->
      <div>
        <input
          type="text"
          value="${searchQuery}"
          onchange="controller.setSearchQuery(this.value)"
          placeholder="Search users by name or email..."
          class="w-full min-h-[44px] px-3.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
        />
      </div>

      <!-- Role Filter Tabs -->
      <div class="flex gap-1.5 border-b border-stone-200 pb-2 overflow-x-auto">
        ${['ALL', 'customer', 'contractor', 'admin']
          .map(
            (r) => `
          <button
            onclick="controller.setRoleFilter('${r}')"
            class="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
              activeRole === r
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }"
          >
            ${r}
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

      <!-- Users List -->
      ${
        users.length === 0
          ? `
        <div class="p-8 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
          <span class="text-3xl">👥</span>
          <p class="text-xs font-bold text-stone-800">No users found.</p>
        </div>
      `
          : `
        <div class="space-y-3">
          ${users
            .map(
              (u) => `
            <div
              onclick="${onSelectUser ? `onSelectUser('${u.id}')` : ''}"
              class="p-4 bg-white border border-stone-200 rounded-2xl space-y-2 hover:border-emerald-400 cursor-pointer transition min-h-[44px]"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h4 class="text-xs font-black text-stone-900">${u.fullName}</h4>
                  <span class="text-[10.5px] text-stone-500 font-semibold block">${u.email}</span>
                </div>
                <span class="dbc-badge ${
                  u.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : u.status === 'SUSPENDED'
                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                } text-[8px] font-bold uppercase shrink-0">
                  ${u.status}
                </span>
              </div>

              <div class="flex items-center justify-between text-[10px] text-stone-500 font-medium pt-1 border-t border-stone-100">
                <span>Role: <strong class="text-stone-800 uppercase font-bold">${u.role}</strong></span>
                <span>Joined: <strong>${u.createdAt}</strong></span>
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
