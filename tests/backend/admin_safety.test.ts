import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import type { AddressInfo } from 'net';
import type { Server } from 'http';

// In-memory database shared by the mocked db module (test data only).
const h = vi.hoisted(() => ({ db: null as any }));
vi.mock('../../api-lib/utils/db.js', async () => {
  const { createFakePrisma } = await import('./helpers/fakePrisma.js');
  h.db = createFakePrisma();
  return { db: h.db };
});
// Caller identity: req.__user for direct handler calls, or an `x-test-user` header for HTTP calls.
vi.mock('../../api-lib/utils/auth.js', () => ({
  verifyToken: (req: any) => req.__user ?? (req.headers?.['x-test-user'] ? JSON.parse(String(req.headers['x-test-user'])) : null),
  hasRole: (u: any, roles: string[]) => roles.includes(u.role),
  generateAccessToken: (u: any) => `access:${u.id}`,
  getTempUserId: async () => 'temp_unregistered',
}));

import adminUserRoute from '../../api-lib/routes/admin/users/[id].js';
import verifyProviderRoute from '../../api-lib/routes/providers/[id]/verify.js';
import featureProviderRoute from '../../api-lib/routes/providers/[id]/feature.js';
import deleteAccountRoute from '../../api-lib/routes/user/delete-account.js';
import { db } from '../../api-lib/utils/db.js';

async function call(handler: any, user: any, opts: { method?: string; query?: any; body?: any } = {}) {
  let status = 200;
  let body: any;
  const res: any = { status: (s: number) => ((status = s), res), json: (b: any) => ((body = b), res), setHeader: () => res };
  await handler({ method: opts.method ?? 'PATCH', query: opts.query ?? {}, body: opts.body ?? {}, headers: {}, __user: user }, res);
  return { status, body };
}

const A1 = { id: 'u-admin1', role: 'ADMIN', email: 'a1@example.test' };
const A2 = { id: 'u-admin2', role: 'ADMIN', email: 'a2@example.test' };
const CUST = { id: 'u-cust', role: 'CUSTOMER', email: 'c@example.test' };
const PRO = { id: 'u-pro', role: 'PROVIDER', email: 'p@example.test' };
const adminEvents = () => h.db._tables.globalActivity?.filter((e: any) => e.activityType === 'ADMIN_ACTION') ?? [];

beforeAll(async () => {
  for (const u of [A1, CUST, PRO]) await db.user.create({ data: { ...u, password: 'x' } });
  await db.serviceCategory.create({ data: { id: 2, name: 'Electrician', slug: 'electrical', isActive: true, deletedAt: null } });
  await db.providerProfile.create({ data: { id: 'p1', userId: PRO.id, fullName: 'Pro', categoryId: 2, verificationStatus: 'PENDING', email: 'p@login.test', phoneNumber: '9', city: 'X', state: 'Y', experienceYears: 1 } });
  await db.userSession.create({ data: { userId: CUST.id, token: 'refresh-hash-cust', expiresAt: new Date(Date.now() + 86400_000) } });
});

