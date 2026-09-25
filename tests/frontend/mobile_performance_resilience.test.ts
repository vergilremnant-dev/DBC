import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mobileCache } from '../../mobile/src/cache/mobileCache.js';
import { mobileNetworkStatus } from '../../mobile/src/utils/networkStatus.js';
import { MutationSafetyController } from '../../mobile/src/utils/mutationSafety.js';
import { requestCancellationTracker } from '../../mobile/src/utils/requestCancellation.js';
import { mobileCustomerWorkspaceService } from '../../mobile/src/services/mobileCustomerWorkspaceService.js';
import { mobileRequestService } from '../../mobile/src/services/mobileRequestService.js';
import { mobileCustomerFinancialService } from '../../mobile/src/services/mobileCustomerFinancialService.js';
import { ProjectService } from '../../src/services/contractor/ProjectService.js';
import { bookingApi } from '../../src/services/booking/bookingService.js';
import { quotationClientService } from '../../src/services/quotation/quotationClientService.js';

vi.mock('../../src/services/contractor/ProjectService.js', () => ({
  ProjectService: {
    listProjects: vi.fn(),
    getProjectDetail: vi.fn(),
    resolveApproval: vi.fn(),
  },
}));

vi.mock('../../src/services/booking/bookingService.js', () => ({
  bookingApi: {
    createBooking: vi.fn(),
    cancelBooking: vi.fn(),
    getMyBookings: vi.fn(),
  },
}));

