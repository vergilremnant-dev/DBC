import { mobileProfessionalProjectExecutionService } from '../../services/mobileProfessionalProjectExecutionService.js';
import type { MobileMilestoneItem } from '../../types/projectExecutionMobileTypes.js';

export interface ProfessionalMilestoneDetailsScreenProps {
  projectId: string;
  milestoneId: string;
  onBack?: () => void;
}

export class ProfessionalMilestoneDetailsScreenController {
  private props: ProfessionalMilestoneDetailsScreenProps;
  private state: {
    milestone: MobileMilestoneItem | null;
    isLoading: boolean;
    isSubmitting: boolean;
    progressInput: number;
    error: string | null;
    statusMessage: string | null;
  };

  constructor(props: ProfessionalMilestoneDetailsScreenProps) {
    this.props = props;
    this.state = {
      milestone: null,
      isLoading: true,
      isSubmitting: false,
      progressInput: 0,
      error: null,
      statusMessage: null,
    };
  }

  async init(): Promise<void> {
    await this.loadDetails();
  }

  async loadDetails(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const m = await mobileProfessionalProjectExecutionService.getMilestoneDetails(
        this.props.projectId,
        this.props.milestoneId
      );
      this.state.milestone = m;
      this.state.progressInput = m.completionPercentage;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load milestone details';
    } finally {
      this.state.isLoading = false;
    }
  }

  setProgressInput(val: number): void {
    this.state.progressInput = Math.max(0, Math.min(100, val));
  }

  async updateProgress(): Promise<void> {
    if (this.state.isSubmitting || !this.state.milestone) return;
    this.state.isSubmitting = true;
    this.state.error = null;
    try {
      const updated = await mobileProfessionalProjectExecutionService.updateMilestoneProgress(
        this.props.projectId,
        this.props.milestoneId,
        this.state.progressInput
      );
      this.state.milestone = updated;
      this.state.statusMessage = `Milestone progress updated to ${updated.completionPercentage}%.`;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Failed to update progress';
    } finally {
      this.state.isSubmitting = false;
    }
  }

  async markComplete(): Promise<void> {
    this.state.progressInput = 100;
    await this.updateProgress();
  }

  getState() {
    return { ...this.state };
  }
}

export function renderProfessionalMilestoneDetailsScreen(
  controller: ProfessionalMilestoneDetailsScreenController,
  onBack?: () => void
): string {
  const { milestone, isLoading, isSubmitting, progressInput, error, statusMessage } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Milestone Details...</p>
      </div>
    `;
  }

  if (!milestone) {
    return `
      <div class="mobile-container p-6 text-center space-y-4">
        <h2 class="text-base font-bold text-stone-800">Milestone Not Found</h2>
        ${
          onBack
            ? `<button onclick="onBack()" class="min-h-[44px] px-4 py-2 bg-stone-900 text-white font-bold rounded-xl text-xs">Return to Workspace</button>`
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
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Milestone Execution</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">${milestone.name}</h1>
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

      <!-- Milestone Card Overview -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
        <div class="flex items-center justify-between">
          <span class="dbc-badge ${
            milestone.status === 'APPROVED'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : milestone.status === 'COMPLETED'
              ? 'bg-amber-100 text-amber-800 border-amber-200'
              : milestone.status === 'IN_PROGRESS'
              ? 'bg-blue-100 text-blue-800 border-blue-200'
              : 'bg-stone-100 text-stone-700 border-stone-200'
          } text-[8px] font-bold uppercase">
            ${milestone.statusLabel}
          </span>
          <span class="text-emerald-800 font-black text-sm">${milestone.budgetFormatted}</span>
        </div>

        ${milestone.description ? `<p class="text-xs text-stone-600 font-medium leading-relaxed">${milestone.description}</p>` : ''}

        <div class="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 text-[11px]">
          <div>
            <span class="text-stone-400 block text-[9.5px] font-bold uppercase">Planned Start</span>
            <span class="font-bold text-stone-800">${milestone.plannedStart || 'N/A'}</span>
          </div>
          <div>
            <span class="text-stone-400 block text-[9.5px] font-bold uppercase">Planned End</span>
            <span class="font-bold text-stone-800">${milestone.plannedEnd || 'N/A'}</span>
          </div>
        </div>
      </div>

      <!-- Update Completion Percentage Input -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
        <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider">Update Progress Percentage</h3>

        <div class="space-y-3">
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="text-stone-600">Completion %</span>
            <span class="text-emerald-800 text-base font-black">${progressInput}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value="${progressInput}"
            oninput="controller.setProgressInput(parseInt(this.value, 10))"
            class="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
          />

          <div class="flex items-center gap-2 pt-2">
            <button
              onclick="controller.updateProgress()"
              ${isSubmitting ? 'disabled' : ''}
              class="flex-1 min-h-[44px] py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
            >
              ${isSubmitting ? 'Saving...' : 'Save Progress %'}
            </button>
            <button
              onclick="controller.markComplete()"
              ${isSubmitting ? 'disabled' : ''}
              class="flex-1 min-h-[44px] py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
            >
              Mark 100% Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
