import { mobileCustomerMessagingService } from '../../services/mobileCustomerMessagingService.js';
import type { MobileConversationThread } from '../../types/customerMessagingMobileTypes.js';

export interface CustomerMessagesScreenProps {
  onSelectThread?: (threadId: string) => void;
  onBack?: () => void;
}

export class CustomerMessagesScreenController {
  private props: CustomerMessagesScreenProps;
  private state: {
    threads: MobileConversationThread[];
    isLoading: boolean;
    error: string | null;
    searchQuery: string;
  };

  constructor(props: CustomerMessagesScreenProps) {
    this.props = props;
    this.state = {
      threads: [],
      isLoading: true,
      error: null,
      searchQuery: '',
    };
  }

  async init(): Promise<void> {
    await this.loadThreads();
  }

  async loadThreads(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const threads = await mobileCustomerMessagingService.getCustomerThreads();
      this.state.threads = threads;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load messaging inbox';
      if (
        this.state.error.includes('UNAUTHORIZED') ||
        this.state.error.includes('ACCESS_DENIED')
      ) {
        this.state.threads = [];
      }
    } finally {
      this.state.isLoading = false;
    }
  }

  setSearchQuery(query: string): void {
    this.state.searchQuery = query;
  }

  getState() {
    return { ...this.state };
  }
}

export function renderCustomerMessagesScreen(
  controller: CustomerMessagesScreenController,
  onSelectThread?: (threadId: string) => void,
  onBack?: () => void
): string {
  const { threads, isLoading, error, searchQuery } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Conversations...</p>
      </div>
    `;
  }

  const filteredThreads = threads.filter(
    (t) =>
      t.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.projectContextTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = threads.reduce((sum, t) => sum + (t.unread ? 1 : 0), 0);

  return `
    <div class="mobile-container p-4 space-y-5 select-none">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          ${
            onBack
              ? `<button onclick="onBack()" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold" aria-label="Go Back">←</button>`
              : ''
          }
          <div>
            <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Communication Hub</span>
            <h1 class="text-base font-bold text-stone-900 font-serif">Project Messages</h1>
          </div>
        </div>
        ${
          totalUnread > 0
            ? `<span class="dbc-badge bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">${totalUnread} UNREAD</span>`
            : '<span class="dbc-badge bg-stone-100 text-stone-600 border-stone-200 text-[10px] font-bold">ALL READ</span>'
        }
      </div>

      <!-- Search Input Bar -->
      <div class="relative">
        <input
          type="text"
          placeholder="Search by contractor or project name..."
          value="${searchQuery}"
          oninput="controller.setSearchQuery(this.value)"
          class="w-full min-h-[44px] px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-emerald-500"
        />
      </div>

      ${
        error
          ? `
        <div class="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <span class="text-2xl">⚠️</span>
          <p class="text-xs font-bold text-rose-800">${error}</p>
          <button onclick="controller.loadThreads()" class="min-h-[44px] px-4 py-2 bg-rose-700 text-white font-bold text-xs rounded-xl hover:bg-rose-800">
            Retry Messaging Lookup
          </button>
        </div>
      `
          : ''
      }

      <!-- Conversation Cards List -->
      ${
        filteredThreads.length === 0
          ? `
        <div class="p-8 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
          <span class="text-3xl">💬</span>
          <p class="text-xs font-bold text-stone-800">No active project conversations found.</p>
          <p class="text-[11px] text-stone-500 font-medium">Message your contractor partner from your Project Workspace to begin.</p>
        </div>
      `
          : `
        <div class="space-y-3">
          ${filteredThreads
            .map(
              (t) => `
            <div
              onclick="${onSelectThread ? `onSelectThread('${t.id}')` : ''}"
              class="p-4 bg-white border ${t.unread ? 'border-emerald-400 bg-emerald-50/20' : 'border-stone-200'} rounded-2xl space-y-2 hover:border-emerald-500 cursor-pointer transition min-h-[44px]"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <span class="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-lg shrink-0">
                    ${t.avatar || '👤'}
                  </span>
                  <div>
                    <h3 class="text-xs font-black text-stone-900 leading-tight">${t.providerName}</h3>
                    <span class="text-[10px] text-stone-500 font-bold block mt-0.5">🎯 ${t.projectContextTitle}</span>
                  </div>
                </div>

                <div class="text-right shrink-0">
                  <span class="text-[10px] text-stone-400 font-semibold block">${t.lastMessageAt}</span>
                  ${t.unread ? `<span class="inline-block mt-1 w-2.5 h-2.5 rounded-full bg-emerald-600"></span>` : ''}
                </div>
              </div>

              <!-- Message Preview -->
              <p class="text-[11.5px] text-stone-600 font-medium line-clamp-1 pt-1 border-t border-stone-100">
                ${t.lastMessage}
              </p>
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
