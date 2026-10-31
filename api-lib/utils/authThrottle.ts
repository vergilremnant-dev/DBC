import crypto from 'crypto';
import { db } from './db.js';
import { getTempUserId } from './auth.js';

/**
 * Database-backed throttling for authentication endpoints (serverless: no shared memory between invocations).
 *
 * Each attempt is one short-lived row in the existing `user_sessions` table, keyed
 *   RL:<scope>:<sha256(key)>:<random>
 * and owned by the system placeholder user. Rows carry `expiresAt` = end of their window and expired rows are
 * pruned opportunistically, so storage stays bounded (unlike counting audit rows in `global_activities`).
 *
 * Identifiers (emails, phone numbers, IPs) are only stored hashed. Security checks FAIL CLOSED: if the database
 * cannot be read, the request is treated as limited.
 */

const PREFIX = 'RL:';
const PRUNE_EVERY = 25;

export function keyHash(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex').slice(0, 40);
}

function bucket(scope: string, key: string) {
  return `${PREFIX}${scope}:${keyHash(key)}:`;
}

export interface ThrottleResult {
  limited: boolean;
  retryAfterSeconds: number;
  /** True when the limiter could not reach the database (request refused for safety). */
  unavailable?: boolean;
}

/** Whether `scope`/`key` already has `limit` unexpired attempts made within `windowMs`. Does not record anything. */
export async function isThrottled(scope: string, key: string, limit: number, windowMs: number): Promise<ThrottleResult> {
  try {
    const rows = await db.userSession.findMany({
      where: { token: { startsWith: bucket(scope, key) }, expiresAt: { gt: new Date() }, createdAt: { gte: new Date(Date.now() - windowMs) } },
      select: { expiresAt: true },
      orderBy: { expiresAt: 'asc' },
      take: limit,
    });
    if (rows.length < limit) return { limited: false, retryAfterSeconds: 0 };
    const firstExpiry = new Date(rows[0].expiresAt).getTime();
    return { limited: true, retryAfterSeconds: Math.max(1, Math.ceil((firstExpiry - Date.now()) / 1000)) };
  } catch {
    return { limited: true, retryAfterSeconds: 60, unavailable: true };
  }
}

let cachedTempUserId: string | null = null;
let writes = 0;

/** Records one attempt for `scope`/`key` that counts for `windowMs`. Best-effort. */
export async function recordAttempt(scope: string, key: string, windowMs: number): Promise<void> {
  try {
    cachedTempUserId ??= await getTempUserId();
    await db.userSession.create({
      data: {
        userId: cachedTempUserId,
        token: `${bucket(scope, key)}${crypto.randomUUID()}`,
        expiresAt: new Date(Date.now() + windowMs),
      },
    });
    if (++writes % PRUNE_EVERY === 0) {
      await db.userSession.deleteMany({ where: { token: { startsWith: PREFIX }, expiresAt: { lt: new Date() } } });
    }
  } catch {
    cachedTempUserId = null;
  }
}

/** Check-and-count in one call, for per-request limits (e.g. N requests per IP per minute). */
export async function consumeAttempt(scope: string, key: string, limit: number, windowMs: number): Promise<ThrottleResult> {
  const result = await isThrottled(scope, key, limit, windowMs);
  if (!result.limited) await recordAttempt(scope, key, windowMs);
  return result;
}

/** Clears recorded attempts (e.g. failed logins after a successful one). Best-effort. */
export async function clearAttempts(scope: string, key: string): Promise<void> {
  try {
    await db.userSession.deleteMany({ where: { token: { startsWith: bucket(scope, key) } } });
  } catch {
    /* best-effort */
  }
}

/** Client IP as set by the hosting proxy (first `x-forwarded-for` entry). */
export function clientIp(req: { headers?: Record<string, unknown>; socket?: { remoteAddress?: string } }): string {
  const fwd = req.headers?.['x-forwarded-for'];
  const first = (Array.isArray(fwd) ? fwd[0] : typeof fwd === 'string' ? fwd : '').split(',')[0]?.trim();
  const real = req.headers?.['x-real-ip'];
  return first || (typeof real === 'string' && real.trim()) || req.socket?.remoteAddress || 'unknown';
}

/** Standard 429 / 503 body for a limited request. */
type JsonResponse = { status: (code: number) => { json: (body: unknown) => unknown }; setHeader?: (name: string, value: string) => unknown };

export function throttledResponse(res: JsonResponse, result: ThrottleResult, message?: string) {
  res.setHeader?.('Retry-After', String(result.retryAfterSeconds));
  if (result.unavailable) {
    return res.status(503).json({ success: false, code: 'TEMPORARILY_UNAVAILABLE', message: 'Sign-in is temporarily unavailable. Please try again shortly.' });
  }
  return res.status(429).json({
    success: false,
    code: 'TOO_MANY_ATTEMPTS',
    retryAfterSeconds: result.retryAfterSeconds,
    message: message ?? 'Too many attempts. Please wait a moment and try again.',
  });
}
