import { mobileProfessionalProjectExecutionService } from '../../services/mobileProfessionalProjectExecutionService.js';
import type { ProfessionalProjectOverview } from '../../types/professionalProjectExecutionMobileTypes.js';
import {
  renderProfessionalProjectOverviewScreen,
  ProfessionalProjectOverviewScreenController,
} from './ProfessionalProjectOverviewScreen.js';
import {
  renderProfessionalMilestonesScreen,
  ProfessionalMilestonesScreenController,
} from './ProfessionalMilestonesScreen.js';
import {
  renderProfessionalProjectTimelineScreen,
  ProfessionalProjectTimelineScreenController,
} from './ProfessionalProjectTimelineScreen.js';
import {
  renderProfessionalProjectDocumentsScreen,
  ProfessionalProjectDocumentsScreenController,
} from './ProfessionalProjectDocumentsScreen.js';
import {
  renderProfessionalProjectFinancialsScreen,
  ProfessionalProjectFinancialsScreenController,
} from '../finance/ProfessionalProjectFinancialsScreen.js';

export type ProfessionalWorkspaceTab = 'OVERVIEW' | 'MILESTONES' | 'TIMELINE' | 'DOCUMENTS' | 'FINANCIALS' | 'COMPLETION';

export interface ProfessionalProjectWorkspaceScreenProps {
  projectId: string;
  initialTab?: ProfessionalWorkspaceTab;
  onSelectMilestone?: (milestoneId: string) => void;
  onMessageCustomer?: (projectId: string) => void;
  onBack?: () => void;
}

export class ProfessionalProjectWorkspaceScreenController {
  private props: ProfessionalProjectWorkspaceScreenProps;
  private state: {
    activeTab: ProfessionalWorkspaceTab;
    overview: ProfessionalProjectOverview | null;
    isLoading: boolean;
    error: string | null;
  };

  private overviewController: ProfessionalProjectOverviewScreenController | null = null;
  private milestonesController: ProfessionalMilestonesScreenController | null = null;
  private timelineController: ProfessionalProjectTimelineScreenController | null = null;
  private documentsController: ProfessionalProjectDocumentsScreenController | null = null;
  private financialsController: ProfessionalProjectFinancialsScreenController | null = null;

  constructor(props: ProfessionalProjectWorkspaceScreenProps) {
    this.props = props;
    this.state = {
      activeTab: props.initialTab || 'OVERVIEW',
      overview: null,
      isLoading: true,
      error: null,
    };
  }

  async init(): Promise<void> {
    await this.loadWorkspaceData();
  }

  async loadWorkspaceData(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const overview = await mobileProfessionalProjectExecutionService.getProjectOverview(this.props.projectId);
      this.state.overview = overview;

      // Initialize sub-controllers
      this.overviewController = new ProfessionalProjectOverviewScreenController({
        projectId: this.props.projectId,
        onNavigateTab: (tab) => this.setTab(tab),
        onMessageCustomer: this.props.onMessageCustomer,
      });
      await this.overviewController.init();

      this.milestonesController = new ProfessionalMilestonesScreenController({
        projectId: this.props.projectId,
        onSelectMilestone: this.props.onSelectMilestone,
      });
      await this.milestonesController.init();

      this.timelineController = new ProfessionalProjectTimelineScreenController({
        projectId: this.props.projectId,
      });
      await this.timelineController.init();

      this.documentsController = new ProfessionalProjectDocumentsScreenController({
        projectId: this.props.projectId,
      });
      await this.documentsController.init();

      this.financialsController = new ProfessionalProjectFinancialsScreenController({
        projectId: this.props.projectId,
      });
      await this.financialsController.init();
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load project workspace';
    } finally {
      this.state.isLoading = false;
    }
  }

  setTab(tab: ProfessionalWorkspaceTab): void {
    this.state.activeTab = tab;
  }

  getState() {
    return { ...this.state };
  }

  getOverviewController() {
    return this.overviewController;
  }
  getMilestonesController() {
    return this.milestonesController;
  }
  getTimelineController() {
    return this.timelineController;
  }
  getDocumentsController() {
    return this.documentsController;
  }
  getFinancialsController() {
    return this.financialsController;
  }
}

