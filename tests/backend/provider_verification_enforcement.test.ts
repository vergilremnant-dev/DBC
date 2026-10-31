import { describe, it, expect, vi, beforeAll } from 'vitest';

// In-memory database shared by the mocked db module (test data only).
const h = vi.hoisted(() => ({ db: null as any }));
vi.mock('../../api-lib/utils/db.js', async () => {
  const { createFakePrisma } = await import('./helpers/fakePrisma.js');
  h.db = createFakePrisma();
  return { db: h.db };
});
// Route handlers read the caller from the request instead of a signed JWT.
vi.mock('../../api-lib/utils/auth.js', () => ({
  verifyToken: (req: any) => req.__user ?? null,
  hasRole: (u: any, roles: string[]) => roles.includes(u.role),
  getTempUserId: async () => 'temp_unregistered',
}));

import projectRequestsRoute from '../../api-lib/routes/projectRequests/index.js';
import projectRequestActionRoute from '../../api-lib/routes/projectRequests/[id].js';
import requirementDetailRoute from '../../api-lib/routes/requirements/[id]/index.js';
import requirementsIndexRoute from '../../api-lib/routes/requirements/index.js';
import quotationsIndexRoute from '../../api-lib/routes/quotations/index.js';
import searchProvidersRoute from '../../api-lib/routes/search/providers.js';
import providerProfileByIdRoute from '../../api-lib/routes/providers/[id]/index.js';
import contractorProfileRoute from '../../api-lib/routes/contractor/profile.js';
import providersProfileRoute from '../../api-lib/routes/providers/profile.js';
import { transitionQuotationStatus } from '../../api-lib/services/quotationService.js';
import { sendMessage } from '../../api-lib/services/chatService.js';
import { requireVerifiedProvider } from '../../api-lib/services/providerEligibility.js';
import { db } from '../../api-lib/utils/db.js';

const U = {
  cust: { id: 'u-cust', role: 'CUSTOMER', email: 'cust@example.test' },
  verified: { id: 'u-ver', role: 'PROVIDER', email: 'ver@example.test' },
  pending: { id: 'u-pen', role: 'PROVIDER', email: 'pen@example.test' },
  rejected: { id: 'u-rej', role: 'PROVIDER', email: 'rej@example.test' },
  suspended: { id: 'u-sus', role: 'PROVIDER', email: 'sus@example.test' },
  admin: { id: 'u-adm', role: 'ADMIN', email: 'adm@example.test' },
};

async function call(handler: any, user: any, opts: { method?: string; query?: any; body?: any } = {}) {
  let status = 200;
  let body: any;
  const res: any = { status: (s: number) => ((status = s), res), json: (b: any) => ((body = b), res), setHeader: () => res };
  await handler({ method: opts.method ?? 'GET', query: opts.query ?? {}, body: opts.body ?? {}, headers: {}, __user: user }, res);
  return { status, body };
}

const REQ = 1;
const quote = { requirementId: REQ, priceModel: 'FIXED', totalAmount: 1, estimatedDurationDays: 1, proposal: { title: 'TEST', summary: 'Test only', scope: 'Test', deliverables: 'One test deliverable' } };

beforeAll(async () => {
  await db.user.create({ data: { id: 'temp_unregistered', email: 'system_temp_otp@dbc.com', role: 'CUSTOMER' } });
  for (const [k, u] of Object.entries(U)) {
    await db.user.create({ data: { id: u.id, role: u.role, email: u.email, status: k === 'suspended' ? 'SUSPENDED' : 'ACTIVE' } });
  }
  await db.serviceCategory.create({ data: { id: 2, name: 'Electrician', slug: 'electrical', categoryType: 'BLUE_COLLAR', isActive: true, deletedAt: null } });
  await db.serviceCategory.create({ data: { id: 3, name: 'Plumber', slug: 'plumbing', categoryType: 'BLUE_COLLAR', isActive: true, deletedAt: null } });
  await db.customerProfile.create({ data: { id: 'c1', userId: U.cust.id, fullName: 'Test Customer', phoneNumber: '9000000001', city: 'Hyderabad', state: 'TS', pincode: '500001' } });
  const pro = (id: string, userId: string, verificationStatus: string) =>
    db.providerProfile.create({ data: { id, userId, fullName: `Pro ${id}`, businessName: `${id} Works`, categoryId: 2, verificationStatus, email: `${id}@login.test`, phoneNumber: '9111111111', city: 'Hyderabad', state: 'TS', experienceYears: 3, averageRating: 0, isFeatured: false, isAvailable: true, canProvideServices: true } });
  await pro('p-ver', U.verified.id, 'VERIFIED');
  await pro('p-pen', U.pending.id, 'PENDING');
  await pro('p-rej', U.rejected.id, 'REJECTED');
  await pro('p-sus', U.suspended.id, 'VERIFIED');
  await db.requirement.create({ data: { id: REQ, customerId: 'c1', serviceCategoryId: 2, title: '[TEST] open request', description: 'Test only', location: 'Hyderabad', status: 'PUBLISHED' } });
});

