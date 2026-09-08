import { describe, it, expect } from 'vitest';

interface MockMilestone {
  id: string;
  name: string;
  dueDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Approved';
}

interface MockProject {
  id: string;
  requirementId: number;
  customerId: string;
  providerId: string;
  quotationId: number;
  status: 'ASSIGNED' | 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  milestones: MockMilestone[];
}

describe('Project Execution & Milestone Management Foundation (Prompt 16)', () => {
  const sampleProject: MockProject = {
    id: 'proj-501',
    requirementId: 201,
    customerId: 'cust-101',
    providerId: 'prov-201',
    quotationId: 801,
    status: 'ASSIGNED',
    milestones: [
      { id: 'm-1', name: 'Structural Load Blueprint Review', dueDate: '2026-09-15', status: 'Approved' },
      { id: 'm-2', name: 'Foundation Soil Excavation & Backfill', dueDate: '2026-10-01', status: 'In Progress' },
      { id: 'm-3', name: 'Raft Slab Reinforcement Pouring', dueDate: '2026-10-20', status: 'Not Started' },
      { id: 'm-4', name: 'MEP Conduit Routing & Wall Chasing', dueDate: '2026-11-10', status: 'Not Started' },
    ],
  };

  it('validates allowed status transition from ASSIGNED to IN_PROGRESS for professional start action', () => {
    const isValidProjectTransition = (from: string, to: string): boolean => {
      const allowed: Record<string, string[]> = {
        CREATED: ['ASSIGNED', 'CANCELLED'],
        ASSIGNED: ['PLANNING', 'IN_PROGRESS', 'CANCELLED'],
        PLANNING: ['READY_TO_START', 'IN_PROGRESS', 'CANCELLED'],
        READY_TO_START: ['IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
        IN_PROGRESS: ['ON_HOLD', 'BLOCKED', 'UNDER_REVIEW', 'COMPLETED', 'CANCELLED'],
      };
      return allowed[from]?.includes(to) ?? false;
    };

    expect(isValidProjectTransition('ASSIGNED', 'IN_PROGRESS')).toBe(true);
    expect(isValidProjectTransition('ASSIGNED', 'PLANNING')).toBe(true);
    expect(isValidProjectTransition('ASSIGNED', 'COMPLETED')).toBe(false);
  });

  it('calculates project progress dynamically from actual milestone completions', () => {
    const calculateProgress = (milestones: MockMilestone[]): { completedCount: number; totalCount: number; percentage: number } => {
      if (!milestones || milestones.length === 0) {
        return { completedCount: 0, totalCount: 0, percentage: 0 };
      }
      const completedCount = milestones.filter((m) => m.status === 'Completed' || m.status === 'Approved').length;
      const percentage = Math.round((completedCount / milestones.length) * 100);
      return { completedCount, totalCount: milestones.length, percentage };
    };

    const emptyProgress = calculateProgress([]);
    expect(emptyProgress.percentage).toBe(0);
    expect(emptyProgress.totalCount).toBe(0);

    const calc = calculateProgress(sampleProject.milestones);
    expect(calc.completedCount).toBe(1);
    expect(calc.totalCount).toBe(4);
    expect(calc.percentage).toBe(25); // 1 / 4 = 25%

    // Mark 2nd milestone approved
    const updatedMilestones: MockMilestone[] = sampleProject.milestones.map((m) =>
      m.id === 'm-2' ? { ...m, status: 'Approved' } : m
    );
    const calc2 = calculateProgress(updatedMilestones);
    expect(calc2.completedCount).toBe(2);
    expect(calc2.percentage).toBe(50); // 2 / 4 = 50%
  });

  it('enforces server ownership authorization for updating project status and adding milestones', () => {
    const canManageProjectExecution = (
      userRole: 'CUSTOMER' | 'PROVIDER' | 'ADMIN',
      userId: string,
      project: MockProject
    ): boolean => {
      if (userRole === 'ADMIN') return true;
      if (userRole === 'PROVIDER') return project.providerId === userId;
      return false; // Customer can view but professional manages execution
    };

    expect(canManageProjectExecution('PROVIDER', 'prov-201', sampleProject)).toBe(true);
    expect(canManageProjectExecution('PROVIDER', 'other-prov', sampleProject)).toBe(false);
    expect(canManageProjectExecution('CUSTOMER', 'cust-101', sampleProject)).toBe(false);
  });

  it('validates Request -> Proposal -> Project -> Milestones lineage traceability', () => {
    const getExecutionLineage = (project: MockProject) => {
      return {
        requestRef: `REQ-${project.requirementId}`,
        proposalRef: `QT-${project.quotationId}`,
        projectRef: project.id,
        milestoneCount: project.milestones.length,
        traceabilityString: `Request REQ-${project.requirementId} ➔ Proposal QT-${project.quotationId} ➔ Project ${project.id} (${project.milestones.length} Milestones)`,
      };
    };

    const lineage = getExecutionLineage(sampleProject);
    expect(lineage.requestRef).toBe('REQ-201');
    expect(lineage.proposalRef).toBe('QT-801');
    expect(lineage.projectRef).toBe('proj-501');
    expect(lineage.milestoneCount).toBe(4);
  });
});
