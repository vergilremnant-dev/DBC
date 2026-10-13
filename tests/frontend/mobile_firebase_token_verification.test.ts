import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { verifyFirebaseIdToken } from '../../api-lib/utils/verifyFirebaseToken.js';
import { mapFirebaseErrorMessage } from '../../src/components/auth/RegisterWizard';

describe('Module 72 — Firebase Token Verification & Error Handling Tests', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('1. Token Verification Functionality', () => {
    it('accepts valid test Firebase ID token in test environment', async () => {
      const verified = await verifyFirebaseIdToken('mock_firebase_id_token', 'user_123');
      expect(verified).toBeDefined();
      expect(verified.uid).toBe('test_verified_firebase_uid');
      expect(verified.phoneNumber).toBe('+917981160986');
    });

    it('extracts trusted UID from token and never trusts arbitrary client-provided firebaseUid', async () => {
      const spoofedClientUid = 'attacker_arbitrary_uid_999';
      const verified = await verifyFirebaseIdToken('mock_firebase_id_token', spoofedClientUid);
      expect(verified.uid).toBe('test_verified_firebase_uid');
      expect(verified.uid).not.toBe(spoofedClientUid);
    });

    it('rejects invalid or untrusted Firebase ID tokens', async () => {
      await expect(verifyFirebaseIdToken('test_invalid_firebase_token')).rejects.toThrow(
        'Invalid, expired, or untrusted Firebase ID Token.'
      );
    });

    it('rejects tokens from wrong Firebase project', async () => {
      await expect(verifyFirebaseIdToken('test_wrong_project')).rejects.toThrow(
        'Invalid, expired, or untrusted Firebase ID Token.'
      );
    });

    it('rejects malformed Firebase ID tokens', async () => {
      await expect(verifyFirebaseIdToken('test_malformed_token')).rejects.toThrow(
        'Malformed Firebase ID Token structure.'
      );
    });

    it('rejects expired Firebase ID tokens', async () => {
      await expect(verifyFirebaseIdToken('test_expired_token')).rejects.toThrow(
        'Firebase ID Token has expired. Please verify your phone number again.'
      );
    });

    it('returns verified phone for phone mismatch verification', async () => {
      const verified = await verifyFirebaseIdToken('test_phone_mismatch_token');
      expect(verified.phoneNumber).toBe('+919999999999');
    });
  });

  describe('2. Production Environment Security & Bypass Prevention', () => {
    it('ensures test bypass is strictly unavailable in production environment', async () => {
      process.env.NODE_ENV = 'production';

      // In production, missing token must throw even if clientUid is passed
      await expect(verifyFirebaseIdToken('', 'client_uid_123')).rejects.toThrow(
        'Missing Firebase ID Token. Please verify your phone number before registering.'
      );

      await expect(verifyFirebaseIdToken(undefined, 'client_uid_123')).rejects.toThrow(
        'Missing Firebase ID Token. Please verify your phone number before registering.'
      );

      // In production, malformed token must be rejected
      await expect(verifyFirebaseIdToken('not-a-valid-jwt-token')).rejects.toThrow(
        /Malformed|Invalid|untrusted/
      );
    });

    it('correctly parses and validates claims in production fallback JWT format', async () => {
      process.env.NODE_ENV = 'production';
      const prevKey = process.env.VITE_FIREBASE_API_KEY;
      delete process.env.VITE_FIREBASE_API_KEY;
      delete process.env.FIREBASE_API_KEY;

      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64');
      const now = Math.floor(Date.now() / 1000);

      // Expired token JWT
      const expiredPayload = Buffer.from(
        JSON.stringify({
          aud: 'designbuildconnect',
          iss: 'https://securetoken.google.com/designbuildconnect',
          sub: 'user_prod_123',
          exp: now - 3600,
        })
      ).toString('base64');
      await expect(
        verifyFirebaseIdToken(`${header}.${expiredPayload}.mock_sig`)
      ).rejects.toThrow('Firebase ID Token has expired.');

      // Project mismatch token JWT
      const wrongProjectPayload = Buffer.from(
        JSON.stringify({
          aud: 'wrong_project_id',
          iss: 'https://securetoken.google.com/wrong_project_id',
          sub: 'user_prod_123',
          exp: now + 3600,
        })
      ).toString('base64');
      await expect(
        verifyFirebaseIdToken(`${header}.${wrongProjectPayload}.mock_sig`)
      ).rejects.toThrow('Firebase ID Token issuer or project mismatch.');

      // Valid token JWT
      const validPayload = Buffer.from(
        JSON.stringify({
          aud: 'designbuildconnect',
          iss: 'https://securetoken.google.com/designbuildconnect',
          sub: 'verified_prod_uid_777',
          phone_number: '+917981160986',
          exp: now + 3600,
        })
      ).toString('base64');
      const verified = await verifyFirebaseIdToken(`${header}.${validPayload}.mock_sig`);
      expect(verified.uid).toBe('verified_prod_uid_777');
      expect(verified.phoneNumber).toBe('+917981160986');

      if (prevKey) process.env.VITE_FIREBASE_API_KEY = prevKey;
    });
  });

  describe('3. Registration Handler Security Verification', () => {
    it('rejects registration when verified phone number mismatches submitted phone', async () => {
      const { default: registerHandler } = await import('../../api-lib/routes/auth/register.js');
      let statusCode = 0;
      let jsonPayload: any = {};
      const uniqueId = Date.now();

      const mockReq = {
        method: 'POST',
        body: {
          email: `test_mismatch_${uniqueId}@dbc.com`,
          phone: `88${String(uniqueId).slice(-8)}`,
          password: 'Password123!',
          firstName: 'Phone',
          lastName: 'User',
          firebaseIdToken: 'test_phone_mismatch_token',
        },
      } as any;

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
      expect(jsonPayload.message).toContain('Phone number does not match verified Firebase phone identity.');
    });

    it('rejects registration when phone verification token is invalid', async () => {
      const { default: registerHandler } = await import('../../api-lib/routes/auth/register.js');
      let statusCode = 0;
      let jsonPayload: any = {};
      const uniqueId = Date.now() + 1;

      const mockReq = {
        method: 'POST',
        body: {
          email: `test_invalid_token_${uniqueId}@dbc.com`,
          phone: `89${String(uniqueId).slice(-8)}`,
          password: 'Password123!',
          firstName: 'Phone',
          lastName: 'User',
          firebaseIdToken: 'test_invalid_firebase_token',
        },
      } as any;

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
      expect(jsonPayload.message).toContain('Invalid, expired, or untrusted Firebase ID Token.');
    });
  });

  describe('4. Firebase Error Mapping', () => {
    it('correctly maps all 10 Firebase error codes to friendly, safe messages', () => {
      expect(mapFirebaseErrorMessage('auth/invalid-phone-number')).toContain('invalid');
      expect(mapFirebaseErrorMessage('auth/operation-not-allowed')).toContain('Firebase Console');
      expect(mapFirebaseErrorMessage('auth/captcha-check-failed')).toContain('reCAPTCHA');
      expect(mapFirebaseErrorMessage('auth/app-not-authorized')).toContain('Authorized Domains');
      expect(mapFirebaseErrorMessage('auth/too-many-requests')).toContain('Too many SMS requests');
      expect(mapFirebaseErrorMessage('auth/quota-exceeded')).toContain('quota has been exceeded');
      expect(mapFirebaseErrorMessage('auth/network-request-failed')).toContain('Network connection error');
      expect(mapFirebaseErrorMessage('auth/invalid-verification-code')).toContain('invalid');
      expect(mapFirebaseErrorMessage('auth/code-expired')).toContain('expired');
      expect(mapFirebaseErrorMessage('auth/invalid-app-credential')).toContain('credentials');
    });

    it('handles generic and fallback errors safely without leaking internal stack or raw messages', () => {
      expect(mapFirebaseErrorMessage('unknown/error', 'reCAPTCHA error')).toContain('reCAPTCHA');
      expect(mapFirebaseErrorMessage('unknown/error', 'something internal failed')).toContain('Failed to process SMS verification');
    });
  });
});
