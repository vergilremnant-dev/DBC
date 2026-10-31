import { describe, it, expect, vi, beforeAll } from 'vitest';

// In-memory database shared by the mocked db module (test data only).
const h = vi.hoisted(() => ({ db: null as any }));
vi.mock('../../api-lib/utils/db.js', async () => {
  const { createFakePrisma } = await import('./helpers/fakePrisma.js');
  h.db = createFakePrisma();
  return { db: h.db };
});
// Route handlers read the caller from the request instead of a signed JWT.
vi.mock('../../api-lib/utils/auth.js', () => ({ verifyToken: (req: any) => req.__user ?? null }));

import { submitProjectRequest, getProviderAccess, acknowledgeRequest, contactCustomer, RequestError, requestReference } from '../../api-lib/services/projectRequestService.js';
import { createQuotation, transitionQuotationStatus } from '../../api-lib/services/quotationService.js';
import requirementDetailRoute from '../../api-lib/routes/requirements/[id]/index.js';
import requirementsIndexRoute from '../../api-lib/routes/requirements/index.js';
import projectRequestsRoute from '../../api-lib/routes/projectRequests/index.js';
import projectRequestActionRoute from '../../api-lib/routes/projectRequests/[id].js';
import quotationsIndexRoute from '../../api-lib/routes/quotations/index.js';
import { db } from '../../api-lib/utils/db.js';

const U = {
  cust1: { id: 'u-cust1', role: 'CUSTOMER' },
  cust2: { id: 'u-cust2', role: 'CUSTOMER' },
  pro1: { id: 'u-pro1', role: 'PROVIDER' },
  pro2: { id: 'u-pro2', role: 'PROVIDER' },
  pro3: { id: 'u-pro3', role: 'PROVIDER' },
  pro4: { id: 'u-pro4', role: 'PROVIDER' },
};

async function call(handler: any, user: any, opts: { method?: string; query?: any; body?: any } = {}) {
  let status = 200;
  let body: any;
  const res: any = { status: (s: number) => ((status = s), res), json: (b: any) => ((body = b), res), setHeader: () => res };
  await handler({ method: opts.method ?? 'GET', query: opts.query ?? {}, body: opts.body ?? {}, headers: {}, __user: user }, res);
  return { status, body };
}

const keysDeep = (v: unknown): string[] => (v && typeof v === 'object' ? Object.entries(v as object).flatMap(([k, x]) => [k, ...keysDeep(x)]) : []);

const base = {
  title: 'Rewire 2BHK apartment',
  description: 'Full rewiring of a 2BHK apartment with new switchboards and lighting points.',
  siteAddress: 'Flat 4B, Test Residency, Kondapur',
  city: 'Hyderabad',
  budgetMin: 50000,
  budgetMax: 200000,
  details: { 'Type of work': 'Replacement', Area: '900 sq ft' },
};

const quoteInput = (requirementId: number, total = 150000) => ({
  requirementId,
  priceModel: 'FIXED' as any,
  totalAmount: total,
  estimatedDurationDays: 10,
  proposal: { title: 'Rewiring', summary: 'Complete rewiring', scope: 'All rooms', deliverables: 'Wiring, boards, testing' },
});

beforeAll(async () => {
  for (const [k, u] of Object.entries(U)) await db.user.create({ data: { id: u.id, role: u.role, email: `${k}@example.test` } });
  await db.serviceCategory.create({ data: { id: 1, name: 'Plumber', slug: 'plumbing', categoryType: 'BLUE_COLLAR', isActive: true, deletedAt: null } });
  await db.serviceCategory.create({ data: { id: 2, name: 'Electrician', slug: 'electrical', categoryType: 'BLUE_COLLAR', isActive: true, deletedAt: null } });
  await db.serviceCategory.create({ data: { id: 6, name: 'CCTV Installation', slug: 'cctv-installation', categoryType: 'BLUE_COLLAR', isActive: false, deletedAt: null } });
  await db.customerProfile.create({ data: { id: 'c1', userId: U.cust1.id, fullName: 'Asha Rao', phoneNumber: '9000000001', city: 'Hyderabad', state: 'TS', pincode: '500001' } });
  await db.customerProfile.create({ data: { id: 'c2', userId: U.cust2.id, fullName: 'Ravi Kumar', phoneNumber: '9000000002', city: 'Hyderabad', state: 'TS', pincode: '500002' } });
  const pro = (id: string, userId: string, categoryId: number, verificationStatus = 'VERIFIED') =>
    db.providerProfile.create({ data: { id, userId, fullName: `Pro ${id}`, businessName: `${id} Works`, categoryId, verificationStatus, email: `${id}@login.test`, phoneNumber: '9111111111', city: 'Hyderabad' } });
  await pro('p1', U.pro1.id, 2);
  await pro('p2', U.pro2.id, 2);
  await pro('p3', U.pro3.id, 1);
  await pro('p4', U.pro4.id, 2);
  await pro('p5-unverified', 'u-none', 2, 'PENDING');
});

