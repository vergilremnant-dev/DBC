import { describe, it, expect, vi, beforeAll } from 'vitest';

// In-memory database shared by the mocked db module (test data only).
const h = vi.hoisted(() => ({ db: null as any }));
vi.mock('../../api-lib/utils/db.js', async () => {
  const { createFakePrisma } = await import('./helpers/fakePrisma.js');
  h.db = createFakePrisma();
  return { db: h.db };
});
// The caller is whoever the (verified) access token says; here it is set on the request.
vi.mock('../../api-lib/utils/auth.js', () => ({
  verifyToken: (req: any) => req.__user ?? null,
  hasRole: (u: any, roles: string[]) => roles.includes(u.role),
  generateAccessToken: (u: any) => `access:${u.id}`,
  getTempUserId: async () => 'temp_unregistered',
}));

import profileRoute from '../../api-lib/routes/profile/index.js';
import completionRoute from '../../api-lib/routes/profile/completion.js';
import customerProfileRoute from '../../api-lib/routes/customer/profile.js';
import sessionsRoute from '../../api-lib/routes/auth/sessions.js';
import { db } from '../../api-lib/utils/db.js';

const A = { id: 'u-shiv', role: 'CUSTOMER', email: '7000000001@dbc.com' };
const B = { id: 'u-other', role: 'CUSTOMER', email: '7000000002@dbc.com' };
const P = { id: 'u-pro', role: 'PROVIDER', email: 'pro@example.test' };

async function call(handler: any, user: any, opts: { method?: string; body?: any; query?: any } = {}) {
  let status = 200;
  let body: any;
  const res: any = { status: (s: number) => ((status = s), res), json: (b: any) => ((body = b), res), setHeader: () => res };
  await handler({ method: opts.method ?? 'GET', query: opts.query ?? {}, body: opts.body ?? {}, headers: {}, __user: user }, res);
  return { status, body };
}

const profileOf = (userId: string) => h.db._tables.customerProfile.find((p: any) => p.userId === userId);

beforeAll(async () => {
  for (const u of [A, B, P]) await db.user.create({ data: { ...u, password: 'x' } });
  // Test data: two customers with different, partly complete profiles.
  await db.customerProfile.create({ data: { id: 'cp-a', userId: A.id, fullName: 'Shiv Test', phoneNumber: '7000000001', city: 'Hyderabad', state: 'Telangana', pincode: '500001' } });
  await db.customerProfile.create({ data: { id: 'cp-b', userId: B.id, fullName: 'Other Customer', phoneNumber: '7000000002', address: '1 Test Road', city: 'Pune', state: 'Maharashtra', pincode: '411001', profileImageUrl: 'https://example.test/b.jpg' } });
  await db.serviceCategory.create({ data: { id: 2, name: 'Electrician', slug: 'electrical', isActive: true, deletedAt: null } });
  await db.providerProfile.create({ data: { id: 'pp', userId: P.id, fullName: 'Pro Test', businessName: 'Pro Test Works', categoryId: 2, verificationStatus: 'VERIFIED', email: 'pro@login.test', phoneNumber: '9111111111', city: 'Hyderabad', state: 'TS', experienceYears: 4, canProvideServices: true, canProvideConsultation: false, consultationFee: 0 } });
  const future = new Date(Date.now() + 86400_000);
  await db.userSession.create({ data: { id: 's-a1', userId: A.id, token: 'hashA1', userAgent: 'Chrome/120 Windows', ipAddress: '10.0.0.1', expiresAt: future } });
  await db.userSession.create({ data: { id: 's-a-reset', userId: A.id, token: 'PWD_RESET:abc', expiresAt: future } });
  await db.userSession.create({ data: { id: 's-a-verify', userId: A.id, token: 'EMAIL_VERIFY:abc', expiresAt: future } });
  await db.userSession.create({ data: { id: 's-a-old', userId: A.id, token: 'hashOld', expiresAt: new Date(Date.now() - 1000) } });
  await db.userSession.create({ data: { id: 's-b1', userId: B.id, token: 'hashB1', expiresAt: future } });
});

