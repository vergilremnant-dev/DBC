import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// In-memory database shared by the mocked db module (test data only).
const h = vi.hoisted(() => ({ db: null as any }));
vi.mock('../../api-lib/utils/db.js', async () => {
  const { createFakePrisma } = await import('./helpers/fakePrisma.js');
  h.db = createFakePrisma();
  return { db: h.db };
});
// Authenticated routes read the caller from the request; tokens are opaque strings here.
vi.mock('../../api-lib/utils/auth.js', () => ({
  verifyToken: (req: any) => req.__user ?? null,
  hasRole: (u: any, roles: string[]) => roles.includes(u.role),
  generateAccessToken: (u: any) => `access:${u.id}`,
  getTempUserId: async () => 'temp_unregistered',
}));

import { loginUser, LoginThrottledError, GENERIC_LOGIN_ERROR } from '../../api-lib/services/authService.js';
import loginRoute from '../../api-lib/routes/auth/login.js';
import resetPasswordRoute from '../../api-lib/routes/auth/reset-password.js';
import forgotPasswordRoute from '../../api-lib/routes/auth/forgot-password.js';
import changePasswordRoute from '../../api-lib/routes/auth/change-password.js';
import sendOtpRoute from '../../api-lib/routes/auth/send-email-otp.js';
import verifyOtpRoute from '../../api-lib/routes/auth/verify-email-otp.js';
import registerRoute from '../../api-lib/routes/auth/register.js';
import { checkRateLimit } from '../../api-lib/utils/rateLimiter.js';
import { keyHash } from '../../api-lib/utils/authThrottle.js';
import { db } from '../../api-lib/utils/db.js';

let ipSeq = 0;
async function call(handler: any, opts: { method?: string; body?: any; user?: any; ip?: string } = {}) {
  let status = 200;
  let body: any;
  const res: any = { status: (s: number) => ((status = s), res), json: (b: any) => ((body = b), res), setHeader: () => res };
  const ip = opts.ip ?? `10.0.0.${++ipSeq}`;
  await handler({ method: opts.method ?? 'POST', body: opts.body ?? {}, query: {}, headers: { 'x-forwarded-for': ip }, socket: {}, __user: opts.user }, res);
  return { status, body };
}

const PASSWORD = 'Correct-Horse-9!';
async function makeUser(id: string, email: string, status = 'ACTIVE', role = 'CUSTOMER') {
  return db.user.create({ data: { id, email, password: await bcrypt.hash(PASSWORD, 4), role, status } });
}
const resetToken = async (userId: string) => {
  const raw = crypto.randomBytes(16).toString('hex');
  await db.userSession.create({ data: { userId, token: `PWD_RESET:${crypto.createHash('sha256').update(raw).digest('hex')}`, expiresAt: new Date(Date.now() + 3600_000) } });
  return raw;
};
const sessionTokens = () => h.db._tables.userSession.map((r: any) => r.token as string);

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-for-hmac-only';
  await db.user.create({ data: { id: 'temp_unregistered', email: 'system_temp_otp@dbc.com', password: 'x', role: 'CUSTOMER' } });
});
afterEach(() => vi.restoreAllMocks());

