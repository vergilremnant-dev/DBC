/**
 * HTTP hardening shared by every API route mounted through api-lib/app.ts.
 */

/**
 * Keys that must never appear in an API response, at any depth. Several
 * handlers include related `User` rows (sender, author, actor, user ...);
 * Prisma returns every scalar column by default, including the bcrypt hash.
 */
const SENSITIVE_RESPONSE_KEYS = new Set(['password', 'passwordHash']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Returns a copy of `value` with sensitive keys removed. Dates, Decimals, Buffers etc. are kept as-is. */
export function stripSensitiveFields<T>(value: T, depth = 0): T {
  if (depth > 25) return value;
  if (Array.isArray(value)) {
    return value.map((item) => stripSensitiveFields(item, depth + 1)) as unknown as T;
  }
  if (!isPlainObject(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (SENSITIVE_RESPONSE_KEYS.has(key)) continue;
    out[key] = stripSensitiveFields(child, depth + 1);
  }
  return out as T;
}

/**
 * Origins allowed to call the API cross-origin with credentials.
 * The web app is served from the same origin as /api (Vercel rewrite), so it
 * needs no CORS. Set CORS_ALLOWED_ORIGINS (comma-separated, exact origins) only
 * for additional trusted front ends, e.g. a separately hosted mobile web build.
 */
export function getAllowedOrigins(): string[] {
  return (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter((o) => /^https?:\/\/[^\s/]+$/.test(o));
}

const ALLOWED_HEADERS =
  'Authorization, Content-Type, Accept, X-Requested-With, X-CSRF-Token';
const ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';

type Req = { method?: string; headers: Record<string, unknown> };
type Res = {
  setHeader(name: string, value: string | string[]): unknown;
  status(code: number): { end(): unknown };
};

/**
 * Express middleware: echoes the Origin only when it is on the allowlist (never
 * `*` with credentials) and answers preflight requests.
 */
export function corsAllowlist(req: Req, res: Res, next: () => void) {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin.replace(/\/$/, '') : '';
  const allowed = origin && getAllowedOrigins().includes(origin);

  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    if (allowed) {
      res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
      res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
      res.setHeader('Access-Control-Max-Age', '600');
    }
    return res.status(204).end();
  }
  return next();
}
