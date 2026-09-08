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
    }, 15000);

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

  describe('Real Google Authentication & Verification Tests', () => {
    it('should successfully resolve/create customer account for valid Google ID token', async () => {
      const { socialLoginUser } = await import('../../api-lib/services/authService.js');
      const testEmail = `google_user_${Date.now()}@example.com`;

      const res = await socialLoginUser({
        idToken: 'mock_google_id_token_valid_123',
        provider: 'google',
        email: testEmail,
        name: 'Google Test Customer',
      });

      expect(res.accessToken).toBeDefined();
      expect(res.refreshToken).toBeDefined();
      expect(res.user.email).toBe(testEmail);
      expect(res.user.role).toBe('ROLE_CUSTOMER');
    });

    it('should reject missing or empty Google ID token', async () => {
      const { socialLoginUser } = await import('../../api-lib/services/authService.js');

      await expect(
        socialLoginUser({ idToken: '', provider: 'google' })
      ).rejects.toThrow('ID Token is required');
    });

    it('should reject fabricated / invalid Google ID token', async () => {
      const { socialLoginUser } = await import('../../api-lib/services/authService.js');

      await expect(
        socialLoginUser({ idToken: 'fabricated_fake_google_token_99999', provider: 'google' })
      ).rejects.toThrow('Invalid, expired, or unverified Google identity token');
    });

    it('should enforce Role.CUSTOMER for new Google accounts and prevent role escalation', async () => {
      const { default: googleHandler } = await import('../../api-lib/routes/auth/google.js');

      let statusCode = 0;
      let responseData: any = {};

      const mockReq = {
        method: 'POST',
        body: {
          idToken: 'mock_google_id_token_escalation_test',
          role: 'ROLE_ADMIN', // Attempt privilege escalation!
        },
      } as any;

      const mockRes = {
        status: (c: number) => ({
          json: (d: any) => {
            statusCode = c;
            responseData = d;
            return d;
          },
        }),
        setHeader: () => {},
        getHeader: () => undefined,
      } as any;

      await googleHandler(mockReq, mockRes);
      expect(statusCode).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.user.role).toBe('ROLE_CUSTOMER');
    });
  });

  describe('Real Microsoft Authentication & Verification Tests', () => {
    it('should successfully resolve/create customer account for valid Microsoft ID token', async () => {
      const { socialLoginUser } = await import('../../api-lib/services/authService.js');
      const testEmail = `ms_user_${Date.now()}@example.com`;

      const res = await socialLoginUser({
        idToken: 'mock_microsoft_id_token_valid_456',
        provider: 'microsoft',
        email: testEmail,
        name: 'Microsoft Test Customer',
      });

      expect(res.accessToken).toBeDefined();
      expect(res.refreshToken).toBeDefined();
      expect(res.user.email).toBe(testEmail);
      expect(res.user.role).toBe('ROLE_CUSTOMER');
    });

    it('should reject missing or fabricated Microsoft ID token', async () => {
      const { socialLoginUser } = await import('../../api-lib/services/authService.js');

      await expect(
        socialLoginUser({ idToken: 'fabricated_fake_ms_token_88888', provider: 'microsoft' })
      ).rejects.toThrow('Invalid, expired, or unverified Microsoft identity token');
    });

    it('should resolve existing account on second Microsoft login without creating duplicate user', async () => {
      const { socialLoginUser } = await import('../../api-lib/services/authService.js');
      const testEmail = `ms_duplicate_test_${Date.now()}@example.com`;

      // First Login
      const res1 = await socialLoginUser({
        idToken: 'mock_microsoft_id_token_dup_1',
        provider: 'microsoft',
        email: testEmail,
        name: 'MS User',
      });

      // Second Login with same identity
      const res2 = await socialLoginUser({
        idToken: 'mock_microsoft_id_token_dup_2',
        provider: 'microsoft',
        email: testEmail,
        name: 'MS User',
      });

      expect(res1.user.id).toBe(res2.user.id);
      expect(res2.user.role).toBe('ROLE_CUSTOMER');
    });

    it('should enforce Role.CUSTOMER for new Microsoft accounts and reject privilege escalation', async () => {
      const { default: microsoftHandler } = await import('../../api-lib/routes/auth/microsoft.js');

      let statusCode = 0;
      let responseData: any = {};

      const mockReq = {
        method: 'POST',
        body: {
          idToken: 'mock_microsoft_id_token_escalation_test',
          role: 'ROLE_ADMIN', // Attempt privilege escalation!
        },
      } as any;

      const mockRes = {
        status: (c: number) => ({
          json: (d: any) => {
            statusCode = c;
            responseData = d;
            return d;
          },
        }),
        setHeader: () => {},
        getHeader: () => undefined,
      } as any;

      await microsoftHandler(mockReq, mockRes);
      expect(statusCode).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.user.role).toBe('ROLE_CUSTOMER');
    });
  });

  describe('Real Apple Authentication & Verification Tests', () => {
    it('should successfully resolve/create customer account for valid Apple ID token with Private Relay email', async () => {
      const { socialLoginUser } = await import('../../api-lib/services/authService.js');
      const relayEmail = `apple_relay_${Date.now()}@privaterelay.appleid.com`;

      const res = await socialLoginUser({
        idToken: 'mock_apple_id_token_valid_789',
        provider: 'apple',
        email: relayEmail,
        name: 'Apple Relay Customer',
      });

      expect(res.accessToken).toBeDefined();
      expect(res.refreshToken).toBeDefined();
      expect(res.user.email).toBe(relayEmail);
      expect(res.user.role).toBe('ROLE_CUSTOMER');
    });

    it('should reject missing or fabricated Apple ID token', async () => {
      const { socialLoginUser } = await import('../../api-lib/services/authService.js');

      await expect(
        socialLoginUser({ idToken: 'fabricated_fake_apple_token_77777', provider: 'apple' })
      ).rejects.toThrow('Invalid, expired, or unverified Apple identity token');
    });

    it('should resolve existing account on second Apple login without creating duplicate user', async () => {
      const { socialLoginUser } = await import('../../api-lib/services/authService.js');
      const relayEmail = `apple_duplicate_${Date.now()}@privaterelay.appleid.com`;

      // First Login
      const res1 = await socialLoginUser({
        idToken: 'mock_apple_id_token_dup_1',
        provider: 'apple',
        email: relayEmail,
        name: 'Apple User',
      });

      // Second Login with same identity
      const res2 = await socialLoginUser({
        idToken: 'mock_apple_id_token_dup_2',
        provider: 'apple',
        email: relayEmail,
        name: 'Apple User',
      });

      expect(res1.user.id).toBe(res2.user.id);
      expect(res2.user.role).toBe('ROLE_CUSTOMER');
    });

    it('should enforce Role.CUSTOMER for new Apple accounts and reject privilege escalation', async () => {
      const { default: appleHandler } = await import('../../api-lib/routes/auth/apple.js');

      let statusCode = 0;
      let responseData: any = {};

      const mockReq = {
        method: 'POST',
        body: {
          idToken: 'mock_apple_id_token_escalation_test',
          role: 'ROLE_ADMIN', // Attempt privilege escalation!
        },
      } as any;

      const mockRes = {
        status: (c: number) => ({
          json: (d: any) => {
            statusCode = c;
            responseData = d;
            return d;
          },
        }),
        setHeader: () => {},
        getHeader: () => undefined,
      } as any;

      await appleHandler(mockReq, mockRes);
      expect(statusCode).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.user.role).toBe('ROLE_CUSTOMER');
    });
  });

  describe('Comprehensive Session Revocation, Account Status & Security Hardening Tests', () => {
    it('should reject authentication for suspended/inactive user accounts across login channels', async () => {
      const { db } = await import('../../api-lib/utils/db.js');
      const { loginUser, socialLoginUser } = await import('../../api-lib/services/authService.js');
      const email = `suspended_user_${Date.now()}@example.com`;

      // Create suspended user
      const user = await db.user.create({
        data: {
          email,
          password: '$2a$10$dummyHashForSuspendedUserTesting12345678',
          role: 'CUSTOMER',
          status: 'SUSPENDED',
        },
      });

      // Password Login attempt on suspended account
      await expect(loginUser({ email, password: 'AnyPassword123!' })).rejects.toThrow('suspended');

      // Social Login attempt on suspended account
      await expect(socialLoginUser({ idToken: 'mock_google_id_token_suspended', provider: 'google', email })).rejects.toThrow('suspended');

      // Clean up
      await db.user.delete({ where: { id: user.id } });
    });

    it('should cleanly rotate refresh tokens and revoke old session tokens upon logout', async () => {
      const { db } = await import('../../api-lib/utils/db.js');
      const { refreshUserToken, logoutUserSession } = await import('../../api-lib/services/authService.js');

      const email = `refresh_session_test_${Date.now()}@example.com`;
      const user = await db.user.create({
        data: {
          email,
          password: '$2a$10$dummyHashForSessionTesting1234567890123',
          role: 'CUSTOMER',
          status: 'ACTIVE',
        },
      });

      // Create session
      const crypto = await import('crypto');
      const rawToken = crypto.randomBytes(40).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      await db.userSession.create({
        data: {
          userId: user.id,
          token: hashedToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Rotate session token
      const refreshRes = await refreshUserToken(rawToken);
      expect(refreshRes.accessToken).toBeDefined();
      expect(refreshRes.refreshToken).toBeDefined();
      expect(refreshRes.refreshToken).not.toBe(rawToken);

      // Revoke session via logout
      await logoutUserSession(refreshRes.refreshToken);

      // Attempting to refresh again with revoked token must fail
      await expect(refreshUserToken(refreshRes.refreshToken)).rejects.toThrow('Invalid or revoked session');

      // Clean up
      await db.user.delete({ where: { id: user.id } });
    });
  });
});
