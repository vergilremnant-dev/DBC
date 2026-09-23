import { mobileProfessionalProjectExecutionService } from '../../services/mobileProfessionalProjectExecutionService.js';
import type { MobileMilestoneItem } from '../../types/projectExecutionMobileTypes.js';

export interface ProfessionalMilestonesScreenProps {
  projectId: string;
  onSelectMilestone?: (milestoneId: string) => void;
  onBack?: () => void;
}

export class ProfessionalMilestonesScreenController {
  private props: ProfessionalMilestonesScreenProps;
  private state: {
    milestones: MobileMilestoneItem[];
    isLoading: boolean;
    isUpdating: boolean;
    activeMilestoneId: string | null;
    error: string | null;
    statusMessage: string | null;
  };

  constructor(props: ProfessionalMilestonesScreenProps) {
    this.props = props;
    this.state = {
      milestones: [],
      isLoading: true,
      isUpdating: false,
      activeMilestoneId: null,
      error: null,
      statusMessage: null,
    };
  }

  async init(): Promise<void> {
    await this.loadMilestones();
  }

  async loadMilestones(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const items = await mobileProfessionalProjectExecutionService.getProjectMilestones(this.props.projectId);
      this.state.milestones = items;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load milestones';
    } finally {
      this.state.isLoading = false;
    }
  }

  async startMilestone(milestoneId: string): Promise<void> {
    if (this.state.isUpdating) return;
    this.state.isUpdating = true;
    this.state.activeMilestoneId = milestoneId;
    this.state.error = null;
    try {
      await mobileProfessionalProjectExecutionService.startMilestone(this.props.projectId, milestoneId);
      await this.loadMilestones();
      this.state.statusMessage = 'Milestone started on site.';
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Failed to start milestone';
    } finally {
      this.state.isUpdating = false;
      this.state.activeMilestoneId = null;
    }
  }

  async markMilestoneComplete(milestoneId: string): Promise<void> {
    if (this.state.isUpdating) return;
    this.state.isUpdating = true;
    this.state.activeMilestoneId = milestoneId;
    this.state.error = null;
    try {
      await mobileProfessionalProjectExecutionService.markMilestoneComplete(this.props.projectId, milestoneId);
      await this.loadMilestones();
      this.state.statusMessage = 'Milestone marked as complete and submitted for customer approval.';
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Failed to complete milestone';
    } finally {
      this.state.isUpdating = false;
      this.state.activeMilestoneId = null;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderProfessionalMilestonesScreen(
  controller: ProfessionalMilestonesScreenController,
  onSelectMilestone?: (milestoneId: string) => void,
  onBack?: () => void
): string {
  const { milestones, isLoading, isUpdating, activeMilestoneId, error, statusMessage } = controller.getState();

  if (isLoading) {
    return `
      <div class="p-6 text-center text-xs font-semibold text-stone-500">
        Loading Construction Milestones...
      </div>
    `;
  }

  return `
    <div class="space-y-4 select-none">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          ${
            onBack
              ? `<button onclick="onBack()" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold">←</button>`
              : ''
          }
          <h2 class="text-xs font-black uppercase text-stone-900 tracking-wider">Project Milestones (${milestones.length})</h2>
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

      ${
        milestones.length === 0
          ? `
        <div class="p-8 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
          <span class="text-3xl">🧱</span>
          <p class="text-xs font-bold text-stone-800">No project milestones defined.</p>
          <p class="text-[11px] text-stone-500 font-medium">Project milestones will appear here once defined in the quotation proposal.</p>
        </div>
      `
          : `
        <div class="space-y-3">
          ${milestones
            .map(
              (m, idx) => `
            <div
              class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3 hover:border-emerald-400 transition"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <span class="text-[10px] font-bold text-stone-400 uppercase">Stage ${idx + 1}</span>
                  <h3
                    onclick="${onSelectMilestone ? `onSelectMilestone('${m.id}')` : ''}"
                    class="text-xs font-black text-stone-900 cursor-pointer hover:text-emerald-700"
                  >
                    ${m.name}
                  </h3>
                </div>
                <span class="dbc-badge ${
                  m.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : m.status === 'COMPLETED'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : m.status === 'IN_PROGRESS'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-stone-100 text-stone-700 border-stone-200'
                } text-[8px] font-bold uppercase shrink-0">
                  ${m.statusLabel}
                </span>
              </div>

              ${m.description ? `<p class="text-[11px] text-stone-600 font-medium">${m.description}</p>` : ''}

              <!-- Progress Bar & Allocation -->
              <div class="space-y-1.5 pt-1">
                <div class="flex items-center justify-between text-[10.5px] font-bold">
                  <span class="text-stone-500">Progress: <strong class="text-stone-900">${m.completionPercentage}%</strong></span>
                  <span class="text-emerald-800">Allocation: ${m.budgetFormatted}</span>
                </div>
                <div class="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div class="h-full bg-emerald-600 rounded-full" style="width: ${m.completionPercentage}%"></div>
                </div>
              </div>

              <!-- Contractor Milestone Actions -->
              <div class="flex items-center gap-2 pt-2 border-t border-stone-100">
                ${
                  m.status === 'PENDING'
                    ? `<button
                        onclick="controller.startMilestone('${m.id}')"
                        ${isUpdating && activeMilestoneId === m.id ? 'disabled' : ''}
                        class="flex-1 min-h-[44px] py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
                      >
                        Start Stage
                      </button>`
                    : ''
                }

                ${
                  m.status === 'IN_PROGRESS'
                    ? `<button
                        onclick="${onSelectMilestone ? `onSelectMilestone('${m.id}')` : ''}"
                        class="flex-1 min-h-[44px] py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition"
                      >
                        Update Progress
                      </button>
                      <button
                        onclick="controller.markMilestoneComplete('${m.id}')"
                        ${isUpdating && activeMilestoneId === m.id ? 'disabled' : ''}
                        class="flex-1 min-h-[44px] py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
                      >
                        Mark Complete
                      </button>`
                    : ''
                }

                ${
                  m.status === 'COMPLETED'
                    ? `<span class="text-[11px] font-bold text-amber-700">Awaiting Customer Approval</span>`
                    : ''
                }

                ${
                  m.status === 'APPROVED'
                    ? `<span class="text-[11px] font-bold text-emerald-800">Approved & Settled</span>`
                    : ''
                }
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