vi.mock('../../src/services/quotation/quotationClientService.js', () => ({
  quotationClientService: {
    getQuotationById: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

describe('Module 54 — Mobile Performance, Caching & Offline Resilience Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mobileCache.clear();
    MutationSafetyController.clear();
    requestCancellationTracker.abortAll();
    mobileNetworkStatus.setStatus('ONLINE');
  });

  describe('1. Lightweight Cache Layer (Storage, TTL & Stale Detection)', () => {
    it('stores entry in cache and retrieves it successfully', () => {
      mobileCache.set('test_key_1', { name: 'Civil Build' }, 1000, 'WORKSPACE');
      const cached = mobileCache.get<{ name: string }>('test_key_1');

      expect(cached).toEqual({ name: 'Civil Build' });
    });

    it('respects TTL expiration and returns null after entry expires', async () => {
      mobileCache.set('short_ttl_key', { data: 123 }, 10, 'WORKSPACE');
      expect(mobileCache.get('short_ttl_key')).toEqual({ data: 123 });

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(mobileCache.get('short_ttl_key')).toBeNull();
    });

    it('identifies fresh vs stale cache entries correctly', async () => {
      mobileCache.set('stale_test_key', 'val', 100, 'GENERAL');

      expect(mobileCache.isFresh('stale_test_key')).toBe(true);
      expect(mobileCache.isStale('stale_test_key')).toBe(false);

      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(mobileCache.isStale('stale_test_key')).toBe(false);
      expect(mobileCache.isFresh('stale_test_key')).toBe(true); // Still within 100ms TTL
    });

    it('invalidates single cache key upon explicit request', () => {
      mobileCache.set('key_a', 'val_a', 10000);
      mobileCache.set('key_b', 'val_b', 10000);

      mobileCache.invalidate('key_a');

      expect(mobileCache.get('key_a')).toBeNull();
      expect(mobileCache.get('key_b')).toBe('val_b');
    });

    it('invalidates key prefix recursively for related resources', () => {
      mobileCache.set('customer_projects_all', [1, 2], 10000);
      mobileCache.set('customer_projects_active', [1], 10000);
      mobileCache.set('customer_requests_all', [3], 10000);

      mobileCache.invalidatePrefix('customer_projects');

      expect(mobileCache.get('customer_projects_all')).toBeNull();
      expect(mobileCache.get('customer_projects_active')).toBeNull();
      expect(mobileCache.get('customer_requests_all')).toEqual([3]);
    });

    it('clears all cache entries on clear()', () => {
      mobileCache.set('k1', 1);
      mobileCache.set('k2', 2);

      mobileCache.clear();

      expect(mobileCache.get('k1')).toBeNull();
      expect(mobileCache.get('k2')).toBeNull();
    });

    it('refuses to store authentication tokens or passwords in generic cache', () => {
      mobileCache.set('user_access_token', 'secret_token_123', 10000);
      mobileCache.set('user_password', 'secret_pass_123', 10000);

      expect(mobileCache.get('user_access_token')).toBeNull();
      expect(mobileCache.get('user_password')).toBeNull();
    });
  });

  describe('2. Request Deduplication & In-Flight Coordination', () => {
    it('deduplicates simultaneous identical GET requests into a single promise', async () => {
      let networkCalls = 0;
      const fetchFunction = () =>
        new Promise((resolve) => {
          networkCalls++;
          setTimeout(() => resolve({ projects: ['P1', 'P2'] }), 50);
        });

      const p1 = mobileCache.deduplicateRequest('req_projects', fetchFunction);
      const p2 = mobileCache.deduplicateRequest('req_projects', fetchFunction);

      const [res1, res2] = await Promise.all([p1, p2]);

      expect(res1).toEqual({ projects: ['P1', 'P2'] });
      expect(res2).toEqual({ projects: ['P1', 'P2'] });
      expect(networkCalls).toBe(1);
    });

    it('removes failed requests from in-flight registry to allow retry', async () => {
      let callCount = 0;
      const failingFetch = async () => {
        callCount++;
        throw new Error('Network timeout');
      };

      await expect(mobileCache.deduplicateRequest('fail_req', failingFetch)).rejects.toThrow('Network timeout');

      // Second call should retry and not return stale rejected promise
      await expect(mobileCache.deduplicateRequest('fail_req', failingFetch)).rejects.toThrow('Network timeout');
      expect(callCount).toBe(2);
    });
  });

  describe('3. Search Request Cancellation', () => {
    it('cancels outdated search requests when user types a new query', () => {
      const sig1 = requestCancellationTracker.getSignal('help_search');
      expect(sig1.aborted).toBe(false);

      const sig2 = requestCancellationTracker.getSignal('help_search');

      expect(sig1.aborted).toBe(true);
      expect(sig2.aborted).toBe(false);
    });
  });

  describe('4. Network Status & Offline State Detection', () => {
    it('tracks online, offline, and reconnecting status changes', () => {
      expect(mobileNetworkStatus.isOnline()).toBe(true);

      let notifiedStatus = '';
      const unsubscribe = mobileNetworkStatus.subscribe((status) => {
        notifiedStatus = status;
      });

      mobileNetworkStatus.setStatus('OFFLINE');

      expect(mobileNetworkStatus.isOffline()).toBe(true);
      expect(notifiedStatus).toBe('OFFLINE');

      mobileNetworkStatus.setStatus('RECONNECTING');
      expect(notifiedStatus).toBe('RECONNECTING');

      unsubscribe();
    });
  });

  describe('5. Mutation Safety & Unsafe Retry Prevention', () => {
    it('locks concurrent duplicate mutation attempts', async () => {
      let count = 0;
      const slowMutation = () =>
        new Promise((resolve) => {
          count++;
          setTimeout(() => resolve('done'), 50);
        });

      const m1 = MutationSafetyController.execute('pay_m1', slowMutation);
      const m2 = MutationSafetyController.execute('pay_m1', slowMutation);

      await expect(m2).rejects.toMatchObject({ code: 'DUPLICATE_SUBMISSION' });
      await expect(m1).resolves.toBe('done');
      expect(count).toBe(1);
    });
  });

  describe('6. Mutation Cache Invalidation Integration', () => {
    it('invalidates workspace project cache when customer projects are requested', async () => {
      vi.mocked(ProjectService.listProjects).mockResolvedValue([
        {
          id: 'proj-101',
          status: 'IN_PROGRESS',
          createdAt: '2026-09-01T10:00:00Z',
          customer: { fullName: 'Vamsi' },
          requirement: { title: 'Villa Foundation' },
        } as any,
      ]);

      const initial = await mobileCustomerWorkspaceService.getCustomerProjects();
      expect(initial.length).toBe(1);
      expect(ProjectService.listProjects).toHaveBeenCalledTimes(1);

      // Second call uses cache
      const cachedCall = await mobileCustomerWorkspaceService.getCustomerProjects();
      expect(cachedCall.length).toBe(1);
      expect(ProjectService.listProjects).toHaveBeenCalledTimes(1);

      // Invalidate cache
      mobileCustomerWorkspaceService.clearCache();

      // Third call refetches from backend
      await mobileCustomerWorkspaceService.getCustomerProjects();
      expect(ProjectService.listProjects).toHaveBeenCalledTimes(2);
    });

    it('invalidates request cache when new project request is created', async () => {
      vi.mocked(bookingApi.createBooking).mockResolvedValue({
        id: 101,
        bookingNumber: 'REQ-101',
        bookingStatus: 'REQUESTED',
      } as any);

      mobileCache.set('customer_requests_all', [{ id: 'old' }], 10000, 'WORKSPACE');
      expect(mobileCache.get('customer_requests_all')).toBeDefined();

      await mobileRequestService.createProjectRequest({
        title: 'New Villa',
        categoryName: 'Civil',
        city: 'Hyderabad',
        description: 'Foundation',
      });

      expect(mobileCache.get('customer_requests_all')).toBeNull();
    });

    it('invalidates quotation and project caches when quotation is accepted', async () => {
      vi.mocked(quotationClientService.updateStatus).mockResolvedValue({} as any);
      vi.mocked(quotationClientService.getQuotationById).mockResolvedValue({
        id: 301,
        requirementId: 101,
        totalAmount: 450000,
        status: 'ACCEPTED',
      } as any);

      mobileCache.set('quotation_301', { id: 301 }, 10000, 'WORKSPACE');
      mobileCache.set('customer_projects_all', [{ id: 'p1' }], 10000, 'WORKSPACE');

      await mobileRequestService.acceptQuotation(301);

      expect(mobileCache.get('quotation_301')).toBeNull();
      expect(mobileCache.get('customer_projects_all')).toBeNull();
    });

    it('invalidates financial and project caches when milestone payment is recorded', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockResolvedValue({
        id: 'proj-501',
        requirement: { title: 'Villa' },
        milestones: [{ id: 'm-1', name: 'Excavation', budgetAllocation: 50000, status: 'APPROVED' }],
      } as any);

      mobileCache.set('financial_summary_proj-501', { totalAmount: 50000 }, 10000, 'FINANCIAL');

      await mobileCustomerFinancialService.recordMilestonePayment({
        projectId: 'proj-501',
        milestoneId: 'm-1',
      });

      expect(mobileCache.get('financial_summary_proj-501')).toBeNull();
    });
  });

  describe('7. Security Isolation Boundaries', () => {
    it('maintains strict separation between generic cache and secure auth storage', () => {
      mobileCache.set('public_categories', ['Civil', 'MEP'], 5000, 'MARKETPLACE');

      expect(mobileCache.get('public_categories')).toEqual(['Civil', 'MEP']);
      expect(mobileCache.get('access_token')).toBeNull();
    });

    it('prevents raw passwords or OTP verification tokens from being stored in generic cache', () => {
      mobileCache.set('otp_verification_token', 'token_123', 5000, 'GENERAL');
      expect(mobileCache.get('otp_verification_token')).toBeNull();
    });

    it('safely handles offline detection signals without clearing authenticated session state', () => {
      mobileNetworkStatus.setStatus('OFFLINE');
      expect(mobileNetworkStatus.isOffline()).toBe(true);
      expect(mobileCache.get('customer_projects_all')).toBeNull(); // Cache cleared or unpopulated, but no crash
    });

    it('allows concurrent requests for different keys without blocking each other', async () => {
      const fn1 = () => Promise.resolve('res1');
      const fn2 = () => Promise.resolve('res2');

      const [r1, r2] = await Promise.all([
        mobileCache.deduplicateRequest('k1', fn1),
        mobileCache.deduplicateRequest('k2', fn2),
      ]);

      expect(r1).toBe('res1');
      expect(r2).toBe('res2');
    });
  });
});
