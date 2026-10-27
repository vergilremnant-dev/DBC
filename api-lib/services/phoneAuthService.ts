import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db as defaultDb } from '../utils/db.js';
import {
  FirebaseTokenError,
  verifyFirebasePhoneIdentity,
} from '../utils/verifyFirebaseToken.js';
import { createUserSession } from './authService.js';
import type { DBUserForAuth, LoginResponse } from './authService.js';
import { logSecurityEvent } from './auditService.js';
import {
  legacyProfilePhoneCandidates,
  normalizeE164,
  profilePhoneFor,
  syntheticPhoneEmail,
} from '../utils/phone.js';

/**
 * Phone OTP authentication (Phase 1).
 *
 * Flow: Firebase phone OTP on the client -> client sends the Firebase ID token ->
 * this service verifies it server-side -> finds or creates the DBC account ->
 * issues the existing DBC JWT + refresh session.
 *
 * Identity (Firebase UID, phone number) is taken ONLY from the verified token.
 * Role is always derived server-side; public phone registration creates CUSTOMER
 * accounts, matching the existing registration policy.
 */

export type PhoneAuthErrorCode =
  | 'ACCOUNT_LINK_REQUIRED'
  | 'ACCOUNT_CONFLICT'
  | 'ACCOUNT_INACTIVE'
  | 'INVALID_PROFILE';

const PHONE_AUTH_STATUS: Record<PhoneAuthErrorCode, number> = {
  ACCOUNT_LINK_REQUIRED: 409,
  ACCOUNT_CONFLICT: 409,
  ACCOUNT_INACTIVE: 403,
  INVALID_PROFILE: 400,
};

export class PhoneAuthError extends Error {
  readonly code: PhoneAuthErrorCode;
  constructor(code: PhoneAuthErrorCode, message: string) {
    super(message);
    this.name = 'PhoneAuthError';
    this.code = code;
  }
}

type DbClient = Pick<typeof defaultDb, 'user' | 'customerProfile' | '$transaction'>;

export interface PhoneAuthDeps {
  db: DbClient;
  verifyPhoneIdentity: typeof verifyFirebasePhoneIdentity;
  createSession: typeof createUserSession;
  logEvent: typeof logSecurityEvent;
  hashPassword: (raw: string) => Promise<string>;
  now: () => Date;
}

export const defaultPhoneAuthDeps: PhoneAuthDeps = {
  db: defaultDb,
  verifyPhoneIdentity: verifyFirebasePhoneIdentity,
  createSession: createUserSession,
  logEvent: logSecurityEvent,
  hashPassword: async (raw) => bcrypt.hash(raw, await bcrypt.genSalt(10)),
  now: () => new Date(),
};

export interface RequestContext {
  userAgent?: string;
  ipAddress?: string;
}

export interface PhoneProfileInput {
  firstName?: unknown;
  lastName?: unknown;
  preferredCity?: unknown;
}

export type PhoneAuthResult =
  | { status: 'AUTHENTICATED'; isNewUser: boolean; session: LoginResponse }
  | { status: 'REGISTRATION_REQUIRED'; phoneE164: string };

const USER_INCLUDE = { customerProfile: true, providerProfile: true } as const;

type DbUser = DBUserForAuth & {
  firebaseUid: string | null;
  phoneE164: string | null;
};

interface VerifiedPhoneIdentity {
  uid: string;
  phoneE164: string;
}

type Resolution =
  | { kind: 'FOUND'; user: DbUser; needsLink: boolean }
  | { kind: 'NOT_FOUND' };

function isUniqueViolation(err: unknown): boolean {
  return (err as { code?: string })?.code === 'P2002';
}

async function verifyIdentity(idToken: unknown, deps: PhoneAuthDeps): Promise<VerifiedPhoneIdentity> {
  const verified = await deps.verifyPhoneIdentity(typeof idToken === 'string' ? idToken : undefined);
  const phoneE164 = normalizeE164(verified.phoneNumber);
  if (!phoneE164) {
    throw new FirebaseTokenError('NOT_PHONE_IDENTITY');
  }
  return { uid: verified.uid, phoneE164 };
}

const CONFLICT_MESSAGE =
  'This mobile number is linked to a different DBC account. Please contact DBC support to recover access.';
const LINK_REQUIRED_MESSAGE =
  'An existing DBC account already uses this mobile number. Please sign in with your email and password to continue.';

