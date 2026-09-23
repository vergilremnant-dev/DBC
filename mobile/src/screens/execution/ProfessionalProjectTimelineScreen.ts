import { mobileProfessionalProjectExecutionService } from '../../services/mobileProfessionalProjectExecutionService.js';
import type { MobileTimelineEvent } from '../../types/projectExecutionMobileTypes.js';

export interface ProfessionalProjectTimelineScreenProps {
  projectId: string;
}

export class ProfessionalProjectTimelineScreenController {
  private props: ProfessionalProjectTimelineScreenProps;
  private state: {
    events: MobileTimelineEvent[];
    isLoading: boolean;
    error: string | null;
  };

  constructor(props: ProfessionalProjectTimelineScreenProps) {
    this.props = props;
    this.state = {
      events: [],
      isLoading: true,
      error: null,
    };
  }

  async init(): Promise<void> {
    await this.loadTimeline();
  }

  async loadTimeline(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const items = await mobileProfessionalProjectExecutionService.getProjectTimeline(this.props.projectId);
      this.state.events = items;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load timeline activity';
    } finally {
      this.state.isLoading = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderProfessionalProjectTimelineScreen(
  controller: ProfessionalProjectTimelineScreenController
): string {
  const { events, isLoading, error } = controller.getState();

  if (isLoading) {
    return `
      <div class="p-6 text-center text-xs font-semibold text-stone-500">
        Loading Project Activity Feed...
      </div>
    `;
  }

  return `
    <div class="space-y-4 select-none">
      <h2 class="text-xs font-black uppercase text-stone-900 tracking-wider">Project Execution Timeline</h2>

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
        events.length === 0
          ? `
        <div class="p-8 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center space-y-2">
          <span class="text-3xl">📅</span>
          <p class="text-xs font-bold text-stone-800">No activity recorded yet.</p>
          <p class="text-[11px] text-stone-500 font-medium">Timeline events will be recorded here as site work progresses.</p>
        </div>
      `
          : `
        <div class="relative pl-4 space-y-4 border-l-2 border-emerald-500">
          ${events
            .map(
              (e) => `
            <div class="relative pl-3 space-y-1">
              <div class="absolute -left-[21px] top-1 w-3 h-3 bg-emerald-600 rounded-full border-2 border-white"></div>
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-mono text-emerald-800 font-bold uppercase">${e.eventType.replace(/_/g, ' ')}</span>
                <span class="text-[9.5px] text-stone-400 font-medium">${e.formattedDate}</span>
              </div>
              <p class="text-xs text-stone-800 font-bold leading-snug">${e.description}</p>
              ${e.actorEmail ? `<span class="text-[10px] text-stone-400 font-semibold block">By: ${e.actorEmail}</span>` : ''}
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
