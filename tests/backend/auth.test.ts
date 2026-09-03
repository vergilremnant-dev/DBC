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
});
