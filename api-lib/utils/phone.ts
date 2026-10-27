/**
 * Phone number helpers for verified (Firebase) phone identities.
 * Input to these helpers must already come from a verified token claim.
 */

const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

/** Returns a canonical E.164 string (e.g. +919876543210) or null if invalid. */
export function normalizeE164(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.trim().replace(/[\s\-().]/g, '');
  return E164_PATTERN.test(cleaned) ? cleaned : null;
}

function indianNationalNumber(e164: string): string | null {
  return e164.startsWith('+91') && e164.length === 13 ? e164.slice(3) : null;
}

/**
 * The account email used for phone-first users. Matches the existing DBC
 * convention (`<10-digit>@dbc.com`) so legacy phone accounts and the existing
 * phone + password login lookup keep working.
 */
export function syntheticPhoneEmail(e164: string): string {
  const national = indianNationalNumber(e164);
  return `${national ?? e164.slice(1)}@dbc.com`;
}

/** Value stored in customer/provider profile `phoneNumber` (existing 10-digit convention for India). */
export function profilePhoneFor(e164: string): string {
  return indianNationalNumber(e164) ?? e164;
}

/** Exact-match candidates for finding legacy profile phone values (no substring matching). */
export function legacyProfilePhoneCandidates(e164: string): string[] {
  const national = indianNationalNumber(e164);
  const candidates = national
    ? [national, `+91${national}`, `91${national}`, `0${national}`, `+91 ${national}`]
    : [e164, e164.slice(1)];
  return Array.from(new Set(candidates));
}
