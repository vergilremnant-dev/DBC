import { mobileSupportService } from '../../services/mobileSupportService.js';
import type { MobileFaqItem } from '../../types/mobileSupportTypes.js';

export interface FAQScreenProps {
  userRole?: 'customer' | 'contractor' | 'admin';
  initialCategory?: string;
  onNavigateRoute?: (route: string, params?: any) => void;
  onBack?: () => void;
}

export class FAQScreenController {
  private props: FAQScreenProps;
  private state: {
    faqs: MobileFaqItem[];
    activeCategory: string;
    searchQuery: string;
    expandedFaqId: string | null;
  };

  constructor(props: FAQScreenProps) {
    this.props = props;
    this.state = {
      faqs: [],
      activeCategory: props.initialCategory || 'ALL',
      searchQuery: '',
      expandedFaqId: null,
    };
  }

  init(): void {
    this.loadFaqs();
  }

  loadFaqs(): void {
    const role = this.props.userRole || 'customer';
    const items = mobileSupportService.getFaqs({
      role,
      category: this.state.activeCategory,
      query: this.state.searchQuery,
    });
    this.state.faqs = items;
  }

  setCategoryFilter(cat: string): void {
    this.state.activeCategory = cat;
    this.loadFaqs();
  }

  setSearchQuery(query: string): void {
    this.state.searchQuery = query;
    this.loadFaqs();
  }

  toggleExpand(id: string): void {
    if (this.state.expandedFaqId === id) {
      this.state.expandedFaqId = null;
    } else {
      this.state.expandedFaqId = id;
    }
  }

  toggleFaq(id: string): void {
    this.toggleExpand(id);
  }

  getState() {
    return { ...this.state };
  }
}

export function renderFAQScreen(
  controller: FAQScreenController,
  onNavigateRoute?: (route: string, params?: any) => void,
  onBack?: () => void
): string {
  const { faqs, activeCategory, searchQuery, expandedFaqId } = controller.getState();

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
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Knowledge Base</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Frequently Asked Questions</h1>
        </div>
      </div>

      <!-- Search Input -->
      <div>
        <input
          type="text"
          value="${searchQuery}"
          onchange="controller.setSearchQuery(this.value)"
          placeholder="Search FAQs by keywords (e.g. quotation, milestone, payment)..."
          class="w-full min-h-[44px] px-3.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
        />
      </div>

      <!-- Category Filter Tabs -->
      <div class="flex gap-1.5 border-b border-stone-200 pb-2 overflow-x-auto">
        ${['ALL', 'project_requests', 'quotations', 'projects_milestones', 'payments', 'messages', 'account_security']
          .map(
            (c) => `
          <button
            onclick="controller.setCategoryFilter('${c}')"
            class="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
              activeCategory === c
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }"
          >
            ${c.replace(/_/g, ' ')}
          </button>
        `
          )
          .join('')}
      </div>

      <!-- FAQ Accordion List -->
      ${
        faqs.length === 0
          ? `
        <div class="p-8 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
          <span class="text-3xl">🔍</span>
          <p class="text-xs font-bold text-stone-800">No FAQs match your search criteria.</p>
          <p class="text-[11px] text-stone-500 font-medium">Try searching for keywords like "milestone", "quotation", or "request".</p>
        </div>
      `
          : `
        <div class="space-y-3">
          ${faqs
            .map((faq) => {
              const isExpanded = expandedFaqId === faq.id;
              return `
                <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-2 shadow-sm">
                  <div
                    onclick="controller.toggleExpand('${faq.id}')"
                    class="flex items-center justify-between cursor-pointer min-h-[44px] gap-2"
                  >
                    <div class="flex items-center gap-2">
                      <span class="dbc-badge bg-stone-100 text-stone-700 border-stone-200 text-[7.5px] font-bold uppercase shrink-0">
                        ${faq.categoryLabel}
                      </span>
                      <h4 class="text-xs font-black text-stone-900">${faq.question}</h4>
                    </div>
                    <span class="text-stone-500 font-bold text-sm shrink-0">${isExpanded ? '−' : '+'}</span>
                  </div>

                  ${
                    isExpanded
                      ? `
                    <div class="pt-2 border-t border-stone-100 text-xs text-stone-700 space-y-2 font-medium">
                      <p class="leading-relaxed">${faq.answer}</p>
                      ${
                        faq.relatedRoute && onNavigateRoute
                          ? `<button
                              onclick="onNavigateRoute('${faq.relatedRoute}', ${JSON.stringify(faq.relatedParams || {}).replace(/"/g, '&quot;')})"
                              class="min-h-[44px] px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-[10.5px] transition block mt-1"
                            >
                              Go to Feature →
                            </button>`
                          : ''
                      }
                    </div>
                  `
                      : ''
                  }
                </div>
              `;
            })
            .join('')}
        </div>
      `
      }
    </div>
  `;
}
