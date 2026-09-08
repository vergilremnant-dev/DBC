import { ProjectStatus } from '@prisma/client';

export const ALLOWED_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  CREATED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['PLANNING', 'IN_PROGRESS', 'CANCELLED'],
  PLANNING: ['READY_TO_START', 'IN_PROGRESS', 'CANCELLED'],
  READY_TO_START: ['IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
  IN_PROGRESS: ['ON_HOLD', 'BLOCKED', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED'],
  ON_HOLD: ['IN_PROGRESS', 'READY_TO_START', 'CANCELLED'],
  BLOCKED: ['IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
  UNDER_REVIEW: ['COMPLETED', 'IN_PROGRESS', 'CANCELLED'],
  COMPLETED: ['CUSTOMER_APPROVAL', 'REOPENED'],
  CUSTOMER_APPROVAL: ['CLOSED', 'REOPENED'],
  CLOSED: ['ARCHIVED'],
  ARCHIVED: [],
  CANCELLED: [],
  SUSPENDED: ['REOPENED'],
  DELAYED: ['IN_PROGRESS', 'ON_HOLD'],
  REOPENED: ['PLANNING', 'IN_PROGRESS'],
};

export function isValidTransition(from: ProjectStatus, to: ProjectStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export function validateTransition(from: ProjectStatus, to: ProjectStatus): void {
  if (!isValidTransition(from, to)) {
    throw new Error(`Invalid status transition from ${from} to ${to}`);
  }
}
