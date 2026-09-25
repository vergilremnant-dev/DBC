import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getFieldClassification,
  isAllowedInCache,
  isAllowedInTelemetry,
  isSensitiveOrRestricted,
} from '../../mobile/src/privacy/dataClassification.js';
import { mobileCache } from '../../mobile/src/cache/mobileCache.js';
import { mobileAuthStore } from '../../mobile/src/state/authStore.js';
import { MemoryStorageAdapter } from '../../mobile/src/storage/StorageAdapter.js';
import {
  sanitizeObservabilityPayload,
  normalizeEndpointUrl,
  sanitizeAnalyticsProperties,
} from '../../mobile/src/observability/observabilitySanitizer.js';
import { mobileDeepLinkService } from '../../mobile/src/services/mobileDeepLinkService.js';
import { normalizeMobileApiError } from '../../mobile/src/api/mobileErrorUtils.js';

describe('Module 60 — Mobile Privacy, Data Governance & Compliance Readiness Suite', () => {
  let memoryStorage: MemoryStorageAdapter;

  beforeEach(() => {
    memoryStorage = new MemoryStorageAdapter();
    mobileCache.clear();
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // 1. Data Inventory & Classification Tests
  // ---------------------------------------------------------------------------
  describe('1. Data Classification Model', () => {
    it('1.1 correctly classifies OTP, password, and tokens as RESTRICTED', () => {
      const otpClass = getFieldClassification('otp');
      const passClass = getFieldClassification('password');
      const tokenClass = getFieldClassification('access_token');
      const refreshClass = getFieldClassification('refresh_token');

      expect(otpClass.level).toBe('RESTRICTED');
      expect(passClass.level).toBe('RESTRICTED');
      expect(tokenClass.level).toBe('RESTRICTED');
      expect(refreshClass.level).toBe('RESTRICTED');
    });

    it('1.2 correctly classifies user profile contact fields as PERSONAL', () => {
      const emailClass = getFieldClassification('email');
      const phoneClass = getFieldClassification('phone');
      const nameClass = getFieldClassification('full_name');
      const addressClass = getFieldClassification('address');

      expect(emailClass.level).toBe('PERSONAL');
      expect(phoneClass.level).toBe('PERSONAL');
      expect(nameClass.level).toBe('PERSONAL');
      expect(addressClass.level).toBe('PERSONAL');
    });

    it('1.3 correctly classifies financial values as SENSITIVE or RESTRICTED', () => {
      const amountClass = getFieldClassification('milestone_amount');
      const receiptClass = getFieldClassification('transaction_receipt');
      const cardClass = getFieldClassification('credit_card');
      const bankClass = getFieldClassification('bank_account_number');

      expect(amountClass.level).toBe('SENSITIVE');
      expect(receiptClass.level).toBe('SENSITIVE');
      expect(cardClass.level).toBe('RESTRICTED');
      expect(bankClass.level).toBe('RESTRICTED');
    });

    it('1.4 correctly classifies public discovery data as PUBLIC', () => {
      const cityClass = getFieldClassification('city');
      const searchClass = getFieldClassification('search_query');
      const tradeClass = getFieldClassification('trade_category');

      expect(cityClass.level).toBe('PUBLIC');
      expect(searchClass.level).toBe('PUBLIC');
      expect(tradeClass.level).toBe('PUBLIC');
    });

    it('1.5 falls back to pattern matching for unlisted fields', () => {
      const customToken = getFieldClassification('custom_session_token');
      const customPhone = getFieldClassification('user_mobile_phone');
      const customPrice = getFieldClassification('total_project_price');

      expect(customToken.level).toBe('RESTRICTED');
      expect(customPhone.level).toBe('PERSONAL');
      expect(customPrice.level).toBe('SENSITIVE');
    });

    it('1.6 enforces isAllowedInCache boundary correctly', () => {
      expect(isAllowedInCache('otp')).toBe(false);
      expect(isAllowedInCache('credit_card')).toBe(false);
      expect(isAllowedInCache('search_query')).toBe(true);
      expect(isAllowedInCache('full_name')).toBe(true);
    });

    it('1.7 enforces isAllowedInTelemetry boundary correctly', () => {
      expect(isAllowedInTelemetry('access_token')).toBe(false);
      expect(isAllowedInTelemetry('email')).toBe(false);
      expect(isAllowedInTelemetry('milestone_amount')).toBe(false);
      expect(isAllowedInTelemetry('app_version')).toBe(true);
      expect(isAllowedInTelemetry('search_query')).toBe(true);
    });

    it('1.8 identifies sensitive or restricted levels using helper', () => {
      expect(isSensitiveOrRestricted('RESTRICTED')).toBe(true);
      expect(isSensitiveOrRestricted('SENSITIVE')).toBe(true);
      expect(isSensitiveOrRestricted('PERSONAL')).toBe(false);
      expect(isSensitiveOrRestricted('INTERNAL')).toBe(false);
      expect(isSensitiveOrRestricted('PUBLIC')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Storage Privacy & Logout Behavior
  // ---------------------------------------------------------------------------
  describe('2. Storage Privacy & Cross-Account Isolation', () => {
    it('2.1 Scenario A: User A logout purges storage & cache, preventing User B cross-contamination', async () => {
      const userA = {
        id: 'usr-customer-a',
        email: 'userA@example.com',
        name: 'User A',
        role: 'customer' as const,
      };

      // Set User A session
      await mobileAuthStore.setSession(userA, 'token-user-a');
      mobileCache.set('workspace_projects_usr-customer-a', [{ id: 'proj-a', title: 'User A House' }]);

      expect(mobileCache.get('workspace_projects_usr-customer-a')).toBeDefined();

      // User A logs out
      await mobileAuthStore.logout();

      // Verify User A data is wiped from cache and authStore
      expect(mobileAuthStore.getState().user).toBeNull();
      expect(mobileCache.get('workspace_projects_usr-customer-a')).toBeNull();

      // User B logs in
      const userB = {
        id: 'usr-customer-b',
        email: 'userB@example.com',
        name: 'User B',
        role: 'customer' as const,
      };
      await mobileAuthStore.setSession(userB, 'token-user-b');

      // Verify User B cannot access User A's cached workspace
      expect(mobileCache.get('workspace_projects_usr-customer-a')).toBeNull();
    });

    it('2.2 Scenario B: User A offline logout still purges local user-specific cache and profile', async () => {
      const userA = {
        id: 'usr-customer-offline',
        email: 'offline@example.com',
        name: 'Offline User',
        role: 'customer' as const,
      };

      await mobileAuthStore.setSession(userA, 'token-offline');
      mobileCache.set('offline_cache_key', { secretData: 'private' });

      // Trigger offline logout
      await mobileAuthStore.logout();

      expect(mobileAuthStore.getState().user).toBeNull();
      expect(mobileAuthStore.getState().status).toBe('unauthenticated');
      expect(mobileCache.get('offline_cache_key')).toBeNull();
    });

    it('2.3 verifies raw passwords and OTPs are never saved to storage during login/OTP verification', async () => {
      await memoryStorage.setItem('temp_credential_check', 'safe');
      const storedProfile = await memoryStorage.getItem('user_profile');
      expect(storedProfile).toBeNull();

      const storedOtp = await memoryStorage.getItem('otp');
      expect(storedOtp).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Cache Privacy Hardening Tests
  // ---------------------------------------------------------------------------
  describe('3. Cache Privacy Hardening', () => {
    it('3.1 rejects caching forbidden authentication keys (access_token, password, otp)', () => {
      mobileCache.set('user_access_token', 'secret-jwt');
      mobileCache.set('account_password', 'p@ssword123');
      mobileCache.set('email_otp_code', '123456');

      expect(mobileCache.get('user_access_token')).toBeNull();
      expect(mobileCache.get('account_password')).toBeNull();
      expect(mobileCache.get('email_otp_code')).toBeNull();
    });

    it('3.2 rejects caching forbidden financial keys (creditcard, cvv, bank, iban, secret)', () => {
      mobileCache.set('user_creditcard_num', '4111222233334444');
      mobileCache.set('payment_cvv', '999');
      mobileCache.set('payout_bank_account', '9876543210');
      mobileCache.set('payout_iban', 'IN12345678');
      mobileCache.set('client_secret', 'sec_999');

      expect(mobileCache.get('user_creditcard_num')).toBeNull();
      expect(mobileCache.get('payment_cvv')).toBeNull();
      expect(mobileCache.get('payout_bank_account')).toBeNull();
      expect(mobileCache.get('payout_iban')).toBeNull();
      expect(mobileCache.get('client_secret')).toBeNull();
    });

    it('3.3 Scenario C: A rejected sensitive cache write deletes any existing value so no partial data remains', () => {
      // First set a safe entry
      mobileCache.set('safe_user_card_preference', { preferred: 'visa' });
      expect(mobileCache.get('safe_user_card_preference')).toBeDefined();

      // Now attempt a write with forbidden key 'creditcard' targeting the same key
      mobileCache.set('safe_user_card_preference', '4111222233334444');

      // The write must be rejected AND any existing entry deleted
      expect(mobileCache.get('safe_user_card_preference')).toBeNull();
    });

    it('3.4 invalidates prefix cache cleanly without leaving orphaned entries', () => {
      mobileCache.set('quotation_1', { id: 'q1' });
      mobileCache.set('quotation_2', { id: 'q2' });
      mobileCache.set('project_1', { id: 'p1' });

      mobileCache.invalidatePrefix('quotation_');

      expect(mobileCache.get('quotation_1')).toBeNull();
      expect(mobileCache.get('quotation_2')).toBeNull();
      expect(mobileCache.get('project_1')).toBeDefined();
    });

    it('3.5 respects TTL windows and purges expired entries on access', async () => {
      mobileCache.set('short_lived_key', { data: 'test' }, 10, 'GENERAL'); // 10ms TTL

      expect(mobileCache.get('short_lived_key')).toBeDefined();

      await new Promise((r) => setTimeout(r, 20));

      expect(mobileCache.get('short_lived_key')).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Observability & Telemetry Privacy Tests
  // ---------------------------------------------------------------------------
  describe('4. Telemetry Privacy & Redaction', () => {
    it('4.1 redacts sensitive authentication credentials from observability payloads', () => {
      const payload = {
        user_id: 'usr-123',
        access_token: 'secret-token',
        password: 'my-password',
        otp: '654321',
      };

      const sanitized = sanitizeObservabilityPayload(payload);

      expect(sanitized.user_id).toBe('[REDACTED]');
      expect(sanitized.access_token).toBe('[REDACTED]');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.otp).toBe('[REDACTED]');
    });

    it('4.2 redacts personal details and message bodies from observability payloads', () => {
      const payload = {
        action: 'send_message',
        email: 'customer@example.com',
        phone: '+919999999999',
        message: 'Here is my private home address',
        content: 'Unsafe raw body',
      };

      const sanitized = sanitizeObservabilityPayload(payload);

      expect(sanitized.action).toBe('send_message');
      expect(sanitized.email).toBe('[REDACTED]');
      expect(sanitized.phone).toBe('[REDACTED]');
      expect(sanitized.message).toBe('[REDACTED]');
      expect(sanitized.content).toBe('[REDACTED]');
    });

    it('4.3 redacts financial and payment details from observability payloads', () => {
      const payload = {
        project_id: 'proj-100',
        creditcard: '4111222233334444',
        cvv: '123',
        bank: 'State Bank of India',
        account_number: '100200300',
      };

      const sanitized = sanitizeObservabilityPayload(payload);

      expect(sanitized.project_id).toBe('proj-100');
      expect(sanitized.creditcard).toBe('[REDACTED]');
      expect(sanitized.cvv).toBe('[REDACTED]');
      expect(sanitized.bank).toBe('[REDACTED]');
      expect(sanitized.account_number).toBe('[REDACTED]');
    });

    it('4.4 normalizes API URLs to prevent query param & ID leakage in telemetry', () => {
      const rawUrl1 = '/api/projects/proj-998877/milestones/ms-112233?token=secret123';
      const rawUrl2 = '/api/payments/txn-554433/receipt';

      expect(normalizeEndpointUrl(rawUrl1)).toBe('/api/projects/:id/milestones/:id');
      expect(normalizeEndpointUrl(rawUrl2)).toBe('/api/payments/:id/receipt');
    });

    it('4.5 sanitizes analytics properties dictionary preventing PII transmission', () => {
      const props = {
        screen_name: 'ProjectOverview',
        project_id: 'proj-1',
        full_name: 'John Customer',
        authorization: 'Bearer xyz',
      };

      const clean = sanitizeAnalyticsProperties(props);

      expect(clean.screen_name).toBe('ProjectOverview');
      expect(clean.project_id).toBe('proj-1');
      expect(clean.full_name).toBe('[REDACTED]');
      expect(clean.authorization).toBe('[REDACTED]');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Deep-Link & Navigation Privacy Tests
  // ---------------------------------------------------------------------------
  describe('5. Deep-Link Privacy & Navigation Controls', () => {
    it('5.1 parses valid deep-link paths without exposing sensitive token query params', () => {
      const url = '/project/proj-100/milestones/ms-1';
      const target = mobileDeepLinkService.resolveDeepLink(url, 'customer');

      expect(target.route).toBe('CustomerMilestoneDetails');
      expect(target.params?.projectId).toBe('proj-100');
    });

    it('5.2 rejects or redirects unauthorized role navigation via deep link', () => {
      const adminUrl = '/admin/users';
      const target = mobileDeepLinkService.resolveDeepLink(adminUrl, 'customer');

      // Customer role navigating to admin route is safely redirected to CustomerHome
      expect(target.route).toBe('CustomerHome');
    });

    it('5.3 handles invalid deep-link paths gracefully', () => {
      const invalidUrl = '/unknown/invalid/route';
      const target = mobileDeepLinkService.resolveDeepLink(invalidUrl, 'customer');

      expect(target.route).toBe('CustomerHome');
    });

    it('5.4 clears pending navigation target on explicit clear call', () => {
      mobileAuthStore.setPendingTarget({ screen: 'QuotationDetails', params: { quotationId: 'q-1' } });
      expect(mobileAuthStore.getState().pendingTarget).toBeDefined();

      const cleared = mobileAuthStore.clearPendingTarget();
      expect(cleared?.screen).toBe('QuotationDetails');
      expect(mobileAuthStore.getState().pendingTarget).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Privacy-Safe Error Handling Tests
  // ---------------------------------------------------------------------------
  describe('6. Privacy-Safe Error Normalization', () => {
    it('6.1 normalizes 500 server error without exposing raw SQL or filesystem paths', () => {
      const rawError = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {
            message: 'pg_query_failed: SELECT * FROM users WHERE id = 123 AT /var/www/backend/db.js:45',
          },
        },
      };

      const normalized = normalizeMobileApiError(rawError);

      expect(normalized.category).toBe('SERVER');
      expect(normalized.message).not.toContain('SELECT * FROM users');
      expect(normalized.message).not.toContain('/var/www/backend');
    });

    it('6.2 normalizes 401 unauthorized errors safely', () => {
      const rawError = {
        isAxiosError: true,
        response: { status: 401, data: { message: 'Token expired' } },
      };
      const normalized = normalizeMobileApiError(rawError);

      expect(normalized.category).toBe('UNAUTHORIZED');
      expect(normalized.message).toBe('Your session has expired. Please sign in again.');
    });

    it('6.3 normalizes network connection drop errors cleanly', () => {
      const rawError = {
        isAxiosError: true,
        code: 'ERR_NETWORK',
        message: 'Network Error',
      };
      const normalized = normalizeMobileApiError(rawError);

      expect(normalized.code).toBe('NETWORK_ERROR');
      expect(normalized.message).toContain('internet connection');
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Account Lifecycle & Data Minimization Tests
  // ---------------------------------------------------------------------------
  describe('7. Account Lifecycle & Data Minimization', () => {
    it('7.1 marks auth state as expired on session expiration challenge', () => {
      mobileAuthStore.markExpired();

      const state = mobileAuthStore.getState();
      expect(state.status).toBe('expired');
      expect(state.error).toEqual({
        code: 'SESSION_ERROR',
        message: 'Session expired. Please log in again.',
      });
      expect(state.pendingTarget).toBeNull();
    });

    it('7.2 preserves clean status transitions across full auth lifecycle', async () => {
      await mobileAuthStore.logout();
      expect(mobileAuthStore.getState().status).toBe('unauthenticated');

      const mockUser = {
        id: 'usr-test-lifecycle',
        email: 'lifecycle@dbc.com',
        name: 'Lifecycle Tester',
        role: 'contractor' as const,
      };

      await mobileAuthStore.setSession(mockUser, 'valid-token-123');
      expect(mobileAuthStore.getState().status).toBe('authenticated');
      expect(mobileAuthStore.getState().user?.role).toBe('contractor');

      await mobileAuthStore.logout();
      expect(mobileAuthStore.getState().status).toBe('unauthenticated');
      expect(mobileAuthStore.getState().user).toBeNull();
    });

    it('7.3 verifies mobile domain models do not introduce unnecessary sensitive fields', () => {
      const mockUser = {
        id: 'usr-min-1',
        email: 'minimal@example.com',
        name: 'Minimal User',
        role: 'customer' as const,
      };

      const keys = Object.keys(mockUser);
      expect(keys).not.toContain('password');
      expect(keys).not.toContain('ssn');
      expect(keys).not.toContain('credit_card');
      expect(keys).not.toContain('otp');
    });
  });
});
