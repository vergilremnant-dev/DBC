/**
 * Server-side verification of Firebase ID tokens.
 *
 * Uses the Firebase Admin SDK, which checks the RS256 signature against Google's
 * published certificates, plus `aud` (project ID), `iss`, `exp`, `iat`, `auth_time`
 * and `sub`. There is deliberately NO fallback that decodes the token payload
 * without verifying its signature: if verification cannot be performed, the
 * request fails closed.
 *
 * Client-supplied values (firebaseUid, phone, "verified" flags) are never used as
 * proof of identity. Only the claims returned from a verified token are trusted.
 */

export interface VerifiedFirebaseToken {
  uid: string;
  phoneNumber?: string;
  email?: string;
  emailVerified?: boolean;
  signInProvider?: string;
}

export type FirebaseTokenErrorCode =
  | 'MISSING_TOKEN'
  | 'INVALID_TOKEN'
  | 'EXPIRED_TOKEN'
  | 'REVOKED_TOKEN'
  | 'NOT_PHONE_IDENTITY'
  | 'NOT_CONFIGURED';

const MESSAGES: Record<FirebaseTokenErrorCode, string> = {
  MISSING_TOKEN: 'Missing Firebase ID Token. Please verify your phone number before registering.',
  INVALID_TOKEN: 'Invalid, expired, or untrusted Firebase ID Token.',
  EXPIRED_TOKEN: 'Firebase ID Token has expired. Please verify your phone number again.',
  REVOKED_TOKEN: 'This phone verification has been revoked. Please verify your phone number again.',
  NOT_PHONE_IDENTITY: 'This sign-in was not completed with a verified phone number.',
  NOT_CONFIGURED: 'Phone sign-in is temporarily unavailable. Please try again later.',
};

export class FirebaseTokenError extends Error {
  readonly code: FirebaseTokenErrorCode;
  constructor(code: FirebaseTokenErrorCode, message?: string) {
    super(message ?? MESSAGES[code]);
    this.name = 'FirebaseTokenError';
    this.code = code;
  }
}

export type FirebaseTokenVerifier = (idToken: string) => Promise<VerifiedFirebaseToken>;

let testVerifierOverride: FirebaseTokenVerifier | null = null;

/**
 * Test seam. Only usable when NODE_ENV === 'test'; throws otherwise so it can
 * never be activated in a deployed environment.
 */
export function __setFirebaseVerifierForTests(verifier: FirebaseTokenVerifier | null): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Firebase verifier override is only available in the test environment.');
  }
  testVerifierOverride = verifier;
}

const ADMIN_APP_NAME = 'dbc-auth-verifier';

function readServiceAccount():
  | { projectId?: string; clientEmail: string; privateKey: string }
  | null {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json && json.trim()) {
    try {
      const parsed = JSON.parse(json);
      if (parsed.client_email && parsed.private_key) {
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: String(parsed.private_key).replace(/\\n/g, '\n'),
        };
      }
    } catch {
      // Malformed JSON: treat as not configured rather than leaking details.
    }
    return null;
  }
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (clientEmail && privateKey) {
    return { clientEmail, privateKey: privateKey.replace(/\\n/g, '\n') };
  }
  return null;
}

export function getFirebaseProjectId(): string | undefined {
  const id = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  return id && id.trim() ? id.trim() : undefined;
}

async function adminSdkVerifier(idToken: string): Promise<VerifiedFirebaseToken> {
  const projectId = getFirebaseProjectId();
  if (!projectId) {
    console.error('[AUTH_CONFIG] FIREBASE_PROJECT_ID is not set; refusing to verify Firebase ID tokens.');
    throw new FirebaseTokenError('NOT_CONFIGURED');
  }

  let appModule: typeof import('firebase-admin/app');
  let authModule: typeof import('firebase-admin/auth');
  try {
    appModule = await import('firebase-admin/app');
    authModule = await import('firebase-admin/auth');
  } catch {
    console.error('[AUTH_CONFIG] firebase-admin is not installed; refusing to verify Firebase ID tokens.');
    throw new FirebaseTokenError('NOT_CONFIGURED');
  }

  const serviceAccount = readServiceAccount();
  const existing = appModule.getApps().find((a) => a.name === ADMIN_APP_NAME);
  const app =
    existing ??
    appModule.initializeApp(
      serviceAccount
        ? {
            projectId,
            credential: appModule.cert({
              projectId: serviceAccount.projectId || projectId,
              clientEmail: serviceAccount.clientEmail,
              privateKey: serviceAccount.privateKey,
            }),
          }
        : { projectId },
      ADMIN_APP_NAME
    );

  try {
    // Revocation checks require Admin credentials (they look up the user record).
    const decoded = await authModule.getAuth(app).verifyIdToken(idToken, Boolean(serviceAccount));
    return {
      uid: decoded.uid,
      phoneNumber: decoded.phone_number,
      email: decoded.email,
      emailVerified: decoded.email_verified === true,
      signInProvider: decoded.firebase?.sign_in_provider,
    };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/id-token-expired') throw new FirebaseTokenError('EXPIRED_TOKEN');
    if (code === 'auth/id-token-revoked' || code === 'auth/user-disabled') {
      throw new FirebaseTokenError('REVOKED_TOKEN');
    }
    throw new FirebaseTokenError('INVALID_TOKEN');
  }
}

/**
 * Verifies a Firebase ID token and returns its trusted claims.
 * The second argument is accepted only for backward compatibility and is ignored.
 */
export async function verifyFirebaseIdToken(
  idToken?: string,
  _untrustedClientUid?: string
): Promise<VerifiedFirebaseToken> {
  if (!idToken || typeof idToken !== 'string' || !idToken.trim()) {
    throw new FirebaseTokenError('MISSING_TOKEN');
  }
  const token = idToken.trim();
  if (token.length > 8192) {
    throw new FirebaseTokenError('INVALID_TOKEN');
  }

  const verifier =
    process.env.NODE_ENV === 'test' && testVerifierOverride ? testVerifierOverride : adminSdkVerifier;
  const verified = await verifier(token);

  if (!verified || typeof verified.uid !== 'string' || !verified.uid) {
    throw new FirebaseTokenError('INVALID_TOKEN');
  }
  return verified;
}

/**
 * Verifies a token AND requires that it represents a phone-number sign-in with a
 * phone_number claim. Use this for every phone OTP login/registration path.
 */
export async function verifyFirebasePhoneIdentity(
  idToken?: string
): Promise<VerifiedFirebaseToken & { phoneNumber: string }> {
  const verified = await verifyFirebaseIdToken(idToken);
  if (!verified.phoneNumber) {
    throw new FirebaseTokenError('NOT_PHONE_IDENTITY');
  }
  if (verified.signInProvider && verified.signInProvider !== 'phone') {
    throw new FirebaseTokenError('NOT_PHONE_IDENTITY');
  }
  return verified as VerifiedFirebaseToken & { phoneNumber: string };
}
