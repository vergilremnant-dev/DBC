/**
 * Mobile Customer Project Timeline Screen Component & Controller for DBC Mobile Application.
 * Displays vertical chronological project activity events, timestamps, and milestone updates.
 */

import { mobileProjectExecutionService } from '../../services/mobileProjectExecutionService';
import { mobileTheme } from '../../theme/themeTokens';
import { MobileTimelineEvent } from '../../types/projectExecutionMobileTypes';

export interface CustomerProjectTimelineState {
  projectId: string;
  events: MobileTimelineEvent[];
  isLoading: boolean;
  errorMessage: string | null;
}

export class CustomerProjectTimelineController {
  private state: CustomerProjectTimelineState;

  constructor(projectId: string = '') {
    this.state = {
      projectId,
      events: [],
      isLoading: false,
      errorMessage: null,
    };
  }

  getState(): CustomerProjectTimelineState {
    return { ...this.state };
  }

  async loadTimeline(id?: string): Promise<void> {
    const targetId = id || this.state.projectId;
    if (!targetId) return;

    this.state.projectId = targetId;
    this.state.isLoading = true;
    this.state.errorMessage = null;

    try {
      this.state.events = await mobileProjectExecutionService.getProjectTimeline(targetId);
    } catch (err: unknown) {
      this.state.errorMessage = err instanceof Error ? err.message : 'Unable to load project timeline';
    } finally {
      this.state.isLoading = false;
    }
  }
}

export const renderCustomerProjectTimelineScreenDescriptor = (state: CustomerProjectTimelineState) => ({
  type: 'Screen',
  name: 'CustomerProjectTimelineScreen',
  styles: {
    backgroundColor: mobileTheme.colors.background,
    padding: mobileTheme.spacing.lg,
  },
  header: {
    title: 'Project Activity Timeline',
    subtitle: 'Chronological history of updates, milestone logs, and project events',
  },
  timelineEvents: state.events.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    description: e.description,
    formattedDate: e.formattedDate,
    actorEmail: e.actorEmail,
    minHeight: mobileTheme.touchTargets.minTouchArea,
  })),
  emptyState: !state.isLoading && state.events.length === 0 ? {
    title: 'No project activity recorded yet.',
    subtitle: 'Project activity will appear here as work progresses.',
  } : null,
  loader: state.isLoading,
  errorBanner: state.errorMessage,
});
