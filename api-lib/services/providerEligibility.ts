import { db } from '../utils/db.js';

/**
 * Professional eligibility: the single source of truth for "may this professional work on project requests".
 *
 * PROVIDER role alone is not enough. The account must be ACTIVE and its ProviderProfile must exist and be
 * VERIFIED by DBC. Values are always read from the database, never from the client or the access token.
 */

export type ProviderGateCode = 'NOT_PROVIDER' | 'PROFILE_REQUIRED' | 'NOT_VERIFIED' | 'REJECTED' | 'ACCOUNT_INACTIVE';

const MESSAGES: Record<ProviderGateCode, string> = {
  NOT_PROVIDER: 'Only professional accounts can perform this action.',
  PROFILE_REQUIRED: 'Complete your professional profile first.',
  NOT_VERIFIED: 'Your professional profile is awaiting verification by DBC. You can respond to project requests once it is verified.',
  REJECTED: 'Your professional profile has not been approved. Please contact DBC support.',
  ACCOUNT_INACTIVE: 'Your account is not active. Please contact DBC support.',
};

/** Thrown by services when an ineligible professional attempts a professional action (HTTP 403). */
export class ProviderAccessError extends Error {
  readonly status = 403;
  constructor(readonly code: ProviderGateCode) {
    super(MESSAGES[code]);
    this.name = 'ProviderAccessError';
  }
}

export interface EligibleProvider {
  id: string;
  userId: string;
  categoryId: number;
}

type ProfileWithStatus = {
  id: string;
  userId: string;
  categoryId: number;
  verificationStatus: string;
  user?: { status: string } | null;
};

/** Prisma filter for professionals that may be shown publicly or act on requests. */
export const ELIGIBLE_PROVIDER_WHERE = { verificationStatus: 'VERIFIED', user: { status: 'ACTIVE' } } as const;

const PROFILE_SELECT = { id: true, userId: true, categoryId: true, verificationStatus: true, user: { select: { status: true } } } as const;

/** Why a loaded profile is not eligible, or null when it is. */
export function providerIneligibility(profile: ProfileWithStatus | null | undefined): ProviderGateCode | null {
  if (!profile) return 'PROFILE_REQUIRED';
  if (profile.user && profile.user.status !== 'ACTIVE') return 'ACCOUNT_INACTIVE';
  if (profile.verificationStatus === 'REJECTED') return 'REJECTED';
  if (profile.verificationStatus !== 'VERIFIED') return 'NOT_VERIFIED';
  return null;
}

export function isEligibleProfile(profile: ProfileWithStatus | null | undefined): boolean {
  return !!profile?.user && providerIneligibility(profile) === null;
}

async function loadByUser(userId: string): Promise<ProfileWithStatus | null> {
  return (await db.providerProfile.findFirst({ where: { userId }, select: PROFILE_SELECT })) as ProfileWithStatus | null;
}

async function loadById(providerProfileId: string): Promise<ProfileWithStatus | null> {
  return (await db.providerProfile.findUnique({ where: { id: providerProfileId }, select: PROFILE_SELECT })) as ProfileWithStatus | null;
}

export type ProviderGate = { ok: true; provider: EligibleProvider } | { ok: false; status: 403; code: ProviderGateCode; message: string };

/**
 * Route-level gate: the caller (from a verified access token) must be a PROVIDER whose account is ACTIVE and
 * whose profile is VERIFIED. Returns a result instead of throwing so routes can answer with a 403.
 */
export async function requireVerifiedProvider(user: { id: string; role: string }): Promise<ProviderGate> {
  if (user.role !== 'PROVIDER') return { ok: false, status: 403, code: 'NOT_PROVIDER', message: MESSAGES.NOT_PROVIDER };
  const profile = await loadByUser(user.id);
  const code = profile && !profile.user ? 'ACCOUNT_INACTIVE' : providerIneligibility(profile);
  if (code || !profile) {
    const c = code ?? 'PROFILE_REQUIRED';
    return { ok: false, status: 403, code: c, message: MESSAGES[c] };
  }
  return { ok: true, provider: { id: profile.id, userId: profile.userId, categoryId: profile.categoryId } };
}

/** Service-level assertion by account id; throws ProviderAccessError. */
export async function assertVerifiedProviderUser(userId: string): Promise<EligibleProvider> {
  const profile = await loadByUser(userId);
  const code = profile && !profile.user ? 'ACCOUNT_INACTIVE' : providerIneligibility(profile);
  if (code || !profile) throw new ProviderAccessError(code ?? 'PROFILE_REQUIRED');
  return { id: profile.id, userId: profile.userId, categoryId: profile.categoryId };
}

/** Service-level check by provider profile id (used when only the profile id is known). */
export async function isEligibleProviderId(providerProfileId: string): Promise<boolean> {
  return isEligibleProfile(await loadById(providerProfileId));
}

/** A verified professional tried to switch service; that needs DBC re-verification (HTTP 409). */
export class ServiceChangeError extends Error {
  readonly status = 409;
  readonly code = 'SERVICE_CHANGE_REQUIRES_REVERIFICATION';
  constructor() {
    super('Changing the service of a verified profile requires re-verification by DBC. Please contact DBC support to change your service.');
    this.name = 'ServiceChangeError';
  }
}

/**
 * Verified professionals cannot move themselves into another service: verification is granted per service.
 * Until a re-verification workflow exists, the change is refused. Pending or rejected profiles may still
 * correct their service (they are not public and cannot act on requests).
 */
export function assertServiceChangeAllowed(existing: { categoryId: number; verificationStatus: string } | null | undefined, nextCategoryId: unknown) {
  if (!existing || nextCategoryId === undefined || nextCategoryId === null || nextCategoryId === '') return;
  if (existing.verificationStatus === 'VERIFIED' && Number(nextCategoryId) !== existing.categoryId) throw new ServiceChangeError();
}
