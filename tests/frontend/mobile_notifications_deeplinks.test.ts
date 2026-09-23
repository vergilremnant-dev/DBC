import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mobileNotificationService } from '../../mobile/src/services/mobileNotificationService.js';
import { mobileDeepLinkService } from '../../mobile/src/services/mobileDeepLinkService.js';
import { mobilePushTokenService } from '../../mobile/src/services/mobilePushTokenService.js';
import { mobileAuthStore } from '../../mobile/src/state/authStore.js';
import {
  NotificationsScreenController,
  renderNotificationsScreen,
} from '../../mobile/src/screens/notifications/NotificationsScreen.js';
import { notificationApi } from '../../src/services/notification/notificationService.js';
import type { MobileNotification } from '../../mobile/src/types/mobileNotificationTypes.js';

vi.mock('../../src/services/notification/notificationService.js', () => ({
  notificationApi: {
    getNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    getUnreadCount: vi.fn(),
  },
}));

describe('Module 46 — Mobile Notifications, Deep Links & Event Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Mobile Notification Service Adaptations', () => {
    it('fetches notifications mapped to structured MobileNotification models', async () => {
      vi.mocked(notificationApi.getNotifications).mockReturnValue([
        {
          id: 'n1',
          title: 'New Bid Proposals Available',
          content: '3 new contractor bids available for your plumbing request.',
          createdAt: '5 mins ago',
          isRead: false,
          category: 'Requirements',
          priority: 'High',
        },
        {
          id: 'n2',
          title: 'Invoice Payment Success',
          content: '₹1,500 booking fee processed.',
          createdAt: '2 days ago',
          isRead: true,
          category: 'Payments',
          priority: 'Low',
        },
      ]);

      const list = await mobileNotificationService.getNotifications('customer');
      expect(list.length).toBe(2);
      expect(list[0].id).toBe('n1');
      expect(list[0].type).toBe('QUOTATION_AVAILABLE');
      expect(list[0].target.route).toBe('QuotationDetails');
      expect(list[1].type).toBe('PAYMENT_STATUS_CHANGED');
    });

    it('returns unread notification count', async () => {
      vi.mocked(notificationApi.getUnreadCount).mockReturnValue(3);

      const unread = await mobileNotificationService.getUnreadCount('customer');
      expect(unread).toBe(3);
    });

    it('marks individual and all notifications as read', async () => {
      await mobileNotificationService.markNotificationRead('n1', 'customer');
      expect(notificationApi.markAsRead).toHaveBeenCalledWith('n1');

      await mobileNotificationService.markAllNotificationsRead('customer');
      expect(notificationApi.markAllAsRead).toHaveBeenCalled();
    });

    it('handles authentication and authorization service errors', async () => {
      vi.mocked(notificationApi.getNotifications).mockImplementation(() => {
        throw new Error('401 Unauthorized Session Expired');
      });

      await expect(mobileNotificationService.getNotifications('customer')).rejects.toThrow(
        'UNAUTHORIZED_EXPIRED_SESSION'
      );
    });
  });

  describe('2. Centralized Deep-Link & Event Resolver', () => {
    it('resolves valid customer project and milestone paths', () => {
      const projTarget = mobileDeepLinkService.resolveDeepLink('/project/proj-101', 'customer');
      expect(projTarget.route).toBe('CustomerProjectWorkspace');
      expect(projTarget.params?.projectId).toBe('proj-101');

      const milestoneTarget = mobileDeepLinkService.resolveDeepLink(
        '/project/proj-101/milestones/m-202',
        'customer'
      );
      expect(milestoneTarget.route).toBe('CustomerMilestoneDetails');
      expect(milestoneTarget.params?.milestoneId).toBe('m-202');

      const finTarget = mobileDeepLinkService.resolveDeepLink('/project/proj-101/financials', 'customer');
      expect(finTarget.route).toBe('CustomerProjectFinancials');
    });

    it('resolves valid contractor project and financial paths', () => {
      const projTarget = mobileDeepLinkService.resolveDeepLink('/project/proj-101', 'contractor');
      expect(projTarget.route).toBe('ProfessionalProjectWorkspace');

      const finTarget = mobileDeepLinkService.resolveDeepLink('/project/proj-101/financials', 'contractor');
      expect(finTarget.route).toBe('ProfessionalProjectFinancials');
    });

    it('resolves request, quotation, and conversation paths', () => {
      const reqTarget = mobileDeepLinkService.resolveDeepLink('/request/req-505', 'customer');
      expect(reqTarget.route).toBe('ProjectRequestDetails');

      const quoteTarget = mobileDeepLinkService.resolveDeepLink('/quotation/808', 'customer');
      expect(quoteTarget.route).toBe('QuotationDetails');
      expect(quoteTarget.params?.quotationId).toBe(808);

      const msgTarget = mobileDeepLinkService.resolveDeepLink('/messages/thread-99', 'customer');
      expect(msgTarget.route).toBe('CustomerConversation');
    });

    it('resolves admin deep links correctly', () => {
      const adminUserTarget = mobileDeepLinkService.resolveDeepLink('/admin/users/u-101', 'admin');
      expect(adminUserTarget.route).toBe('AdminUserDetails');

      const adminProjTarget = mobileDeepLinkService.resolveDeepLink('/admin/projects', 'admin');
      expect(adminProjTarget.route).toBe('AdminProjects');
    });

    it('handles unknown paths with fallback to home for user role', () => {
      const fallbackTarget = mobileDeepLinkService.resolveDeepLink('/unknown/invalid/path', 'customer');
      expect(fallbackTarget.route).toBe('CustomerHome');
    });

    it('resolves notification payload targets directly', () => {
      const notif: MobileNotification = {
        id: 'n1',
        title: 'Milestone Update',
        message: 'Excavation stage completed.',
        type: 'PROJECT_MILESTONE_UPDATED',
        priority: 'High',
        createdAt: '1 hour ago',
        isRead: false,
        projectId: 'proj-777',
        target: { route: 'CustomerProjects' },
      };

      const resolved = mobileDeepLinkService.resolveNotificationTarget(notif, 'customer');
      expect(resolved.route).toBe('CustomerProjectWorkspace');
      expect(resolved.params?.projectId).toBe('proj-777');
    });
  });

  describe('3. Authentication Handoff & Role Authorization Guards', () => {
    it('redirects unauthenticated users to auth stack and stores pending target', () => {
      const unauthTarget = mobileDeepLinkService.resolveDeepLink('/project/proj-999', 'customer');

      const authState = {
        status: 'unauthenticated' as const,
        user: null,
        error: null,
        challengeState: 'IDLE' as const,
        pendingTarget: null,
      };

      const result = mobileDeepLinkService.evaluateTargetAccess(unauthTarget, authState);
      expect(result.canNavigate).toBe(false);
      expect(result.reason).toBe('UNAUTHENTICATED');
      expect(result.redirectedToAuth).toBe(true);

      const pending = mobileAuthStore.getState().pendingTarget;
      expect(pending?.route).toBe('CustomerProjectWorkspace');
      expect(pending?.params?.projectId).toBe('proj-999');
    });

    it('blocks role mismatch attempt without rendering sensitive data', () => {
      const adminOnlyTarget = mobileDeepLinkService.resolveDeepLink('/admin/users/u-101', 'admin');

      const customerAuthState = {
        status: 'authenticated' as const,
        user: { id: 'u-cust', email: 'cust@dbc.in', name: 'Customer User', role: 'customer' as const },
        error: null,
        challengeState: 'AUTHENTICATED' as const,
        pendingTarget: null,
      };

      const result = mobileDeepLinkService.evaluateTargetAccess(adminOnlyTarget, customerAuthState);
      expect(result.canNavigate).toBe(false);
      expect(result.reason).toBe('UNAUTHORIZED_ROLE_MISMATCH');
      expect(result.fallbackRoute).toBe('CustomerHome');
    });

    it('allows valid authenticated user navigation', () => {
      const customerTarget = mobileDeepLinkService.resolveDeepLink('/project/proj-101', 'customer');

      const authState = {
        status: 'authenticated' as const,
        user: { id: 'u-cust', email: 'cust@dbc.in', name: 'Customer User', role: 'customer' as const },
        error: null,
        challengeState: 'AUTHENTICATED' as const,
        pendingTarget: null,
      };

      const result = mobileDeepLinkService.evaluateTargetAccess(customerTarget, authState);
      expect(result.canNavigate).toBe(true);
      expect(result.target?.route).toBe('CustomerProjectWorkspace');
    });
  });

  describe('4. Push Token Architecture & Deferred Provider Boundary', () => {
    it('registers push token through deferred provider boundary when native SDK is unavailable', async () => {
      const reg = await mobilePushTokenService.registerPushToken('user-101', 'customer');

      expect(reg.userId).toBe('user-101');
      expect(reg.provider).toBe('DEFERRED_WEB');
      expect(reg.token).toContain('user-101');
    });

    it('allows unregistering push token on logout', async () => {
      await expect(mobilePushTokenService.unregisterPushToken('user-101')).resolves.not.toThrow();
    });
  });

  describe('5. NotificationsScreen Controller & HTML Renderer', () => {
    it('initializes and renders NotificationsScreen with list items', async () => {
      vi.mocked(notificationApi.getNotifications).mockReturnValue([
        {
          id: 'n1',
          title: 'Quotation Accepted',
          content: 'Customer accepted raft foundation proposal.',
          createdAt: '10 mins ago',
          isRead: false,
          category: 'Bookings',
          priority: 'High',
        },
      ]);

      const controller = new NotificationsScreenController({ userRole: 'contractor' });
      await controller.init();

      const html = renderNotificationsScreen(controller);
      expect(html).toContain('Notifications');
      expect(html).toContain('Quotation Accepted');
      expect(html).toContain('1 New');
    });

    it('filters notifications by category tabs', async () => {
      vi.mocked(notificationApi.getNotifications).mockReturnValue([
        { id: 'n1', title: 'Quotation Accepted', category: 'Bookings', isRead: false },
        { id: 'n2', title: 'Payment Deposited', category: 'Payments', isRead: true },
      ]);

      const controller = new NotificationsScreenController({ userRole: 'contractor' });
      await controller.init();

      controller.setCategoryFilter('UNREAD');
      expect(controller.getFilteredNotifications().length).toBe(1);

      controller.setCategoryFilter('PAYMENTS');
      expect(controller.getFilteredNotifications().length).toBe(1);
    });

    it('marks all notifications as read', async () => {
      vi.mocked(notificationApi.getNotifications).mockReturnValue([
        { id: 'n1', title: 'Test 1', isRead: false },
      ]);

      const controller = new NotificationsScreenController({ userRole: 'customer' });
      await controller.init();

      await controller.markAllRead();
      expect(notificationApi.markAllAsRead).toHaveBeenCalled();
      expect(controller.getState().notifications[0].isRead).toBe(true);
    });

    it('renders empty state when no notifications match', async () => {
      vi.mocked(notificationApi.getNotifications).mockReturnValue([]);

      const controller = new NotificationsScreenController({ userRole: 'customer' });
      await controller.init();

      const html = renderNotificationsScreen(controller);
      expect(html).toContain("You're all caught up");
    });

    it('renders error state with retry button when loading fails', async () => {
      vi.mocked(notificationApi.getNotifications).mockImplementation(() => {
        throw new Error('Network timeout loading notifications');
      });

      const controller = new NotificationsScreenController({ userRole: 'customer' });
      await controller.init();

      const html = renderNotificationsScreen(controller);
      expect(html).toContain('Network timeout loading notifications');
      expect(html).toContain('Retry');
    });
  });
});
