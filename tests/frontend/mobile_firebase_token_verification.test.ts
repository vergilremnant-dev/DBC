import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import {
  verifyFirebaseIdToken,
  verifyFirebasePhoneIdentity,
  FirebaseTokenError,
  __setFirebaseVerifierForTests,
} from '../../api-lib/utils/verifyFirebaseToken.js';
import { mapFirebaseErrorMessage } from '../../src/components/auth/RegisterWizard';

/**
 * Test double for the Firebase Admin SDK. Production code no longer contains any
 * magic test tokens; tests install this verifier through the NODE_ENV=test-only seam.
 */
async function fakeAdminVerifier(token: string) {
  if (token === 'test_invalid_firebase_token' || token === 'test_wrong_project') {
    throw new FirebaseTokenError('INVALID_TOKEN');
  }
  if (token === 'test_malformed_token') throw new FirebaseTokenError('INVALID_TOKEN');
  if (token === 'test_expired_token') throw new FirebaseTokenError('EXPIRED_TOKEN');
  if (token === 'test_email_only_token') return { uid: 'email_uid', email: 'x@example.com', signInProvider: 'password' };
  if (token === 'test_phone_mismatch_token') {
    return { uid: 'test_mismatch_uid', phoneNumber: '+919999999999', signInProvider: 'phone' };
  }
  return { uid: 'test_verified_firebase_uid', phoneNumber: '+917981160986', signInProvider: 'phone' };
}

describe('Module 72 — Firebase Token Verification & Error Handling Tests', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    __setFirebaseVerifierForTests(fakeAdminVerifier);
  });

  afterAll(() => {
    process.env.NODE_ENV = 'test';
    __setFirebaseVerifierForTests(null);
    process.env.NODE_ENV = originalEnv;
  });

  afterEach(() => {
    process.env.NODE_ENV = 'test';
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
        'Invalid, expired, or untrusted Firebase ID Token.'
      );
    });

    it('rejects a verified token without a phone_number claim for phone identity', async () => {
      await expect(verifyFirebasePhoneIdentity('test_email_only_token')).rejects.toMatchObject({
        code: 'NOT_PHONE_IDENTITY',
      });
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
    it('ensures the test verifier seam cannot be used outside NODE_ENV=test', async () => {
      process.env.NODE_ENV = 'production';
      expect(() => __setFirebaseVerifierForTests(fakeAdminVerifier)).toThrow(/only available in the test environment/);

      // Missing token must throw even if a client UID is passed
      await expect(verifyFirebaseIdToken('', 'client_uid_123')).rejects.toThrow(
        'Missing Firebase ID Token. Please verify your phone number before registering.'
      );
      await expect(verifyFirebaseIdToken(undefined, 'client_uid_123')).rejects.toThrow(
        'Missing Firebase ID Token. Please verify your phone number before registering.'
      );
    });

    it('fails closed when the Firebase project is not configured (installed test verifier is ignored outside test env)', async () => {
      process.env.NODE_ENV = 'production';
      const prevProject = process.env.FIREBASE_PROJECT_ID;
      const prevViteProject = process.env.VITE_FIREBASE_PROJECT_ID;
      delete process.env.FIREBASE_PROJECT_ID;
      delete process.env.VITE_FIREBASE_PROJECT_ID;
      try {
        await expect(verifyFirebaseIdToken('mock_firebase_id_token')).rejects.toMatchObject({ code: 'NOT_CONFIGURED' });
      } finally {
        if (prevProject) process.env.FIREBASE_PROJECT_ID = prevProject;
        if (prevViteProject) process.env.VITE_FIREBASE_PROJECT_ID = prevViteProject;
      }
    });

    it('rejects a forged token with valid-looking claims but no valid signature (requires firebase-admin)', async () => {
      process.env.NODE_ENV = 'production';
      const prevProject = process.env.FIREBASE_PROJECT_ID;
      process.env.FIREBASE_PROJECT_ID = 'designbuildconnect';

      const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
      const now = Math.floor(Date.now() / 1000);
      const forged = [
        b64({ alg: 'RS256', typ: 'JWT' }),
        b64({
          aud: 'designbuildconnect',
          iss: 'https://securetoken.google.com/designbuildconnect',
          sub: 'attacker_uid',
          user_id: 'attacker_uid',
          phone_number: '+917981160986',
          iat: now,
          auth_time: now,
          exp: now + 3600,
          firebase: { sign_in_provider: 'phone' },
        }),
        'mock_sig',
      ].join('.');

      try {
        // Previously this token was ACCEPTED by an unsigned-payload fallback.
        await expect(verifyFirebaseIdToken(forged)).rejects.toMatchObject({ code: 'INVALID_TOKEN' });
      } finally {
        if (prevProject) process.env.FIREBASE_PROJECT_ID = prevProject;
        else delete process.env.FIREBASE_PROJECT_ID;
      }
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
