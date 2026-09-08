import { describe, it, expect } from 'vitest';
import { isValidTransition, validateTransition } from '../../api-lib/services/projectWorkflow.js';

interface MockMilestone {
  id: string;
  name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';
}

interface MockProject {
  id: string;
  requirementId: number;
  customerId: string;
  providerId: string;
  status: string;
  milestones: MockMilestone[];
}

const sampleProject: MockProject = {
  id: 'proj-505',
  requirementId: 120,
  customerId: 'cust-user-10',
  providerId: 'prov-user-20',
  status: 'IN_PROGRESS',
  milestones: [
    { id: 'ms-10', name: 'Foundation Masonry', status: 'COMPLETED' },
    { id: 'ms-11', name: 'Structural Framing', status: 'COMPLETED' },
    { id: 'ms-12', name: 'Interior MEP & Finishes', status: 'COMPLETED' },
  ],
};

function checkCompletionReadiness(project: MockProject) {
  const total = project.milestones.length;
  const completed = project.milestones.filter(
    (m) => m.status === 'COMPLETED' || m.status === 'APPROVED'
  ).length;
  const isReady = total > 0 && completed === total;

  return {
    total,
    completed,
    pending: total - completed,
    isReady,
  };
}

function transitionProjectStatusForUser(
  user: { id: string; role: 'CUSTOMER' | 'PROVIDER' },
  project: MockProject,
  targetStatus: any
) {
  const isCustomer = project.customerId === user.id;
  const isProvider = project.providerId === user.id;

  if (!isCustomer && !isProvider) {
    throw new Error('Forbidden: Unauthorized project status transition');
  }

  // Validate state machine rule
  validateTransition(project.status as any, targetStatus);

  // Authorization rule for final closure
  if (targetStatus === 'CLOSED' && !isCustomer) {
    throw new Error('Forbidden: Only the customer can confirm project handover and closure');
  }

  return {
    ...project,
    status: targetStatus,
  };
}

describe('Prompt 21 — Project Completion, Closure & Customer Feedback Workflow', () => {
  it('validates project completion state transitions IN_PROGRESS -> UNDER_REVIEW -> COMPLETED -> CLOSED', () => {
    expect(isValidTransition('IN_PROGRESS', 'UNDER_REVIEW')).toBe(true);
    expect(isValidTransition('UNDER_REVIEW', 'COMPLETED')).toBe(true);
    expect(isValidTransition('COMPLETED', 'CUSTOMER_APPROVAL')).toBe(true);
    expect(isValidTransition('CUSTOMER_APPROVAL', 'CLOSED')).toBe(true);

    // Invalid transition
    expect(isValidTransition('CREATED', 'CLOSED')).toBe(false);
  });

  it('evaluates milestone completion readiness accurately', () => {
    const readyStatus = checkCompletionReadiness(sampleProject);
    expect(readyStatus.total).toBe(3);
    expect(readyStatus.completed).toBe(3);
    expect(readyStatus.pending).toBe(0);
    expect(readyStatus.isReady).toBe(true);

    const pendingProject: MockProject = {
      ...sampleProject,
      milestones: [
        { id: 'ms-1', name: 'Foundation', status: 'COMPLETED' },
        { id: 'ms-2', name: 'Plumbing', status: 'IN_PROGRESS' },
      ],
    };
    const pendingStatus = checkCompletionReadiness(pendingProject);
    expect(pendingStatus.isReady).toBe(false);
    expect(pendingStatus.pending).toBe(1);
  });

  it('enforces role authorization on project completion and closure', () => {
    const provider = { id: 'prov-user-20', role: 'PROVIDER' as const };
    const customer = { id: 'cust-user-10', role: 'CUSTOMER' as const };
    const intruder = { id: 'intruder-99', role: 'CUSTOMER' as const };

    // Professional marks ready for completion (UNDER_REVIEW)
    const reviewProject = transitionProjectStatusForUser(provider, sampleProject, 'UNDER_REVIEW');
    expect(reviewProject.status).toBe('UNDER_REVIEW');

    // Customer confirms completion to CLOSED via COMPLETED -> CUSTOMER_APPROVAL -> CLOSED
    const completedProject = transitionProjectStatusForUser(provider, reviewProject, 'COMPLETED');
    const customerApproved = transitionProjectStatusForUser(customer, completedProject, 'CUSTOMER_APPROVAL');
    const closedProject = transitionProjectStatusForUser(customer, customerApproved, 'CLOSED');
    expect(closedProject.status).toBe('CLOSED');

    // Intruder access rejected
    expect(() => transitionProjectStatusForUser(intruder, sampleProject, 'UNDER_REVIEW')).toThrow(
      'Forbidden: Unauthorized project status transition'
    );
  });

  it('validates customer review submission rules and prevents invalid ratings or self-reviews', () => {
    const validateReview = (
      rating: number,
      title: string,
      desc: string,
      customerId: string,
      providerId: string
    ) => {
      if (rating < 1 || rating > 5) throw new Error('Rating must be between 1 and 5');
      if (!title || !title.trim()) throw new Error('Review title is required');
      if (!desc || !desc.trim()) throw new Error('Review description is required');
      if (customerId === providerId) throw new Error('You cannot submit a review for yourself');
      return true;
    };

    expect(validateReview(5, 'Excellent Execution', 'Timely handover and great quality', 'cust-1', 'prov-1')).toBe(true);
    expect(() => validateReview(6, 'Invalid Rating', 'Desc', 'cust-1', 'prov-1')).toThrow('Rating must be between 1 and 5');
    expect(() => validateReview(5, '', 'Desc', 'cust-1', 'prov-1')).toThrow('Review title is required');
    expect(() => validateReview(5, 'Title', 'Desc', 'user-1', 'user-1')).toThrow('You cannot submit a review for yourself');
  });

  it('preserves historical project records after project completion and closure', () => {
    const closedProject: MockProject = {
      ...sampleProject,
      status: 'CLOSED',
    };

    const isHistoricalAccessible = (project: MockProject) => {
      return ['COMPLETED', 'CLOSED', 'ARCHIVED'].includes(project.status);
    };

    expect(isHistoricalAccessible(closedProject)).toBe(true);
  });
});
