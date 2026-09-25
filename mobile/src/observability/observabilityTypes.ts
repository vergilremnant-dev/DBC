/**
 * Observability, Analytics & Diagnostics Types for DBC Mobile Application.
 * Standardized interfaces for log levels, telemetry events, performance metrics,
 * error categories, and privacy-sanitized payloads.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type TelemetryEnvironment = 'development' | 'staging' | 'production';

export type ErrorCategory =
  | 'NETWORK'
  | 'TIMEOUT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'SERVER'
  | 'RUNTIME'
  | 'UNKNOWN';

export type AllowedAnalyticsEvent =
  // Customer Events
  | 'marketplace_viewed'
  | 'service_searched'
  | 'professional_viewed'
  | 'project_request_started'
  | 'project_request_submitted'
  | 'quotation_viewed'
  | 'quotation_accepted'
  | 'quotation_rejected'
  | 'project_viewed'
  | 'milestone_viewed'
  | 'payment_started'
  | 'payment_completed'
  | 'message_sent'
  | 'project_completion_confirmed'
  // Professional Events
  | 'professional_dashboard_viewed'
  | 'request_viewed'
  | 'request_accepted'
  | 'request_declined'
  | 'quotation_created'
  | 'quotation_submitted'
  | 'project_started'
  | 'milestone_updated'
  | 'document_uploaded'
  // Admin Events
  | 'admin_dashboard_viewed'
  | 'user_directory_viewed'
  | 'audit_log_viewed'
  // Authentication Events
  | 'login_started'
  | 'login_succeeded'
  | 'login_failed'
  | 'otp_verification_failed'
  | 'session_restored'
  | 'session_expired'
  | 'logout'
  // System / Network / Cache / Navigation Events
  | 'network_offline'
  | 'network_reconnected'
  | 'api_timeout'
  | 'api_error'
  | 'cache_hit'
  | 'cache_miss'
  | 'deep_link_received'
  | 'deep_link_blocked'
  | 'notification_opened';

export interface TelemetryEvent {
  eventName: AllowedAnalyticsEvent;
  category: string;
  properties: Record<string, string | number | boolean | null>;
  timestamp: string;
  environment: TelemetryEnvironment;
  appVersion: string;
  anonymousSessionId: string;
  screen?: string;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  category?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  environment: TelemetryEnvironment;
}

export interface PerformanceMetric {
  operationName: string;
  durationMs: number;
  success: boolean;
  category?: string;
  timestamp: string;
}

export interface ErrorReport {
  errorCode: string;
  errorCategory: ErrorCategory;
  httpStatus?: number;
  message: string;
  screen?: string;
  feature?: string;
  operation?: string;
  networkState?: 'ONLINE' | 'OFFLINE' | 'RECONNECTING';
  timestamp: string;
  environment: TelemetryEnvironment;
}

export interface ObservabilityConsentConfig {
  analyticsOptIn: boolean;
  crashReportingOptIn: boolean;
}
