import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { mobileApiClient } from '../../mobile/src/api/mobileApiClient.js';
import {
  normalizeMobileApiError,
  formatUserErrorMessage,
  sanitizeLogPayload,
  API_TIMEOUT_CONFIG,
} from '../../mobile/src/api/mobileErrorUtils.js';
import { MutationSafetyController } from '../../mobile/src/utils/mutationSafety.js';
import { requestCancellationTracker } from '../../mobile/src/utils/requestCancellation.js';
import {
  validateObjectShape,
  validateArrayShape,
  ResponseValidationError,
} from '../../mobile/src/utils/responseValidation.js';
import { mobileAuthStore } from '../../mobile/src/state/authStore.js';
import { axiosClient } from '../../src/services/auth/axiosClient.js';

describe('Module 52 — Mobile API Reliability, Error Handling & Network Resilience', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    MutationSafetyController.clear();
    requestCancellationTracker.abortAll();
    await mobileAuthStore.logout();
  });

  describe('1. Network Failure & Timeout Normalization', () => {
    it('normalizes GET network failure to NETWORK category with retryable=true', () => {
      const axiosError = new axios.AxiosError('Network Error', 'ERR_NETWORK', undefined, undefined, undefined);
      const normalized = normalizeMobileApiError(axiosError);

      expect(normalized.category).toBe('NETWORK');
      expect(normalized.code).toBe('NETWORK_ERROR');
      expect(normalized.status).toBe(0);
      expect(normalized.retryable).toBe(true);
      expect(normalized.message).toContain('connect to the server');
    });

    it('normalizes POST network failure cleanly without exposing raw Axios text', () => {
      const axiosError = new axios.AxiosError('connect ECONNREFUSED 127.0.0.1:80', 'ECONNREFUSED');
      const normalized = normalizeMobileApiError(axiosError);

      expect(normalized.category).toBe('NETWORK');
      expect(normalized.code).toBe('NETWORK_ERROR');
      expect(normalized.retryable).toBe(true);
      expect(formatUserErrorMessage(axiosError)).not.toContain('ECONNREFUSED');
    });

    it('normalizes request timeout to TIMEOUT category with retryable=true', () => {
      const timeoutError = new axios.AxiosError('timeout of 15000ms exceeded', 'ECONNABORTED');
      const normalized = normalizeMobileApiError(timeoutError);

      expect(normalized.category).toBe('TIMEOUT');
      expect(normalized.code).toBe('TIMEOUT_ERROR');
      expect(normalized.status).toBe(408);
      expect(normalized.retryable).toBe(true);
      expect(normalized.message).toContain('took too long');
    });

    it('defines standardized API timeout thresholds', () => {
      expect(API_TIMEOUT_CONFIG.defaultMs).toBe(15000);
      expect(API_TIMEOUT_CONFIG.paymentMs).toBe(30000);
      expect(API_TIMEOUT_CONFIG.uploadMs).toBe(60000);
    });
  });

  describe('2. HTTP Status Code Mapping (401, 403, 404, 409, 422, 500)', () => {
    it('maps 401 Unauthorized to UNAUTHORIZED_EXPIRED_SESSION (retryable=false)', () => {
      const err = new axios.AxiosError('Unauthorized', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 401,
        statusText: 'Unauthorized',
        data: { message: 'Token expired' },
        headers: {},
        config: {} as any,
      });
      const normalized = normalizeMobileApiError(err);

      expect(normalized.category).toBe('UNAUTHORIZED');
      expect(normalized.code).toBe('UNAUTHORIZED_EXPIRED_SESSION');
      expect(normalized.status).toBe(401);
      expect(normalized.retryable).toBe(false);
      expect(normalized.message).toContain('session has expired');
    });

    it('maps 403 Forbidden to ACCESS_DENIED (retryable=false)', () => {
      const err = new axios.AxiosError('Forbidden', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 403,
        statusText: 'Forbidden',
        data: { message: 'Role mismatch' },
        headers: {},
        config: {} as any,
      });
      const normalized = normalizeMobileApiError(err);

      expect(normalized.category).toBe('FORBIDDEN');
      expect(normalized.code).toBe('ACCESS_DENIED');
      expect(normalized.status).toBe(403);
      expect(normalized.retryable).toBe(false);
    });

    it('maps 404 Not Found to NOT_FOUND (retryable=false)', () => {
      const err = new axios.AxiosError('Not Found', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 404,
        statusText: 'Not Found',
        data: { message: 'Resource not found' },
        headers: {},
        config: {} as any,
      });
      const normalized = normalizeMobileApiError(err);

      expect(normalized.category).toBe('NOT_FOUND');
      expect(normalized.code).toBe('NOT_FOUND');
      expect(normalized.status).toBe(404);
      expect(normalized.retryable).toBe(false);
    });

    it('maps 409 Conflict to CONFLICT (retryable=false)', () => {
      const err = new axios.AxiosError('Conflict', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 409,
        statusText: 'Conflict',
        data: { message: 'Milestone already approved' },
        headers: {},
        config: {} as any,
      });
      const normalized = normalizeMobileApiError(err);

      expect(normalized.category).toBe('CONFLICT');
      expect(normalized.code).toBe('CONFLICT');
      expect(normalized.status).toBe(409);
      expect(normalized.retryable).toBe(false);
    });

    it('maps 422 Unprocessable Entity to VALIDATION with fieldErrors', () => {
      const err = new axios.AxiosError('Validation Error', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 422,
        statusText: 'Unprocessable Entity',
        data: {
          message: 'Invalid input fields',
          fieldErrors: { amount: 'Amount must be greater than zero' },
        },
        headers: {},
        config: {} as any,
      });
      const normalized = normalizeMobileApiError(err);

      expect(normalized.category).toBe('VALIDATION');
      expect(normalized.code).toBe('VALIDATION_ERROR');
      expect(normalized.status).toBe(422);
      expect(normalized.retryable).toBe(false);
      expect(normalized.fieldErrors?.amount).toBe('Amount must be greater than zero');
    });

    it('maps 500+ Server Error to SERVER (retryable=true)', () => {
      const err = new axios.AxiosError('Internal Server Error', 'ERR_BAD_RESPONSE', undefined, undefined, {
        status: 500,
        statusText: 'Internal Server Error',
        data: { message: 'Database error' },
        headers: {},
        config: {} as any,
      });
      const normalized = normalizeMobileApiError(err);

      expect(normalized.category).toBe('SERVER');
      expect(normalized.code).toBe('SERVER_ERROR');
      expect(normalized.status).toBe(500);
      expect(normalized.retryable).toBe(true);
      expect(normalized.message).not.toContain('Database error');
    });
  });

  describe('3. User Error Message Rules & Diagnostic Log Sanitization', () => {
    it('redacts technical stack traces and Axios internal strings from user messages', () => {
      const technicalErr = new Error('TypeError: Cannot read properties of undefined (reading "id") at Axios.request');
      const safeMessage = formatUserErrorMessage(technicalErr);

      expect(safeMessage).not.toContain('TypeError');
      expect(safeMessage).not.toContain('Axios.request');
      expect(safeMessage).toBe('An error occurred. Please try again.');
    });

    it('redacts sensitive headers, tokens, and passwords from diagnostic log payloads', () => {
      const rawLog = {
        authorization: 'Bearer token_secret_123',
        password: 'UserPass123!',
        otp: '654321',
        access_token: 'secret_acc_token',
        customerName: 'Vamsi Krishna',
      };
      const sanitized = sanitizeLogPayload(rawLog);

      expect(sanitized.authorization).toBe('[REDACTED]');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.otp).toBe('[REDACTED]');
      expect(sanitized.access_token).toBe('[REDACTED]');
      expect(sanitized.customerName).toBe('Vamsi Krishna');
    });
  });

  describe('4. Mutation Safety & Duplicate Submission Protection', () => {
    it('prevents concurrent duplicate submissions for the same mutation key', async () => {
      let executeCount = 0;
      const slowMutation = () =>
        new Promise((resolve) => {
          executeCount++;
          setTimeout(() => resolve({ success: true }), 100);
        });

      const call1 = MutationSafetyController.execute('submit_payment_m1', slowMutation);
      const call2 = MutationSafetyController.execute('submit_payment_m1', slowMutation);

      await expect(call2).rejects.toMatchObject({
        code: 'DUPLICATE_SUBMISSION',
        category: 'CONFLICT',
      });

      const res1 = await call1;
      expect(res1).toEqual({ success: true });
      expect(executeCount).toBe(1);
    });

    it('releases lock cleanly when mutation completes', async () => {
      const quickMutation = async () => 'done';

      await MutationSafetyController.execute('key1', quickMutation);
      expect(MutationSafetyController.isPending('key1')).toBe(false);

      const secondRun = await MutationSafetyController.execute('key1', quickMutation);
      expect(secondRun).toBe('done');
    });
  });

  describe('5. Request Cancellation & Search Race Condition Prevention', () => {
    it('aborts active pending search request when a new search request is started', () => {
      const signal1 = requestCancellationTracker.getSignal('marketplace_search');
      expect(signal1.aborted).toBe(false);

      const signal2 = requestCancellationTracker.getSignal('marketplace_search');
      expect(signal1.aborted).toBe(true);
      expect(signal2.aborted).toBe(false);
    });
  });

  describe('6. API Response Shape Validation', () => {
    it('validates required keys on backend object response', () => {
      const validProject = { id: 'proj-1', status: 'IN_PROGRESS', createdAt: '2026-09-24' };
      const validated = validateObjectShape(validProject, ['id', 'status'], 'Project');
      expect(validated).toBe(validProject);

      const malformedProject = { status: 'IN_PROGRESS' };
      expect(() => validateObjectShape(malformedProject, ['id', 'status'], 'Project')).toThrow(
        ResponseValidationError
      );
    });

    it('validates list payload shape and throws on non-array or malformed items', () => {
      const validList = [{ id: '1' }, { id: '2' }];
      expect(validateArrayShape(validList, ['id'], 'Items')).toHaveLength(2);

      expect(() => validateArrayShape('not an array', ['id'], 'Items')).toThrow(ResponseValidationError);
      expect(() => validateArrayShape([{ id: '1' }, { invalid: true }], ['id'], 'Items')).toThrow(
        ResponseValidationError
      );
    });
  });

  describe('7. Session Expiration & Auth Cleanup', () => {
    it('clears session state cleanly upon 401 session expiration without loop', async () => {
      await mobileAuthStore.setSession(
        { id: 'u-1', email: 'test@example.com', name: 'Test User', role: 'customer' },
        'token_expired'
      );
      expect(mobileAuthStore.getState().status).toBe('authenticated');

      await mobileAuthStore.logout();

      expect(mobileAuthStore.getState().status).toBe('unauthenticated');
      expect(mobileAuthStore.getState().user).toBeNull();
    });
  });
});
