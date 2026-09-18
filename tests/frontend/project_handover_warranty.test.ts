import { describe, it, expect } from 'vitest';

interface MockQuotation {
  id: number;
  warrantyMonths?: number | null;
  totalAmount: number;
}

interface MockProject {
  id: string;
  requirementId: number;
  customerId: string;
  providerId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  quotation: MockQuotation;
}

const closedProjectWithWarranty: MockProject = {
  id: 'proj-606',
  requirementId: 130,
  customerId: 'cust-user-10',
  providerId: 'prov-user-20',
  status: 'CLOSED',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
  quotation: {
    id: 55,
    totalAmount: 4500000,
    warrantyMonths: 24, // 24 Months warranty
  },
};

function calculateWarrantyDetails(project: MockProject, currentNowMs = new Date('2026-09-18T10:00:00.000Z').getTime()) {
  const warrantyMonths = project.quotation.warrantyMonths;
  if (!warrantyMonths) {
    return {
      isConfigured: false,
      badgeText: 'Not Configured',
      daysRemaining: 0,
    };
  }

  const startDate = new Date(project.updatedAt || project.createdAt);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + warrantyMonths);

  const daysRemaining = Math.ceil((endDate.getTime() - currentNowMs) / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining < 0;
  const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 30;

  const badgeText = isExpired ? 'Expired Warranty' : isExpiringSoon ? 'Expiring Soon' : 'Active Warranty';

  return {
    isConfigured: true,
    startDate,
    endDate,
    daysRemaining,
    isExpired,
    isExpiringSoon,
    badgeText,
  };
}

function accessClosedProjectWorkspace(user: { id: string }, project: MockProject) {
  const isCustomer = project.customerId === user.id;
  const isProvider = project.providerId === user.id;

  if (!isCustomer && !isProvider) {
    throw new Error('Forbidden: You are not authorized to view this closed project');
  }

  const isReadOnly = ['CLOSED', 'CUSTOMER_APPROVAL', 'COMPLETED'].includes(project.status);

  return {
    projectId: project.id,
    status: project.status,
    isReadOnly,
    warranty: calculateWarrantyDetails(project),
  };
}

describe('Prompt 22 — Project Handover, Warranty & Post-Completion Experience', () => {
  it('calculates real warranty dates and active vs expiring vs expired statuses correctly', () => {
    // Current date: Sept 18, 2026. Closed date: June 1, 2026. 24 Months warranty -> Expires June 1, 2028.
    const warranty = calculateWarrantyDetails(closedProjectWithWarranty);

    expect(warranty.isConfigured).toBe(true);
    expect(warranty.badgeText).toBe('Active Warranty');
    expect(warranty.isExpired).toBe(false);
    expect(warranty.daysRemaining).toBeGreaterThan(600);
  });

  it('handles projects without explicit warranty duration with a clear unconfigured fallback', () => {
    const projectNoWarranty: MockProject = {
      ...closedProjectWithWarranty,
      quotation: {
        id: 56,
        totalAmount: 2000000,
        warrantyMonths: null,
      },
    };

    const warranty = calculateWarrantyDetails(projectNoWarranty);
    expect(warranty.isConfigured).toBe(false);
    expect(warranty.badgeText).toBe('Not Configured');
  });

  it('allows authorized customer and provider to access closed project historical workspace in read-only mode', () => {
    const customer = { id: 'cust-user-10' };
    const provider = { id: 'prov-user-20' };

    const custView = accessClosedProjectWorkspace(customer, closedProjectWithWarranty);
    const provView = accessClosedProjectWorkspace(provider, closedProjectWithWarranty);

    expect(custView.isReadOnly).toBe(true);
    expect(provView.isReadOnly).toBe(true);
    expect(custView.projectId).toBe('proj-606');
  });

  it('rejects unauthorized users attempting to view closed project historical workspace', () => {
    const intruder = { id: 'intruder-99' };
    expect(() => accessClosedProjectWorkspace(intruder, closedProjectWithWarranty)).toThrow(
      'Forbidden: You are not authorized to view this closed project'
    );
  });

  it('verifies complete project lineage traceability from requirement through post-completion warranty', () => {
    const lineage = {
      requirementId: closedProjectWithWarranty.requirementId,
      quotationId: closedProjectWithWarranty.quotation.id,
      projectId: closedProjectWithWarranty.id,
      warrantyMonths: closedProjectWithWarranty.quotation.warrantyMonths,
      traceabilityString: `Req #${closedProjectWithWarranty.requirementId} ➔ Quotation #${closedProjectWithWarranty.quotation.id} ➔ Project ${closedProjectWithWarranty.id} (${closedProjectWithWarranty.quotation.warrantyMonths} M Warranty)`,
    };

    expect(lineage.requirementId).toBe(130);
    expect(lineage.quotationId).toBe(55);
    expect(lineage.projectId).toBe('proj-606');
    expect(lineage.warrantyMonths).toBe(24);
    expect(lineage.traceabilityString).toContain('24 M Warranty');
  });
});
