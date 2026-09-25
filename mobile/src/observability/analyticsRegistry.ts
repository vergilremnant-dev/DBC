/**
 * Analytics Registry & Event Taxonomy for DBC Mobile Application.
 * Authoritative taxonomy mapping allowed event names, allowed property keys,
 * and event validation rules.
 */

import { AllowedAnalyticsEvent } from './observabilityTypes';

export const ALLOWED_ANALYTICS_EVENTS: Record<AllowedAnalyticsEvent, { domain: string; description: string }> = {
  // Customer Events
  marketplace_viewed: { domain: 'customer', description: 'Customer opened marketplace home screen' },
  service_searched: { domain: 'customer', description: 'Customer searched marketplace categories or providers' },
  professional_viewed: { domain: 'customer', description: 'Customer viewed professional public profile' },
  project_request_started: { domain: 'customer', description: 'Customer initiated project request form' },
  project_request_submitted: { domain: 'customer', description: 'Customer submitted a new project request' },
  quotation_viewed: { domain: 'customer', description: 'Customer viewed quotation breakdown' },
  quotation_accepted: { domain: 'customer', description: 'Customer accepted contractor quotation' },
  quotation_rejected: { domain: 'customer', description: 'Customer rejected contractor quotation' },
  project_viewed: { domain: 'customer', description: 'Customer viewed active project workspace' },
  milestone_viewed: { domain: 'customer', description: 'Customer viewed milestone details' },
  payment_started: { domain: 'customer', description: 'Customer initiated milestone payment checkout' },
  payment_completed: { domain: 'customer', description: 'Customer successfully completed milestone payment' },
  message_sent: { domain: 'customer', description: 'Customer sent operational message to professional' },
  project_completion_confirmed: { domain: 'customer', description: 'Customer confirmed project completion' },

  // Professional Events
  professional_dashboard_viewed: { domain: 'professional', description: 'Trade partner opened workspace console' },
  request_viewed: { domain: 'professional', description: 'Trade partner viewed customer project request' },
  request_accepted: { domain: 'professional', description: 'Trade partner accepted project request' },
  request_declined: { domain: 'professional', description: 'Trade partner declined project request' },
  quotation_created: { domain: 'professional', description: 'Trade partner created proposal draft' },
  quotation_submitted: { domain: 'professional', description: 'Trade partner submitted formal quotation' },
  project_started: { domain: 'professional', description: 'Trade partner initiated project execution' },
  milestone_updated: { domain: 'professional', description: 'Trade partner updated milestone progress' },
  document_uploaded: { domain: 'professional', description: 'Trade partner uploaded project document' },

  // Admin Events
  admin_dashboard_viewed: { domain: 'admin', description: 'Admin opened operations console' },
  user_directory_viewed: { domain: 'admin', description: 'Admin viewed user management directory' },
  audit_log_viewed: { domain: 'admin', description: 'Admin viewed platform audit trail' },

  // Authentication Events
  login_started: { domain: 'system_auth', description: 'User initiated authentication attempt' },
  login_succeeded: { domain: 'system_auth', description: 'User successfully authenticated' },
  login_failed: { domain: 'system_auth', description: 'User authentication attempt failed' },
  otp_verification_failed: { domain: 'system_auth', description: 'OTP verification failed' },
  session_restored: { domain: 'system_auth', description: 'Auth session successfully restored' },
  session_expired: { domain: 'system_auth', description: 'Auth session expired' },
  logout: { domain: 'system_auth', description: 'User logged out of application' },

  // System / Network / Cache / Navigation Events
  network_offline: { domain: 'system', description: 'Network connectivity lost' },
  network_reconnected: { domain: 'system', description: 'Network connectivity restored' },
  api_timeout: { domain: 'system', description: 'API request timed out' },
  api_error: { domain: 'system', description: 'API request returned an error' },
  cache_hit: { domain: 'system', description: 'In-memory cache hit' },
  cache_miss: { domain: 'system', description: 'In-memory cache miss' },
  deep_link_received: { domain: 'system', description: 'Deep link route received' },
  deep_link_blocked: { domain: 'system', description: 'Deep link route blocked by guard' },
  notification_opened: { domain: 'system', description: 'User opened notification' },
};

/**
 * Checks if an event name is valid according to the taxonomy.
 */
export function isAllowedAnalyticsEvent(eventName: string): eventName is AllowedAnalyticsEvent {
  return eventName in ALLOWED_ANALYTICS_EVENTS;
}
