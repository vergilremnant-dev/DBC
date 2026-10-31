/**
 * Phase 1 — Firebase phone OTP authentication (backend).
 *
 * Exercises phoneAuthService with an in-memory database double and a fake
 * Firebase verifier, so these tests need no live database or Firebase project.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// The route-handler tests below need a database for the per-IP limiter (which fails closed without one).
// Service tests inject their own doubles; routes get an in-memory database (test data only).
vi.mock('../../api-lib/utils/db.js', async () => {
  const { createFakePrisma } = await import('./helpers/fakePrisma.js');
  const db = createFakePrisma();
  await db.user.create({ data: { id: 'temp_unregistered', email: 'system_temp_otp@dbc.com', password: 'x' } });
  return { db };
});
import {
  registerPhoneUser,
  startPhoneSession,
  toPhoneAuthHttpError,
  PhoneAuthError,
  type PhoneAuthDeps,
} from '../../api-lib/services/phoneAuthService.js';
import { FirebaseTokenError } from '../../api-lib/utils/verifyFirebaseToken.js';

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

type Row = Record<string, any>;

function uniqueViolation() {
  return Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
}

function createFakeDb(seedUsers: Row[] = []) {
  let users: Row[] = seedUsers.map((u) => ({
    firebaseUid: null,
    phoneE164: null,
    phoneVerifiedAt: null,
    customerProfile: null,
    providerProfile: null,
    status: 'ACTIVE',
    ...u,
  }));
  let nextId = 1;
  const failures: { transaction?: Error; profileCreate?: Error } = {};
  const tick = () => new Promise((r) => setTimeout(r, 0));

  const matchesWhere = (u: Row, where: Row): boolean => {
    if (where.OR) return where.OR.some((w: Row) => matchesWhere(u, w));
    return Object.entries(where).every(([key, cond]) => {
      if (key === 'customerProfile' || key === 'providerProfile') {
        const profile = u[key];
        if (!profile) return false;
        const pn = (cond as Row).phoneNumber;
        return pn?.in ? pn.in.includes(profile.phoneNumber) : profile.phoneNumber === pn;
      }
      return u[key] !== null && u[key] !== undefined && u[key] === cond;
    });
  };

  const assertUnique = (candidate: Row, exceptId?: string) => {
    for (const field of ['email', 'firebaseUid', 'phoneE164']) {
      if (candidate[field] == null) continue;
      if (users.some((u) => u.id !== exceptId && u[field] === candidate[field])) throw uniqueViolation();
    }
  };

  const clone = (u: Row | undefined | null) => (u ? JSON.parse(JSON.stringify(u)) : null);

  const userApi = {
    async findUnique({ where }: Row) {
      await tick();
      return clone(users.find((u) => matchesWhere(u, where)));
    },
    async findFirst({ where }: Row) {
      await tick();
      return clone(users.find((u) => matchesWhere(u, where)));
    },
    async create({ data }: Row) {
      await tick();
      assertUnique(data);
      const row = { id: `user-${nextId++}`, customerProfile: null, providerProfile: null, ...data };
      users.push(row);
      return clone(row);
    },
    async update({ where, data }: Row) {
      await tick();
      const row = users.find((u) => u.id === where.id);
      if (!row) throw new Error('Record not found');
      assertUnique({ ...row, ...data }, row.id);
      Object.assign(row, data);
      return clone(row);
    },
  };

  const customerProfileApi = {
    async create({ data }: Row) {
      await tick();
      if (failures.profileCreate) throw failures.profileCreate;
      const row = users.find((u) => u.id === data.userId);
      if (!row) throw new Error('FK violation');
      row.customerProfile = { ...data };
      return { ...data };
    },
  };

  const db = {
    user: userApi,
    customerProfile: customerProfileApi,
    async $transaction(fn: (tx: unknown) => Promise<unknown>) {
      if (failures.transaction) throw failures.transaction;
      const createdInTx: string[] = [];
      const txUser = {
        ...userApi,
        async create(args: Row) {
          const row = await userApi.create(args);
          createdInTx.push(row!.id);
          return row;
        },
      };
      try {
        return await fn({ user: txUser, customerProfile: customerProfileApi });
      } catch (err) {
        users = users.filter((u) => !createdInTx.includes(u.id)); // rollback this tx only
        throw err;
      }
    },
  };

  return {
    db,
    failures,
    get users() {
      return users;
    },
  };
}

const IDENTITIES: Record<string, { uid: string; phoneNumber?: string; signInProvider?: string }> = {
  'token-new': { uid: 'fb-uid-new', phoneNumber: '+919876543210', signInProvider: 'phone' },
  'token-legacy': { uid: 'fb-uid-legacy', phoneNumber: '+919000000001', signInProvider: 'phone' },
  'token-profile-only': { uid: 'fb-uid-profile', phoneNumber: '+919000000002', signInProvider: 'phone' },
  'token-provider': { uid: 'fb-uid-provider', phoneNumber: '+919000000003', signInProvider: 'phone' },
  'token-suspended': { uid: 'fb-uid-suspended', phoneNumber: '+919000000004', signInProvider: 'phone' },
  'token-recreated': { uid: 'fb-uid-recreated', phoneNumber: '+919000000005', signInProvider: 'phone' },
};

async function fakeVerifyPhoneIdentity(token?: string) {
  if (!token) throw new FirebaseTokenError('MISSING_TOKEN');
  if (token === 'token-expired') throw new FirebaseTokenError('EXPIRED_TOKEN');
  if (token === 'token-forged') throw new FirebaseTokenError('INVALID_TOKEN');
  const identity = IDENTITIES[token];
  if (!identity) throw new FirebaseTokenError('INVALID_TOKEN');
  if (!identity.phoneNumber) throw new FirebaseTokenError('NOT_PHONE_IDENTITY');
  return identity as { uid: string; phoneNumber: string };
}

function createDeps(fake: ReturnType<typeof createFakeDb>) {
  const sessions: { userId: string; role: string }[] = [];
  const events: { actorId: string; type: string; description: string }[] = [];
  const deps: PhoneAuthDeps = {
    db: fake.db as unknown as PhoneAuthDeps['db'],
    verifyPhoneIdentity: fakeVerifyPhoneIdentity as unknown as PhoneAuthDeps['verifyPhoneIdentity'],
    createSession: (async (user: Row) => {
      sessions.push({ userId: user.id, role: user.role });
      return {
        accessToken: `access-${user.id}`,
        refreshToken: `refresh-${user.id}`,
        user: { id: user.id, email: user.email, role: `ROLE_${user.role}`, status: user.status },
      };
    }) as unknown as PhoneAuthDeps['createSession'],
    logEvent: (async (actorId: string, type: string, description: string) => {
      events.push({ actorId, type, description });
    }) as unknown as PhoneAuthDeps['logEvent'],
    hashPassword: async (raw) => `hashed:${raw.length}`,
    now: () => new Date('2026-10-26T00:00:00Z'),
  };
  return { deps, sessions, events };
}

const ctx = { userAgent: 'vitest', ipAddress: '203.0.113.7' };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Phase 1 — Phone OTP authentication service', () => {
  let fake: ReturnType<typeof createFakeDb>;
  let harness: ReturnType<typeof createDeps>;

  beforeEach(() => {
    fake = createFakeDb([
      // Legacy phone-registered customer (old wizard: <10 digits>@dbc.com, no firebase link)
      {
        id: 'legacy-1',
        email: '9000000001@dbc.com',
        role: 'CUSTOMER',
        customerProfile: { fullName: 'Legacy Customer', phoneNumber: '9000000001' },
      },
      // Email account whose profile phone was typed in (unverified)
      {
        id: 'email-1',
        email: 'someone@example.com',
        role: 'CUSTOMER',
        customerProfile: { fullName: 'Email User', phoneNumber: '9000000002' },
      },
      // Professional linked earlier
      {
        id: 'provider-1',
        email: 'pro@example.com',
        role: 'PROVIDER',
        firebaseUid: 'fb-uid-provider',
        phoneE164: '+919000000003',
        providerProfile: { fullName: 'Pro Builder', phoneNumber: '9000000003', categoryId: 4 },
      },
      {
        id: 'suspended-1',
        email: 'blocked@example.com',
        role: 'CUSTOMER',
        status: 'SUSPENDED',
        firebaseUid: 'fb-uid-suspended',
        phoneE164: '+919000000004',
      },
      // Linked to a different Firebase UID for the same phone
      {
        id: 'conflict-1',
        email: 'conflict@example.com',
        role: 'CUSTOMER',
        firebaseUid: 'fb-uid-original',
        phoneE164: '+919000000005',
      },
    ]);
    harness = createDeps(fake);
  });

  describe('1. New-user registration', () => {
    it('login for an unknown number returns REGISTRATION_REQUIRED and creates nothing', async () => {
      const before = fake.users.length;
      const result = await startPhoneSession('token-new', ctx, harness.deps);
      expect(result).toEqual({ status: 'REGISTRATION_REQUIRED', phoneE164: '+919876543210' });
      expect(fake.users.length).toBe(before);
      expect(harness.sessions).toHaveLength(0);
    });

    it('registration creates one CUSTOMER account + profile and establishes a session', async () => {
      const result = await registerPhoneUser('token-new', { firstName: 'Asha', lastName: 'Rao' }, ctx, harness.deps);
      expect(result.status).toBe('AUTHENTICATED');
      if (result.status !== 'AUTHENTICATED') return;
      expect(result.isNewUser).toBe(true);

      const created = fake.users.find((u) => u.firebaseUid === 'fb-uid-new');
      expect(created).toBeDefined();
      expect(created!.role).toBe('CUSTOMER');
      expect(created!.phoneE164).toBe('+919876543210');
      expect(created!.email).toBe('9876543210@dbc.com');
      expect(created!.customerProfile).toMatchObject({ fullName: 'Asha Rao', phoneNumber: '9876543210', city: 'Hyderabad' });
      expect(harness.sessions).toEqual([{ userId: created!.id, role: 'CUSTOMER' }]);
    });

    it('rejects missing or invalid profile names before touching the database', async () => {
      await expect(registerPhoneUser('token-new', { firstName: '' }, ctx, harness.deps)).rejects.toMatchObject({
        code: 'INVALID_PROFILE',
      });
      await expect(registerPhoneUser('token-new', { firstName: '<script>' }, ctx, harness.deps)).rejects.toMatchObject({
        code: 'INVALID_PROFILE',
      });
      expect(fake.users.some((u) => u.firebaseUid === 'fb-uid-new')).toBe(false);
    });
  });

  describe('2. Existing-user lookup without duplicates', () => {
    it('signs a registered phone user back in without creating a second account', async () => {
      await registerPhoneUser('token-new', { firstName: 'Asha' }, ctx, harness.deps);
      const count = fake.users.length;
      const result = await startPhoneSession('token-new', ctx, harness.deps);
      expect(result.status).toBe('AUTHENTICATED');
      if (result.status === 'AUTHENTICATED') expect(result.isNewUser).toBe(false);
      expect(fake.users.length).toBe(count);
    });

    it('links a legacy phone-registered account, preserving its user ID', async () => {
      const result = await startPhoneSession('token-legacy', ctx, harness.deps);
      expect(result.status).toBe('AUTHENTICATED');
      const legacy = fake.users.find((u) => u.id === 'legacy-1')!;
      expect(legacy.firebaseUid).toBe('fb-uid-legacy');
      expect(legacy.phoneE164).toBe('+919000000001');
      expect(harness.sessions[0].userId).toBe('legacy-1');
    });

    it('does NOT auto-link an account matched only by an unverified profile phone', async () => {
      await expect(startPhoneSession('token-profile-only', ctx, harness.deps)).rejects.toMatchObject({
        code: 'ACCOUNT_LINK_REQUIRED',
      });
      await expect(
        registerPhoneUser('token-profile-only', { firstName: 'Mallory' }, ctx, harness.deps)
      ).rejects.toMatchObject({ code: 'ACCOUNT_LINK_REQUIRED' });
      expect(fake.users.find((u) => u.id === 'email-1')!.firebaseUid).toBeNull();
      expect(harness.sessions).toHaveLength(0);
    });

    it('refuses to rebind a phone that is linked to a different Firebase UID', async () => {
      const err = await startPhoneSession('token-recreated', ctx, harness.deps).catch((e) => e);
      expect(err).toBeInstanceOf(PhoneAuthError);
      expect(toPhoneAuthHttpError(err).status).toBe(409);
      expect(fake.users.find((u) => u.id === 'conflict-1')!.firebaseUid).toBe('fb-uid-original');
    });
  });

  describe('4. Invalid / expired Firebase tokens', () => {
    for (const [token, code, status] of [
      ['token-expired', 'EXPIRED_TOKEN', 401],
      ['token-forged', 'INVALID_TOKEN', 401],
      [undefined, 'MISSING_TOKEN', 400],
    ] as const) {
      it(`${String(token)} -> ${code} (${status}) with no session or account`, async () => {
        const before = fake.users.length;
        const loginErr = await startPhoneSession(token, ctx, harness.deps).catch((e) => e);
        const regErr = await registerPhoneUser(token, { firstName: 'X' }, ctx, harness.deps).catch((e) => e);
        for (const err of [loginErr, regErr]) {
          expect(err).toBeInstanceOf(FirebaseTokenError);
          expect(err.code).toBe(code);
          expect(toPhoneAuthHttpError(err).status).toBe(status);
        }
        expect(fake.users.length).toBe(before);
        expect(harness.sessions).toHaveLength(0);
      });
    }
  });

  describe('5. Client-supplied UID / role / phone spoofing', () => {
    it('ignores firebaseUid, role and phone in the request body', async () => {
      const spoofed = {
        firstName: 'Eve',
        firebaseUid: 'attacker-chosen-uid',
        role: 'ADMIN',
        phone: '+911111111111',
        phoneVerified: true,
      } as Record<string, unknown>;
      const result = await registerPhoneUser('token-new', spoofed, ctx, harness.deps);
      expect(result.status).toBe('AUTHENTICATED');
      const created = fake.users.find((u) => u.firebaseUid === 'fb-uid-new')!;
      expect(created.role).toBe('CUSTOMER');
      expect(created.phoneE164).toBe('+919876543210');
      expect(fake.users.some((u) => u.firebaseUid === 'attacker-chosen-uid')).toBe(false);
      expect(fake.users.some((u) => u.phoneE164 === '+911111111111')).toBe(false);
    });
  });

  describe('6. Duplicate registration requests', () => {
    it('a repeated registration signs in to the same account', async () => {
      const first = await registerPhoneUser('token-new', { firstName: 'Asha' }, ctx, harness.deps);
      const second = await registerPhoneUser('token-new', { firstName: 'Different' }, ctx, harness.deps);
      expect(first.status === 'AUTHENTICATED' && first.isNewUser).toBe(true);
      expect(second.status === 'AUTHENTICATED' && second.isNewUser).toBe(false);
      expect(fake.users.filter((u) => u.firebaseUid === 'fb-uid-new')).toHaveLength(1);
      // Existing profile is not overwritten by the repeat request
      expect(fake.users.find((u) => u.firebaseUid === 'fb-uid-new')!.customerProfile.fullName).toBe('Asha');
    });

    it('concurrent registrations create exactly one account', async () => {
      const results = await Promise.all([
        registerPhoneUser('token-new', { firstName: 'Asha' }, ctx, harness.deps),
        registerPhoneUser('token-new', { firstName: 'Asha' }, ctx, harness.deps),
      ]);
      expect(results.every((r) => r.status === 'AUTHENTICATED')).toBe(true);
      expect(fake.users.filter((u) => u.firebaseUid === 'fb-uid-new')).toHaveLength(1);
      const ids = new Set(harness.sessions.map((s) => s.userId));
      expect(ids.size).toBe(1);
    });
  });

  describe('7. Database failures', () => {
    it('transaction failure returns a generic 500 and no session', async () => {
      fake.failures.transaction = new Error('connection terminated unexpectedly');
      const err = await registerPhoneUser('token-new', { firstName: 'Asha' }, ctx, harness.deps).catch((e) => e);
      const http = toPhoneAuthHttpError(err);
      expect(http.status).toBe(500);
      expect(http.message).not.toContain('connection');
      expect(harness.sessions).toHaveLength(0);
    });

    it('profile creation failure rolls back the user row (no orphan account)', async () => {
      fake.failures.profileCreate = new Error('insert failed');
      await expect(registerPhoneUser('token-new', { firstName: 'Asha' }, ctx, harness.deps)).rejects.toThrow('insert failed');
      expect(fake.users.some((u) => u.firebaseUid === 'fb-uid-new')).toBe(false);
      // A retry after the failure succeeds
      fake.failures.profileCreate = undefined;
      const retry = await registerPhoneUser('token-new', { firstName: 'Asha' }, ctx, harness.deps);
      expect(retry.status).toBe('AUTHENTICATED');
    });
  });

  describe('10. Existing roles and profile relationships', () => {
    it('a linked professional keeps PROVIDER role, user ID and provider profile', async () => {
      const result = await startPhoneSession('token-provider', ctx, harness.deps);
      expect(result.status).toBe('AUTHENTICATED');
      if (result.status === 'AUTHENTICATED') expect(result.session.user.role).toBe('ROLE_PROVIDER');
      const pro = fake.users.find((u) => u.id === 'provider-1')!;
      expect(pro.role).toBe('PROVIDER');
      expect(pro.providerProfile).toMatchObject({ fullName: 'Pro Builder', categoryId: 4 });
      expect(pro.customerProfile).toBeNull();
    });

    it('registration on a professional\'s number signs them in instead of creating a customer', async () => {
      const result = await registerPhoneUser('token-provider', { firstName: 'Someone' }, ctx, harness.deps);
      expect(result.status === 'AUTHENTICATED' && result.isNewUser).toBe(false);
      expect(fake.users.filter((u) => u.phoneE164 === '+919000000003')).toHaveLength(1);
      expect(fake.users.find((u) => u.id === 'provider-1')!.customerProfile).toBeNull();
    });

    it('suspended accounts are refused with 403 and get no session', async () => {
      const err = await startPhoneSession('token-suspended', ctx, harness.deps).catch((e) => e);
      expect(err).toMatchObject({ code: 'ACCOUNT_INACTIVE' });
      expect(toPhoneAuthHttpError(err).status).toBe(403);
      expect(harness.sessions).toHaveLength(0);
    });

    it('records the login IP for the existing rate limiter', async () => {
      await startPhoneSession('token-legacy', ctx, harness.deps);
      expect(harness.events.some((e) => e.type === 'LOGIN' && e.description.includes('IP: 203.0.113.7'))).toBe(true);
    });
  });
});

describe('Phase 1 — Phone auth route handlers', () => {
  function mockRes() {
    const out: { status?: number; body?: any; headers: Record<string, unknown> } = { headers: {} };
    const res = {
      status(code: number) {
        out.status = code;
        return { json: (b: unknown) => ((out.body = b), b) };
      },
      setHeader(name: string, value: unknown) {
        out.headers[name.toLowerCase()] = value;
      },
      getHeader(name: string) {
        return out.headers[name.toLowerCase()];
      },
    };
    return { res, out };
  }

  it('rejects non-POST methods', async () => {
    const { default: handler } = await import('../../api-lib/routes/auth/phone-session.js');
    const { res, out } = mockRes();
    await handler({ method: 'GET', headers: {} } as any, res as any);
    expect(out.status).toBe(405);
  });

  it('missing token -> 400 and no refresh cookie', async () => {
    const { default: handler } = await import('../../api-lib/routes/auth/phone-session.js');
    const { res, out } = mockRes();
    await handler({ method: 'POST', headers: {}, body: { firebaseUid: 'spoofed' } } as any, res as any);
    expect(out.status).toBe(400);
    expect(out.body).toMatchObject({ success: false, code: 'MISSING_TOKEN' });
    expect(out.headers['set-cookie']).toBeUndefined();
  });

  it('register route never accepts identity without a token', async () => {
    const { default: handler } = await import('../../api-lib/routes/auth/phone-register.js');
    const { res, out } = mockRes();
    await handler(
      { method: 'POST', headers: {}, body: { firstName: 'Eve', firebaseUid: 'x', role: 'ADMIN', phone: '+919876543210' } } as any,
      res as any
    );
    expect(out.status).toBe(400);
    expect(out.body.success).toBe(false);
    expect(out.headers['set-cookie']).toBeUndefined();
  });
});