describe('Project request submission', () => {
  it('validates required fields with field messages', async () => {
    await expect(submitProjectRequest(U.cust1.id, { ...base, serviceCategoryId: 2, title: 'x', description: 'short' })).rejects.toMatchObject({ status: 400 });
    try {
      await submitProjectRequest(U.cust1.id, { ...base, serviceCategoryId: 2, title: 'x', description: 'short' });
    } catch (e: any) {
      expect(e).toBeInstanceOf(RequestError);
      expect(Object.keys(e.fields)).toEqual(expect.arrayContaining(['title', 'description']));
    }
  });

  it('rejects retired services, mismatched or unverified professionals and non-image attachments', async () => {
    await expect(submitProjectRequest(U.cust1.id, { ...base, serviceCategoryId: 6 })).rejects.toThrow(/not available/);
    await expect(submitProjectRequest(U.cust1.id, { ...base, serviceCategoryId: 2, providerId: 'p3' })).rejects.toThrow(/not available for this service/);
    await expect(submitProjectRequest(U.cust1.id, { ...base, serviceCategoryId: 2, providerId: 'p5-unverified' })).rejects.toThrow(/not available/);
    await expect(submitProjectRequest(U.cust1.id, { ...base, serviceCategoryId: 2, attachments: [{ fileName: 'a.pdf', fileUrl: 'x', fileType: 'application/pdf' }] })).rejects.toThrow(/JPEG, PNG or WEBP/);
  });

  it('rejects attachment links that are not images and photo sets too large for one request', async () => {
    const img = (fileUrl: string) => ({ fileName: 'site.jpg', fileUrl, fileType: 'image/jpeg' });
    await expect(submitProjectRequest(U.cust1.id, { ...base, serviceCategoryId: 2, attachments: [img('javascript:alert(1)')] })).rejects.toThrow(/JPEG, PNG or WEBP/);
    await expect(submitProjectRequest(U.cust1.id, { ...base, serviceCategoryId: 2, attachments: [img('data:text/html;base64,PGI+')] })).rejects.toThrow(/JPEG, PNG or WEBP/);
    const big = img(`data:image/jpeg;base64,${'A'.repeat(800_000)}`);
    await expect(submitProjectRequest(U.cust1.id, { ...base, serviceCategoryId: 2, attachments: [big, big, big, big] })).rejects.toThrow(/too large together/);
  });

  it('only customer accounts can submit (route)', async () => {
    const r = await call(projectRequestsRoute, U.pro1, { method: 'POST', body: { ...base, serviceCategoryId: 2 } });
    expect(r.status).toBe(403);
    expect((await call(projectRequestsRoute, null, { method: 'POST', body: {} })).status).toBe(401);
  });
});

let directedId = 0;
let openId = 0;

