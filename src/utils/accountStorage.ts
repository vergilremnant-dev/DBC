/**
 * Browser storage for data that belongs to one signed-in account.
 *
 * Keys are namespaced by the backend-authenticated user id (`dbc:u:<userId>:<name>`), so one account can never
 * read another account's data, and everything account-specific is wiped at sign-out or when a different account
 * signs in on the same browser. Identity itself (name, phone, email) is never read from here: it always comes from
 * the authenticated API responses.
 */

const SCOPED_PREFIX = 'dbc:u:';

/**
 * Older builds stored account data under shared keys that every account on the browser could read (e.g. the
 * Settings page's personal details). They are no longer read anywhere and are removed on start-up and sign-out.
 */
export const LEGACY_SHARED_KEYS = [
  'dbc_customer_personal',
  'dbc_customer_contact',
  'dbc_customer_addresses',
  'dbc_customer_preferences',
  'dbc_customer_avatar',
  'dbc_customer_requirements',
  'dbc_customer_intent',
  'dbc_professional_projects',
];

/** Account-specific keys that are not namespaced but must not outlive the account's session. */
const SESSION_KEYS = ['dbc_project_request_draft'];
const SESSION_PREFIXES = ['dbc_fav_', 'dbc_notifications_'];

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function scopedKey(userId: string | number, name: string): string {
  return `${SCOPED_PREFIX}${String(userId)}:${name}`;
}

export function readScoped<T>(userId: string | number | null | undefined, name: string, fallback: T): T {
  const s = storage();
  if (!s || userId === null || userId === undefined || userId === '') return fallback;
  try {
    const raw = s.getItem(scopedKey(userId, name));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeScoped(userId: string | number | null | undefined, name: string, value: unknown): void {
  const s = storage();
  if (!s || userId === null || userId === undefined || userId === '') return;
  try {
    s.setItem(scopedKey(userId, name), JSON.stringify(value));
  } catch {
    /* storage full or blocked: account data simply isn't kept on this device */
  }
}

/** Removes the legacy shared keys (safe to call at any time). */
export function purgeLegacySharedKeys(): void {
  const s = storage();
  if (!s) return;
  for (const k of LEGACY_SHARED_KEYS) {
    try {
      s.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

/** Wipes every piece of account-specific browser data (all accounts). Called at sign-out and on account switch. */
export function clearAccountData(): void {
  const s = storage();
  if (!s) return;
  purgeLegacySharedKeys();
  try {
    const keys: string[] = [];
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (k && (k.startsWith(SCOPED_PREFIX) || SESSION_KEYS.includes(k) || SESSION_PREFIXES.some((p) => k.startsWith(p)))) keys.push(k);
    }
    keys.forEach((k) => s.removeItem(k));
  } catch {
    /* ignore */
  }
}
