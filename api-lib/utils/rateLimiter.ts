import { consumeAttempt } from './authThrottle.js';

/**
 * Per-IP request limit for authentication endpoints.
 * Returns true if the request is allowed, false if the limit is exceeded OR the limiter is unavailable
 * (fails closed). Each call counts as one request in `scope` (default: shared "auth" bucket).
 *
 * Previously this counted `global_activities` rows that happened to contain the IP, which only throttled
 * requests that wrote an audit row and let everything through when the database errored.
 */
export async function checkRateLimit(
  ipAddress: string,
  limit: number = 30,
  windowMs: number = 60000,
  scope: string = 'auth'
): Promise<boolean> {
  const ip = String(ipAddress || 'unknown').split(',')[0].trim() || 'unknown';
  const result = await consumeAttempt(`ip:${scope}`, ip, limit, windowMs);
  return !result.limited;
}
