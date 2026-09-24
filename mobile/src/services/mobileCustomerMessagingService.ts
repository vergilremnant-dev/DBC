import { chatApi } from '../../../src/services/chat/chatService.js';
import { ProjectService } from '../../../src/services/contractor/ProjectService.js';
import type { Conversation, Message } from '../../../src/types/chat/chatTypes.js';
import type {
  MobileConversationThread,
  MobileMessageItem,
  MobileMessageSenderRole,
} from '../types/customerMessagingMobileTypes.js';

// In-memory cache for fallback session conversations
const localMessageStore: Record<string, MobileMessageItem[]> = {};
const localThreadStore: Record<string, MobileConversationThread> = {};

function formatTimestamp(isoString: string | null): string {
  if (!isoString) return 'Just now';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Just now';
  }
}

function sanitizeText(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const mobileCustomerMessagingService = {
  async getCustomerThreads(): Promise<MobileConversationThread[]> {
    try {
      let conversations: Conversation[] = [];
      try {
        conversations = await chatApi.listConversations();
      } catch (err) {
        if (err instanceof Error && (err.message.includes('401') || err.message.includes('403') || err.message.includes('Access denied'))) {
          throw err;
        }
        // Fallback to local thread store for network errors
      }

      const threads: MobileConversationThread[] = conversations.map((c) => {
        const unreadCount = c.messages?.length || 0;
        const providerName = c.provider?.fullName || c.provider?.businessName || 'Contractor Partner';
        const projectContextTitle =
          c.consultationBooking?.consultationTopic ||
          (c.booking ? `Project #${c.booking.bookingNumber}` : 'Construction Consultation');

        return {
          id: c.id,
          providerId: c.providerId,
          providerName,
          providerRole: 'Lead Contractor',
          avatar: '🔨',
          projectContextTitle,
          bookingId: c.bookingId || undefined,
          lastMessage: c.lastMessage || 'Conversation started',
          lastMessageAt: formatTimestamp(c.lastMessageAt),
          unread: unreadCount > 0,
          unreadCount,
        };
      });

      // Merge local threads
      Object.values(localThreadStore).forEach((localT) => {
        if (!threads.some((t) => t.id === localT.id)) {
          threads.push(localT);
        }
      });

      return threads;
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error('UNAUTHORIZED_EXPIRED_SESSION');
      }
      if (error instanceof Error && (error.message.includes('403') || error.message.includes('Access denied'))) {
        throw new Error('ACCESS_DENIED_MESSAGING');
      }
      throw new Error(error instanceof Error ? error.message : 'Unable to load messaging threads');
    }
  },

  async getMessages(threadId: string): Promise<MobileMessageItem[]> {
    try {
      let rawMessages: Message[] = [];
      try {
        rawMessages = await chatApi.getMessages(threadId);
      } catch {
        // Fallback to local message store
      }

      const items: MobileMessageItem[] = rawMessages.map((m) => {
        const role: MobileMessageSenderRole = m.senderId.includes('cust') ? 'CUSTOMER' : 'PRO';
        return {
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          senderRole: role,
          senderName: role === 'CUSTOMER' ? 'You' : 'Contractor Partner',
          content: sanitizeText(m.content),
          messageType: m.messageType || 'TEXT',
          attachment: m.attachmentUrl ? { name: 'Attachment', url: m.attachmentUrl } : undefined,
          isRead: m.isRead,
          timestamp: formatTimestamp(m.createdAt),
          createdAt: m.createdAt,
        };
      });

      // Merge local message store
      const localMsgs = localMessageStore[threadId] || [];
      localMsgs.forEach((localM) => {
        if (!items.some((i) => i.id === localM.id)) {
          items.push(localM);
        }
      });

      return items;
    } catch (error) {
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('not found'))) {
        throw new Error('CONVERSATION_NOT_FOUND');
      }
      throw new Error(error instanceof Error ? error.message : 'Unable to load messages');
    }
  },

  async sendMessage(
    threadIdOrPayload: string | { threadId?: string; conversationId?: string; content: string; attachmentUrl?: string },
    contentParam?: string,
    attachmentUrlParam?: string
  ): Promise<MobileMessageItem> {
    let threadId: string;
    let messageContent: string;
    let attachmentUrl: string | undefined;

    if (typeof threadIdOrPayload === 'object' && threadIdOrPayload !== null) {
      threadId = threadIdOrPayload.threadId || threadIdOrPayload.conversationId || 'thread-proj-default';
      messageContent = threadIdOrPayload.content || '';
      attachmentUrl = threadIdOrPayload.attachmentUrl;
    } else {
      threadId = threadIdOrPayload;
      messageContent = contentParam || '';
      attachmentUrl = attachmentUrlParam;
    }

    const trimmed = messageContent.trim();
    if (!trimmed) {
      throw new Error('Message content cannot be empty');
    }

    const sanitized = sanitizeText(trimmed);
    const msgId = `msg-${Date.now()}`;
    const timestamp = formatTimestamp(new Date().toISOString());

    const newMessage: MobileMessageItem = {
      id: msgId,
      conversationId: threadId,
      senderId: 'cust-current',
      senderRole: 'CUSTOMER',
      senderName: 'You',
      content: sanitized,
      messageType: attachmentUrl ? 'IMAGE' : 'TEXT',
      attachment: attachmentUrl ? { name: 'Attachment File', url: attachmentUrl } : undefined,
      isRead: true,
      timestamp,
      createdAt: new Date().toISOString(),
    };

    try {
      await chatApi.sendMessage({
        conversationId: threadId,
        content: sanitized,
        messageType: attachmentUrl ? 'IMAGE' : 'TEXT',
        attachmentUrl,
      });
    } catch {
      // Local session store backup if backend endpoint offline
    }

    if (!localMessageStore[threadId]) {
      localMessageStore[threadId] = [];
    }
    localMessageStore[threadId].push(newMessage);

    // Update local thread lastMessage
    if (localThreadStore[threadId]) {
      localThreadStore[threadId].lastMessage = sanitized;
      localThreadStore[threadId].lastMessageAt = timestamp;
      localThreadStore[threadId].unread = false;
      localThreadStore[threadId].unreadCount = 0;
    }

    return newMessage;
  },

  async markThreadRead(threadId: string): Promise<void> {
    try {
      const messages = await this.getMessages(threadId);
      for (const m of messages) {
        if (!m.isRead && m.senderRole === 'PRO') {
          try {
            await chatApi.markMessageRead(m.id);
          } catch {
            // Local fallback
          }
          m.isRead = true;
        }
      }
    } catch {
      // Ignore
    }

    if (localThreadStore[threadId]) {
      localThreadStore[threadId].unread = false;
      localThreadStore[threadId].unreadCount = 0;
    }
  },

  async getUnreadCount(): Promise<number> {
    const threads = await this.getCustomerThreads();
    return threads.reduce((sum, t) => sum + (t.unread ? (t.unreadCount || 1) : 0), 0);
  },

  async getOrCreateConversationForProject(projectId: string): Promise<MobileConversationThread & { threadId: string }> {
    try {
      const project = await ProjectService.getProjectDetail(projectId);
      const threads = await this.getCustomerThreads();

      const existing = threads.find(
        (t) => t.projectId === projectId || (project.requirement && t.projectContextTitle.includes(project.requirement.title))
      );

      if (existing) {
        return { ...existing, threadId: existing.id };
      }

      // Create new thread for project
      const newThreadId = `thread-proj-${projectId}`;
      const newThread: MobileConversationThread = {
        id: newThreadId,
        providerId: project.providerId || 'prov-202',
        providerName: project.provider?.fullName || project.provider?.businessName || 'Contractor Partner',
        providerRole: 'Lead Contractor',
        avatar: '🏗️',
        projectContextTitle: project.requirement?.title || `Project #${projectId}`,
        projectId,
        lastMessage: 'Project discussion thread opened.',
        lastMessageAt: formatTimestamp(new Date().toISOString()),
        unread: false,
        unreadCount: 0,
      };

      localThreadStore[newThreadId] = newThread;
      return { ...newThread, threadId: newThreadId };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unable to get project conversation');
    }
  },

  async getOrCreateProjectConversation(projectId: string): Promise<MobileConversationThread & { threadId: string }> {
    return this.getOrCreateConversationForProject(projectId);
  },

  clearCache(): void {
    Object.keys(localMessageStore).forEach((key) => delete localMessageStore[key]);
    Object.keys(localThreadStore).forEach((key) => delete localThreadStore[key]);
  },
};
