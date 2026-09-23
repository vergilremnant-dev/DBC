import { mobileSupportService } from '../../services/mobileSupportService.js';
import type { MobileHelpTopic } from '../../types/mobileSupportTypes.js';

export interface HelpCenterScreenProps {
  userRole?: 'customer' | 'contractor' | 'admin';
  onNavigateTab?: (route: string, params?: any) => void;
  onBack?: () => void;
}

export class HelpCenterScreenController {
  private props: HelpCenterScreenProps;
  private state: {
    topics: MobileHelpTopic[];
    searchQuery: string;
    selectedCategory: string;
    supportEmail: string;
  };

  constructor(props: HelpCenterScreenProps) {
    this.props = props;
    this.state = {
      topics: [],
      searchQuery: '',
      selectedCategory: 'ALL',
      supportEmail: mobileSupportService.getSupportEmail(),
    };
  }

  init(): void {
    const role = this.props.userRole || 'customer';
    this.state.topics = mobileSupportService.getHelpTopics(role);
  }

  setSearchQuery(query: string): void {
    this.state.searchQuery = query;
  }

  setQuery(query: string): void {
    this.setSearchQuery(query);
  }

  setCategoryFilter(cat: string): void {
    this.state.selectedCategory = cat;
  }

  getState() {
    return { ...this.state };
  }
}

export function renderHelpCenterScreen(
  controller: HelpCenterScreenController,
  onNavigateTab?: (route: string, params?: any) => void,
  onBack?: () => void
): string {
  const { topics, searchQuery, supportEmail } = controller.getState();
  const role = controller['props'].userRole || 'customer';

  const filteredTopics = searchQuery
    ? topics.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : topics;

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
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Customer & Partner Assistance</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Help & Support Center</h1>
        </div>
      </div>

      <!-- Search Input -->
      <div>
        <input
          type="text"
          value="${searchQuery}"
          onchange="controller.setSearchQuery(this.value)"
          placeholder="Search help topics, questions, workflows..."
          class="w-full min-h-[44px] px-3.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
        />
      </div>

      <!-- Quick Action Shortcuts -->
      <div class="grid grid-cols-2 gap-2">
        <button
          onclick="${onNavigateTab ? `onNavigateTab('FAQ')` : ''}"
          class="p-3 bg-stone-900 text-white rounded-2xl text-left space-y-1 hover:bg-stone-800 transition min-h-[44px]"
        >
          <span class="text-lg">❓</span>
          <h4 class="text-xs font-bold text-white">Browse FAQs</h4>
          <p class="text-[10px] text-stone-300">Frequently asked questions</p>
        </button>

        <button
          onclick="${onNavigateTab ? `onNavigateTab('ContactSupport')` : ''}"
          class="p-3 bg-emerald-900 text-white rounded-2xl text-left space-y-1 hover:bg-emerald-800 transition min-h-[44px]"
        >
          <span class="text-lg">✉️</span>
          <h4 class="text-xs font-bold text-white">Contact Support</h4>
          <p class="text-[10px] text-emerald-200">Log an issue or inquiry</p>
        </button>
      </div>

      <!-- Role-Aware Support Topics Grid -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3 shadow-sm">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider">
            ${role === 'admin' ? 'Platform Administration Topics' : role === 'contractor' ? 'Trade Partner Support Topics' : 'Customer Support Topics'}
          </h3>
          <span class="text-[10px] text-stone-400 font-semibold">${filteredTopics.length} Topics</span>
        </div>

        ${
          filteredTopics.length === 0
            ? `
          <div class="p-6 text-center space-y-1 bg-stone-50 rounded-xl">
            <p class="text-xs font-bold text-stone-800">No help topics found for "${searchQuery}".</p>
            <button onclick="${onNavigateTab ? `onNavigateTab('FAQ')` : ''}" class="text-[11px] font-bold text-emerald-800">Search All FAQs →</button>
          </div>
        `
            : `
          <div class="space-y-2">
            ${filteredTopics
              .map(
                (topic) => `
              <div
                onclick="${onNavigateTab ? `onNavigateTab('FAQ', { category: '${topic.id}' })` : ''}"
                class="p-3 bg-stone-50 border border-stone-150 rounded-xl flex items-center justify-between cursor-pointer hover:border-emerald-400 transition min-h-[44px]"
              >
                <div class="flex items-center gap-3">
                  <span class="text-xl">${topic.icon}</span>
                  <div>
                    <h4 class="text-xs font-bold text-stone-900">${topic.title}</h4>
                    <p class="text-[10.5px] text-stone-500 font-medium line-clamp-1">${topic.description}</p>
                  </div>
                </div>
                <span class="text-stone-400 text-xs font-bold">→</span>
              </div>
            `
              )
              .join('')}
          </div>
        `
        }
      </div>

      <!-- Support Channel Footer Card -->
      <div class="p-4 bg-stone-100 border border-stone-200 rounded-2xl space-y-2 text-xs">
        <div class="flex items-center justify-between font-bold text-stone-900">
          <span>Need Direct Platform Assistance?</span>
          <span class="text-emerald-800 font-mono">${supportEmail}</span>
        </div>
        <p class="text-stone-600 text-[11px]">
          Our platform team is available Monday through Saturday to assist with site execution queries, quotations, and payments.
        </p>
      </div>
    </div>
  `;
}
