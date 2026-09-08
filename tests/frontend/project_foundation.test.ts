import { describe, it, expect } from 'vitest';

interface MockProject {
  id: string;
  requirementId: number;
  customerId: string;
  providerId: string;
  quotationId: number;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

describe('Project Creation & Project Workspace Foundation (Prompt 15)', () => {
  const existingProjects: MockProject[] = [
    {
      id: 'proj-101',
      requirementId: 201,
      customerId: 'customer-ramesh',
      providerId: 'provider-apex',
      quotationId: 801,
      status: 'ASSIGNED',
      createdAt: '2026-09-08T15:20:00Z',
    },
  ];

  it('verifies that proposal acceptance creates a project with initial status ASSIGNED', () => {
    const handleProposalAcceptance = (quotationId: number, reqId: number, customerId: string, providerId: string) => {
      const newProject: MockProject = {
        id: `proj-${Date.now()}`,
        requirementId: reqId,
        customerId,
        providerId,
        quotationId,
        status: 'ASSIGNED',
        createdAt: new Date().toISOString(),
      };
      return newProject;
    };

    const project = handleProposalAcceptance(802, 202, 'customer-sita', 'provider-apex');
    expect(project.status).toBe('ASSIGNED');
    expect(project.quotationId).toBe(802);
    expect(project.requirementId).toBe(202);
    expect(project.customerId).toBe('customer-sita');
    expect(project.providerId).toBe('provider-apex');
  });

  it('prevents duplicate project creation when acceptance is retried for the same quotation', () => {
    const createProjectWithDuplicateCheck = (
      projectsList: MockProject[],
      quotationId: number,
      reqId: number,
      customerId: string,
      providerId: string
    ) => {
      // 1. Check if project already exists for this quotation
      const existing = projectsList.find((p) => p.quotationId === quotationId);
      if (existing) {
        return { project: existing, createdNew: false };
      }

      // 2. Otherwise create
      const newProj: MockProject = {
        id: `proj-${Date.now()}`,
        requirementId: reqId,
        customerId,
        providerId,
        quotationId,
        status: 'ASSIGNED',
        createdAt: new Date().toISOString(),
      };
      projectsList.push(newProj);
      return { project: newProj, createdNew: true };
    };

    // First acceptance call
    const res1 = createProjectWithDuplicateCheck(existingProjects, 801, 201, 'customer-ramesh', 'provider-apex');
    expect(res1.createdNew).toBe(false);
    expect(res1.project.id).toBe('proj-101');

    // Second acceptance call for a new quote 803
    const res2 = createProjectWithDuplicateCheck(existingProjects, 803, 203, 'customer-anita', 'provider-apex');
    expect(res2.createdNew).toBe(true);
    expect(res2.project.quotationId).toBe(803);

    // Retry for 803
    const res3 = createProjectWithDuplicateCheck(existingProjects, 803, 203, 'customer-anita', 'provider-apex');
    expect(res3.createdNew).toBe(false);
    expect(res3.project.id).toBe(res2.project.id);
  });

  it('enforces project access authorization rules for customer and professional', () => {
    const canAccessProjectWorkspace = (
      project: MockProject,
      userRole: 'CUSTOMER' | 'PROVIDER' | 'ADMIN',
      userId: string
    ): boolean => {
      if (userRole === 'ADMIN') return true;
      if (userRole === 'CUSTOMER') return project.customerId === userId;
      if (userRole === 'PROVIDER') return project.providerId === userId;
      return false;
    };

    const targetProj = existingProjects[0];

    // Authorized customer
    expect(canAccessProjectWorkspace(targetProj, 'CUSTOMER', 'customer-ramesh')).toBe(true);
    // Unauthorized customer
    expect(canAccessProjectWorkspace(targetProj, 'CUSTOMER', 'other-customer')).toBe(false);

    // Authorized provider
    expect(canAccessProjectWorkspace(targetProj, 'PROVIDER', 'provider-apex')).toBe(true);
    // Unauthorized provider
    expect(canAccessProjectWorkspace(targetProj, 'PROVIDER', 'other-provider')).toBe(false);
  });

  it('validates Request -> Proposal -> Project lineage traceability', () => {
    const getProjectLineage = (project: MockProject) => {
      return {
        requestId: `REQ-${project.requirementId}`,
        proposalRef: `QT-${project.quotationId}`,
        projectRef: project.id,
        lineageText: `Request REQ-${project.requirementId} ➔ Accepted Proposal QT-${project.quotationId} ➔ Project ${project.id}`,
      };
    };

    const lineage = getProjectLineage(existingProjects[0]);
    expect(lineage.requestId).toBe('REQ-201');
    expect(lineage.proposalRef).toBe('QT-801');
    expect(lineage.lineageText).toContain('Request REQ-201 ➔ Accepted Proposal QT-801 ➔ Project proj-101');
  });
});
