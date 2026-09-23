export type MobileMessageSenderRole = 'CUSTOMER' | 'PRO' | 'SYSTEM';

export interface MobileAttachment {
  name: string;
  url: string;
  type?: 'IMAGE' | 'FILE';
}

export interface MobileConversationThread {
  id: string;
  providerId: string;
  providerName: string;
  providerRole?: string;
  avatar?: string;
  projectContextTitle: string;
  projectId?: string;
  bookingId?: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: boolean;
  unreadCount: number;
}

export interface MobileMessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: MobileMessageSenderRole;
  senderName: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  attachment?: MobileAttachment;
  isRead: boolean;
  timestamp: string;
  createdAt: string;
}

export interface MobileUnreadSummary {
  totalUnreadCount: number;
  hasUnread: boolean;
}