describe('requireVerifiedProvider', () => {
  it('allows only ACTIVE professionals with a VERIFIED profile', async () => {
    expect((await requireVerifiedProvider(U.verified)).ok).toBe(true);
    expect(await requireVerifiedProvider(U.pending)).toMatchObject({ ok: false, status: 403, code: 'NOT_VERIFIED' });
    expect(await requireVerifiedProvider(U.rejected)).toMatchObject({ ok: false, code: 'REJECTED' });
    expect(await requireVerifiedProvider(U.suspended)).toMatchObject({ ok: false, code: 'ACCOUNT_INACTIVE' });
    expect(await requireVerifiedProvider(U.cust)).toMatchObject({ ok: false, code: 'NOT_PROVIDER' });
    expect(await requireVerifiedProvider({ id: 'u-nobody', role: 'PROVIDER' })).toMatchObject({ ok: false, code: 'PROFILE_REQUIRED' });
  });
});

describe('Professional request workflow requires verification', () => {
  it('request inbox (invited and open): verified allowed; pending, rejected and suspended denied', async () => {
    for (const scope of ['open', 'invited']) {
      expect((await call(projectRequestsRoute, U.verified, { query: { scope } })).status).toBe(200);
      for (const u of [U.pending, U.rejected, U.suspended]) {
        const r = await call(projectRequestsRoute, u, { query: { scope } });
        expect(r.status).toBe(403);
        expect(r.body.data).toBeUndefined();
      }
    }
    const open = await call(projectRequestsRoute, U.verified, { query: { scope: 'open' } });
    expect(open.body.data.map((x: any) => x.id)).toContain(REQ);
  });

  it('legacy request feed is closed to unverified professionals', async () => {
    expect((await call(requirementsIndexRoute, U.pending)).status).toBe(403);
    expect((await call(requirementsIndexRoute, U.verified)).status).toBe(200);
  });

  it('request details: verified professional sees the limited view, unverified ones are refused', async () => {
    const ok = await call(requirementDetailRoute, U.verified, { query: { id: String(REQ) } });
    expect(ok.status).toBe(200);
    for (const u of [U.pending, U.rejected, U.suspended]) {
      expect((await call(requirementDetailRoute, u, { query: { id: String(REQ) } })).status).toBe(403);
    }
  });

  it('contacting the customer requires verification', async () => {
    const denied = await call(projectRequestActionRoute, U.pending, { method: 'POST', query: { id: String(REQ) }, body: { action: 'contact' } });
    expect(denied.status).toBe(403);
    expect(await db.conversation.count({ where: { providerId: 'p-pen' } })).toBe(0);
    const ok = await call(projectRequestActionRoute, U.verified, { method: 'POST', query: { id: String(REQ) }, body: { action: 'contact' } });
    expect(ok.status).toBe(200);
    expect(ok.body.data.conversationId).toBeTruthy();
  });

  it('creating a quotation requires verification', async () => {
    for (const u of [U.pending, U.rejected, U.suspended]) {
      const r = await call(quotationsIndexRoute, u, { method: 'POST', body: quote });
      expect(r.status).toBe(403);
    }
    expect(await db.quotation.count({ where: {} })).toBe(0);
    const ok = await call(quotationsIndexRoute, U.verified, { method: 'POST', body: quote });
    expect(ok.status).toBe(201);
  });

  it('a professional who is no longer verified cannot send an existing draft', async () => {
    const draft = await db.quotation.findFirst({ where: { providerId: 'p-ver' } });
    await db.providerProfile.update({ where: { id: 'p-ver' }, data: { verificationStatus: 'PENDING' } });
    await expect(transitionQuotationStatus(draft.id, U.verified.id, 'SUBMITTED' as any)).rejects.toMatchObject({ status: 403 });
    expect((await db.quotation.findUnique({ where: { id: draft.id } })).status).toBe('DRAFT');
    await db.providerProfile.update({ where: { id: 'p-ver' }, data: { verificationStatus: 'VERIFIED' } });
    const sent = await transitionQuotationStatus(draft.id, U.verified.id, 'SUBMITTED' as any);
    expect(sent.status).toBe('SUBMITTED');
  });

  it('request conversations: an unverified professional cannot message the customer; booking chats are unaffected', async () => {
    await db.conversation.create({ data: { id: 'conv-req-pen', customerId: 'c1', providerId: 'p-pen', requirementId: REQ, conversationType: 'REQUIREMENT' } });
    await db.conversation.create({ data: { id: 'conv-book-pen', customerId: 'c1', providerId: 'p-pen', requirementId: null, conversationType: 'DIRECT' } });
    await expect(sendMessage('conv-req-pen', U.pending.id, 'hello')).rejects.toThrow(/Access denied/);
    expect(await db.message.count({ where: { conversationId: 'conv-req-pen' } })).toBe(0);
    const m = await sendMessage('conv-book-pen', U.pending.id, 'about my booking');
    expect(m.conversationId).toBe('conv-book-pen');
    // The customer can still write in the request conversation.
    expect((await sendMessage('conv-req-pen', U.cust.id, 'hi')).conversationId).toBe('conv-req-pen');
  });
});

