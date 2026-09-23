import { mobileProfessionalProjectExecutionService } from '../../services/mobileProfessionalProjectExecutionService.js';
import type {
  ProfessionalProjectOverview,
  ProfessionalProjectAction,
} from '../../types/professionalProjectExecutionMobileTypes.js';

export interface ProfessionalProjectOverviewScreenProps {
  projectId: string;
  onNavigateTab?: (tab: 'OVERVIEW' | 'MILESTONES' | 'TIMELINE' | 'DOCUMENTS') => void;
  onMessageCustomer?: (projectId: string) => void;
}

export class ProfessionalProjectOverviewScreenController {
  private props: ProfessionalProjectOverviewScreenProps;
  private state: {
    overview: ProfessionalProjectOverview | null;
    isLoading: boolean;
    isExecutingAction: boolean;
    error: string | null;
    statusMessage: string | null;
  };

  constructor(props: ProfessionalProjectOverviewScreenProps) {
    this.props = props;
    this.state = {
      overview: null,
      isLoading: true,
      isExecutingAction: false,
      error: null,
      statusMessage: null,
    };
  }

  async init(): Promise<void> {
    await this.loadOverview();
  }

  async loadOverview(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const overview = await mobileProfessionalProjectExecutionService.getProjectOverview(this.props.projectId);
      this.state.overview = overview;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load project overview';
    } finally {
      this.state.isLoading = false;
    }
  }

  async handleAction(action: ProfessionalProjectAction): Promise<void> {
    if (this.state.isExecutingAction || !this.state.overview) return;

    this.state.isExecutingAction = true;
    this.state.error = null;
    this.state.statusMessage = null;

    try {
      if (action === 'START_PLANNING') {
        const updated = await mobileProfessionalProjectExecutionService.startPlanning(this.props.projectId);
        this.state.overview = updated;
        this.state.statusMessage = 'Project status updated to Planning & Mobilization.';
      } else if (action === 'START_PROJECT') {
        const updated = await mobileProfessionalProjectExecutionService.startProjectExecution(this.props.projectId);
        this.state.overview = updated;
        this.state.statusMessage = 'Project execution started on site.';
      } else if (action === 'MARK_READY_FOR_COMPLETION') {
        const updated = await mobileProfessionalProjectExecutionService.markReadyForCompletion(this.props.projectId);
        this.state.overview = updated;
        this.state.statusMessage = 'Submitted project completion for customer review.';
      } else if (action === 'MANAGE_MILESTONES') {
        if (this.props.onNavigateTab) this.props.onNavigateTab('MILESTONES');
      } else if (action === 'UPLOAD_DOCUMENTS') {
        if (this.props.onNavigateTab) this.props.onNavigateTab('DOCUMENTS');
      } else if (action === 'MESSAGE_CUSTOMER') {
        if (this.props.onMessageCustomer) this.props.onMessageCustomer(this.props.projectId);
      }
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Failed to execute project action';
    } finally {
      this.state.isExecutingAction = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderProfessionalProjectOverviewScreen(
  controller: ProfessionalProjectOverviewScreenController
): string {
  const { overview, isLoading, isExecutingAction, error, statusMessage } = controller.getState();

  if (isLoading) {
    return `
      <div class="p-6 text-center text-xs font-semibold text-stone-500">
        Loading Project Overview...
      </div>
    `;
  }

  if (!overview) {
    return `
      <div class="p-4 bg-rose-50 text-rose-800 rounded-xl text-xs">
        ${error || 'Project overview details unavailable.'}
      </div>
    `;
  }

  return `
    <div class="space-y-4">
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

      <!-- Progress & Target Date Overview Card -->
      <div class="p-4 bg-stone-900 text-white rounded-2xl space-y-3 shadow-md">
        <div class="flex items-center justify-between text-xs">
          <div>
            <span class="text-[10px] text-stone-400 font-bold uppercase block">Customer Client</span>
            <span class="text-xs font-black text-white">${overview.customerName}</span>
          </div>
          <div class="text-right">
            <span class="text-stone-400 font-semibold uppercase text-[10px] block">Overall Site Progress</span>
            <span class="text-emerald-400 font-black text-sm">${overview.progressPercentage}%</span>
          </div>
        </div>

        <div class="w-full h-3 bg-stone-800 rounded-full overflow-hidden">
          <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" style="width: ${overview.progressPercentage}%"></div>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-2 border-t border-stone-800 text-[11px]">
          <div>
            <span class="text-stone-400 block text-[9.5px] font-bold uppercase">Start Date</span>
            <span class="font-bold">${overview.startDate || 'Immediate'}</span>
          </div>
          <div>
            <span class="text-stone-400 block text-[9.5px] font-bold uppercase">Target Handover</span>
            <span class="font-bold">${overview.targetCompletionDate || 'Flex Schedule'}</span>
          </div>
        </div>
      </div>

      <!-- Financial Context Summary Card -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
        <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider">Financial Overview</h3>

        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="p-2.5 bg-stone-50 border border-stone-150 rounded-xl">
            <span class="text-[9.5px] text-stone-400 uppercase font-bold block">Contract</span>
            <span class="text-xs font-black text-stone-900">${overview.totalBudgetFormatted}</span>
          </div>
          <div class="p-2.5 bg-emerald-50 border border-emerald-150 rounded-xl">
            <span class="text-[9.5px] text-emerald-700 uppercase font-bold block">Received</span>
            <span class="text-xs font-black text-emerald-800">${overview.amountReceivedFormatted}</span>
          </div>
          <div class="p-2.5 bg-amber-50 border border-amber-150 rounded-xl">
            <span class="text-[9.5px] text-amber-700 uppercase font-bold block">Pending</span>
            <span class="text-xs font-black text-amber-800">${overview.pendingBalanceFormatted}</span>
          </div>
        </div>
      </div>

      <!-- Milestone Status Indicator -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="font-black text-stone-900 uppercase text-[10px] tracking-wider">Milestone Execution</span>
          <span class="text-[10px] font-bold text-stone-500">${overview.completedMilestonesCount} of ${overview.totalMilestonesCount} Completed</span>
        </div>

        <div class="p-3 bg-stone-50 border border-stone-150 rounded-xl space-y-1">
          <span class="text-[9.5px] text-stone-400 font-bold uppercase block">Active Stage</span>
          <p class="text-xs font-bold text-stone-900">${overview.currentMilestoneName}</p>
          ${overview.nextMilestoneName ? `<span class="text-[10px] text-stone-500 font-medium block">Up Next: ${overview.nextMilestoneName}</span>` : ''}
        </div>
      </div>

      <!-- Professional Execution Actions -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
        <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider">Execution Actions</h3>

        <div class="grid grid-cols-1 gap-2">
          ${
            overview.supportedActions.includes('START_PLANNING')
              ? `<button
                  onclick="controller.handleAction('START_PLANNING')"
                  ${isExecutingAction ? 'disabled' : ''}
                  class="min-h-[44px] py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
                >
                  Start Project Planning
                </button>`
              : ''
          }

          ${
            overview.supportedActions.includes('START_PROJECT')
              ? `<button
                  onclick="controller.handleAction('START_PROJECT')"
                  ${isExecutingAction ? 'disabled' : ''}
                  class="min-h-[44px] py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
                >
                  Start Site Construction Work
                </button>`
              : ''
          }

          ${
            overview.supportedActions.includes('MANAGE_MILESTONES')
              ? `<button
                  onclick="controller.handleAction('MANAGE_MILESTONES')"
                  class="min-h-[44px] py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs transition"
                >
                  Manage Construction Milestones →
                </button>`
              : ''
          }

          ${
            overview.supportedActions.includes('MARK_READY_FOR_COMPLETION')
              ? `<button
                  onclick="controller.handleAction('MARK_READY_FOR_COMPLETION')"
                  ${isExecutingAction ? 'disabled' : ''}
                  class="min-h-[44px] py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
                >
                  Submit Handover for Customer Review
                </button>`
              : ''
          }

          ${
            overview.supportedActions.includes('UPLOAD_DOCUMENTS')
              ? `<button
                  onclick="controller.handleAction('UPLOAD_DOCUMENTS')"
                  class="min-h-[44px] py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition"
                >
                  Upload Technical Documents
                </button>`
              : ''
          }
        </div>
      </div>
    </div>
  `;
}
