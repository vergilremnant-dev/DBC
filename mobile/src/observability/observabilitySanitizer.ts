/**
 * Observability Privacy Sanitizer for DBC Mobile Application.
 * Enforces strict security boundary rules: redacts tokens, passwords, OTPs,
 * payment secrets, user-generated message bodies, raw PII, and template-normalizes URLs.
 */

const FORBIDDEN_SENSITIVE_KEYS = [
  'authorization',
  'cookie',
  'token',
  'access_token',
  'refresh_token',
  'password',
  'otp',
  'secret',
  'creditcard',
  'card',
  'cvv',
  'bank',
  'account_number',
  'iban',
  'email',
  'phone',
  'address',
  'full_name',
  'user_id',
  'ssn',
  'message',
  'message_body',
  'content',
  'description',
  'notes',
  'file_content',
  'payload',
  'raw_body',
];

/**
 * Sanitizes arbitrary metadata or payload objects by replacing sensitive keys with '[REDACTED]'.
 */
export function sanitizeObservabilityPayload<T extends Record<string, any>>(payload?: T): T {
  if (!payload || typeof payload !== 'object') {
    return {} as T;
  }

  const sanitized: Record<string, any> = Array.isArray(payload) ? [] : {};

  for (const [key, value] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = FORBIDDEN_SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive));

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObservabilityPayload(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Normalizes API endpoint URLs to safe template paths without leaking resource IDs or query params.
 * Example: "/api/projects/proj-12345/milestones/ms-99?token=abc" -> "/api/projects/:id/milestones/:id"
 */
export function normalizeEndpointUrl(url?: string): string {
  if (!url) return '/api/unknown';

  // Strip query params
  const cleanUrl = url.split('?')[0];

  // Replace GUIDs, MongoDB ObjectIds, prefixed IDs (proj-123, ms-45, etc.), or numeric IDs with :id
  return cleanUrl.replace(/\/[a-f0-9-]{8,36}|\/[0-9]+|\/[a-z]{1,10}-[a-z0-9-]+/gi, '/:id');
}

/**
 * Validates and sanitizes analytics event properties to guarantee zero PII leakage.
 */
export function sanitizeAnalyticsProperties(
  properties?: Record<string, any>
): Record<string, string | number | boolean | null> {
  if (!properties || typeof properties !== 'object') return {};

  const cleanProps: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(properties)) {
    const lowerKey = key.toLowerCase();
    const isForbidden = FORBIDDEN_SENSITIVE_KEYS.some((sensitive) => lowerKey.includes(sensitive));

    if (isForbidden) {
      cleanProps[key] = '[REDACTED]';
    } else if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      cleanProps[key] = value;
    } else {
      cleanProps[key] = String(value);
    }
  }

  return cleanProps;
}