describe('Public discovery shows verified, active professionals only', () => {
  it('search ignores a caller-supplied verificationStatus', async () => {
    for (const verificationStatus of [undefined, 'PENDING', 'REJECTED']) {
      const r = await call(searchProvidersRoute, null, { query: verificationStatus ? { verificationStatus } : {} });
      expect(r.status).toBe(200);
      const ids = (r.body.data ?? []).map((p: any) => p.id);
      expect(ids).toEqual(['p-ver']);
    }
  });

  it('a public profile id cannot bypass verification; owner and admin can still open it', async () => {
    expect((await call(providerProfileByIdRoute, null, { query: { id: 'p-ver' } })).status).toBe(200);
    for (const id of ['p-pen', 'p-rej', 'p-sus']) {
      const r = await call(providerProfileByIdRoute, null, { query: { id } });
      expect(r.status).toBe(404);
      expect(r.body.data).toBeUndefined();
      expect((await call(providerProfileByIdRoute, U.cust, { query: { id } })).status).toBe(404);
    }
    expect((await call(providerProfileByIdRoute, U.pending, { query: { id: 'p-pen' } })).status).toBe(200);
    expect((await call(providerProfileByIdRoute, U.admin, { query: { id: 'p-pen' } })).status).toBe(200);
  });
});

describe('Professional profile authorization', () => {
  const contractorBody = { companyName: 'Test Co', ownerName: 'Test Owner', phoneNumber: '9222222222', experienceYears: 2, specialization: 'Plumber', city: 'Pune', state: 'MH' };

  it('a customer cannot create or overwrite a professional profile', async () => {
    for (const method of ['POST', 'PUT']) {
      const r = await call(contractorProfileRoute, U.cust, { method, body: contractorBody });
      expect(r.status).toBe(403);
    }
    expect(await db.providerProfile.count({ where: { userId: U.cust.id } })).toBe(0);
  });

  it('no fallback service and no invented location', async () => {
    await db.user.create({ data: { id: 'u-new-pro', role: 'PROVIDER', email: 'newpro@example.test' } });
    const newPro = { id: 'u-new-pro', role: 'PROVIDER', email: 'newpro@example.test' };
    expect((await call(contractorProfileRoute, newPro, { method: 'POST', body: { ...contractorBody, specialization: 'Rocket repair' } })).status).toBe(400);
    expect((await call(contractorProfileRoute, newPro, { method: 'POST', body: { ...contractorBody, city: undefined, state: undefined } })).status).toBe(400);
    expect(await db.providerProfile.count({ where: { userId: 'u-new-pro' } })).toBe(0);
    const ok = await call(contractorProfileRoute, newPro, { method: 'POST', body: contractorBody });
    expect(ok.status).toBe(200);
    const created = await db.providerProfile.findFirst({ where: { userId: 'u-new-pro' } });
    expect(created).toMatchObject({ categoryId: 3, city: 'Pune', state: 'MH', verificationStatus: 'PENDING', isFeatured: false });
  });

  it('a professional cannot change their own verification or featured status', async () => {
    const r = await call(providersProfileRoute, U.pending, { method: 'PUT', body: { description: 'Updated', verificationStatus: 'VERIFIED', isFeatured: true } });
    expect(r.status).toBe(200);
    const p = await db.providerProfile.findUnique({ where: { id: 'p-pen' } });
    expect(p.verificationStatus).toBe('PENDING');
    expect(p.isFeatured).toBe(false);
    expect(p.description).toBe('Updated');
  });

  it('a verified professional cannot switch service without re-verification; a pending one can correct it', async () => {
    const r = await call(providersProfileRoute, U.verified, { method: 'PUT', body: { categoryId: 3 } });
    expect(r.status).toBe(409);
    expect(r.body.code).toBe('SERVICE_CHANGE_REQUIRES_REVERIFICATION');
    expect((await db.providerProfile.findUnique({ where: { id: 'p-ver' } })).categoryId).toBe(2);
    const legacy = await call(contractorProfileRoute, U.verified, { method: 'PUT', body: { ...contractorBody, specialization: 'Plumber' } });
    expect(legacy.status).toBe(409);
    expect((await call(providersProfileRoute, U.pending, { method: 'PUT', body: { categoryId: 3 } })).status).toBe(200);
    // Same-service edits by a verified professional still work.
    expect((await call(providersProfileRoute, U.verified, { method: 'PUT', body: { categoryId: 2, description: 'Same service' } })).status).toBe(200);
  });
});