describe('Request sent to a chosen professional', () => {
  it('creates a published request linked to customer, service and professional, with an invite thread and notification', async () => {
    const r = await call(projectRequestsRoute, U.cust1, { method: 'POST', body: { ...base, serviceCategoryId: 2, providerId: 'p1' } });
    expect(r.status).toBe(201);
    directedId = r.body.data.id;
    expect(r.body.data.reference).toBe(requestReference(directedId));
    const req = await db.requirement.findUnique({ where: { id: directedId } });
    expect(req).toMatchObject({ customerId: 'c1', serviceCategoryId: 2, serviceCategory: 'Electrician', status: 'PUBLISHED', location: 'Flat 4B, Test Residency, Kondapur, Hyderabad' });
    expect(req.description).toContain('Project details:\n- Type of work: Replacement');
    const convo = await db.conversation.findFirst({ where: { requirementId: directedId } });
    expect(convo).toMatchObject({ customerId: 'c1', providerId: 'p1', conversationType: 'PROJECT_REQUEST' });
    expect(r.body.data.conversationId).toBe(convo.id);
    expect(await db.message.count({ where: { conversationId: convo.id } })).toBe(1);
    expect(await db.notification.findFirst({ where: { userId: U.pro1.id } })).toMatchObject({ title: 'New project request' });
  });

  it('treats an immediate re-submit as the same request (no duplicate)', async () => {
    const before = await db.requirement.count({});
    const again = await call(projectRequestsRoute, U.cust1, { method: 'POST', body: { ...base, serviceCategoryId: 2, providerId: 'p1' } });
    expect(again.status).toBe(200);
    expect(again.body.data).toMatchObject({ id: directedId, duplicate: true });
    expect(await db.requirement.count({})).toBe(before);
  });

  it('is private to the invited professional', async () => {
    expect(await getProviderAccess('p1', directedId)).toEqual({ allowed: true, invited: true, engaged: true });
    expect((await getProviderAccess('p2', directedId)).allowed).toBe(false); // same service, not invited
    expect((await getProviderAccess('p3', directedId)).allowed).toBe(false); // other service
    const open = await call(projectRequestsRoute, U.pro2, { query: { scope: 'open' } });
    expect(open.body.data.map((x: any) => x.id)).not.toContain(directedId);
    const feed = await call(requirementsIndexRoute, U.pro2, { query: { status: 'PUBLISHED' } });
    expect(feed.body.data.map((x: any) => x.id)).not.toContain(directedId);
  });

  it('request detail: owner sees everything, other users are refused, the invited pro gets a limited view', async () => {
    const owner = await call(requirementDetailRoute, U.cust1, { query: { id: String(directedId) } });
    expect(owner.status).toBe(200);
    expect(owner.body.data.customer.phoneNumber).toBe('9000000001');
    expect((await call(requirementDetailRoute, U.cust2, { query: { id: String(directedId) } })).status).toBe(403);
    expect((await call(requirementDetailRoute, U.pro2, { query: { id: String(directedId) } })).status).toBe(403);
    const pro = await call(requirementDetailRoute, U.pro1, { query: { id: String(directedId) } });
    expect(pro.status).toBe(200);
    expect(pro.body.data.customer).toEqual({ displayName: 'Asha Rao' });
    for (const k of ['phoneNumber', 'userId', 'pincode', 'notes', 'history']) expect(keysDeep(pro.body.data)).not.toContain(k);
  });

  it('professional inbox lists it, and opening it marks it under review (validated)', async () => {
    const inbox = await call(projectRequestsRoute, U.pro1, { query: { scope: 'invited' } });
    expect(inbox.body.data.find((x: any) => x.id === directedId)).toMatchObject({ invited: true, location: 'Flat 4B, Test Residency, Kondapur, Hyderabad' });
    const ack = await call(projectRequestActionRoute, U.pro1, { method: 'POST', query: { id: String(directedId) }, body: { action: 'acknowledge' } });
    expect(ack.status).toBe(200);
    expect((await db.requirement.findUnique({ where: { id: directedId } })).status).toBe('PROVIDER_REVIEW');
    expect((await call(projectRequestActionRoute, U.pro2, { method: 'POST', query: { id: String(directedId) }, body: { action: 'acknowledge' } })).status).toBe(403);
  });

  it('“contact customer” reuses the existing thread', async () => {
    const invite = await db.conversation.findFirst({ where: { requirementId: directedId, providerId: 'p1' } });
    const c = await contactCustomer(U.pro1.id, 'p1', directedId);
    expect(c.id).toBe(invite.id);
    await expect(contactCustomer(U.pro2.id, 'p2', directedId)).rejects.toMatchObject({ status: 403 });
  });

  it('only the invited professional can quote; submitting moves the request to “quotation received”', async () => {
    await expect(createQuotation('p2', U.pro2.id, quoteInput(directedId))).rejects.toThrow(/Unauthorized/);
    await expect(createQuotation('p1', U.pro1.id, { ...quoteInput(directedId, 100), priceModel: 'MILESTONE_BASED' as any, milestones: [{ name: 'A', cost: 40 }] })).rejects.toThrow(/does not match/);
    const q = await createQuotation('p1', U.pro1.id, quoteInput(directedId));
    expect(q.status).toBe('DRAFT');
    await expect(createQuotation('p1', U.pro1.id, quoteInput(directedId))).rejects.toThrow(/already submitted/);
    await transitionQuotationStatus(q.id, U.pro1.id, 'SUBMITTED' as any);
    expect((await db.requirement.findUnique({ where: { id: directedId } })).status).toBe('QUOTATION_RECEIVED');
    const hist = await db.requirementHistory.findMany({ where: { requirementId: directedId }, orderBy: { id: 'asc' } });
    expect(hist.map((x: any) => x.toStatus)).toEqual(['PUBLISHED', 'PROVIDER_REVIEW', 'QUOTATION_RECEIVED']);
    expect(await db.notification.findFirst({ where: { userId: U.cust1.id, title: 'New quotation received' } })).toBeTruthy();
  });

  it('customer reviews and accepts: exactly one project is created; repeats are refused', async () => {
    const q = await db.quotation.findFirst({ where: { requirementId: directedId } });
    await expect(transitionQuotationStatus(q.id, U.cust1.id, 'ACCEPTED' as any)).rejects.toThrow(/Invalid status transition/); // must review first
    await transitionQuotationStatus(q.id, U.cust1.id, 'VIEWED' as any);
    expect((await db.requirement.findUnique({ where: { id: directedId } })).status).toBe('CUSTOMER_REVIEW');
    await transitionQuotationStatus(q.id, U.cust1.id, 'UNDER_REVIEW' as any);
    await expect(transitionQuotationStatus(q.id, U.pro1.id, 'ACCEPTED' as any)).rejects.toThrow(/Only the customer/);
    await expect(transitionQuotationStatus(q.id, U.cust2.id, 'ACCEPTED' as any)).rejects.toThrow(/not a participant/);
    await transitionQuotationStatus(q.id, U.cust1.id, 'ACCEPTED' as any);
    const projects = await db.project.findMany({ where: { requirementId: directedId } });
    expect(projects).toHaveLength(1);
    expect(projects[0]).toMatchObject({ customerId: 'c1', providerId: 'p1', quotationId: q.id, status: 'ASSIGNED' });
    expect((await db.requirement.findUnique({ where: { id: directedId } })).status).toBe('QUOTATION_ACCEPTED');
    expect(await db.notification.findFirst({ where: { userId: U.pro1.id, title: 'Quotation accepted' } })).toBeTruthy();
    await expect(transitionQuotationStatus(q.id, U.cust1.id, 'ACCEPTED' as any)).rejects.toThrow(/Invalid status transition/);
    expect(await db.project.count({ where: { requirementId: directedId } })).toBe(1);
    await expect(createQuotation('p1', U.pro1.id, quoteInput(directedId))).rejects.toThrow(/no longer accepting/);
  });
});