describe('Login lockout and generic errors', () => {
  it('unknown account and wrong password get the same message', async () => {
    await makeUser('u-a', 'alice@example.test');
    await expect(loginUser({ email: 'nobody@example.test', password: 'whatever-1A!' })).rejects.toThrow(GENERIC_LOGIN_ERROR);
    await expect(loginUser({ email: 'alice@example.test', password: 'wrong-pass-1A!' })).rejects.toThrow(GENERIC_LOGIN_ERROR);
  });

  it('repeated failures lock sign-in temporarily but never suspend the account', async () => {
    await makeUser('u-b', 'bob@example.test');
    for (let i = 0; i < 5; i++) await expect(loginUser({ email: 'bob@example.test', password: `wrong-${i}-1A!` })).rejects.toThrow(GENERIC_LOGIN_ERROR);
    // Even the right password is refused while the temporary lock lasts.
    await expect(loginUser({ email: 'bob@example.test', password: PASSWORD })).rejects.toBeInstanceOf(LoginThrottledError);
    expect((await db.user.findUnique({ where: { id: 'u-b' } })).status).toBe('ACTIVE');
    const r = await call(loginRoute, { body: { email: 'bob@example.test', password: PASSWORD } });
    expect(r.status).toBe(429);
    expect(r.body.code).toBe('TOO_MANY_ATTEMPTS');
    // An unknown identifier locks the same way (no account-existence signal).
    for (let i = 0; i < 5; i++) await expect(loginUser({ email: 'ghost@example.test', password: 'x-1A!aaaa' })).rejects.toThrow(GENERIC_LOGIN_ERROR);
    await expect(loginUser({ email: 'ghost@example.test', password: 'x-1A!aaaa' })).rejects.toBeInstanceOf(LoginThrottledError);
  });

  it('a successful sign-in clears earlier failures', async () => {
    await makeUser('u-c', 'carol@example.test');
    for (let i = 0; i < 4; i++) await expect(loginUser({ email: 'carol@example.test', password: `bad-${i}-1A!` })).rejects.toThrow();
    const ok = await loginUser({ email: 'carol@example.test', password: PASSWORD });
    expect(ok.accessToken).toBe('access:u-c');
    for (let i = 0; i < 4; i++) await expect(loginUser({ email: 'carol@example.test', password: `bad-${i}-1A!` })).rejects.toThrow(GENERIC_LOGIN_ERROR);
  });

  it('account status is only revealed after the correct password', async () => {
    await makeUser('u-d', 'dave@example.test', 'SUSPENDED');
    await expect(loginUser({ email: 'dave@example.test', password: 'wrong-pass-1A!' })).rejects.toThrow(GENERIC_LOGIN_ERROR);
    await expect(loginUser({ email: 'dave@example.test', password: PASSWORD })).rejects.toThrow(/inactive or suspended/);
  });

  it('per-IP limit on the login route', async () => {
    const ip = '203.0.113.7';
    for (let i = 0; i < 10; i++) expect((await call(loginRoute, { ip, body: { email: `x${i}@example.test`, password: 'nope-1A!aa' } })).status).toBe(400);
    expect((await call(loginRoute, { ip, body: { email: 'x@example.test', password: 'nope-1A!aa' } })).status).toBe(429);
  });

  it('the limiter fails closed when the database is unavailable', async () => {
    vi.spyOn(h.db.userSession, 'findMany').mockRejectedValue(new Error('db down'));
    expect(await checkRateLimit('198.51.100.1', 10, 60000, 'login')).toBe(false);
    await expect(loginUser({ email: 'alice@example.test', password: PASSWORD })).rejects.toMatchObject({ unavailable: true });
  });
});

describe('Password reset never reactivates accounts', () => {
  it('suspended and inactive accounts stay as they are and keep their password', async () => {
    for (const [id, status] of [['u-s1', 'SUSPENDED'], ['u-s2', 'INACTIVE']] as const) {
      const before = await makeUser(id, `${id}@example.test`, status);
      const token = await resetToken(id);
      const r = await call(resetPasswordRoute, { body: { token, newPassword: 'Brand-New-Pass-77!' } });
      expect(r.status).toBe(400);
      const after = await db.user.findUnique({ where: { id } });
      expect(after.status).toBe(status);
      expect(after.password).toBe(before.password);
    }
  });

  it('an active account can still reset its password', async () => {
    const before = await makeUser('u-r1', 'reset-ok@example.test');
    const token = await resetToken('u-r1');
    const r = await call(resetPasswordRoute, { body: { token, newPassword: 'Brand-New-Pass-77!' } });
    expect(r.status).toBe(200);
    const after = await db.user.findUnique({ where: { id: 'u-r1' } });
    expect(after.status).toBe('ACTIVE');
    expect(after.password).not.toBe(before.password);
  });

  it('forgot-password says it is unavailable outside the test environment and issues no token', async () => {
    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const r = await call(forgotPasswordRoute, { body: { email: 'reset-ok@example.test' } });
      expect(r.status).toBe(503);
      expect(r.body.code).toBe('EMAIL_DELIVERY_UNAVAILABLE');
    } finally {
      process.env.NODE_ENV = env;
    }
    expect(sessionTokens().filter((t: string) => t.startsWith('PWD_RESET:')).length).toBe(0);
  });

  it('forgot-password issues no token for suspended accounts', async () => {
    const r = await call(forgotPasswordRoute, { body: { email: 'u-s1@example.test' } });
    expect(r.status).toBe(200);
    expect(h.db._tables.userSession.some((s: any) => s.userId === 'u-s1' && s.token.startsWith('PWD_RESET:'))).toBe(false);
  });
});

describe('Change password', () => {
  it('limits wrong current-password attempts per account', async () => {
    await makeUser('u-cp', 'cp@example.test');
    const user = { id: 'u-cp', role: 'CUSTOMER' };
    for (let i = 0; i < 5; i++) {
      expect((await call(changePasswordRoute, { user, body: { currentPassword: `bad-${i}`, newPassword: 'Brand-New-Pass-77!' } })).status).toBe(400);
    }
    expect((await call(changePasswordRoute, { user, body: { currentPassword: PASSWORD, newPassword: 'Brand-New-Pass-77!' } })).status).toBe(429);
  });
});

