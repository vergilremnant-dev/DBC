import { notificationApi } from '../../../src/services/notification/notificationService.js';
import type {
  MobileNotification,
  MobileNotificationType,
  MobileNotificationPriority,
  MobileNotificationTarget,
} from '../types/mobileNotificationTypes.js';

function mapAppNotificationToMobile(item: any, userRole: string = 'customer'): MobileNotification {
  const normRole = (userRole || 'customer').toLowerCase();

  let type: MobileNotificationType = 'SYSTEM_ANNOUNCEMENT';
  let target: MobileNotificationTarget = {
    route: normRole === 'contractor' ? 'ProfessionalHome' : normRole === 'admin' ? 'AdminHome' : 'CustomerHome',
    allowedRoles: ['customer', 'contractor', 'admin'],
  };

  const cat = (item.category || '').toLowerCase();
  const titleLower = (item.title || '').toLowerCase();
  const contentLower = (item.content || item.description || '').toLowerCase();

  if (normRole === 'contractor') {
    if (cat === 'bookings' || titleLower.includes('booking assigned') || titleLower.includes('request')) {
      type = 'NEW_PROJECT_REQUEST';
      target = {
        route: 'ProfessionalRequests',
        resourceType: 'request',
        resourceId: item.id || 'req-1',
        allowedRoles: ['contractor'],
      };
    } else if (cat === 'payments' || titleLower.includes('payout') || titleLower.includes('payment')) {
      type = 'PAYMENT_EARNING_UPDATE';
      target = {
        route: 'ProfessionalFinance',
        resourceType: 'financials',
        allowedRoles: ['contractor'],
      };
    } else if (cat === 'messages' || titleLower.includes('message')) {
      type = 'CUSTOMER_MESSAGE';
      target = {
        route: 'CustomerConversation',
        params: { threadId: 'thread-1' },
        resourceType: 'message',
        resourceId: 'thread-1',
        allowedRoles: ['contractor', 'customer'],
      };
    } else {
      type = 'PROJECT_MILESTONE_ACTION';
      target = {
        route: 'ProfessionalProjects',
        resourceType: 'project',
        allowedRoles: ['contractor'],
      };
    }
  } else if (normRole === 'admin') {
    if (titleLower.includes('provider') || titleLower.includes('verify')) {
      type = 'PROVIDER_VERIFICATION_REQUIRED';
      target = {
        route: 'AdminProfessionals',
        resourceType: 'provider',
        allowedRoles: ['admin'],
      };
    } else if (titleLower.includes('request') || titleLower.includes('callback')) {
      type = 'USER_REVIEW_REQUIRED';
      target = {
        route: 'AdminUsers',
        resourceType: 'user',
        allowedRoles: ['admin'],
      };
    } else {
      type = 'PROJECT_OPERATION_REQUIRED';
      target = {
        route: 'AdminProjects',
        resourceType: 'project',
        allowedRoles: ['admin'],
      };
    }
  } else {
    // Customer
    if (cat === 'requirements' || titleLower.includes('bid') || titleLower.includes('quotation')) {
      type = 'QUOTATION_AVAILABLE';
      target = {
        route: 'QuotationDetails',
        params: { quotationId: 101 },
        resourceType: 'quotation',
        resourceId: '101',
        allowedRoles: ['customer'],
      };
    } else if (cat === 'bookings' || titleLower.includes('booking')) {
      type = 'PROJECT_MILESTONE_UPDATED';
      target = {
        route: 'CustomerProjects',
        resourceType: 'project',
        allowedRoles: ['customer'],
      };
    } else if (cat === 'messages' || titleLower.includes('message')) {
      type = 'MESSAGE_RECEIVED';
      target = {
        route: 'CustomerMessages',
        params: { threadId: 'thread-101' },
        resourceType: 'message',
        resourceId: 'thread-101',
        allowedRoles: ['customer'],
      };
    } else if (cat === 'payments' || titleLower.includes('invoice') || titleLower.includes('payment')) {
      type = 'PAYMENT_STATUS_CHANGED';
      target = {
        route: 'CustomerPaymentHistory',
        params: { projectId: 'proj-101' },
        resourceType: 'financials',
        resourceId: 'proj-101',
        allowedRoles: ['customer'],
      };
    } else {
      type = 'SYSTEM_ANNOUNCEMENT';
      target = {
        route: 'CustomerHome',
        allowedRoles: ['customer'],
      };
    }
  }

  let priority: MobileNotificationPriority = 'Medium';
  if (item.priority === 'High' || item.priority === 'HIGH') priority = 'High';
  if (item.priority === 'Low' || item.priority === 'LOW') priority = 'Low';

  return {
    id: String(item.id),
    title: item.title || 'Platform Notification',
    message: item.content || item.description || '',
    type,
    category: item.category,
    priority,
    createdAt: item.createdAt || 'Just now',
    isRead: !!item.isRead,
    target,
    actionLabel: item.actionLabel || 'View Details',
  };
}

export const mobileNotificationService = {
  async getNotifications(userRole: string = 'customer'): Promise<MobileNotification[]> {
    try {
      const rawList = notificationApi.getNotifications(userRole);
      return rawList.map((item) => mapAppNotificationToMobile(item, userRole));
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error('UNAUTHORIZED_EXPIRED_SESSION');
      }
      if (error instanceof Error && error.message.includes('403')) {
        throw new Error('ACCESS_DENIED_ROLE_MISMATCH');
      }
      throw new Error(error instanceof Error ? error.message : 'Unable to load notifications');
    }
  },

  async getUnreadCount(userRole: string = 'customer'): Promise<number> {
    try {
      return notificationApi.getUnreadCount(userRole);
    } catch {
      return 0;
    }
  },

  async markNotificationRead(id: string, userRole: string = 'customer'): Promise<void> {
    try {
      notificationApi.markAsRead(id);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to mark notification as read');
    }
  },

  async markAllNotificationsRead(userRole: string = 'customer'): Promise<void> {
    try {
      notificationApi.markAllAsRead();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to mark all notifications as read');
    }
  },

  async markAllAsRead(userRole: string = 'customer'): Promise<void> {
    return this.markAllNotificationsRead(userRole);
  },
};