describe('Open request (no professional chosen)', () => {
  it('is visible to professionals of that service only, who can contact the customer', async () => {
    const r = await submitProjectRequest(U.cust2.id, { ...base, title: 'Office lighting upgrade', serviceCategoryId: 2 });
    openId = r.requirement.id;
    expect(r.conversationId).toBeNull();
    const open = await call(projectRequestsRoute, U.pro2, { query: { scope: 'open' } });
    const item = open.body.data.find((x: any) => x.id === openId);
    expect(item).toMatchObject({ engaged: false, city: 'Hyderabad', location: 'Hyderabad', customer: { displayName: 'Ravi K.' } });
    expect((await getProviderAccess('p3', openId)).allowed).toBe(false);
    const contact = await call(projectRequestActionRoute, U.pro2, { method: 'POST', query: { id: String(openId) }, body: { action: 'contact' } });
    expect(contact.status).toBe(200);
    const convo = await db.conversation.findFirst({ where: { id: contact.body.data.conversationId } });
    expect(convo).toMatchObject({ customerId: 'c2', providerId: 'p2', conversationType: 'REQUIREMENT', requirementId: openId });
    expect(await getProviderAccess('p2', openId)).toMatchObject({ allowed: true, engaged: true });
  });

  it('competing quotations: accepting one declines the others and only one project exists', async () => {
    const a = await createQuotation('p2', U.pro2.id, quoteInput(openId, 90000));
    const b = await createQuotation('p4', U.pro4.id, quoteInput(openId, 80000));
    await transitionQuotationStatus(a.id, U.pro2.id, 'SUBMITTED' as any);
    await transitionQuotationStatus(b.id, U.pro4.id, 'SUBMITTED' as any);
    for (const s of ['VIEWED', 'UNDER_REVIEW']) await transitionQuotationStatus(a.id, U.cust2.id, s as any);
    await transitionQuotationStatus(a.id, U.cust2.id, 'ACCEPTED' as any);
    expect((await db.quotation.findUnique({ where: { id: b.id } })).status).toBe('REJECTED');
    await expect(transitionQuotationStatus(b.id, U.cust2.id, 'ACCEPTED' as any)).rejects.toThrow();
    expect(await db.project.count({ where: { requirementId: openId } })).toBe(1);
  });

  it('customers never see draft quotations, and quotation lists expose public professional fields only', async () => {
    const r = await submitProjectRequest(U.cust2.id, { ...base, title: 'Garden lighting points', serviceCategoryId: 2 });
    await createQuotation('p4', U.pro4.id, quoteInput(r.requirement.id, 30000)); // stays DRAFT
    const drafts = await call(quotationsIndexRoute, U.cust2, { query: { status: 'DRAFT' } });
    expect(drafts.body.data).toEqual([]);
    const list = await call(quotationsIndexRoute, U.cust2, {});
    expect(list.body.data.every((q: any) => q.status !== 'DRAFT')).toBe(true);
    for (const k of ['email', 'userId', 'phoneNumber']) expect(keysDeep(list.body.data.map((q: any) => q.provider))).not.toContain(k);
  });

  it('a professional cannot browse other customers’ requests by status', async () => {
    const feed = await call(requirementsIndexRoute, U.pro2, { query: { status: 'QUOTATION_ACCEPTED' } });
    expect(feed.body.data.every((x: any) => x.status === 'PUBLISHED')).toBe(true);
    expect(keysDeep(feed.body.data)).not.toContain('phoneNumber');
  });
});
