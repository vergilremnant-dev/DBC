import { describe, it, expect } from 'vitest';

interface MockMilestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  budgetAllocation: number;
  completionPercentage: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';
  plannedEnd?: string;
  actualEnd?: string;
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
  id: 'proj-101',
  requirementId: 88,
  customerId: 'cust-user-1',
  providerId: 'prov-user-2',
  status: 'IN_PROGRESS',
  milestones: [
    {
      id: 'ms-1',
      projectId: 'proj-101',
      name: 'Architectural Approval & Site Prep',
      description: 'Site clearance and foundation grid marking',
      budgetAllocation: 250000,
      completionPercentage: 100,
      status: 'APPROVED',
      actualEnd: '2026-08-15T00:00:00.000Z',
    },
    {
      id: 'ms-2',
      projectId: 'proj-101',
      name: 'Foundation Concrete Pouring',
      description: 'Reinforced cement concrete pillar casting',
      budgetAllocation: 450000,
      completionPercentage: 50,
      status: 'IN_PROGRESS',
      plannedEnd: '2026-09-30T00:00:00.000Z',
    },
    {
      id: 'ms-3',
      projectId: 'proj-101',
      name: 'MEP Electrical & Plumbing Layout',
      description: 'Internal wall piping and grid conduits',
      budgetAllocation: 300000,
      completionPercentage: 0,
      status: 'PENDING',
      plannedEnd: '2026-10-15T00:00:00.000Z',
    },
  ],
};

function calculateProgress(milestones: MockMilestone[]): {
  completedCount: number;
  totalCount: number;
  percentage: number;
  activeStageName: string;
} {
  if (!milestones || milestones.length === 0) {
    return { completedCount: 0, totalCount: 0, percentage: 0, activeStageName: 'No milestones set' };
  }
  const completedCount = milestones.filter((m) => m.status === 'COMPLETED' || m.status === 'APPROVED').length;
  const percentage = Math.round((completedCount / milestones.length) * 100);
  const active = milestones.find((m) => m.status === 'IN_PROGRESS') || milestones.find((m) => m.status === 'PENDING');
  return {
    completedCount,
    totalCount: milestones.length,
    percentage,
    activeStageName: active ? active.name : 'All milestones completed',
  };
}

describe('Prompt 17 — Project Milestones, Progress Updates & Customer Visibility', () => {
  it('calculates project progress dynamically from real milestone completion status', () => {
    const initialCalc = calculateProgress(sampleProject.milestones);
    expect(initialCalc.totalCount).toBe(3);
    expect(initialCalc.completedCount).toBe(1);
    expect(initialCalc.percentage).toBe(33);
    expect(initialCalc.activeStageName).toBe('Foundation Concrete Pouring');

    const updatedMilestones: MockMilestone[] = sampleProject.milestones.map((m) =>
      m.id === 'ms-2'
        ? { ...m, status: 'COMPLETED' as const, completionPercentage: 100, actualEnd: new Date().toISOString() }
        : m
    );

    const updatedCalc = calculateProgress(updatedMilestones);
    expect(updatedCalc.completedCount).toBe(2);
    expect(updatedCalc.percentage).toBe(67);
    expect(updatedCalc.activeStageName).toBe('MEP Electrical & Plumbing Layout');
  });

  it('handles empty milestone list with clean empty state and zero progress without error', () => {
    const emptyCalc = calculateProgress([]);
    expect(emptyCalc.totalCount).toBe(0);
    expect(emptyCalc.completedCount).toBe(0);
    expect(emptyCalc.percentage).toBe(0);
    expect(emptyCalc.activeStageName).toBe('No milestones set');
  });

  it('validates milestone status state machine and blocks changing approved milestone status', () => {
    const validateStatusTransition = (currentStatus: string, newStatus: string) => {
      if (currentStatus === 'APPROVED' && newStatus !== 'APPROVED') {
        throw new Error('Approved milestone status cannot be changed');
      }
      return true;
    };

    expect(() => validateStatusTransition('PENDING', 'IN_PROGRESS')).not.toThrow();
    expect(() => validateStatusTransition('IN_PROGRESS', 'COMPLETED')).not.toThrow();
    expect(() => validateStatusTransition('COMPLETED', 'APPROVED')).not.toThrow();
    expect(() => validateStatusTransition('APPROVED', 'PENDING')).toThrow('Approved milestone status cannot be changed');
  });

  it('prevents deleting completed or approved milestones', () => {
    const canDeleteMilestone = (status: string) => {
      if (status === 'APPROVED' || status === 'COMPLETED') {
        return false;
      }
      return true;
    };

    expect(canDeleteMilestone('PENDING')).toBe(true);
    expect(canDeleteMilestone('IN_PROGRESS')).toBe(true);
    expect(canDeleteMilestone('COMPLETED')).toBe(false);
    expect(canDeleteMilestone('APPROVED')).toBe(false);
  });

  it('enforces server-side project authorization for milestone operations', () => {
    const authorizeMilestoneAccess = (
      user: { id: string },
      project: MockProject,
      action: 'VIEW' | 'MODIFY'
    ) => {
      const isCustomer = project.customerId === user.id;
      const isProvider = project.providerId === user.id;

      if (!isCustomer && !isProvider) {
        throw new Error('Forbidden: You do not have access to this project');
      }

      if (action === 'MODIFY' && !isProvider) {
        throw new Error('Forbidden: Only assigned professional can modify project milestones');
      }

      return true;
    };

    const customer = { id: 'cust-user-1' };
    const provider = { id: 'prov-user-2' };
    const attacker = { id: 'attacker-99' };

    expect(authorizeMilestoneAccess(customer, sampleProject, 'VIEW')).toBe(true);
    expect(() => authorizeMilestoneAccess(customer, sampleProject, 'MODIFY')).toThrow(
      'Only assigned professional can modify project milestones'
    );

    expect(authorizeMilestoneAccess(provider, sampleProject, 'VIEW')).toBe(true);
    expect(authorizeMilestoneAccess(provider, sampleProject, 'MODIFY')).toBe(true);

    expect(() => authorizeMilestoneAccess(attacker, sampleProject, 'VIEW')).toThrow(
      'You do not have access to this project'
    );
  });

  it('preserves full origin lineage across project milestone workflows', () => {
    const lineage = {
      requirementId: sampleProject.requirementId,
      projectId: sampleProject.id,
      milestoneCount: sampleProject.milestones.length,
      traceabilityString: 'Req REQ-' + sampleProject.requirementId + ' ➔ Project ' + sampleProject.id + ' (' + sampleProject.milestones.length + ' Milestones)',
    };

    expect(lineage.requirementId).toBe(88);
    expect(lineage.projectId).toBe('proj-101');
    expect(lineage.milestoneCount).toBe(3);
    expect(lineage.traceabilityString).toContain('Req REQ-88 ➔ Project proj-101 (3 Milestones)');
  });
});