/**
 * Finds the DBC account for a verified phone identity, in order of trust:
 * 1. firebase_uid, 2. verified phone_e164, 3. legacy phone-registered account
 * (synthetic `<number>@dbc.com` email). A match only on an unverified profile
 * phone value is NOT auto-linked, to prevent account takeover through a phone
 * number someone typed into a profile.
 */
async function resolveAccount(client: DbClient, identity: VerifiedPhoneIdentity): Promise<Resolution> {
  const byUid = (await client.user.findUnique({
    where: { firebaseUid: identity.uid },
    include: USER_INCLUDE,
  })) as DbUser | null;
  if (byUid) {
    return { kind: 'FOUND', user: byUid, needsLink: byUid.phoneE164 !== identity.phoneE164 };
  }

  const byPhone = (await client.user.findUnique({
    where: { phoneE164: identity.phoneE164 },
    include: USER_INCLUDE,
  })) as DbUser | null;
  if (byPhone) {
    if (byPhone.firebaseUid && byPhone.firebaseUid !== identity.uid) {
      throw new PhoneAuthError('ACCOUNT_CONFLICT', CONFLICT_MESSAGE);
    }
    return { kind: 'FOUND', user: byPhone, needsLink: true };
  }

  const legacy = (await client.user.findUnique({
    where: { email: syntheticPhoneEmail(identity.phoneE164) },
    include: USER_INCLUDE,
  })) as DbUser | null;
  if (legacy) {
    if (
      (legacy.firebaseUid && legacy.firebaseUid !== identity.uid) ||
      (legacy.phoneE164 && legacy.phoneE164 !== identity.phoneE164)
    ) {
      throw new PhoneAuthError('ACCOUNT_CONFLICT', CONFLICT_MESSAGE);
    }
    return { kind: 'FOUND', user: legacy, needsLink: true };
  }

  const candidates = legacyProfilePhoneCandidates(identity.phoneE164);
  const profileMatch = await client.user.findFirst({
    where: {
      OR: [
        { customerProfile: { phoneNumber: { in: candidates } } },
        { providerProfile: { phoneNumber: { in: candidates } } },
      ],
    },
    select: { id: true },
  });
  if (profileMatch) {
    throw new PhoneAuthError('ACCOUNT_LINK_REQUIRED', LINK_REQUIRED_MESSAGE);
  }

  return { kind: 'NOT_FOUND' };
}

function ensureActive(user: DbUser): void {
  if (user.status !== 'ACTIVE') {
    throw new PhoneAuthError('ACCOUNT_INACTIVE', 'Your account is currently inactive or suspended');
  }
}

async function linkIdentity(
  client: DbClient,
  user: DbUser,
  identity: VerifiedPhoneIdentity,
  deps: PhoneAuthDeps
): Promise<DbUser> {
  try {
    return (await client.user.update({
      where: { id: user.id },
      data: {
        firebaseUid: identity.uid,
        phoneE164: identity.phoneE164,
        phoneVerifiedAt: deps.now(),
      },
      include: USER_INCLUDE,
    })) as DbUser;
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new PhoneAuthError('ACCOUNT_CONFLICT', CONFLICT_MESSAGE);
    }
    throw err;
  }
}

async function authenticateExisting(
  user: DbUser,
  needsLink: boolean,
  identity: VerifiedPhoneIdentity,
  ctx: RequestContext,
  deps: PhoneAuthDeps
): Promise<PhoneAuthResult> {
  ensureActive(user);
  const wasUnlinked = !user.firebaseUid;
  const current = needsLink ? await linkIdentity(deps.db, user, identity, deps) : user;
  if (needsLink && wasUnlinked) {
    await deps.logEvent(current.id, 'PROFILE_UPDATE', 'Verified phone identity linked to existing account');
  }
  const session = await deps.createSession(current, ctx.userAgent, ctx.ipAddress);
  await deps.logEvent(current.id, 'LOGIN', `User authenticated via phone OTP from IP: ${ctx.ipAddress || 'unknown'}`);
  return { status: 'AUTHENTICATED', isNewUser: false, session };
}

/**
 * Login step after OTP verification. Never creates an account.
 */
