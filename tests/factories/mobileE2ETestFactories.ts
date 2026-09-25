/**
 * DBC Mobile E2E Test Factories.
 * Provides deterministic, isolated test fixtures for Customer, Professional, and Admin workflows.
 * Strictly free of production data.
 */

export interface E2EUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'contractor' | 'admin';
  phoneNumber: string;
}

export interface E2ERequest {
  id: string;
  bookingNumber: string;
  customerId: string;
  providerId: string;
  categoryName: string;
  title: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface E2EQuotation {
  id: number;
  requestId: string;
  customerId: string;
  providerId: string;
  totalAmount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  milestones: Array<{ id: string; name: string; cost: number }>;
}

export interface E2EProject {
  id: string;
  requirementId: number;
  quotationId: number;
  customerId: string;
  contractorId: string;
  title: string;
  status: 'ASSIGNED' | 'PLANNING' | 'IN_PROGRESS' | 'CUSTOMER_APPROVAL' | 'COMPLETED' | 'CLOSED';
  completionPercentage: number;
  milestones: Array<{ id: string; name: string; status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED'; budgetAllocation: number }>;
}

export function createE2ECustomerUser(overrides?: Partial<E2EUser>): E2EUser {
  return {
    id: `cust-e2e-${Date.now()}`,
    email: 'e2e.customer@dbc.in',
    firstName: 'Anand',
    lastName: 'Verma',
    role: 'customer',
    phoneNumber: '+919876543210',
    ...overrides,
  };
}

export function createE2EProfessionalUser(overrides?: Partial<E2EUser>): E2EUser {
  return {
    id: `pro-e2e-${Date.now()}`,
    email: 'e2e.contractor@dbc.in',
    firstName: 'Rajesh',
    lastName: 'Builders',
    role: 'contractor',
    phoneNumber: '+919876543211',
    ...overrides,
  };
}

export function createE2EAdminUser(overrides?: Partial<E2EUser>): E2EUser {
  return {
    id: `admin-e2e-${Date.now()}`,
    email: 'e2e.admin@dbc.in',
    firstName: 'Super',
    lastName: 'Admin',
    role: 'admin',
    phoneNumber: '+919876543212',
    ...overrides,
  };
}

export function createE2ERequest(customerId: string, providerId: string, overrides?: Partial<E2ERequest>): E2ERequest {
  const num = Math.floor(1000 + Math.random() * 9000);
  return {
    id: `req-e2e-${num}`,
    bookingNumber: `REQ-E2E-${num}`,
    customerId,
    providerId,
    categoryName: 'Civil & Architectural Execution',
    title: 'Raft Foundation & Structural Pillars',
    status: 'REQUESTED',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createE2EQuotation(requestId: string, customerId: string, providerId: string, overrides?: Partial<E2EQuotation>): E2EQuotation {
  const id = Math.floor(10000 + Math.random() * 90000);
  return {
    id,
    requestId,
    customerId,
    providerId,
    totalAmount: 150000,
    status: 'SUBMITTED',
    milestones: [
      { id: `ms-e2e-${id}-1`, name: 'Mobilization & Excavation (30%)', cost: 45000 },
      { id: `ms-e2e-${id}-2`, name: 'RCC Steel Casting (40%)', cost: 60000 },
      { id: `ms-e2e-${id}-3`, name: 'Final Handover & Curing (30%)', cost: 45000 },
    ],
    ...overrides,
  };
}

export function createE2EProject(quotation: E2EQuotation, overrides?: Partial<E2EProject>): E2EProject {
  const id = `proj-e2e-${quotation.id}`;
  return {
    id,
    requirementId: 501,
    quotationId: quotation.id,
    customerId: quotation.customerId,
    contractorId: quotation.providerId,
    title: 'Raft Foundation & Structural Pillars',
    status: 'ASSIGNED',
    completionPercentage: 0,
    milestones: quotation.milestones.map((m) => ({
      id: m.id,
      name: m.name,
      status: 'PENDING',
      budgetAllocation: m.cost,
    })),
    ...overrides,
  };
}
