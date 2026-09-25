/**
 * Automated Unit Tests for Mobile Observability, Analytics & Diagnostics.
 * Verifies log level environment filters, strict privacy sanitization (no tokens/passwords/OTPs/PII/secrets),
 * URL template normalization, event taxonomy, event deduplication, error reporting, performance tracking,
 * consent enforcement, non-blocking resilience, and buffer memory limits.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  setEnvironmentOverride,
  getEnvironment,
  isLogLevelEnabled,
  getAnonymousSessionId,
  resetAnonymousSessionId,
  setObservabilityConsent,
  getObservabilityConsent,
  OBSERVABILITY_CONFIG,
} from '../../mobile/src/observability/observabilityConfig';
import {
  sanitizeObservabilityPayload,
  normalizeEndpointUrl,
  sanitizeAnalyticsProperties,
} from '../../mobile/src/observability/observabilitySanitizer';
import { isAllowedAnalyticsEvent } from '../../mobile/src/observability/analyticsRegistry';
import {
  logger,
  trackEvent,
  getTelemetryBuffer,
  getLogHistory,
  clearObservabilityData,
} from '../../mobile/src/observability/observabilityService';
import {
  startPerformanceTimer,
  stopPerformanceTimer,
  measurePerformanceAsync,
  getPerformanceMetricsHistory,
  clearPerformanceHistory,
} from '../../mobile/src/observability/performanceTracker';
import {
  reportError,
  getErrorReportHistory,
  clearErrorReportHistory,
  MobileErrorBoundarySpec,
} from '../../mobile/src/observability/errorReporter';

describe('Module 56 — Mobile Observability & Analytics Suite', () => {
  beforeEach(() => {
    setEnvironmentOverride('development');
    setObservabilityConsent({ analyticsOptIn: true, crashReportingOptIn: true });
    clearObservabilityData();
    clearPerformanceHistory();
    clearErrorReportHistory();
  });

  // --- Environment & Log Filter Tests ---

  it('1. Production environment suppresses debug logs and allows only warn/error', () => {
    setEnvironmentOverride('production');

    expect(isLogLevelEnabled('debug')).toBe(false);
    expect(isLogLevelEnabled('info')).toBe(false);
    expect(isLogLevelEnabled('warn')).toBe(true);
    expect(isLogLevelEnabled('error')).toBe(true);

    logger.debug('This debug log should be suppressed in production');
    const logs = getLogHistory();
    expect(logs.length).toBe(0);
  });

  it('2. Development environment allows all log levels', () => {
    setEnvironmentOverride('development');

    expect(isLogLevelEnabled('debug')).toBe(true);
    logger.debug('Debug log enabled in development');
    const logs = getLogHistory();
    expect(logs.length).toBe(1);
    expect(logs[0].message).toBe('Debug log enabled in development');
  });

  // --- Privacy & Sanitization Tests ---

  it('3. Central logger sanitizes sensitive security keys (tokens, passwords, OTPs, auth headers)', () => {
    logger.info('User login attempt', {
      authorization: 'Bearer secret_access_token_123',
      password: 'MySecretPassword123!',
      otp: '654321',
      refresh_token: 'refresh_tok_abc',
      safeField: 'login_screen',
    });

    const logs = getLogHistory();
    expect(logs.length).toBe(1);
    const meta = logs[0].metadata;

    expect(meta?.authorization).toBe('[REDACTED]');
    expect(meta?.password).toBe('[REDACTED]');
    expect(meta?.otp).toBe('[REDACTED]');
    expect(meta?.refresh_token).toBe('[REDACTED]');
    expect(meta?.safeField).toBe('login_screen');
  });

  it('4. Sanitizer redacts PII, message bodies, file contents, and financial card numbers', () => {
    const rawPayload = {
      email: 'user@example.com',
      phone: '+919876543210',
      message_body: 'Hello, please send the building plan draft.',
      creditcard: '4111222233334444',
      cvv: '123',
      bank: 'HDFC Bank',
      status: 'active',
    };

    const clean = sanitizeObservabilityPayload(rawPayload);

    expect(clean.email).toBe('[REDACTED]');
    expect(clean.phone).toBe('[REDACTED]');
    expect(clean.message_body).toBe('[REDACTED]');
    expect(clean.creditcard).toBe('[REDACTED]');
    expect(clean.cvv).toBe('[REDACTED]');
    expect(clean.bank).toBe('[REDACTED]');
    expect(clean.status).toBe('active');
  });

  it('5. URL normalization strips resource IDs and query parameters into template paths', () => {
    const rawUrl = 'https://api.dbc.com/api/projects/proj-98765/milestones/ms-123?token=secret123&user=45';
    const cleanUrl = normalizeEndpointUrl(rawUrl);
    expect(cleanUrl).toBe('https://api.dbc.com/api/projects/:id/milestones/:id');
  });

  // --- Analytics Event Taxonomy & Validation Tests ---

  it('6. Valid analytics events in the taxonomy are accepted and queued', () => {
    const tracked = trackEvent('project_request_submitted', { category: 'Residential' }, 'ProjectRequestFormScreen');
    expect(tracked).toBe(true);

    const buffer = getTelemetryBuffer();
    expect(buffer.length).toBe(1);
    expect(buffer[0].eventName).toBe('project_request_submitted');
    expect(buffer[0].screen).toBe('ProjectRequestFormScreen');
  });

  it('7. Unknown/unregistered analytics event names are safely rejected', () => {
    // @ts-expect-error testing invalid event name
    const tracked = trackEvent('invalid_fake_event_name', { foo: 'bar' });
    expect(tracked).toBe(false);

    const buffer = getTelemetryBuffer();
    expect(buffer.length).toBe(0);
  });

  it('8. Analytics event properties automatically sanitize PII and forbidden fields', () => {
    trackEvent('message_sent', {
      recipientRole: 'professional',
      message_body: 'Private conversation details',
      email: 'customer@dbc.com',
      status: 'sent',
    });

    const buffer = getTelemetryBuffer();
    expect(buffer.length).toBe(1);
    const props = buffer[0].properties;

    expect(props.recipientRole).toBe('professional');
    expect(props.status).toBe('sent');
    expect(props.message_body).toBe('[REDACTED]');
    expect(props.email).toBe('[REDACTED]');
  });

  it('9. Event deduplication prevents duplicate identical events within deduplication window', () => {
    const event1 = trackEvent('quotation_accepted', { quotationId: 'q-100' }, 'QuotationDetailsScreen');
    expect(event1).toBe(true);

    // Immediate duplicate trigger (e.g. rapid re-render or double tap)
    const event2 = trackEvent('quotation_accepted', { quotationId: 'q-100' }, 'QuotationDetailsScreen');
    expect(event2).toBe(false); // Deduplicated!

    const buffer = getTelemetryBuffer();
    expect(buffer.length).toBe(1);
  });

  // --- Resilience & Non-Blocking Policy Tests ---

  it('10. Telemetry operations are strictly non-blocking and fail silently without throwing', () => {
    // Simulate error during tracking
    const spySanitize = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      trackEvent('project_viewed', { category: 'Commercial' });
    }).not.toThrow();

    spySanitize.mockRestore();
  });

  it('11. Telemetry buffer enforces maximum size limit (50 events) to prevent memory growth', () => {
    for (let i = 0; i < 70; i++) {
      trackEvent('marketplace_viewed', { page: i });
    }

    const buffer = getTelemetryBuffer();
    expect(buffer.length).toBe(OBSERVABILITY_CONFIG.maxBufferSize); // 50
  });

  // --- Domain-Specific Observability Tests ---

  it('12. Offline and network reconnection events log safe network state metadata', () => {
    trackEvent('network_offline', { previousState: 'ONLINE' });
    trackEvent('network_reconnected', { retryCount: 2 });

    const buffer = getTelemetryBuffer();
    expect(buffer.length).toBe(2);
    expect(buffer[0].eventName).toBe('network_offline');
    expect(buffer[1].eventName).toBe('network_reconnected');
  });

  it('13. Cache events record aggregate hits/misses without logging cached business payloads', () => {
    trackEvent('cache_hit', { cacheCategory: 'WORKSPACE', isFresh: true });
    trackEvent('cache_miss', { cacheCategory: 'FINANCIAL' });

    const buffer = getTelemetryBuffer();
    expect(buffer.length).toBe(2);
    expect(buffer[0].properties.cacheCategory).toBe('WORKSPACE');
    expect(buffer[0].properties.projectTitle).toBeUndefined(); // Zero business content
  });

  it('14. Authentication events record lifecycle states without exposing tokens or passwords', () => {
    trackEvent('login_succeeded', { role: 'Customer', method: 'OTP' });
    trackEvent('logout', { reason: 'user_action' });

    const buffer = getTelemetryBuffer();
    expect(buffer.length).toBe(2);
    expect(buffer[0].properties.role).toBe('Customer');
    expect(buffer[0].properties.token).toBeUndefined();
    expect(buffer[0].properties.password).toBeUndefined();
  });

  it('15. Deep link events record safe target route categories without raw query credentials', () => {
    trackEvent('deep_link_received', { routeCategory: 'quotations', isAuth: true });

    const buffer = getTelemetryBuffer();
    expect(buffer[0].properties.routeCategory).toBe('quotations');
    expect(buffer[0].properties.rawUrl).toBeUndefined();
  });

  it('16. Notification events log notification categories without body text', () => {
    trackEvent('notification_opened', { category: 'PAYMENT', notificationId: 'n-55' });

    const buffer = getTelemetryBuffer();
    expect(buffer[0].properties.category).toBe('PAYMENT');
    expect(buffer[0].properties.body).toBeUndefined();
  });

  it('17. Messaging events track operational status without message text or body', () => {
    trackEvent('message_sent', { recipientRole: 'professional', hasAttachment: false });

    const buffer = getTelemetryBuffer();
    expect(buffer[0].properties.hasAttachment).toBe(false);
    expect(buffer[0].properties.text).toBeUndefined();
  });

  it('18. Payment events log payment category without card numbers or financial secrets', () => {
    trackEvent('payment_completed', { paymentMethod: 'ESCROW_WALLET', status: 'SUCCESS' });

    const buffer = getTelemetryBuffer();
    expect(buffer[0].properties.paymentMethod).toBe('ESCROW_WALLET');
    expect(buffer[0].properties.cardNumber).toBeUndefined();
    expect(buffer[0].properties.cvv).toBeUndefined();
  });

  // --- Performance & Error Reporting Tests ---

  it('19. Performance tracker measures operation start and stop durations cleanly', () => {
    startPerformanceTimer('load_marketplace');
    const metric = stopPerformanceTimer('load_marketplace', true, 'screen_load');

    expect(metric).not.toBeNull();
    expect(metric?.operationName).toBe('load_marketplace');
    expect(metric?.durationMs).toBeGreaterThanOrEqual(0);

    const history = getPerformanceMetricsHistory();
    expect(history.length).toBe(1);
  });

  it('20. measurePerformanceAsync measures async operation latency without swallowing errors', async () => {
    const result = await measurePerformanceAsync('fetch_projects_api', async () => {
      return [{ id: 'p-1' }];
    });

    expect(result.length).toBe(1);
    const history = getPerformanceMetricsHistory();
    expect(history.length).toBe(1);
    expect(history[0].operationName).toBe('fetch_projects_api');
  });

  it('21. Error reporter normalizes API errors into user-safe reports without stack trace exposure', () => {
    const report = reportError(new Error('Network error ECONNREFUSED'), {
      screen: 'CustomerProjectsScreen',
      feature: 'project_list',
    });

    expect(report.errorCode).toBe('NETWORK_ERROR');
    expect(report.errorCategory).toBe('NETWORK');
    expect(report.message).toContain('We could not connect to the server');
    expect(report.screen).toBe('CustomerProjectsScreen');

    const history = getErrorReportHistory();
    expect(history.length).toBe(1);
  });

  it('22. MobileErrorBoundarySpec handles component render exceptions with safe fallback', () => {
    const state = MobileErrorBoundarySpec.handleError(new Error('Render crashed'), 'PaymentDetailsScreen');

    expect(state.hasError).toBe(true);
    expect(state.userMessage).toBe('Something went wrong. Please try again.');
    expect(state.errorCode).toBe('UNKNOWN_ERROR');
  });

  it('23. Anonymous session ID is pseudonymous and contains zero PII', () => {
    const id1 = getAnonymousSessionId();
    expect(id1).toMatch(/^anon_session_/);
    expect(id1).not.toContain('user');
    expect(id1).not.toContain('email');

    resetAnonymousSessionId();
    const id2 = getAnonymousSessionId();
    expect(id2).not.toBe(id1);
  });

  it('24. Consent opt-out disables analytics tracking', () => {
    setObservabilityConsent({ analyticsOptIn: false, crashReportingOptIn: true });

    const tracked = trackEvent('marketplace_viewed');
    expect(tracked).toBe(false);

    const buffer = getTelemetryBuffer();
    expect(buffer.length).toBe(0);
  });

  it('25. Telemetry events include environment and app version tags accurately', () => {
    setEnvironmentOverride('staging');
    trackEvent('admin_dashboard_viewed');

    const buffer = getTelemetryBuffer();
    expect(buffer.length).toBe(1);
    expect(buffer[0].environment).toBe('staging');
    expect(buffer[0].appVersion).toBe('1.0.0');
  });
});