describe('Email OTP', () => {
  const send = (email: string, ip?: string) => call(sendOtpRoute, { body: { email }, ip });
  const verify = (email: string, otp: string, ip?: string) => call(verifyOtpRoute, { body: { email, otp }, ip });

  it('stores only a keyed digest (no code, no email) and enforces a resend cooldown', async () => {
    const email = 'test_otp_store@example.test';
    expect((await send(email)).status).toBe(200);
    const otpRows = sessionTokens().filter((t: string) => t.startsWith('EMAIL_OTP:'));
    expect(otpRows).toHaveLength(1);
    expect(otpRows[0]).not.toContain('123456');
    expect(otpRows[0]).not.toContain('test_otp_store');
    const again = await send(email);
    expect(again.status).toBe(429);
  });

  it('limits wrong codes, then destroys the code', async () => {
    const email = 'test_otp_attempts@example.test';
    await send(email);
    for (let i = 0; i < 5; i++) expect((await verify(email, '000000')).status).toBe(400);
    const locked = await verify(email, '123456');
    expect(locked.status).toBe(429);
    expect(sessionTokens().some((t: string) => t.startsWith(`EMAIL_OTP:${keyHash(email)}:`))).toBe(false);
    // The correct code no longer works: it was destroyed.
    expect((await verify(email, '123456')).status).not.toBe(200);
  });

  it('rejects expired codes and malformed input', async () => {
    const email = 'test_otp_expiry@example.test';
    await send(email);
    for (const row of h.db._tables.userSession) if (row.token.startsWith('EMAIL_OTP:')) row.expiresAt = new Date(Date.now() - 1000);
    const r = await verify(email, '123456');
    expect(r.status).toBe(400);
    expect(r.body.message).toMatch(/expired/);
    expect((await verify(email, '12ab56')).status).toBe(400);
  });

  it('a verified code yields a single-use proof; registration forces CUSTOMER and stores no invented location', async () => {
    const email = 'test_otp_register@example.test';
    await send(email);
    const v = await verify(email, '123456');
    expect(v.status).toBe(200);
    const proof = v.body.verificationToken;
    expect(sessionTokens().some((t: string) => t.includes(proof))).toBe(false); // only its digest is stored
    expect((await verify(email, '123456')).status).toBe(400); // code is single use

    const reg = await call(registerRoute, { body: { email, password: 'Strong-Pass-123!', firstName: 'Test', lastName: 'User', role: 'ROLE_ADMIN', verificationToken: proof } });
    expect(reg.status).toBe(201);
    const user = await db.user.findUnique({ where: { email } });
    expect(user.role).toBe('CUSTOMER');
    const profile = await db.customerProfile.findFirst({ where: { userId: user.id } });
    expect(profile).toMatchObject({ city: '', state: '', pincode: '' });

    const replay = await call(registerRoute, { body: { email: 'test_otp_replay@example.test', password: 'Strong-Pass-123!', verificationToken: proof } });
    expect(replay.status).toBe(400);
  });

  it('a PROVIDER role in the payload is ignored too', async () => {
    const email = 'test_otp_provider@example.test';
    await send(email);
    const proof = (await verify(email, '123456')).body.verificationToken;
    expect((await call(registerRoute, { body: { email, password: 'Strong-Pass-123!', role: 'ROLE_PROVIDER', verificationToken: proof } })).status).toBe(201);
    expect((await db.user.findUnique({ where: { email } })).role).toBe('CUSTOMER');
    expect(await db.providerProfile.count({ where: {} })).toBe(0);
  });

  it('registration is atomic: if the profile cannot be created, no account is left behind', async () => {
    const email = 'test_otp_atomic@example.test';
    await send(email);
    const proof = (await verify(email, '123456')).body.verificationToken;
    vi.spyOn(h.db.customerProfile, 'create').mockRejectedValueOnce(new Error('profile write failed'));
    const r = await call(registerRoute, { body: { email, password: 'Strong-Pass-123!', verificationToken: proof } });
    expect(r.status).toBe(500);
    expect(await db.user.findUnique({ where: { email } })).toBeNull();
  });

  it('email sign-up reports itself unavailable outside the test environment', async () => {
    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      expect((await send('someone@example.test')).status).toBe(503);
      expect((await verify('someone@example.test', '123456')).status).toBe(503);
    } finally {
      process.env.NODE_ENV = env;
    }
  });
});
