import { mobileProfessionalWorkspaceService } from '../../services/mobileProfessionalWorkspaceService.js';
import type { MobileProfessionalProject } from '../../types/professionalWorkspaceMobileTypes.js';

export interface ProfessionalProjectsScreenProps {
  onSelectProject?: (projectId: string) => void;
  onBack?: () => void;
}

export class ProfessionalProjectsScreenController {
  private props: ProfessionalProjectsScreenProps;
  private state: {
    projects: MobileProfessionalProject[];
    isLoading: boolean;
    error: string | null;
  };

  constructor(props: ProfessionalProjectsScreenProps) {
    this.props = props;
    this.state = {
      projects: [],
      isLoading: true,
      error: null,
    };
  }

  async init(): Promise<void> {
    await this.loadProjects();
  }

  async loadProjects(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const projects = await mobileProfessionalWorkspaceService.getProfessionalProjects();
      this.state.projects = projects;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load active projects';
    } finally {
      this.state.isLoading = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderProfessionalProjectsScreen(
  controller: ProfessionalProjectsScreenController,
  onSelectProject?: (projectId: string) => void,
  onBack?: () => void
): string {
  const { projects, isLoading, error } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Construction Projects...</p>
      </div>
    `;
  }

  return `
    <div class="mobile-container p-4 space-y-5 select-none">
      <!-- Header -->
      <div class="flex items-center gap-3">
        ${
          onBack
            ? `<button onclick="onBack()" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold">←</button>`
            : ''
        }
        <div>
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Active Portfolio</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Contractor Builds & Projects</h1>
        </div>
      </div>

      ${
        error
          ? `
        <div class="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-800">
          ${error}
        </div>
      `
          : ''
      }

      <!-- Projects Cards List -->
      ${
        projects.length === 0
          ? `
        <div class="p-8 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
          <span class="text-3xl">🔨</span>
          <p class="text-xs font-bold text-stone-800">No active construction projects.</p>
          <p class="text-[11px] text-stone-500 font-medium">Projects will appear here once a customer accepts your quotation.</p>
        </div>
      `
          : `
        <div class="space-y-3">
          ${projects
            .map(
              (p) => `
            <div
              onclick="${onSelectProject ? `onSelectProject('${p.id}')` : ''}"
              class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3 hover:border-emerald-400 cursor-pointer transition min-h-[44px]"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h3 class="text-xs font-black text-stone-900">${p.title}</h3>
                  <span class="text-[10.5px] text-stone-500 font-semibold block mt-0.5">Customer: ${p.customerName}</span>
                </div>
                <span class="dbc-badge bg-emerald-100 text-emerald-800 border-emerald-200 text-[8px] font-bold uppercase">
                  ${p.statusLabel}
                </span>
              </div>

              <!-- Progress bar -->
              <div class="space-y-1">
                <div class="flex justify-between text-[10px] font-bold text-stone-600">
                  <span>Overall Execution: ${p.progressPercentage}%</span>
                  <span class="truncate max-w-[150px]">Milestone: ${p.currentMilestoneName}</span>
                </div>
                <div class="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div class="h-full bg-emerald-600 rounded-full" style="width: ${p.progressPercentage}%"></div>
                </div>
              </div>

              <div class="flex items-center justify-between pt-1 border-t border-stone-100 text-xs font-bold text-stone-800">
                <span class="text-[10px] text-stone-500 font-medium">Started: ${p.startDate}</span>
                <span class="text-emerald-800 font-serif font-extrabold text-sm">${p.totalBudgetFormatted}</span>
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
