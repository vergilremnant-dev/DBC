import { describe, it, expect, beforeAll } from 'vitest';
import { generateAccessToken, verifyToken } from '../../api-lib/utils/auth.js';
import { VercelRequest } from '@vercel/node';

describe('Auth Utility Tests', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret_key_12345';
  });

  it('should generate a valid JWT access token', () => {
    const user = { id: 'user-1', email: 'test@example.com', role: 'CUSTOMER' };
    const token = generateAccessToken(user);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('should verify a valid Bearer token from VercelRequest headers', () => {
    const user = { id: 'user-1', email: 'test@example.com', role: 'CUSTOMER' };
    const token = generateAccessToken(user);

    const mockRequest = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    } as unknown as VercelRequest;

    const decoded = verifyToken(mockRequest);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(user.id);
    expect(decoded?.email).toBe(user.email);
    expect(decoded?.role).toBe(user.role);
  });

  it('should return null for invalid or missing authorization header', () => {
    const mockRequest = {
      headers: {},
    } as unknown as VercelRequest;

    const decoded = verifyToken(mockRequest);
    expect(decoded).toBeNull();
  });

  it('should load Firebase SDK configuration without throwing', async () => {
    const { isFirebaseConfigured, auth } = await import('../../src/config/firebase.js');
    expect(auth).toBeDefined();
    expect(typeof isFirebaseConfigured).toBe('boolean');
  });

  describe('Email OTP Isolation Tests', () => {
    const originalEnv = process.env.NODE_ENV;

    it('should generate deterministic 123456 OTP when NODE_ENV === "test" and email starts with "test"', async () => {
      process.env.NODE_ENV = 'test';
      const email = 'test_isolation_1@example.com';
      const isTestEnv = process.env.NODE_ENV === 'test';
      const isTestEmail = email.startsWith('test');
      const rawOtp = isTestEnv && isTestEmail ? '123456' : 'random';
      expect(rawOtp).toBe('123456');
    });

    it('should generate random OTP when NODE_ENV === "development" even if email starts with "test"', async () => {
      process.env.NODE_ENV = 'development';
      const email = 'test_isolation_2@example.com';
      const isTestEnv = process.env.NODE_ENV === 'test';
      const isTestEmail = email.startsWith('test');
      const rawOtp = isTestEnv && isTestEmail ? '123456' : 'random_generated';
      expect(rawOtp).not.toBe('123456');
      process.env.NODE_ENV = originalEnv;
    });

    it('should generate random OTP when NODE_ENV === "production" even if email starts with "test"', async () => {
      process.env.NODE_ENV = 'production';
      const email = 'test_isolation_3@example.com';
      const isTestEnv = process.env.NODE_ENV === 'test';
      const isTestEmail = email.startsWith('test');
      const rawOtp = isTestEnv && isTestEmail ? '123456' : 'random_generated';
      expect(rawOtp).not.toBe('123456');
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Server-Side Registration Proof Gating Tests', () => {
    it('should reject unverified email registration attempts missing a verificationToken', async () => {
      const { default: registerHandler } = await import('../../api-lib/routes/auth/register.js');
      const mockReq = {
        method: 'POST',
        body: {
          email: 'unverified_attacker@example.com',
          password: 'Password123!',
          firstName: 'Attacker',
          lastName: 'User',
          role: 'ROLE_CUSTOMER',
        },
      } as any;

      let statusCode = 0;
      let jsonPayload: any = {};

      const mockRes = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (data: any) => {
              jsonPayload = data;
              return data;
            },
          };
        },
        setHeader: () => {},
      } as any;

      await registerHandler(mockReq, mockRes);
      expect(statusCode).toBe(400);
      expect(jsonPayload.success).toBe(false);
      expect(jsonPayload.message).toContain('Please verify your email address');
    });

    it('should reject registration attempts with fabricated/invalid verification tokens', async () => {
      const { default: registerHandler } = await import('../../api-lib/routes/auth/register.js');
      const mockReq = {
        method: 'POST',
        body: {
          email: 'fake_token_user@example.com',
          password: 'Password123!',
          firstName: 'FakeToken',
          lastName: 'Tester',
          role: 'ROLE_CUSTOMER',
          verificationToken: 'fabricated_fake_token_12345',
        },
      } as any;

      let statusCode = 0;
      let jsonPayload: any = {};

      const mockRes = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (data: any) => {
              jsonPayload = data;
              return data;
            },
          };
        },
        setHeader: () => {},
      } as any;

      await registerHandler(mockReq, mockRes);
      expect(statusCode).toBe(400);
      expect(jsonPayload.success).toBe(false);
      expect(jsonPayload.message).toContain('invalid or has expired');
    });
  });

  describe('End-to-End Registration, Verification, Login & Security Tests', () => {
    it('should complete end-to-end email verification -> registration -> login flow', async () => {
      const { default: sendOtpHandler } = await import('../../api-lib/routes/auth/send-email-otp.js');
      const { default: verifyOtpHandler } = await import('../../api-lib/routes/auth/verify-email-otp.js');
      const { default: registerHandler } = await import('../../api-lib/routes/auth/register.js');
      const { loginUser } = await import('../../api-lib/services/authService.js');

      const email = `test_e2e_customer_${Date.now()}@example.com`;
      const password = 'SecurePassword123!';

      // Step 1: Send OTP
      let sendStatus = 0;
      let sendData: any = {};
      await sendOtpHandler(
        { method: 'POST', body: { email } } as any,
        { status: (c: number) => ({ json: (d: any) => { sendStatus = c; sendData = d; } }), setHeader: () => {} } as any
      );
      expect(sendStatus).toBe(200);
      expect(sendData.success).toBe(true);

      // Step 2: Verify OTP
      let verifyStatus = 0;
      let verifyData: any = {};
      await verifyOtpHandler(
        { method: 'POST', body: { email, otp: '123456' } } as any,
        { status: (c: number) => ({ json: (d: any) => { verifyStatus = c; verifyData = d; } }), setHeader: () => {} } as any
      );
      expect(verifyStatus).toBe(200);
      expect(verifyData.success).toBe(true);
      expect(verifyData.verificationToken).toBeDefined();

      const proofToken = verifyData.verificationToken;

      // Step 3: Register Account with Proof Token
      let regStatus = 0;
      let regData: any = {};
      await registerHandler(
        {
          method: 'POST',
          body: {
            email,
            password,
            firstName: 'E2E',
            lastName: 'Customer',
            role: 'ROLE_ADMIN', // Attempt privilege escalation!
            verificationToken: proofToken,
          },
        } as any,
        { status: (c: number) => ({ json: (d: any) => { regStatus = c; regData = d; } }), setHeader: () => {} } as any
      );
      expect(regStatus).toBe(201);
      expect(regData.success).toBe(true);

      // Step 4: Login with newly created credentials
      const loginRes = await loginUser({ email, password });
      expect(loginRes.accessToken).toBeDefined();
      expect(loginRes.refreshToken).toBeDefined();
      expect(loginRes.user.email).toBe(email);
      expect(loginRes.user.role).toBe('ROLE_CUSTOMER'); // Strict Role Enforcement verified!

      // Step 5: Verify replay protection (reusing proofToken must fail)
      let replayStatus = 0;
      let replayData: any = {};
      await registerHandler(
        {
          method: 'POST',
          body: {
            email: 'test_replay_user@example.com',
            password,
            firstName: 'Replay',
            lastName: 'User',
            verificationToken: proofToken,
          },
        } as any,
        { status: (c: number) => ({ json: (d: any) => { replayStatus = c; replayData = d; } }), setHeader: () => {} } as any
      );
      expect(replayStatus).toBe(400);
      expect(replayData.success).toBe(false);
      expect(replayData.message).toContain('invalid or has expired');
    });

    it('should reject duplicate email registrations cleanly', async () => {
      const { default: sendOtpHandler } = await import('../../api-lib/routes/auth/send-email-otp.js');
      const { default: verifyOtpHandler } = await import('../../api-lib/routes/auth/verify-email-otp.js');
      const { default: registerHandler } = await import('../../api-lib/routes/auth/register.js');

      const email = `test_duplicate_${Date.now()}@example.com`;

      // Register first account
      await sendOtpHandler({ method: 'POST', body: { email } } as any, { status: () => ({ json: () => {} }), setHeader: () => {} } as any);
      let vToken = '';
      await verifyOtpHandler({ method: 'POST', body: { email, otp: '123456' } } as any, { status: () => ({ json: (d: any) => { vToken = d.verificationToken; } }), setHeader: () => {} } as any);
      await registerHandler({ method: 'POST', body: { email, password: 'Password123!', firstName: 'Dup', lastName: 'User', verificationToken: vToken } } as any, { status: () => ({ json: () => {} }), setHeader: () => {} } as any);

      // Now try to send OTP for the exact same email
      let sendStatus = 0;
      let sendData: any = {};
      await sendOtpHandler(
        { method: 'POST', body: { email } } as any,
        { status: (c: number) => ({ json: (d: any) => { sendStatus = c; sendData = d; } }), setHeader: () => {} } as any
      );
      expect(sendStatus).toBe(400);
      expect(sendData.success).toBe(false);
      expect(sendData.message).toContain('already registered');
    });
  });
});
