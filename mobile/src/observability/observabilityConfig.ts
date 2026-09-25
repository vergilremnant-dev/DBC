/**
 * Observability Environment & Configuration for DBC Mobile Application.
 * Manages environment detection, log level filters, batch limits, consent settings,
 * and pseudonymous session identification.
 */

import { LogLevel, ObservabilityConsentConfig, TelemetryEnvironment } from './observabilityTypes';

export const APP_VERSION = '1.0.0';

let overrideEnv: TelemetryEnvironment | null = null;
let consentConfig: ObservabilityConsentConfig = {
  analyticsOptIn: true,
  crashReportingOptIn: true,
};

let cachedAnonymousSessionId: string | null = null;

/**
 * Resolves current execution environment ('development' | 'staging' | 'production').
 */
export function getEnvironment(): TelemetryEnvironment {
  if (overrideEnv) return overrideEnv;

  if (typeof process !== 'undefined' && process.env) {
    if (process.env.NODE_ENV === 'test') return 'development';
    if (process.env.NODE_ENV === 'production') return 'production';
    if (process.env.VITE_APP_ENV === 'staging') return 'staging';
  }

  return 'development';
}

/**
 * Sets explicit environment override for testing or environment switching.
 */
export function setEnvironmentOverride(env: TelemetryEnvironment | null): void {
  overrideEnv = env;
}

/**
 * Determines if a given LogLevel should be output in the current environment.
 */
export function isLogLevelEnabled(level: LogLevel): boolean {
  const env = getEnvironment();
  if (env === 'production') {
    // In production, debug logs are strictly suppressed
    return level === 'warn' || level === 'error';
  }
  if (env === 'staging') {
    return level === 'info' || level === 'warn' || level === 'error';
  }
  // Development mode allows all log levels
  return true;
}

/**
 * Gets or generates a privacy-safe pseudonymous session identifier.
 * Does NOT contain user IDs, emails, or personal identifiers.
 */
export function getAnonymousSessionId(): string {
  if (!cachedAnonymousSessionId) {
    cachedAnonymousSessionId = `anon_session_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
  }
  return cachedAnonymousSessionId;
}

/**
 * Clears or resets the anonymous session identifier (e.g. on session switch/logout).
 */
export function resetAnonymousSessionId(): void {
  cachedAnonymousSessionId = `anon_session_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
}

/**
 * Updates analytics/telemetry privacy consent settings.
 */
export function setObservabilityConsent(consent: Partial<ObservabilityConsentConfig>): void {
  consentConfig = { ...consentConfig, ...consent };
}

/**
 * Returns active observability privacy consent settings.
 */
export function getObservabilityConsent(): ObservabilityConsentConfig {
  return { ...consentConfig };
}

export const OBSERVABILITY_CONFIG = {
  maxBufferSize: 50,
  flushIntervalMs: 10000,
  deduplicationWindowMs: 1000,
};
