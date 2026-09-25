/**
 * Reusable Test Factories & Fixtures for Mobile Quality Engineering.
 * Provides isolated test objects for Users, Requests, Quotations, Projects,
 * Milestones, Payments, Messages, and Notifications.
 *
 * CRITICAL RULE:
 * Fixtures exist ONLY in the tests/ directory and are strictly prohibited
 * from being imported or referenced inside production mobile/src/ code.
 */

import { MobileUser } from '../../mobile/src/state/authStore';

export interface TestUserFixture extends MobileUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'contractor' | 'admin';
}

export interface TestRequestFixture {
  id: string;
  title: string;
  budget: number;
  location: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
  customerId: string;
}

export interface TestQuotationFixture {
  id: string;
  requestId: string;
  totalPrice: number;
  status: 'DRAFT' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  professionalId: string;
}

export interface TestProjectFixture {
  id: string;
  title: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'DISPUTED';
  progressPercentage: number;
  customerId: string;
  professionalId: string;
}

export interface TestMilestoneFixture {
  id: string;
  projectId: string;
  title: string;
  amount: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';
}

export interface TestPaymentFixture {
  id: string;
  milestoneId: string;
  amount: number;
  status: 'PAID' | 'UNPAID' | 'FAILED';
  transactionRef: string;
}

export function createMockCustomer(overrides?: Partial<TestUserFixture>): TestUserFixture {
  return {
    id: 'cust-test-101',
    name: 'Sanjay Customer',
    email: 'customer@example.com',
    role: 'customer',
    ...overrides,
  };
}

export function createMockProfessional(overrides?: Partial<TestUserFixture>): TestUserFixture {
  return {
    id: 'pro-test-202',
    name: 'BuildTech Pro',
    email: 'contractor@example.com',
    role: 'contractor',
    ...overrides,
  };
}

export function createMockAdmin(overrides?: Partial<TestUserFixture>): TestUserFixture {
  return {
    id: 'admin-test-303',
    name: 'Platform Admin',
    email: 'admin@dbc.com',
    role: 'admin',
    ...overrides,
  };
}

export function createMockProjectRequest(overrides?: Partial<TestRequestFixture>): TestRequestFixture {
  return {
    id: 'req-test-555',
    title: 'Modern 3BHK Villa Construction',
    budget: 4500000,
    location: 'Hyderabad, TS',
    status: 'REQUESTED',
    customerId: 'cust-test-101',
    ...overrides,
  };
}

export function createMockQuotation(overrides?: Partial<TestQuotationFixture>): TestQuotationFixture {
  return {
    id: 'quo-test-777',
    requestId: 'req-test-555',
    totalPrice: 4200000,
    status: 'SUBMITTED',
    professionalId: 'pro-test-202',
    ...overrides,
  };
}

export function createMockProject(overrides?: Partial<TestProjectFixture>): TestProjectFixture {
  return {
    id: 'proj-test-888',
    title: 'Modern 3BHK Villa Build',
    status: 'IN_PROGRESS',
    progressPercentage: 45,
    customerId: 'cust-test-101',
    professionalId: 'pro-test-202',
    ...overrides,
  };
}

export function createMockMilestone(overrides?: Partial<TestMilestoneFixture>): TestMilestoneFixture {
  return {
    id: 'ms-test-999',
    projectId: 'proj-test-888',
    title: 'Foundation & Earthwork',
    amount: 1000000,
    status: 'COMPLETED',
    ...overrides,
  };
}

export function createMockPayment(overrides?: Partial<TestPaymentFixture>): TestPaymentFixture {
  return {
    id: 'pay-test-111',
    milestoneId: 'ms-test-999',
    amount: 1000000,
    status: 'PAID',
    transactionRef: 'txn_razorpay_998877',
    ...overrides,
  };
}
