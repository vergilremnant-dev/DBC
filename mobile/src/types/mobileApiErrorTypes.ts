/**
 * DBC Mobile API Error Model & Classification Types.
 * Standardizes API reliability, error categorization, and user-safe error messages for Module 52.
 */

export type MobileApiErrorCategory =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'SERVER'
  | 'UNKNOWN';

export type MobileApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNAUTHORIZED_EXPIRED_SESSION'
  | 'ACCESS_DENIED'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'SERVER_ERROR'
  | 'MALFORMED_RESPONSE'
  | 'DUPLICATE_SUBMISSION'
  | 'UNKNOWN_ERROR';

export interface MobileApiError {
  code: MobileApiErrorCode | string;
  message: string;
  status: number;
  category: MobileApiErrorCategory;
  retryable: boolean;
  fieldErrors?: Record<string, string>;
  originalError?: unknown;
}

export interface ApiTimeoutConfig {
  defaultMs: number;
  paymentMs: number;
  uploadMs: number;
}
