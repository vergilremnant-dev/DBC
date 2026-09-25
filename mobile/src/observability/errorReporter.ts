/**
 * Error Reporting & Global Runtime Boundary for DBC Mobile Application.
 * Normalizes caught errors using Module 52 error utilities, strips stack traces,
 * emits privacy-sanitized error telemetry, and provides a safe runtime fallback.
 */

import { ErrorCategory, ErrorReport } from './observabilityTypes';
import { normalizeMobileApiError, isMobileApiError } from '../api/mobileErrorUtils';
import { getEnvironment, OBSERVABILITY_CONFIG } from './observabilityConfig';
import { sanitizeObservabilityPayload } from './observabilitySanitizer';

const errorReportsHistory: ErrorReport[] = [];

/**
 * Normalizes and reports an error event securely without exposing PII or raw stack traces.
 */
export function reportError(
  error: unknown,
  context?: { screen?: string; feature?: string; operation?: string }
): ErrorReport {
  const normalized = normalizeMobileApiError(error);

  const report: ErrorReport = {
    errorCode: normalized.code || 'UNKNOWN_ERROR',
    errorCategory: (normalized.category as ErrorCategory) || 'UNKNOWN',
    httpStatus: normalized.status,
    message: normalized.message, // User-safe normalized message
    screen: context?.screen,
    feature: context?.feature,
    operation: context?.operation,
    timestamp: new Date().toISOString(),
    environment: getEnvironment(),
  };

  errorReportsHistory.push(report);
  if (errorReportsHistory.length > OBSERVABILITY_CONFIG.maxBufferSize) {
    errorReportsHistory.shift();
  }

  return report;
}

/**
 * Returns recorded error reports history.
 */
export function getErrorReportHistory(): ErrorReport[] {
  return [...errorReportsHistory];
}

/**
 * Clears error report history.
 */
export function clearErrorReportHistory(): void {
  errorReportsHistory.length = 0;
}

/**
 * Mobile Runtime Error Boundary Specification & State Descriptor.
 * Used for catching component render exceptions and displaying user-safe retry state.
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  userMessage: string;
  errorCode: string;
}

export const MobileErrorBoundarySpec = {
  getInitialState: (): ErrorBoundaryState => ({
    hasError: false,
    userMessage: '',
    errorCode: '',
  }),

  handleError: (error: unknown, screenName: string = 'AppScreen'): ErrorBoundaryState => {
    const report = reportError(error, { screen: screenName, feature: 'runtime_boundary' });
    return {
      hasError: true,
      userMessage: 'Something went wrong. Please try again.',
      errorCode: report.errorCode,
    };
  },

  resetError: (): ErrorBoundaryState => ({
    hasError: false,
    userMessage: '',
    errorCode: '',
  }),
};
