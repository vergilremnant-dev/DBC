import type { RootStackParamList } from '../navigation/rootNavigation';

export type MobileNotificationType =
  // Customer events
  | 'QUOTATION_AVAILABLE'
  | 'QUOTATION_STATUS_CHANGED'
  | 'PROJECT_MILESTONE_UPDATED'
  | 'PAYMENT_STATUS_CHANGED'
  | 'MESSAGE_RECEIVED'
  | 'PROJECT_COMPLETION_REQUIRED'
  | 'SYSTEM_ANNOUNCEMENT'
  // Professional events
  | 'NEW_PROJECT_REQUEST'
  | 'CUSTOMER_MESSAGE'
  | 'QUOTATION_RESPONSE'
  | 'PROJECT_MILESTONE_ACTION'
  | 'PAYMENT_EARNING_UPDATE'
  | 'COMPLETION_ACTION'
  // Admin events
  | 'USER_REVIEW_REQUIRED'
  | 'PROJECT_OPERATION_REQUIRED'
  | 'PROVIDER_VERIFICATION_REQUIRED';

export type MobileNotificationPriority = 'High' | 'Medium' | 'Low';
export type MobileNotificationStatus = 'READ' | 'UNREAD' | 'ARCHIVED';

export interface MobileNotificationTarget {
  route: keyof RootStackParamList;
  params?: Record<string, any>;
  urlPath?: string;
  resourceType?: 'request' | 'quotation' | 'project' | 'milestone' | 'financials' | 'message' | 'user' | 'provider';
  resourceId?: string;
  allowedRoles?: Array<'customer' | 'contractor' | 'admin'>;
}

export interface MobileNotification {
  id: string;
  title: string;
  message: string;
  type: MobileNotificationType;
  category?: string;
  priority: MobileNotificationPriority;
  createdAt: string;
  isRead: boolean;
  target: MobileNotificationTarget;
  projectId?: string;
  requestId?: string;
  quotationId?: number | string;
  threadId?: string;
  userId?: string;
  providerId?: string;
  actionLabel?: string;
}

export interface MobilePushTokenRegistration {
  userId: string;
  token: string;
  platform: 'android' | 'ios' | 'web';
  provider: 'FCM' | 'APNS' | 'DEFERRED_WEB';
  updatedAt: string;
}
