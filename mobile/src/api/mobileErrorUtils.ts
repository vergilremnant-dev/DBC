import axios from 'axios';
import type { MobileApiError } from '../types/mobileApiErrorTypes.js';

export const API_TIMEOUT_CONFIG = {
  defaultMs: 15000, // 15 seconds
  paymentMs: 30000, // 30 seconds
  uploadMs: 60000,  // 60 seconds
};

/**
 * Normalizes any caught error into a standardized MobileApiError.
 * Preserves backend truth and redacts technical details from user-facing messages.
 */
export function normalizeMobileApiError(error: unknown): MobileApiError {
  if (isMobileApiError(error)) {
    return error;
  }

  // Handle Axios Errors
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 0;
    const responseData = error.response?.data as Record<string, any> | undefined;

    // Timeout Error
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        code: 'TIMEOUT_ERROR',
        message: 'The request took too long. Please check your connection and try again.',
        status: 408,
        category: 'TIMEOUT',
        retryable: true,
        originalError: error,
      };
    }

    // Network Connection Failure (No response)
    if (!error.response || error.code === 'ERR_NETWORK') {
      return {
        code: 'NETWORK_ERROR',
        message: 'We could not connect to the server. Please check your internet connection and try again.',
        status: 0,
        category: 'NETWORK',
        retryable: true,
        originalError: error,
      };
    }

    // Status 401 Unauthorized
    if (status === 401) {
      return {
        code: 'UNAUTHORIZED_EXPIRED_SESSION',
        message: 'Your session has expired. Please sign in again.',
        status: 401,
        category: 'UNAUTHORIZED',
        retryable: false,
        originalError: error,
      };
    }

    // Status 403 Forbidden / Access Denied
    if (status === 403) {
      return {
        code: 'ACCESS_DENIED',
        message: "You don't have permission to perform this action.",
        status: 403,
        category: 'FORBIDDEN',
        retryable: false,
        originalError: error,
      };
    }

    // Status 404 Not Found
    if (status === 404) {
      return {
        code: 'NOT_FOUND',
        message: 'The requested resource could not be found.',
        status: 404,
        category: 'NOT_FOUND',
        retryable: false,
        originalError: error,
      };
    }

    // Status 409 Conflict
    if (status === 409) {
      return {
        code: 'CONFLICT',
        message: 'The operation could not be completed because the backend state has changed. Please refresh and try again.',
        status: 409,
        category: 'CONFLICT',
        retryable: false,
        originalError: error,
      };
    }

    // Status 422 Unprocessable Entity / Validation
    if (status === 422) {
      const fieldErrors = responseData?.errors || responseData?.fieldErrors || undefined;
      return {
        code: 'VALIDATION_ERROR',
        message: responseData?.message || 'Please check your input values and try again.',
        status: 422,
        category: 'VALIDATION',
        retryable: false,
        fieldErrors,
        originalError: error,
      };
    }

    // Status 500+ Server Error
    if (status >= 500) {
      return {
        code: 'SERVER_ERROR',
        message: "We're experiencing technical difficulties. Please try again in a moment.",
        status,
        category: 'SERVER',
        retryable: true,
        originalError: error,
      };
    }

    // Fallback for other status codes
    return {
      code: 'UNKNOWN_ERROR',
      message: responseData?.message || 'An unexpected error occurred. Please try again.',
      status,
      category: 'UNKNOWN',
      retryable: false,
      originalError: error,
    };
  }

  // Handle Error Instances
  if (error instanceof Error) {
    const msg = error.message;

    if (msg === 'UNAUTHORIZED_EXPIRED_SESSION' || msg.includes('401')) {
      return {
        code: 'UNAUTHORIZED_EXPIRED_SESSION',
        message: 'Your session has expired. Please sign in again.',
        status: 401,
        category: 'UNAUTHORIZED',
        retryable: false,
        originalError: error,
      };
    }

    if (
      msg === 'ACCESS_DENIED_FINANCE' ||
      msg === 'ACCESS_DENIED_ADMIN' ||
      msg.includes('403') ||
      msg.includes('Access denied')
    ) {
      return {
        code: 'ACCESS_DENIED',
        message: "You don't have permission to perform this action.",
        status: 403,
        category: 'FORBIDDEN',
        retryable: false,
        originalError: error,
      };
    }

    if (msg.includes('Network error') || msg.includes('ECONNREFUSED')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'We could not connect to the server. Please check your internet connection and try again.',
        status: 0,
        category: 'NETWORK',
        retryable: true,
        originalError: error,
      };
    }

    if (msg.includes('timeout') || msg.includes('Timeout')) {
      return {
        code: 'TIMEOUT_ERROR',
        message: 'The request took too long. Please check your connection and try again.',
        status: 408,
        category: 'TIMEOUT',
        retryable: true,
        originalError: error,
      };
    }

    if (msg.includes('not found') || msg.includes('404')) {
      return {
        code: 'NOT_FOUND',
        message: 'The requested resource could not be found.',
        status: 404,
        category: 'NOT_FOUND',
        retryable: false,
        originalError: error,
      };
    }

    const isTechnical = /AxiosError|TypeError|ECONNREFUSED|SQL|stack|at\s|\[object\s/i.test(msg);
    return {
      code: 'UNKNOWN_ERROR',
      message: isTechnical ? 'An error occurred. Please try again.' : msg,
      status: 500,
      category: 'UNKNOWN',
      retryable: false,
      originalError: error,
    };
  }

  // Handle unknown/primitive errors
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred. Please try again.',
    status: 500,
    category: 'UNKNOWN',
    retryable: false,
    originalError: error,
  };
}

export function isMobileApiError(obj: unknown): obj is MobileApiError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'code' in obj &&
    'category' in obj &&
    'retryable' in obj &&
    'message' in obj
  );
}

/**
 * Returns a user-safe error message string, stripping technical stack traces or raw Axios errors.
 */
export function formatUserErrorMessage(error: unknown): string {
  const normalized = normalizeMobileApiError(error);
  return normalized.message;
}

/**
 * Redacts sensitive credentials from log payloads (tokens, cookies, passwords, OTPs).
 */
export function sanitizeLogPayload(payload: Record<string, any>): Record<string, any> {
  if (!payload || typeof payload !== 'object') return {};
  const sanitized = { ...payload };
  const sensitiveKeys = [
    'authorization',
    'cookie',
    'token',
    'password',
    'otp',
    'access_token',
    'refresh_token',
    'creditcard',
    'cvv',
  ];
  Object.keys(sanitized).forEach((key) => {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    }
  });
  return sanitized;
}
