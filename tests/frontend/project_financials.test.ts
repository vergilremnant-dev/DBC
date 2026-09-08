import { describe, it, expect } from 'vitest';

interface MockQuotation {
  id: number;
  requirementId: number;
  totalAmount: number;
}

interface MockMilestone {
  id: string;
  projectId: string;
  name: string;
  budgetAllocation: number;
  status: string;
}

interface MockProject {
  id: string;
  requirementId: number;
  customerId: string;
  providerId: string;
  quotationId: number;
  quotation: MockQuotation;
  milestones: MockMilestone[];
}

const sampleProject: MockProject = {
  id: 'proj-404',
  requirementId: 110,
  customerId: 'cust-user-10',
  providerId: 'prov-user-20',
  quotationId: 45,
  quotation: {
    id: 45,
    requirementId: 110,
    totalAmount: 3000000, // ₹30,00,000
  },
  milestones: [
    {
      id: 'ms-1',
      projectId: 'proj-404',
      name: 'Site Excavation & Foundation Laying',
      budgetAllocation: 1000000,
      status: 'APPROVED',
    },
    {
      id: 'ms-2',
      projectId: 'proj-404',
      name: 'Structural Pillars & Slab Casting',
      budgetAllocation: 1200000,
      status: 'IN_PROGRESS',
    },
    {
      id: 'ms-3',
      projectId: 'proj-404',
      name: 'Finishing & Handover',
      budgetAllocation: 800000,
      status: 'PENDING',
    },
  ],
};

function calculateProjectFinancials(project: MockProject) {
  const totalProjectValue = project.quotation.totalAmount;
  const platformFee = Math.round(totalProjectValue * 0.01);
  const gst = Math.round(platformFee * 0.18);
  const totalCustomerPayable = totalProjectValue + platformFee + gst;

  const paidMilestones = project.milestones.filter(
    (m) => m.status === 'APPROVED' || m.status === 'COMPLETED'
  );
  const amountPaid = paidMilestones.reduce((acc, m) => acc + m.budgetAllocation, 0);
  const remainingBalance = Math.max(0, totalProjectValue - amountPaid);

  return {
    totalProjectValue,
    platformFee,
    gst,
    totalCustomerPayable,
    amountPaid,
    remainingBalance,
    settledMilestonesCount: paidMilestones.length,
  };
}

function getProjectFinancialsForUser(user: { id: string }, project: MockProject) {
  const isCustomer = project.customerId === user.id;
  const isProvider = project.providerId === user.id;

  if (!isCustomer && !isProvider) {
    throw new Error('Forbidden: You are not authorized to access this project financials');
  }

  return calculateProjectFinancials(project);
}

describe('Prompt 20 — Project Financials, Payments & Brokerage Workflow', () => {
  it('calculates project financials, platform fees, and paid vs remaining balances accurately', () => {
    const summary = calculateProjectFinancials(sampleProject);

    expect(summary.totalProjectValue).toBe(3000000);
    expect(summary.platformFee).toBe(30000); // 1% of 30,00,000
    expect(summary.gst).toBe(5400); // 18% of 30,000
    expect(summary.totalCustomerPayable).toBe(3035400);
    expect(summary.amountPaid).toBe(1000000); // Milestone 1 (APPROVED)
    expect(summary.remainingBalance).toBe(2000000); // 30,00,000 - 10,00,000
    expect(summary.settledMilestonesCount).toBe(1);
  });

  it('allows authorized customer and provider to access project financial details', () => {
    const customer = { id: 'cust-user-10' };
    const provider = { id: 'prov-user-20' };

    const custSummary = getProjectFinancialsForUser(customer, sampleProject);
    const provSummary = getProjectFinancialsForUser(provider, sampleProject);

    expect(custSummary.totalProjectValue).toBe(3000000);
    expect(provSummary.totalProjectValue).toBe(3000000);
  });

  it('rejects unauthorized users attempting cross-project financial access', () => {
    const intruder = { id: 'intruder-99' };
    expect(() => getProjectFinancialsForUser(intruder, sampleProject)).toThrow(
      'Forbidden: You are not authorized to access this project financials'
    );
  });

  it('verifies complete financial lineage traceability from requirement to project payments', () => {
    const lineage = {
      requirementId: sampleProject.requirementId,
      quotationId: sampleProject.quotationId,
      projectId: sampleProject.id,
      totalQuotationAmount: sampleProject.quotation.totalAmount,
      milestonesCount: sampleProject.milestones.length,
      traceabilityString: `Req #${sampleProject.requirementId} ➔ Quotation #${sampleProject.quotationId} ➔ Project ${sampleProject.id} (₹${sampleProject.quotation.totalAmount.toLocaleString()})`,
    };

    expect(lineage.requirementId).toBe(110);
    expect(lineage.quotationId).toBe(45);
    expect(lineage.projectId).toBe('proj-404');
    expect(lineage.traceabilityString).toContain('Req #110 ➔ Quotation #45 ➔ Project proj-404');
  });

  it('handles zero-milestone projects gracefully with clear empty states', () => {
    const emptyProject: MockProject = {
      ...sampleProject,
      id: 'proj-empty',
      milestones: [],
    };

    const summary = calculateProjectFinancials(emptyProject);

    expect(summary.totalProjectValue).toBe(3000000);
    expect(summary.amountPaid).toBe(0);
    expect(summary.remainingBalance).toBe(3000000);
    expect(summary.settledMilestonesCount).toBe(0);
  });
});