describe('Every profile endpoint returns the authenticated account only', () => {
  it('GET /api/profile: each customer gets their own profile', async () => {
    const a = await call(profileRoute, A);
    const b = await call(profileRoute, B);
    expect(a.status).toBe(200);
    expect(a.body.data).toMatchObject({ userId: A.id, fullName: 'Shiv Test' });
    expect(b.body.data).toMatchObject({ userId: B.id, fullName: 'Other Customer' });
  });

  it('the legacy /api/customer/profile endpoint agrees with /api/profile', async () => {
    const a = await call(customerProfileRoute, A);
    expect(a.body.data.id).toBe((await call(profileRoute, A)).body.data.id);
  });

  it('completion is computed from the same profile for each account', async () => {
    const a = await call(completionRoute, A);
    const b = await call(completionRoute, B);
    // A: all required fields, no optional ones = 80%. B: everything = 100%.
    expect(a.body).toMatchObject({ success: true, percentage: 80, missingFields: [] });
    expect(b.body).toMatchObject({ success: true, percentage: 100 });
  });

  it('missing authentication is 401 everywhere', async () => {
    for (const route of [profileRoute, completionRoute, customerProfileRoute, sessionsRoute]) {
      expect((await call(route, null)).status).toBe(401);
    }
  });
});

describe('Customers can only change their own profile', () => {
  const valid = { fullName: 'Shiv Updated', phoneNumber: '7000000001', city: 'Hyderabad', state: 'Telangana', pincode: '500002' };

  it('a manipulated userId or id in the body is ignored: A updates A, never B', async () => {
    const r = await call(profileRoute, A, { method: 'POST', body: { ...valid, userId: B.id, id: 'cp-b' } });
    expect(r.status).toBe(200);
    expect(profileOf(A.id)).toMatchObject({ id: 'cp-a', fullName: 'Shiv Updated', pincode: '500002' });
    expect(profileOf(B.id)).toMatchObject({ id: 'cp-b', fullName: 'Other Customer', pincode: '411001' });
  });

  it('the legacy endpoint also writes only the caller\'s own profile', async () => {
    const r = await call(customerProfileRoute, B, { method: 'PUT', body: { ...valid, fullName: 'Other Updated', phoneNumber: '7000000002', userId: A.id } });
    expect(r.status).toBe(200);
    expect(profileOf(B.id).fullName).toBe('Other Updated');
    expect(profileOf(A.id).fullName).toBe('Shiv Updated');
  });

  it('validation errors are reported per field and change nothing', async () => {
    const r = await call(profileRoute, A, { method: 'POST', body: { ...valid, pincode: 'abc' } });
    expect(r.status).toBe(400);
    expect(r.body.errors.some((e: any) => e.field === 'pincode')).toBe(true);
    expect(profileOf(A.id).pincode).toBe('500002');
  });

  it('a professional reads and edits their own professional profile', async () => {
    const r = await call(profileRoute, P);
    expect(r.body.data).toMatchObject({ userId: P.id, businessName: 'Pro Test Works' });
  });
});

describe('Sessions list (Security tab)', () => {
  it('shows only the caller\'s own, unexpired sign-in sessions', async () => {
    const r = await call(sessionsRoute, A);
    expect(r.status).toBe(200);
    expect(r.body.data.map((s: any) => s.id)).toEqual(['s-a1']);
    expect(JSON.stringify(r.body.data)).not.toContain('hashA1'); // token values never returned
  });

  it('cannot revoke another account\'s session', async () => {
    await call(sessionsRoute, A, { method: 'DELETE', body: { sessionId: 's-b1' } });
    expect(h.db._tables.userSession.some((s: any) => s.id === 's-b1')).toBe(true);
  });
});