describe('Admin user management', () => {
  it('non-admins cannot change roles or statuses', async () => {
    for (const u of [CUST, PRO]) {
      const r = await call(adminUserRoute, u, { query: { id: CUST.id }, body: { role: 'ADMIN' } });
      expect(r.status).toBe(403);
    }
    expect((await db.user.findUnique({ where: { id: CUST.id } })).role).toBe('CUSTOMER');
  });

  it('rejects invalid values and empty updates', async () => {
    expect((await call(adminUserRoute, A1, { query: { id: CUST.id }, body: { role: 'SUPERADMIN' } })).status).toBe(400);
    expect((await call(adminUserRoute, A1, { query: { id: CUST.id }, body: { status: 'BANNED' } })).status).toBe(400);
    expect((await call(adminUserRoute, A1, { query: { id: CUST.id }, body: {} })).status).toBe(400);
  });

  it('the last active administrator cannot be demoted, suspended or deleted (including by themselves)', async () => {
    expect((await call(adminUserRoute, A1, { query: { id: A1.id }, body: { role: 'CUSTOMER' } })).status).toBe(409);
    expect((await call(adminUserRoute, A1, { query: { id: A1.id }, body: { status: 'SUSPENDED' } })).status).toBe(409);
    expect((await call(adminUserRoute, A1, { method: 'DELETE', query: { id: A1.id } })).status).toBe(409);
    expect((await call(deleteAccountRoute, A1, { method: 'DELETE', body: {} })).status).toBe(409);
    expect(await db.user.findUnique({ where: { id: A1.id } })).toMatchObject({ role: 'ADMIN', status: 'ACTIVE' });
  });

  it('with another active admin the change is allowed, sessions are revoked and the action is recorded', async () => {
    await db.user.create({ data: { ...A2, password: 'x' } });
    await db.userSession.create({ data: { userId: A2.id, token: 'refresh-hash-a2', expiresAt: new Date(Date.now() + 86400_000) } });
    const r = await call(adminUserRoute, A1, { query: { id: A2.id }, body: { role: 'CUSTOMER' } });
    expect(r.status).toBe(200);
    expect(r.body.data.role).toBe('CUSTOMER');
    expect(h.db._tables.userSession.some((s: any) => s.userId === A2.id)).toBe(false);
    const e = adminEvents().find((x: any) => x.targetId === A2.id);
    expect(e).toMatchObject({ actorId: A1.id, targetType: 'USER' });
    expect(e.description).toContain('role ADMIN -> CUSTOMER');
    expect(e.description).not.toContain('@'); // no personal data in audit text
  });

  it('suspending a customer revokes their sessions and is recorded', async () => {
    const r = await call(adminUserRoute, A1, { query: { id: CUST.id }, body: { status: 'SUSPENDED' } });
    expect(r.status).toBe(200);
    expect(h.db._tables.userSession.some((s: any) => s.userId === CUST.id)).toBe(false);
    expect(adminEvents().some((x: any) => x.targetId === CUST.id && x.description.includes('status ACTIVE -> SUSPENDED'))).toBe(true);
  });
});

describe('Provider verification is admin-only and audited', () => {
  it('a professional cannot verify themselves', async () => {
    expect((await call(verifyProviderRoute, PRO, { method: 'PATCH', query: { id: 'p1' }, body: { status: 'VERIFIED' } })).status).toBe(403);
    expect((await db.providerProfile.findUnique({ where: { id: 'p1' } })).verificationStatus).toBe('PENDING');
  });

  it('admin verification and featuring are recorded', async () => {
    const v = await call(verifyProviderRoute, A1, { method: 'PATCH', query: { id: 'p1' }, body: { status: 'VERIFIED' } });
    expect(v.status).toBe(200);
    expect(adminEvents().some((x: any) => x.targetType === 'PROVIDER_PROFILE' && x.targetId === 'p1' && x.description.includes('verification to VERIFIED'))).toBe(true);
    const f = await call(featureProviderRoute, A1, { method: 'PATCH', query: { id: 'p1' }, body: { isFeatured: true } });
    expect(f.status).toBe(200);
    expect(adminEvents().some((x: any) => x.targetId === 'p1' && x.description.includes('featured to true'))).toBe(true);
  });
});

describe('Admin access tokens are re-checked against the database', () => {
  let server: Server;
  let base = '';
  beforeAll(async () => {
    const { default: app } = await import('../../api-lib/app.js');
    server = app.listen(0);
    await new Promise((r) => server.once('listening', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => server?.close());

  const asUser = (u: any) => ({ 'x-test-user': JSON.stringify({ id: u.id, role: u.role, email: u.email }) });

  it('an active admin passes; a demoted or suspended admin with an old token is refused', async () => {
    const ok = await fetch(`${base}/api/admin/users/${CUST.id}`, { method: 'PATCH', headers: { ...asUser(A1), 'content-type': 'application/json' }, body: JSON.stringify({ status: 'ACTIVE' }) });
    expect(ok.status).toBe(200);
    // A2 was demoted to CUSTOMER above but still holds a token that says ADMIN.
    const stale = await fetch(`${base}/api/admin/users/${CUST.id}`, { method: 'PATCH', headers: { ...asUser(A2), 'content-type': 'application/json' }, body: JSON.stringify({ status: 'SUSPENDED' }) });
    expect(stale.status).toBe(401);
    expect((await stale.json()).code).toBe('SESSION_REVOKED');
    expect((await db.user.findUnique({ where: { id: CUST.id } })).status).toBe('ACTIVE');
  });

  it('non-admin requests are not affected', async () => {
    const r = await fetch(`${base}/api/categories`, { headers: asUser(CUST) });
    expect(r.status).not.toBe(401);
  });
});
