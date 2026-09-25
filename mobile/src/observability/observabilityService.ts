/**
 * Central Observability & Telemetry Service for DBC Mobile Application.
 * Standardized logger, analytics event tracker, event deduplication,
 * and non-blocking privacy-sanitized telemetry emitter.
 *
 * CRITICAL RULE:
 * Telemetry and logging operations are STRICTLY best-effort and non-blocking.
 * Telemetry failures will NEVER throw exceptions or block business operations.
 */

import {
  AllowedAnalyticsEvent,
  LogEntry,
  LogLevel,
  TelemetryEvent,
} from './observabilityTypes';
import {
  getAnonymousSessionId,
  getEnvironment,
  getObservabilityConsent,
  isLogLevelEnabled,
  OBSERVABILITY_CONFIG,
} from './observabilityConfig';
import {
  sanitizeAnalyticsProperties,
  sanitizeObservabilityPayload,
} from './observabilitySanitizer';
import { isAllowedAnalyticsEvent } from './analyticsRegistry';

const telemetryBuffer: TelemetryEvent[] = [];
const logHistory: LogEntry[] = [];
const recentEventsMap = new Map<string, number>();

/**
 * Structured Logger.
 */
export const logger = {
  debug: (message: string, metadata?: Record<string, any>) => logMessage('debug', message, metadata),
  info: (message: string, metadata?: Record<string, any>) => logMessage('info', message, metadata),
  warn: (message: string, metadata?: Record<string, any>) => logMessage('warn', message, metadata),
  error: (message: string, metadata?: Record<string, any>) => logMessage('error', message, metadata),
};

function logMessage(level: LogLevel, message: string, metadata?: Record<string, any>): void {
  try {
    if (!isLogLevelEnabled(level)) return;

    const sanitizedMeta = sanitizeObservabilityPayload(metadata);
    const entry: LogEntry = {
      level,
      message,
      metadata: sanitizedMeta,
      timestamp: new Date().toISOString(),
      environment: getEnvironment(),
    };

    logHistory.push(entry);
    if (logHistory.length > OBSERVABILITY_CONFIG.maxBufferSize) {
      logHistory.shift();
    }
  } catch (_err) {
    // Fail silently — never break app execution
  }
}

/**
 * Tracks a privacy-sanitized analytics event.
 */
export function trackEvent(
  eventName: AllowedAnalyticsEvent,
  properties?: Record<string, any>,
  screen?: string
): boolean {
  try {
    const consent = getObservabilityConsent();
    if (!consent.analyticsOptIn) return false;

    if (!isAllowedAnalyticsEvent(eventName)) {
      logger.warn(`Rejected unauthorized analytics event name: ${eventName}`);
      return false;
    }

    // Event Deduplication check
    const dedupKey = `${eventName}_${screen || 'app'}_${JSON.stringify(properties || {})}`;
    const now = Date.now();
    const lastFired = recentEventsMap.get(dedupKey);

    if (lastFired && now - lastFired < OBSERVABILITY_CONFIG.deduplicationWindowMs) {
      // Duplicate event within window — ignore to prevent event spam
      return false;
    }
    recentEventsMap.set(dedupKey, now);

    const cleanProps = sanitizeAnalyticsProperties(properties);

    const event: TelemetryEvent = {
      eventName,
      category: eventName.split('_')[0] || 'general',
      properties: cleanProps,
      timestamp: new Date().toISOString(),
      environment: getEnvironment(),
      appVersion: '1.0.0',
      anonymousSessionId: getAnonymousSessionId(),
      screen,
    };

    telemetryBuffer.push(event);
    if (telemetryBuffer.length > OBSERVABILITY_CONFIG.maxBufferSize) {
      telemetryBuffer.shift(); // Evict oldest event when buffer full
    }

    return true;
  } catch (_err) {
    // Fail silently — non-blocking analytics policy
    return false;
  }
}

/**
 * Returns recorded telemetry events buffer.
 */
export function getTelemetryBuffer(): TelemetryEvent[] {
  return [...telemetryBuffer];
}

/**
 * Returns recorded log entries history.
 */
export function getLogHistory(): LogEntry[] {
  return [...logHistory];
}

/**
 * Clears telemetry buffer, log history, and deduplication map.
 */
export function clearObservabilityData(): void {
  telemetryBuffer.length = 0;
  logHistory.length = 0;
  recentEventsMap.clear();
}
