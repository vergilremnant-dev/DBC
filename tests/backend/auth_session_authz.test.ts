/**
 * Phase 2 — Session lifecycle, backend authorization and security hardening.
 *
 * Route handlers are exercised directly with an in-memory database double, so
 * these tests need no live database. The double is installed both through
 * vi.mock (vitest) and Prisma's existing `globalThis.prisma` singleton hook.
 * Route modules are imported dynamically after the double is in place.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { vi } from 'vitest';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// In-memory Prisma double: every model/method records its call and returns
// whatever the current test configured with fake.on(model, method, fn).
// ---------------------------------------------------------------------------
const { fake } = vi.hoisted(() => {
  type Handler = (args: any) => any;
  const handlers: Record<string, Record<string, Handler>> = {};
  const calls: { model: string; method: string; args: any }[] = [];
  const LIST_METHODS = ['findMany'];
  const COUNT_METHODS = ['deleteMany', 'updateMany', 'createMany'];

  const model = (name: string) =>
    new Proxy(
      {},
      {
        get(_t, method: string) {
          if (method === 'then') return undefined;
          return async (args: any) => {
            calls.push({ model: name, method, args });
            const h = handlers[name]?.[method];
            if (h) return h(args);
            if (LIST_METHODS.includes(method)) return [];
            if (COUNT_METHODS.includes(method)) return { count: 0 };
            if (method === 'count') return 0;
            if (method === 'create' || method === 'update') return { id: `${name}-new`, ...(args?.data || {}) };
            return null;
          };
        },
      }
    );

  const base: Record<string, any> = {
    $transaction: async (arg: any) => (typeof arg === 'function' ? arg(db) : Promise.all(arg)),
  };
  const db: any = new Proxy(base, {
    get(t, p: string) {
      if (p in t) return t[p];
      if (typeof p !== 'string' || p === 'then') return undefined;
      t[p] = model(p);
      return t[p];
    },
  });

  const fake = {
    db,
    calls,
    on(m: string, method: string, fn: Handler) {
      (handlers[m] ||= {})[method] = fn;
    },
    reset() {
      for (const k of Object.keys(handlers)) delete handlers[k];
      calls.length = 0;
    },
    called(m: string, method: string) {
      return calls.filter((c) => c.model === m && c.method === method);
    },
  };
  (globalThis as any).prisma = db;
  return { fake };
});

vi.mock('../../api-lib/utils/db.js', () => ({ db: fake.db }));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const JWT_SECRET = 'phase2_test_secret_value';
const USERS = {
  custA: { id: 'u-cust-a', email: 'a@example.com', role: 'CUSTOMER' },
  custB: { id: 'u-cust-b', email: 'b@example.com', role: 'CUSTOMER' },
  proA: { id: 'u-pro-a', email: 'pa@example.com', role: 'PROVIDER' },
  proB: { id: 'u-pro-b', email: 'pb@example.com', role: 'PROVIDER' },
  worker: { id: 'u-worker', email: 'w@example.com', role: 'PROVIDER' },
  admin: { id: 'u-admin', email: 'admin@example.com', role: 'ADMIN' },
} as const;
const PROFILES: Record<string, { customer?: string; provider?: string }> = {
  'u-cust-a': { customer: 'cp-a' },
  'u-cust-b': { customer: 'cp-b' },
  'u-pro-a': { provider: 'pp-a' },
  'u-pro-b': { provider: 'pp-b' },
};

let generateAccessToken: (u: { id: string; email: string; role: string }) => string;

function bearer(user: { id: string; email: string; role: string }) {
  return `Bearer ${generateAccessToken(user)}`;
}

function mockReq(opts: { method?: string; auth?: string; query?: any; body?: any; cookie?: string; headers?: any }) {
  return {
    method: opts.method || 'GET',
    query: opts.query || {},
    body: opts.body || {},
    headers: {
      ...(opts.auth ? { authorization: opts.auth } : {}),
      ...(opts.cookie ? { cookie: opts.cookie } : {}),
      'user-agent': 'vitest',
      ...(opts.headers || {}),
    },
    socket: { remoteAddress: '203.0.113.9' },
  } as any;
}

function mockRes() {
  const out: { status?: number; body?: any; headers: Record<string, any> } = { headers: {} };
  const res: any = {
    status(code: number) {
      out.status = code;
      return {
        json: (b: any) => ((out.body = b), b),
        end: () => undefined,
      };
    },
    setHeader(name: string, value: any) {
      out.headers[name.toLowerCase()] = value;
    },
    getHeader(name: string) {
      return out.headers[name.toLowerCase()];
    },
  };
  return { res, out };
}

async function call(modulePath: string, req: any) {
  const { default: handler } = await import(modulePath);
  const { res, out } = mockRes();
  await handler(req, res);
  return out;
}

function setupProfiles() {
  fake.on('customerProfile', 'findUnique', ({ where }) =>
    PROFILES[where.userId]?.customer ? { id: PROFILES[where.userId].customer, userId: where.userId } : null
  );
  fake.on('providerProfile', 'findFirst', ({ where }) =>
    PROFILES[where.userId]?.provider ? { id: PROFILES[where.userId].provider, userId: where.userId } : null
  );
  fake.on('providerProfile', 'findUnique', ({ where }) =>
    PROFILES[where.userId]?.provider ? { id: PROFILES[where.userId].provider, userId: where.userId } : null
  );
}

function setupProject() {
  fake.on('project', 'findUnique', () => ({
    id: 'p1',
    customer: { id: 'cp-a', userId: USERS.custA.id },
    provider: { id: 'pp-a', userId: USERS.proA.id },
    resources: [{ userId: USERS.worker.id }],
  }));
}

function setupConversation() {
  fake.on('conversation', 'findUnique', ({ where }) =>
    where.id === 'c1' ? { id: 'c1', customerId: 'cp-a', providerId: 'pp-a', customer: { userId: USERS.custA.id }, provider: { userId: USERS.proA.id } } : null
  );
}

function setupQuotation(status = 'SUBMITTED') {
  fake.on('quotation', 'findUnique', ({ where }) =>
    where.id === 7
      ? {
          id: 7,
          status,
          totalAmount: 150000,
          provider: { id: 'pp-a', userId: USERS.proA.id },
          requirement: { id: 3, customer: { id: 'cp-a', userId: USERS.custA.id } },
          negotiations: [],
          history: [],
        }
      : null
  );
}

const R = '../../api-lib/routes';

// ---------------------------------------------------------------------------
beforeAll(async () => {
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.NODE_ENV = 'test';
  ({ generateAccessToken } = await import('../../api-lib/utils/auth.js'));
});

beforeEach(() => {
  fake.reset();
  process.env.JWT_SECRET = JWT_SECRET;
});

describe('Phase 2 — 5. Session restoration, refresh and logout', () => {
  const sha = (t: string) => crypto.createHash('sha256').update(t).digest('hex');
  const activeSession = (status = 'ACTIVE', expires = Date.now() + 3600_000) => ({
    id: 's1',
    userId: USERS.custA.id,
    token: sha('raw-refresh'),
    expiresAt: new Date(expires),
    user: { ...USERS.custA, status, customerProfile: { fullName: 'Asha Rao', phoneNumber: '9876543210' }, providerProfile: null },
  });

  it('restores a valid session, rotates the refresh token and sets a hardened cookie', async () => {
    fake.on('userSession', 'findUnique', ({ where }) => (where.token === sha('raw-refresh') ? activeSession() : null));
    const out = await call(`${R}/auth/refresh.js`, mockReq({ method: 'POST', cookie: 'refresh_token=raw-refresh' }));
    expect(out.status).toBe(200);
    expect(out.body.success).toBe(true);
    expect(typeof out.body.accessToken).toBe('string');
    expect(out.body.user.role).toBe('ROLE_CUSTOMER');
    const cookie = String(out.headers['set-cookie']);
    expect(cookie).toContain('refresh_token=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Path=/api/auth');
    expect(cookie).toContain('SameSite=Lax');
    const update = fake.called('userSession', 'update')[0];
    expect(update.args.data.token).not.toBe(sha('raw-refresh')); // rotated
    expect(cookie).not.toContain('raw-refresh');
  });

  it('rejects a rotated/unknown refresh token without issuing a session', async () => {
    const out = await call(`${R}/auth/refresh.js`, mockReq({ method: 'POST', cookie: 'refresh_token=old-rotated' }));
    expect(out.body.success).toBe(false);
    expect(out.body.accessToken).toBeUndefined();
    expect(out.headers['set-cookie']).toBeUndefined();
  });

  it('rejects and deletes an expired session', async () => {
    fake.on('userSession', 'findUnique', () => activeSession('ACTIVE', Date.now() - 1000));
    const out = await call(`${R}/auth/refresh.js`, mockReq({ method: 'POST', cookie: 'refresh_token=raw-refresh' }));
    expect(out.body.success).toBe(false);
    expect(fake.called('userSession', 'delete')).toHaveLength(1);
  });

  it('a suspended account cannot refresh and all its sessions are revoked', async () => {
    fake.on('userSession', 'findUnique', () => activeSession('SUSPENDED'));
    const out = await call(`${R}/auth/refresh.js`, mockReq({ method: 'POST', cookie: 'refresh_token=raw-refresh' }));
    expect(out.body.success).toBe(false);
    expect(out.body.message).toContain('inactive or suspended');
    expect(fake.called('userSession', 'deleteMany')[0].args.where).toEqual({ userId: USERS.custA.id });
    expect(fake.called('userSession', 'update')).toHaveLength(0);
  });

  it('no cookie -> not authenticated (no OTP needed for valid sessions, none issued without one)', async () => {
    const out = await call(`${R}/auth/refresh.js`, mockReq({ method: 'POST' }));
    expect(out.body.success).toBe(false);
  });

  it('logout revokes the server session and clears the refresh cookie on its path', async () => {
    fake.on('userSession', 'findUnique', () => ({ id: 's1', userId: USERS.custA.id }));
    const out = await call(`${R}/auth/logout.js`, mockReq({ method: 'POST', cookie: 'refresh_token=raw-refresh' }));
    expect(out.status).toBe(200);
    expect(fake.called('userSession', 'delete')).toHaveLength(1);
    const cookie = String(out.headers['set-cookie']);
    expect(cookie).toContain('Max-Age=0');
    expect(cookie).toContain('Path=/api/auth');
  });

  it('database failure during refresh fails closed', async () => {
    fake.on('userSession', 'findUnique', () => {
      throw new Error('connection refused');
    });
    const out = await call(`${R}/auth/refresh.js`, mockReq({ method: 'POST', cookie: 'refresh_token=raw-refresh' }));
    expect(out.body.success).toBe(false);
    expect(out.body.accessToken).toBeUndefined();
  });
});

describe('Phase 2 — Access token validation', () => {
  it('accepts a correctly signed token and rejects tampered, foreign-secret and alg:none tokens', async () => {
    const { verifyToken } = await import('../../api-lib/utils/auth.js');
    const good = generateAccessToken(USERS.custA);
    expect(verifyToken({ headers: { authorization: `Bearer ${good}` } } as any)?.id).toBe(USERS.custA.id);

    const [h, p, s] = good.split('.');
    const elevated = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(p, 'base64url').toString()), role: 'ADMIN' })).toString('base64url');
    expect(verifyToken({ headers: { authorization: `Bearer ${h}.${elevated}.${s}` } } as any)).toBeNull();

    process.env.JWT_SECRET = 'attacker_secret';
    const foreign = generateAccessToken({ ...USERS.custA, role: 'ADMIN' });
    process.env.JWT_SECRET = JWT_SECRET;
    expect(verifyToken({ headers: { authorization: `Bearer ${foreign}` } } as any)).toBeNull();

    const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ ...USERS.admin })).toString('base64url')}.`;
    expect(verifyToken({ headers: { authorization: `Bearer ${none}` } } as any)).toBeNull();
    expect(verifyToken({ headers: { authorization: 'Bearer not-a-jwt' } } as any)).toBeNull();
  });
});

describe('Phase 2 — 6. Unauthorized API access is rejected', () => {
  const protectedRoutes: [string, any][] = [
    [`${R}/projects/[id]/progress.js`, { method: 'GET', query: { id: 'p1' } }],
    [`${R}/projects/[id]/resources.js`, { method: 'GET', query: { id: 'p1' } }],
    [`${R}/projects/[id]/work-orders.js`, { method: 'GET', query: { id: 'p1' } }],
    [`${R}/projects/[id]/milestones.js`, { method: 'GET', query: { id: 'p1' } }],
    [`${R}/projects/[id]/approvals.js`, { method: 'POST', query: { id: 'p1' }, body: { action: 'REQUEST' } }],
    [`${R}/conversations/[id]/index.js`, { method: 'GET', query: { id: 'c1' } }],
    [`${R}/conversations/[id]/messages.js`, { method: 'GET', query: { id: 'c1' } }],
    [`${R}/quotations/[id]/index.js`, { method: 'GET', query: { id: '7' } }],
    [`${R}/activities/index.js`, { method: 'GET' }],
    [`${R}/requirements/[id]/attachments.js`, { method: 'POST', query: { id: '3' }, body: { fileName: 'a', fileUrl: 'u', fileType: 't' } }],
    [`${R}/admin/users/[id].js`, { method: 'GET', query: { id: 'u-cust-b' } }],
  ];
  for (const [path, req] of protectedRoutes) {
    it(`${path.replace(R, '')} -> 401 without a token`, async () => {
      const out = await call(path, mockReq(req));
      expect(out.status).toBe(401);
      expect(fake.calls.filter((c) => c.method !== 'count')).toHaveLength(0); // no data touched
    });
  }
});

describe('Phase 2 — 7 & 10. Project ownership (progress, resources, work orders, milestones, documents)', () => {
  beforeEach(setupProject);

  it('a customer cannot read another customer\'s project progress', async () => {
    const out = await call(`${R}/projects/[id]/progress.js`, mockReq({ auth: bearer(USERS.custB), query: { id: 'p1' } }));
    expect(out.status).toBe(403);
    expect(fake.called('progressLog', 'findMany')).toHaveLength(0);
  });

  it('a professional cannot read another professional\'s project resources', async () => {
    const out = await call(`${R}/projects/[id]/resources.js`, mockReq({ auth: bearer(USERS.proB), query: { id: 'p1' } }));
    expect(out.status).toBe(403);
  });

  it('project members can read; an assigned resource can read work orders', async () => {
    expect((await call(`${R}/projects/[id]/progress.js`, mockReq({ auth: bearer(USERS.custA), query: { id: 'p1' } }))).status).toBe(200);
    expect((await call(`${R}/projects/[id]/work-orders.js`, mockReq({ auth: bearer(USERS.worker), query: { id: 'p1' } }))).status).toBe(200);
    expect((await call(`${R}/projects/[id]/resources.js`, mockReq({ auth: bearer(USERS.admin), query: { id: 'p1' } }))).status).toBe(200);
  });

  it('write rules: only the assigned professional/team can log progress, assign resources or create work orders', async () => {
    const progressByCustomer = await call(`${R}/projects/[id]/progress.js`, mockReq({ method: 'POST', auth: bearer(USERS.custA), query: { id: 'p1' }, body: { completionPercentage: 50, notes: 'x' } }));
    expect(progressByCustomer.status).toBe(403);
    const resourceByCustomer = await call(`${R}/projects/[id]/resources.js`, mockReq({ method: 'POST', auth: bearer(USERS.custA), query: { id: 'p1' }, body: { email: 'w@example.com' } }));
    expect(resourceByCustomer.status).toBe(403);
    const woByCustomer = await call(`${R}/projects/[id]/work-orders.js`, mockReq({ method: 'POST', auth: bearer(USERS.custA), query: { id: 'p1' }, body: { title: 'Tile' } }));
    expect(woByCustomer.status).toBe(403);
    expect(fake.called('progressLog', 'create')).toHaveLength(0);
    expect(fake.called('workOrder', 'create')).toHaveLength(0);

    const progressByPro = await call(`${R}/projects/[id]/progress.js`, mockReq({ method: 'POST', auth: bearer(USERS.proA), query: { id: 'p1' }, body: { completionPercentage: 50, notes: 'Slab poured' } }));
    expect(progressByPro.status).toBe(201);
    expect(fake.called('progressLog', 'create')[0].args.data.reporterId).toBe(USERS.proA.id);
  });

  it('approval requests are limited to project participants', async () => {
    const out = await call(`${R}/projects/[id]/approvals.js`, mockReq({ method: 'POST', auth: bearer(USERS.proB), query: { id: 'p1' }, body: { action: 'REQUEST', targetType: 'MILESTONE', targetId: 'm1' } }));
    expect(out.status).toBe(403);
  });

  it('existing milestone and document checks still block outsiders (regression)', async () => {
    fake.on('project', 'findUnique', () => ({ id: 'p1', customer: { userId: USERS.custA.id }, provider: { userId: USERS.proA.id } }));
    expect((await call(`${R}/projects/[id]/milestones.js`, mockReq({ auth: bearer(USERS.custB), query: { id: 'p1' } }))).status).toBe(403);
    expect((await call(`${R}/projects/[id]/milestones.js`, mockReq({ method: 'POST', auth: bearer(USERS.custA), query: { id: 'p1' }, body: { name: 'M' } }))).status).toBe(403);
    expect((await call(`${R}/projects/[id]/documents.js`, mockReq({ auth: bearer(USERS.proB), query: { id: 'p1' } }))).status).toBe(403);
  });
});

describe('Phase 2 — 11. Messaging participants', () => {
  beforeEach(() => {
    setupProfiles();
    setupConversation();
  });

  it('a non-participant cannot read, post to or delete a conversation', async () => {
    expect((await call(`${R}/conversations/[id]/messages.js`, mockReq({ auth: bearer(USERS.custB), query: { id: 'c1' } }))).status).toBe(403);
    expect((await call(`${R}/conversations/[id]/index.js`, mockReq({ auth: bearer(USERS.proB), query: { id: 'c1' } }))).status).toBe(403);
    expect((await call(`${R}/conversations/[id]/index.js`, mockReq({ method: 'DELETE', auth: bearer(USERS.custB), query: { id: 'c1' } }))).status).toBe(403);
    expect(fake.called('conversation', 'delete')).toHaveLength(0);

    const post = await call(`${R}/chat/messages/index.js`, mockReq({ method: 'POST', auth: bearer(USERS.proB), body: { conversationId: 'c1', content: 'spam' } }));
    expect(post.status).toBe(403);
    expect(fake.called('message', 'create')).toHaveLength(0);
  });

  it('participants can read and post', async () => {
    expect((await call(`${R}/conversations/[id]/messages.js`, mockReq({ auth: bearer(USERS.custA), query: { id: 'c1' } }))).status).toBe(200);
    const post = await call(`${R}/chat/messages/index.js`, mockReq({ method: 'POST', auth: bearer(USERS.proA), body: { conversationId: 'c1', content: 'Site visit at 10' } }));
    expect(post.status).toBe(201);
    expect(fake.called('message', 'create')[0].args.data.senderId).toBe(USERS.proA.id);
  });

  it('read receipts only apply to messages in the participant\'s conversation', async () => {
    const out = await call(`${R}/conversations/[id]/read.js`, mockReq({ method: 'POST', auth: bearer(USERS.custA), query: { id: 'c1' }, body: { messageId: 'msg-in-other-conversation' } }));
    expect(out.status).toBe(404);
    expect(fake.called('readReceipt', 'create')).toHaveLength(0);
  });

  it('database errors return a generic message (no internal details)', async () => {
    fake.on('message', 'findMany', () => {
      throw new Error('relation "messages" does not exist at 10.0.0.5');
    });
    const out = await call(`${R}/conversations/[id]/messages.js`, mockReq({ auth: bearer(USERS.custA), query: { id: 'c1' } }));
    expect(out.status).toBe(500);
    expect(out.body.message).not.toContain('10.0.0.5');
  });
});

describe('Phase 2 — 9. Project requests and quotations', () => {
  it('a competing professional cannot read another professional\'s quotation', async () => {
    setupQuotation();
    const out = await call(`${R}/quotations/[id]/index.js`, mockReq({ auth: bearer(USERS.proB), query: { id: '7' } }));
    expect(out.status).toBe(403);
    expect(out.body.data).toBeUndefined();
  });

  it('the requesting customer, quoting professional and admins can read it', async () => {
    setupQuotation();
    for (const u of [USERS.custA, USERS.proA, USERS.admin]) {
      const out = await call(`${R}/quotations/[id]/index.js`, mockReq({ auth: bearer(u), query: { id: '7' } }));
      expect(out.status).toBe(200);
      expect(out.body.data.totalAmount).toBe(150000); // amounts untouched
    }
  });

  it('non-participants cannot change a quotation status (even "neutral" transitions)', async () => {
    setupQuotation('SUBMITTED');
    fake.on('user', 'findUnique', ({ where }) => Object.values(USERS).find((u) => u.id === where.id) || null);
    const out = await call(`${R}/quotations/[id]/status.js`, mockReq({ method: 'PUT', auth: bearer(USERS.custB), query: { id: '7' }, body: { status: 'VIEWED' } }));
    expect(out.status).toBe(403);
    expect(fake.called('quotation', 'update')).toHaveLength(0);
  });

  it('only the requirement owner (or admin) can attach files to a project request', async () => {
    fake.on('requirement', 'findUnique', () => ({ customer: { userId: USERS.custA.id } }));
    const body = { fileName: 'plan.pdf', fileUrl: 'https://files/plan.pdf', fileType: 'application/pdf' };
    expect((await call(`${R}/requirements/[id]/attachments.js`, mockReq({ method: 'POST', auth: bearer(USERS.proB), query: { id: '3' }, body }))).status).toBe(403);
    expect(fake.called('requirementAttachment', 'create')).toHaveLength(0);
    expect((await call(`${R}/requirements/[id]/attachments.js`, mockReq({ method: 'POST', auth: bearer(USERS.custA), query: { id: '3' }, body }))).status).toBe(201);
  });
});

describe('Phase 2 — 8. Admin-only operations and client-supplied roles', () => {
  it('non-admins are refused admin endpoints even if they send role=ADMIN in the body/headers', async () => {
    const req = mockReq({ auth: bearer(USERS.custA), query: { id: 'u-cust-b' }, body: { role: 'ADMIN' }, headers: { 'x-user-role': 'ADMIN' } });
    expect((await call(`${R}/admin/users/[id].js`, req)).status).toBe(403);
    const verify = await call(`${R}/providers/[id]/verify.js`, mockReq({ method: 'POST', auth: bearer(USERS.proA), query: { id: 'pp-a' }, body: { status: 'VERIFIED', role: 'ADMIN' } }));
    expect(verify.status).toBe(403);
  });

  it('an admin token is accepted by admin endpoints', async () => {
    const out = await call(`${R}/admin/users/[id].js`, mockReq({ auth: bearer(USERS.admin), query: { id: 'u-cust-b' } }));
    expect([401, 403]).not.toContain(out.status);
  });

  it('the activity log is scoped to the caller unless admin, and never selects password hashes', async () => {
    await call(`${R}/activities/index.js`, mockReq({ auth: bearer(USERS.custA) }));
    await call(`${R}/activities/index.js`, mockReq({ auth: bearer(USERS.admin) }));
    const [own, all] = fake.called('globalActivity', 'findMany');
    expect(own.args.where).toEqual({ actorId: USERS.custA.id });
    expect(all.args.where).toEqual({});
    expect(JSON.stringify(own.args.include)).not.toContain('password');
    expect(own.args.include.actor.select).toBeDefined();
  });

  it('announcement authors are returned without credential fields', async () => {
    await call(`${R}/announcements/index.js`, mockReq({ auth: bearer(USERS.custA) }));
    const args = fake.called('announcement', 'findMany')[0].args;
    expect(args.include.author.select).toBeDefined();
    expect(args.include.author.select.password).toBeUndefined();
  });
});

describe('Phase 2 — 12. Payment and financial record authorization', () => {
  beforeEach(() => {
    process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret';
  });
  const sign = (order: string, payment: string) =>
    crypto.createHmac('sha256', 'rzp_test_secret').update(`${order}|${payment}`).digest('hex');

  it('a bad signature only touches the caller\'s own payment record', async () => {
    const { verifyRazorpayPayment } = await import('../../api-lib/services/subscriptionService.js');
    await expect(verifyRazorpayPayment(USERS.custB.id, 'order_A', 'pay_A', 'f'.repeat(64))).rejects.toThrow('signature verification failed');
    const lookup = fake.called('payment', 'findFirst')[0];
    expect(lookup.args.where.userId).toBe(USERS.custB.id);
  });

  it('a validly signed payment that belongs to another user is refused and nothing is activated', async () => {
    fake.on('payment', 'findFirst', () => ({ id: 'pay-row', userId: USERS.custA.id, status: 'PENDING', plan: { id: 1 } }));
    const { verifyRazorpayPayment } = await import('../../api-lib/services/subscriptionService.js');
    await expect(verifyRazorpayPayment(USERS.custB.id, 'order_A', 'pay_A', sign('order_A', 'pay_A'))).rejects.toThrow('does not belong');
    expect(fake.called('userSubscription', 'create')).toHaveLength(0);
    expect(fake.called('payment', 'update')).toHaveLength(0);
  });
});

describe('Phase 2 — Response sanitizer and CORS', () => {
  it('strips password hashes at any depth and keeps other values intact', async () => {
    const { stripSensitiveFields } = await import('../../api-lib/utils/http.js');
    const when = new Date('2026-10-26T00:00:00Z');
    const out = stripSensitiveFields({
      success: true,
      data: [{ id: 'm1', createdAt: when, amount: 1200.5, sender: { id: 'u1', email: 'e', password: '$2a$10$hash', role: 'CUSTOMER' } }],
      password: 'x',
    });
    expect(JSON.stringify(out)).not.toContain('$2a$10$hash');
    expect((out as any).password).toBeUndefined();
    expect((out as any).data[0].createdAt).toBe(when);
    expect((out as any).data[0].amount).toBe(1200.5);
    expect((out as any).data[0].sender.email).toBe('e');
  });

  it('CORS echoes only allow-listed origins with credentials, never "*"', async () => {
    const { corsAllowlist } = await import('../../api-lib/utils/http.js');
    process.env.CORS_ALLOWED_ORIGINS = 'https://app.example.com, https://www.example.com/';
    const run = (origin: string, method = 'GET') => {
      const { res, out } = mockRes();
      let nextCalled = false;
      corsAllowlist({ method, headers: { origin } } as any, res, () => (nextCalled = true));
      return { out, nextCalled };
    };
    const ok = run('https://www.example.com');
    expect(ok.out.headers['access-control-allow-origin']).toBe('https://www.example.com');
    expect(ok.out.headers['access-control-allow-credentials']).toBe('true');
    expect(ok.nextCalled).toBe(true);

    const evil = run('https://evil.example.net');
    expect(evil.out.headers['access-control-allow-origin']).toBeUndefined();

    const preflight = run('https://evil.example.net', 'OPTIONS');
    expect(preflight.out.status).toBe(204);
    expect(preflight.out.headers['access-control-allow-methods']).toBeUndefined();
    delete process.env.CORS_ALLOWED_ORIGINS;
  });
});

describe('Phase 2 — Social login uses verified Firebase identity', () => {
  it('rejects a social token whose email is not verified and a token that fails verification', async () => {
    const tokenModule = await import('../../api-lib/utils/verifyFirebaseToken.js');
    const { socialLoginUser } = await import('../../api-lib/services/authService.js');
    tokenModule.__setFirebaseVerifierForTests(async (t: string) => {
      if (t === 'fb-unverified') return { uid: 'g1', email: 'victim@example.com', emailVerified: false, signInProvider: 'google.com' };
      throw new tokenModule.FirebaseTokenError('INVALID_TOKEN');
    });
    try {
      await expect(socialLoginUser({ idToken: 'fb-unverified', provider: 'google', email: 'victim@example.com' })).rejects.toThrow('must be verified');
      await expect(socialLoginUser({ idToken: 'token-for-another-firebase-project', provider: 'google', email: 'victim@example.com' })).rejects.toThrow('Invalid, expired, or unverified');
      expect(fake.called('user', 'findFirst')).toHaveLength(0); // client-supplied email never used for lookup
      expect(fake.called('userSession', 'create')).toHaveLength(0);
    } finally {
      tokenModule.__setFirebaseVerifierForTests(null);
    }
  });
});

describe('Phase 2 — Password reset token is not disclosed', () => {
  it('forgot-password never returns the reset token and responds identically for known and unknown emails', async () => {
    const unknown = await call(`${R}/auth/forgot-password.js`, mockReq({ method: 'POST', body: { email: 'nobody@example.com' } }));
    fake.on('user', 'findUnique', () => ({ id: USERS.custA.id, email: USERS.custA.email }));
    const known = await call(`${R}/auth/forgot-password.js`, mockReq({ method: 'POST', body: { email: USERS.custA.email } }));
    expect(known.status).toBe(200);
    expect(known.body.resetToken).toBeUndefined();
    expect(JSON.stringify(known.body)).toBe(JSON.stringify(unknown.body));
  });
});