export function renderProfessionalProjectWorkspaceScreen(
  controller: ProfessionalProjectWorkspaceScreenController,
  onSelectMilestone?: (milestoneId: string) => void,
  onMessageCustomer?: (projectId: string) => void,
  onBack?: () => void
): string {
  const { activeTab, overview, isLoading, error } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Construction Workspace...</p>
      </div>
    `;
  }

  if (error || !overview) {
    return `
      <div class="mobile-container p-6 text-center space-y-4">
        <h2 class="text-base font-bold text-stone-800">Project Not Found</h2>
        <p class="text-xs text-stone-500">${error || 'Unable to locate project parameters.'}</p>
        ${
          onBack
            ? `<button onclick="onBack()" class="min-h-[44px] px-4 py-2 bg-stone-900 text-white font-bold rounded-xl text-xs">Back to Projects</button>`
            : ''
        }
      </div>
    `;
  }

  return `
    <div class="mobile-container p-4 space-y-4 select-none pb-20">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          ${
            onBack
              ? `<button onclick="onBack()" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold">←</button>`
              : ''
          }
          <div>
            <div class="flex items-center gap-2">
              <span class="text-[9px] font-mono text-stone-400 font-bold">PROJ-#${overview.id}</span>
              <span class="dbc-badge bg-emerald-100 text-emerald-800 border-emerald-200 text-[8px] font-bold uppercase">
                ${overview.statusLabel}
              </span>
            </div>
            <h1 class="text-base font-bold text-stone-900 font-serif">${overview.title}</h1>
            <span class="text-[10.5px] text-stone-500 font-semibold block">Client: ${overview.customerName}</span>
          </div>
        </div>

        ${
          onMessageCustomer
            ? `<button
                onclick="onMessageCustomer('${overview.id}')"
                class="min-h-[44px] px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                💬 Chat
              </button>`
            : ''
        }
      </div>

      <!-- Contextual Workspace Tabs -->
      <div class="flex gap-1.5 border-b border-stone-200 pb-2 overflow-x-auto">
        ${[
          { id: 'OVERVIEW', label: 'Overview' },
          { id: 'MILESTONES', label: 'Milestones' },
          { id: 'TIMELINE', label: 'Timeline' },
          { id: 'DOCUMENTS', label: 'Documents' },
          { id: 'FINANCIALS', label: 'Financials' },
        ]
          .map(
            (tab) => `
          <button
            onclick="controller.setTab('${tab.id}')"
            class="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition ${
              activeTab === tab.id
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }"
          >
            ${tab.label}
          </button>
        `
          )
          .join('')}
      </div>

      <!-- Tab Content Area -->
      <div>
        ${
          activeTab === 'OVERVIEW' && controller.getOverviewController()
            ? renderProfessionalProjectOverviewScreen(controller.getOverviewController()!)
            : activeTab === 'MILESTONES' && controller.getMilestonesController()
            ? renderProfessionalMilestonesScreen(controller.getMilestonesController()!, onSelectMilestone)
            : activeTab === 'TIMELINE' && controller.getTimelineController()
            ? renderProfessionalProjectTimelineScreen(controller.getTimelineController()!)
            : activeTab === 'DOCUMENTS' && controller.getDocumentsController()
            ? renderProfessionalProjectDocumentsScreen(controller.getDocumentsController()!)
            : activeTab === 'FINANCIALS' && controller.getFinancialsController()
            ? renderProfessionalProjectFinancialsScreen(controller.getFinancialsController()!)
            : ''
        }
      </div>
    </div>
  `;
}
