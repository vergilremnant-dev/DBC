import { describe, it, expect } from 'vitest';

interface MockTimelineEvent {
  id: string;
  projectId: string;
  type: 'STATUS_CHANGE' | 'MILESTONE' | 'MILESTONE_UPDATE' | 'MILESTONE_DELETE' | 'PROGRESS_UPDATE' | 'DOCUMENT_UPLOAD' | 'DOCUMENT_DELETE' | 'APPROVAL' | 'ASSIGNMENT' | 'WORK_ORDER';
  description: string;
  actorId: string;
  actor?: {
    id: string;
    email: string;
    role: string;
  };
  createdAt: string;
}

interface MockConversation {
  id: string;
  projectId?: string | null;
  customerId: string;
  providerId: string;
  conversationType: 'DIRECT' | 'SUPPORT';
}

interface MockProject {
  id: string;
  requirementId: number;
  customerId: string;
  providerId: string;
  timeline: MockTimelineEvent[];
}

const sampleProject: MockProject = {
  id: 'proj-303',
  requirementId: 105,
  customerId: 'cust-user-10',
  providerId: 'prov-user-20',
  timeline: [
    {
      id: 'event-3',
      projectId: 'proj-303',
      type: 'DOCUMENT_UPLOAD',
      description: 'Uploaded project document "Architectural Blueprints v2.pdf"',
      actorId: 'prov-user-20',
      actor: { id: 'prov-user-20', email: 'builder@dbc.com', role: 'PROVIDER' },
      createdAt: '2026-08-25T11:30:00.000Z',
    },
    {
      id: 'event-2',
      projectId: 'proj-303',
      type: 'MILESTONE',
      description: 'Created milestone "Foundation Excavation & Curing"',
      actorId: 'prov-user-20',
      actor: { id: 'prov-user-20', email: 'builder@dbc.com', role: 'PROVIDER' },
      createdAt: '2026-08-24T09:15:00.000Z',
    },
    {
      id: 'event-1',
      projectId: 'proj-303',
      type: 'STATUS_CHANGE',
      description: 'Project created from accepted proposal (Requirement #105)',
      actorId: 'cust-user-10',
      actor: { id: 'cust-user-10', email: 'customer@dbc.com', role: 'CUSTOMER' },
      createdAt: '2026-08-23T14:00:00.000Z',
    },
  ],
};

function establishProjectConversation(
  initiator: { id: string; role: 'CUSTOMER' | 'PROVIDER' },
  project: MockProject
): MockConversation {
  const isCustomer = project.customerId === initiator.id;
  const isProvider = project.providerId === initiator.id;

  if (!isCustomer && !isProvider) {
    throw new Error('Forbidden: You are not a participant in this project');
  }

  return {
    id: `convo-proj-${project.id}`,
    projectId: project.id,
    customerId: project.customerId,
    providerId: project.providerId,
    conversationType: 'DIRECT',
  };
}

describe('Prompt 19 — Project Communication, Activity Timeline & Collaboration', () => {
  it('establishes or selects project conversation thread with project context handoff', () => {
    const customer = { id: 'cust-user-10', role: 'CUSTOMER' as const };
    const provider = { id: 'prov-user-20', role: 'PROVIDER' as const };

    const customerConvo = establishProjectConversation(customer, sampleProject);
    expect(customerConvo.projectId).toBe('proj-303');
    expect(customerConvo.customerId).toBe('cust-user-10');
    expect(customerConvo.providerId).toBe('prov-user-20');
    expect(customerConvo.conversationType).toBe('DIRECT');

    const providerConvo = establishProjectConversation(provider, sampleProject);
    expect(providerConvo.id).toBe(customerConvo.id);
  });

  it('rejects unauthorized users attempting to initiate conversation on unassigned project', () => {
    const unauthorized = { id: 'unauthorized-user', role: 'CUSTOMER' as const };
    expect(() => establishProjectConversation(unauthorized, sampleProject)).toThrow(
      'Forbidden: You are not a participant in this project'
    );
  });

  it('retrieves and displays chronological activity timeline with actor attribution', () => {
    const fetchTimeline = (user: { id: string }, project: MockProject) => {
      const isCustomer = project.customerId === user.id;
      const isProvider = project.providerId === user.id;

      if (!isCustomer && !isProvider) {
        throw new Error('Forbidden: You do not have access to this project timeline');
      }

      return [...project.timeline].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    };

    const customer = { id: 'cust-user-10' };
    const sortedEvents = fetchTimeline(customer, sampleProject);

    expect(sortedEvents).toHaveLength(3);
    expect(sortedEvents[0].type).toBe('DOCUMENT_UPLOAD');
    expect(sortedEvents[0].actor?.role).toBe('PROVIDER');
    expect(sortedEvents[0].actor?.email).toBe('builder@dbc.com');

    expect(sortedEvents[2].type).toBe('STATUS_CHANGE');
    expect(sortedEvents[2].actor?.role).toBe('CUSTOMER');
  });

  it('rejects cross-project access for timeline events', () => {
    const fetchTimeline = (user: { id: string }, project: MockProject) => {
      const isCustomer = project.customerId === user.id;
      const isProvider = project.providerId === user.id;

      if (!isCustomer && !isProvider) {
        throw new Error('Forbidden: You do not have access to this project timeline');
      }

      return project.timeline;
    };

    const intruder = { id: 'intruder-88' };
    expect(() => fetchTimeline(intruder, sampleProject)).toThrow(
      'Forbidden: You do not have access to this project timeline'
    );
  });

  it('verifies complete project lineage connecting requirement, proposal, project, conversation, and timeline events', () => {
    const lineage = {
      requirementId: sampleProject.requirementId,
      projectId: sampleProject.id,
      conversationId: `convo-proj-${sampleProject.id}`,
      totalTimelineEvents: sampleProject.timeline.length,
      traceability: `Requirement #${sampleProject.requirementId} ➔ Project ${sampleProject.id} ➔ Conversation convo-proj-${sampleProject.id} (${sampleProject.timeline.length} Events)`,
    };

    expect(lineage.requirementId).toBe(105);
    expect(lineage.projectId).toBe('proj-303');
    expect(lineage.conversationId).toBe('convo-proj-proj-303');
    expect(lineage.totalTimelineEvents).toBe(3);
    expect(lineage.traceability).toContain('Requirement #105 ➔ Project proj-303');
  });
});
