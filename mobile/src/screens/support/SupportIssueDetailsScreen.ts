import { mobileSupportService } from '../../services/mobileSupportService.js';
import type { MobileSupportIssue } from '../../types/mobileSupportTypes.js';

export interface SupportIssueDetailsScreenProps {
  issueId?: string;
  ticketId?: string;
  onBack?: () => void;
}

export class SupportIssueDetailsScreenController {
  private props: SupportIssueDetailsScreenProps;
  private state: {
    issue: MobileSupportIssue | null;
    isLoading: boolean;
    error: string | null;
  };

  constructor(props: SupportIssueDetailsScreenProps) {
    this.props = props;
    this.state = {
      issue: null,
      isLoading: true,
      error: null,
    };
  }

  async init(): Promise<void> {
    await this.loadIssue();
  }

  async loadIssue(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const targetId = this.props.issueId || this.props.ticketId || '';
      const item = await mobileSupportService.getSupportIssueById(targetId);
      this.state.issue = item;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load support issue details';
    } finally {
      this.state.isLoading = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderSupportIssueDetailsScreen(
  controller: SupportIssueDetailsScreenController,
  onBack?: () => void
): string {
  const { issue, isLoading, error } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Support Ticket...</p>
      </div>
    `;
  }

  if (!issue) {
    return `
      <div class="mobile-container p-6 text-center space-y-4">
        <h2 class="text-base font-bold text-stone-800">Support Ticket Not Found</h2>
        ${
          onBack
            ? `<button onclick="onBack()" class="min-h-[44px] px-4 py-2 bg-stone-900 text-white font-bold rounded-xl text-xs">Return to Help Center</button>`
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
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Ticket #${issue.id}</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">${issue.subject}</h1>
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

      <!-- Issue Details Card -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3 shadow-sm">
        <div class="flex items-center justify-between">
          <span class="dbc-badge bg-stone-100 text-stone-800 border-stone-200 text-[8px] font-bold uppercase">
            CATEGORY: ${issue.issueType}
          </span>
          <span class="dbc-badge ${
            issue.status === 'SUBMITTED'
              ? 'bg-amber-100 text-amber-800 border-amber-200'
              : issue.status === 'IN_REVIEW'
              ? 'bg-blue-100 text-blue-800 border-blue-200'
              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
          } text-[8px] font-bold uppercase">
            ${issue.status}
          </span>
        </div>

        <div class="space-y-2 text-xs">
          <div class="flex justify-between py-1 border-b border-stone-100">
            <span class="text-stone-500 font-medium">Logged By</span>
            <span class="font-bold text-stone-900">${issue.userEmail}</span>
          </div>
          <div class="flex justify-between py-1 border-b border-stone-100">
            <span class="text-stone-500 font-medium">Created Date</span>
            <span class="font-bold text-stone-900">${issue.createdAt}</span>
          </div>
          ${
            issue.relatedProjectId
              ? `
            <div class="flex justify-between py-1 border-b border-stone-100">
              <span class="text-stone-500 font-medium">Related Project</span>
              <span class="font-bold text-emerald-800 font-mono">${issue.relatedProjectId}</span>
            </div>
          `
              : ''
          }
        </div>

        <!-- Issue Description -->
        <div class="space-y-1 pt-2 border-t border-stone-100">
          <span class="text-[10px] uppercase font-bold text-stone-500 block">Description</span>
          <p class="text-xs text-stone-800 font-medium leading-relaxed">${issue.description}</p>
        </div>
      </div>

      <!-- Support Response Card -->
      ${
        issue.responseNote
          ? `
        <div class="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-1 text-xs">
          <h4 class="font-bold text-emerald-900">Platform Support Response</h4>
          <p class="text-stone-700 font-medium leading-relaxed">${issue.responseNote}</p>
        </div>
      `
          : ''
      }
    </div>
  `;
}