export async function startPhoneSession(
  idToken: unknown,
  ctx: RequestContext = {},
  deps: PhoneAuthDeps = defaultPhoneAuthDeps
): Promise<PhoneAuthResult> {
  const identity = await verifyIdentity(idToken, deps);
  const resolution = await resolveAccount(deps.db, identity);
  if (resolution.kind === 'NOT_FOUND') {
    return { status: 'REGISTRATION_REQUIRED', phoneE164: identity.phoneE164 };
  }
  return authenticateExisting(resolution.user, resolution.needsLink, identity, ctx, deps);
}

const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u;

function cleanName(value: unknown, field: string, required: boolean, max = 50): string {
  const text = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  if (!text) {
    if (required) throw new PhoneAuthError('INVALID_PROFILE', `${field} is required.`);
    return '';
  }
  if (text.length > max || !NAME_PATTERN.test(text)) {
    throw new PhoneAuthError('INVALID_PROFILE', `Please enter a valid ${field.toLowerCase()}.`);
  }
  return text;
}

export function validatePhoneProfile(input: PhoneProfileInput) {
  const firstName = cleanName(input.firstName, 'First name', true);
  const lastName = cleanName(input.lastName, 'Last name', false);
  const city = cleanName(input.preferredCity, 'City', false, 80);
  return { firstName, lastName, city };
}

/**
 * Registration step after OTP verification. Idempotent: if the verified phone
 * identity already has an account (including one created by a concurrent or
 * repeated request), that account is signed in instead of creating a duplicate.
 */
export async function registerPhoneUser(
  idToken: unknown,
  input: PhoneProfileInput,
  ctx: RequestContext = {},
  deps: PhoneAuthDeps = defaultPhoneAuthDeps
): Promise<PhoneAuthResult> {
  const profile = validatePhoneProfile(input);
  const identity = await verifyIdentity(idToken, deps);

  const resolution = await resolveAccount(deps.db, identity);
  if (resolution.kind === 'FOUND') {
    return authenticateExisting(resolution.user, resolution.needsLink, identity, ctx, deps);
  }

  // Unusable random password: phone-first users authenticate with OTP.
  const passwordHash = await deps.hashPassword(crypto.randomBytes(32).toString('hex'));
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  let created: DbUser | null;
  try {
    created = (await deps.db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: syntheticPhoneEmail(identity.phoneE164),
          password: passwordHash,
          role: 'CUSTOMER',
          status: 'ACTIVE',
          firebaseUid: identity.uid,
          phoneE164: identity.phoneE164,
          phoneVerifiedAt: deps.now(),
        },
      });
      await tx.customerProfile.create({
        data: {
          userId: user.id,
          fullName,
          phoneNumber: profilePhoneFor(identity.phoneE164),
          // Same defaults as the existing /api/auth/register flow.
          city: profile.city || 'Hyderabad',
          state: 'Telangana',
          pincode: '500001',
        },
      });
      return tx.user.findUnique({ where: { id: user.id }, include: USER_INCLUDE });
    })) as DbUser | null;
  } catch (err) {
    if (isUniqueViolation(err)) {
      // Duplicate/concurrent request won the race: sign in to that account.
      const winner = (await deps.db.user.findUnique({
        where: { firebaseUid: identity.uid },
        include: USER_INCLUDE,
      })) as DbUser | null;
      if (winner) {
        return authenticateExisting(winner, false, identity, ctx, deps);
      }
      throw new PhoneAuthError('ACCOUNT_CONFLICT', CONFLICT_MESSAGE);
    }
    throw err;
  }

  if (!created) {
    throw new Error('Account creation did not return a user record');
  }

  await deps.logEvent(created.id, 'PROFILE_UPDATE', 'New customer account created via verified phone OTP');
  const session = await deps.createSession(created, ctx.userAgent, ctx.ipAddress);
  await deps.logEvent(created.id, 'LOGIN', `User authenticated via phone OTP from IP: ${ctx.ipAddress || 'unknown'}`);
  return { status: 'AUTHENTICATED', isNewUser: true, session };
}

/** Maps service errors to HTTP status + safe client message. */
export function toPhoneAuthHttpError(err: unknown): { status: number; code: string; message: string } {
  if (err instanceof FirebaseTokenError) {
    const status = err.code === 'MISSING_TOKEN' ? 400 : err.code === 'NOT_CONFIGURED' ? 503 : 401;
    return { status, code: err.code, message: err.message };
  }
  if (err instanceof PhoneAuthError) {
    return { status: PHONE_AUTH_STATUS[err.code], code: err.code, message: err.message };
  }
  return {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'We could not complete sign-in right now. Please try again.',
  };
}
