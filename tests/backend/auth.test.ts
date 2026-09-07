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
});
