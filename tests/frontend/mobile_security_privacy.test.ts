import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mobileAuthStore } from '../../mobile/src/state/authStore.js';
import { mobileAuthService } from '../../mobile/src/services/mobileAuthService.js';
import { mobileDeepLinkService } from '../../mobile/src/services/mobileDeepLinkService.js';
import { mobileProfileService } from '../../mobile/src/services/mobileProfileService.js';
import { mobileCustomerMessagingService } from '../../mobile/src/services/mobileCustomerMessagingService.js';
import { mobileCustomerFinancialService } from '../../mobile/src/services/mobileCustomerFinancialService.js';
import { mobileProfessionalFinanceService } from '../../mobile/src/services/mobileProfessionalFinanceService.js';
import { mobileAdminWorkspaceService } from '../../mobile/src/services/mobileAdminWorkspaceService.js';
import { sanitizeLogPayload, formatUserErrorMessage } from '../../mobile/src/api/mobileErrorUtils.js';
import { defaultStorageAdapter } from '../../mobile/src/storage/StorageAdapter.js';

describe('Module 53 — Mobile Security, Privacy & Sensitive Data Protection Audit', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mobileCustomerMessagingService.clearCache();
    mobileCustomerFinancialService.clearFinancialCache();
    mobileAdminWorkspaceService.clearCache();
    mobileProfileService.clearCache();
    mobileAuthStore.clearPendingTarget();
    await mobileAuthStore.logout();
  });

  describe('1. Authentication & Session Lifecycle Security', () => {
    it('blocks access to protected user profile when unauthenticated', async () => {
      await expect(mobileProfileService.getCurrentProfile()).rejects.toThrow('UNAUTHORIZED_EXPIRED_SESSION');
    });

    it('clears session tokens, user profile, and pending targets upon logout', async () => {
      await mobileAuthStore.setSession(
        { id: 'u-sec-101', email: 'user@example.com', name: 'Security Test', role: 'customer' },
        'token_secret_999'
      );
      mobileAuthStore.setPendingTarget({ route: 'CustomerProjectWorkspace', params: { projectId: 'p-1' } });

      expect(mobileAuthStore.getState().status).toBe('authenticated');
      expect(mobileAuthStore.getState().pendingTarget).not.toBeNull();

      await mobileProfileService.logout();

      expect(mobileAuthStore.getState().status).toBe('unauthenticated');
      expect(mobileAuthStore.getState().user).toBeNull();
      expect(mobileAuthStore.getState().pendingTarget).toBeNull();
      const savedToken = await defaultStorageAdapter.getItem('access_token');
      expect(savedToken).toBeNull();
    });

    it('prevents cross-session user data leakage when switching accounts', async () => {
      // User A session
      await mobileAuthStore.setSession(
        { id: 'u-user-A', email: 'userA@example.com', name: 'User A', role: 'customer' },
        'token_A'
      );
      const profileA = await mobileProfileService.getCurrentProfile();
      expect(profileA.email).toBe('userA@example.com');

      // Logout User A
      await mobileProfileService.logout();

      // User B session
      await mobileAuthStore.setSession(
        { id: 'u-user-B', email: 'userB@example.com', name: 'User B', role: 'customer' },
        'token_B'
      );
      const profileB = await mobileProfileService.getCurrentProfile();

      expect(profileB.email).toBe('userB@example.com');
      expect(profileB.email).not.toBe('userA@example.com');
    });
  });

  describe('2. Authorization Boundaries & Role Mismatch Protection', () => {
    it('prevents Customer role from evaluating or accessing Admin deep-link target', () => {
      const adminTarget = mobileDeepLinkService.resolveDeepLink('/admin/users/u-100', 'customer');

      const evaluation = mobileDeepLinkService.evaluateTargetAccess(adminTarget, {
        status: 'authenticated',
        user: { id: 'u-cust', email: 'cust@example.com', name: 'Customer User', role: 'customer' },
        error: null,
        challengeState: 'AUTHENTICATED',
        pendingTarget: null,
      });

      expect(evaluation.canNavigate).toBe(false);
      expect(evaluation.reason).toBe('UNAUTHORIZED_ROLE_MISMATCH');
      expect(evaluation.fallbackRoute).toBe('CustomerHome');
    });

    it('prevents Contractor role from evaluating or accessing Admin deep-link target', () => {
      const adminTarget = mobileDeepLinkService.resolveDeepLink('/admin/projects', 'contractor');

      const evaluation = mobileDeepLinkService.evaluateTargetAccess(adminTarget, {
        status: 'authenticated',
        user: { id: 'u-pro', email: 'pro@example.com', name: 'Contractor User', role: 'contractor' },
        error: null,
        challengeState: 'AUTHENTICATED',
        pendingTarget: null,
      });

      expect(evaluation.canNavigate).toBe(false);
      expect(evaluation.reason).toBe('UNAUTHORIZED_ROLE_MISMATCH');
      expect(evaluation.fallbackRoute).toBe('ProfessionalHome');
    });

    it('permits Admin role to access Admin deep-link targets', () => {
      const adminTarget = mobileDeepLinkService.resolveDeepLink('/admin/users/u-100', 'admin');

      const evaluation = mobileDeepLinkService.evaluateTargetAccess(adminTarget, {
        status: 'authenticated',
        user: { id: 'u-admin', email: 'admin@dbc.com', name: 'Admin User', role: 'admin' },
        error: null,
        challengeState: 'AUTHENTICATED',
        pendingTarget: null,
      });

      expect(evaluation.canNavigate).toBe(true);
      expect(evaluation.target?.route).toBe('AdminUserDetails');
    });
  });

  describe('3. Deep Link Target & Unauthenticated Guard', () => {
    it('stores pendingTarget securely when deep link is accessed unauthenticated', () => {
      const target = mobileDeepLinkService.resolveDeepLink('/project/proj-404/financials', 'customer');

      const evaluation = mobileDeepLinkService.evaluateTargetAccess(target, {
        status: 'unauthenticated',
        user: null,
        error: null,
        challengeState: 'IDLE',
        pendingTarget: null,
      });

      expect(evaluation.canNavigate).toBe(false);
      expect(evaluation.redirectedToAuth).toBe(true);
      expect(mobileAuthStore.getState().pendingTarget?.urlPath).toBe('/project/proj-404/financials');
    });
  });

  describe('4. Token Leakage & Log Payload Redaction', () => {
    it('redacts sensitive headers, tokens, passwords, and OTP codes from log payloads', () => {
      const logData = {
        authorization: 'Bearer secret_token_abc',
        password: 'SuperSecret123!',
        otp: '987654',
        access_token: 'acc_token_xyz',
        refresh_token: 'ref_token_xyz',
        userRole: 'customer',
      };

      const sanitized = sanitizeLogPayload(logData);

      expect(sanitized.authorization).toBe('[REDACTED]');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.otp).toBe('[REDACTED]');
      expect(sanitized.access_token).toBe('[REDACTED]');
      expect(sanitized.refresh_token).toBe('[REDACTED]');
      expect(sanitized.userRole).toBe('customer');
    });

    it('ensures user error messages never leak raw technical stack traces or Axios secrets', () => {
      const technicalErr = new Error('AxiosError: Request failed with status code 500 at https://api.dbc.com/login?token=secret123');
      const safeMsg = formatUserErrorMessage(technicalErr);

      expect(safeMsg).not.toContain('AxiosError');
      expect(safeMsg).not.toContain('secret123');
      expect(safeMsg).not.toContain('https://api.dbc.com');
      expect(safeMsg).toBe('An error occurred. Please try again.');
    });
  });

  describe('5. Financial & Payment Privacy', () => {
    it('masks destination bank account numbers in professional payout records', async () => {
      const payouts = await mobileProfessionalFinanceService.getProfessionalPayouts();
      expect(payouts.length).toBeGreaterThan(0);

      payouts.forEach((p) => {
        expect(p.destinationAccountMasked).toMatch(/\*\*\*\*\d{4}$/);
        expect(p.destinationAccountMasked).not.toMatch(/\d{9,18}/); // No raw account numbers
      });
    });
  });

  describe('6. Messaging & Input Sanitization', () => {
    it('sanitizes HTML special characters in message content to prevent XSS injection', async () => {
      const sent = await mobileCustomerMessagingService.sendMessage({
        threadId: 'thread-test-1',
        content: '<script>alert("xss")</script> & "quote"',
      });

      expect(sent.content).not.toContain('<script>');
      expect(sent.content).toContain('&lt;script&gt;');
      expect(sent.content).toContain('&quot;quote&quot;');
    });
  });
});
