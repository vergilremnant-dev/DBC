import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mobileCustomerMessagingService } from '../../mobile/src/services/mobileCustomerMessagingService.js';
import {
  CustomerMessagesScreenController,
  renderCustomerMessagesScreen,
} from '../../mobile/src/screens/workspace/CustomerMessagesScreen.js';
import {
  CustomerConversationScreenController,
  renderCustomerConversationScreen,
} from '../../mobile/src/screens/workspace/CustomerConversationScreen.js';
import { chatApi } from '../../src/services/chat/chatService.js';
import { ProjectService } from '../../src/services/contractor/ProjectService.js';
import type { Conversation, Message } from '../../src/types/chat/chatTypes.js';

vi.mock('../../src/services/chat/chatService.js', () => ({
  chatApi: {
    listConversations: vi.fn(),
    getConversationDetail: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    markMessageRead: vi.fn(),
    createConversation: vi.fn(),
  },
}));

vi.mock('../../src/services/contractor/ProjectService.js', () => ({
  ProjectService: {
    getProjectDetail: vi.fn(),
  },
}));

const mockConversations: Conversation[] = [
  {
    id: 'conv-101',
    bookingId: 'bk-55',
    consultationBookingId: null,
    customerId: 'cust-101',
    providerId: 'prov-202',
    lastMessage: 'Layout plan drawing updated for structural review',
    lastMessageAt: '2026-09-22T10:30:00Z',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-22T10:30:00Z',
    provider: {
      id: 'prov-202',
      fullName: 'Alice Architect',
      businessName: 'Apex Architecture Studio',
      userId: 'user-prov-202',
    },
    booking: {
      bookingNumber: 'BK-9901',
      bookingStatus: 'ACCEPTED',
    },
    messages: [{ id: 'msg-m3' }],
  },
];

const mockMessages: Message[] = [
  {
    id: 'msg-m1',
    conversationId: 'conv-101',
    senderId: 'user-prov-202',
    messageType: 'TEXT',
    content: 'Hello! Checking the foundation layout plans.',
    attachmentUrl: null,
    isRead: true,
    createdAt: '2026-09-22T09:00:00Z',
  },
  {
    id: 'msg-m2',
    conversationId: 'conv-101',
    senderId: 'cust-101',
    messageType: 'TEXT',
    content: 'Please adjust column C4 spacing.',
    attachmentUrl: null,
    isRead: true,
    createdAt: '2026-09-22T09:30:00Z',
  },
  {
    id: 'msg-m3',
    conversationId: 'conv-101',
    senderId: 'user-prov-202',
    messageType: 'TEXT',
    content: 'Layout plan drawing updated for structural review',
    attachmentUrl: null,
    isRead: false,
    createdAt: '2026-09-22T10:30:00Z',
  },
];

describe('Module 40 — Customer Mobile Messaging & Project Communication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mobileCustomerMessagingService.clearCache();
  });

  describe('1. Customer Inbox & Contextual Threads', () => {
    it('retrieves active customer threads with project context and unread indicators', async () => {
      vi.mocked(chatApi.listConversations).mockResolvedValue(mockConversations);

      const threads = await mobileCustomerMessagingService.getCustomerThreads();

      expect(threads.length).toBeGreaterThan(0);
      const thread = threads.find((t) => t.id === 'conv-101');
      expect(thread).toBeDefined();
      if (thread) {
        expect(thread.providerName).toBe('Alice Architect');
        expect(thread.projectContextTitle).toBe('Project #BK-9901');
        expect(thread.unread).toBe(true);
      }
    });

    it('renders CustomerMessagesScreen with thread cards and unread badge', async () => {
      vi.mocked(chatApi.listConversations).mockResolvedValue(mockConversations);

      const controller = new CustomerMessagesScreenController({});
      await controller.init();

      expect(controller.getState().isLoading).toBe(false);
      expect(controller.getState().threads.length).toBeGreaterThan(0);

      const html = renderCustomerMessagesScreen(controller);
      expect(html).toContain('Alice Architect');
      expect(html).toContain('Project #BK-9901');
      expect(html).toContain('UNREAD');
    });
  });

  describe('2. Conversation Feed & Message Distinction', () => {
    it('loads messages and distinguishes customer vs pro message bubbles', async () => {
      vi.mocked(chatApi.listConversations).mockResolvedValue(mockConversations);
      vi.mocked(chatApi.getMessages).mockResolvedValue(mockMessages);
      vi.mocked(chatApi.markMessageRead).mockResolvedValue(mockMessages[2]);

      const controller = new CustomerConversationScreenController({ threadId: 'conv-101' });
      await controller.init();

      expect(controller.getState().messages.length).toBe(3);
      expect(chatApi.markMessageRead).toHaveBeenCalledWith('msg-m3');

      const html = renderCustomerConversationScreen(controller);
      expect(html).toContain('Alice Architect');
      expect(html).toContain('Checking the foundation layout plans');
      expect(html).toContain('Please adjust column C4 spacing');
    });

    it('sanitizes message content to prevent HTML script injection', async () => {
      const xssMsg: Message = {
        id: 'msg-xss',
        conversationId: 'conv-101',
        senderId: 'user-prov-202',
        messageType: 'TEXT',
        content: '<script>alert("hack")</script>',
        attachmentUrl: null,
        isRead: true,
        createdAt: new Date().toISOString(),
      };
      vi.mocked(chatApi.getMessages).mockResolvedValue([xssMsg]);

      const messages = await mobileCustomerMessagingService.getMessages('conv-101');
      expect(messages[0].content).toContain('&lt;script&gt;');
      expect(messages[0].content).not.toContain('<script>');
    });
  });

  describe('3. Message Sending & Validation', () => {
    it('sends message through backend API and appends to feed', async () => {
      vi.mocked(chatApi.listConversations).mockResolvedValue(mockConversations);
      vi.mocked(chatApi.getMessages).mockResolvedValue(mockMessages);
      vi.mocked(chatApi.sendMessage).mockResolvedValue({
        id: 'msg-new',
        conversationId: 'conv-101',
        senderId: 'cust-101',
        messageType: 'TEXT',
        content: 'Thanks for the quick update!',
        attachmentUrl: null,
        isRead: true,
        createdAt: new Date().toISOString(),
      });

      const controller = new CustomerConversationScreenController({ threadId: 'conv-101' });
      await controller.init();

      controller.setInputText('Thanks for the quick update!');
      await controller.handleSendMessage();

      expect(chatApi.sendMessage).toHaveBeenCalled();
      expect(controller.getState().messages.length).toBe(4);
      expect(controller.getState().inputText).toBe('');
    });

    it('prevents empty message submissions', async () => {
      const controller = new CustomerConversationScreenController({ threadId: 'conv-101' });
      controller.setInputText('   ');
      await controller.handleSendMessage();

      expect(chatApi.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('4. Project Handoff & Navigation', () => {
    it('creates or reuses contextual conversation for project workspace', async () => {
      vi.mocked(ProjectService.getProjectDetail).mockResolvedValue({
        id: 'proj-500',
        requirementId: 88,
        customerId: 'cust-101',
        providerId: 'prov-202',
        quotationId: 501,
        status: 'IN_PROGRESS',
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: '2026-09-15T10:00:00Z',
        requirement: {
          id: 88,
          title: 'Villa Structural Remodel',
          description: 'Structural works',
          location: 'Bangalore',
        },
        provider: {
          id: 'prov-202',
          fullName: 'Alice Architect',
          businessName: 'Apex Studio',
        },
      });

      const thread = await mobileCustomerMessagingService.getOrCreateConversationForProject('proj-500');

      expect(thread.projectId).toBe('proj-500');
      expect(thread.projectContextTitle).toBe('Villa Structural Remodel');
      expect(thread.providerName).toBe('Alice Architect');
    });
  });

  describe('5. Security & Authorization Error Handling', () => {
    it('handles 401 unauthorized errors gracefully', async () => {
      vi.mocked(chatApi.listConversations).mockRejectedValue(new Error('401 Session Expired'));

      const controller = new CustomerMessagesScreenController({});
      await controller.init();

      expect(controller.getState().threads.length).toBe(0);
      expect(controller.getState().error).toContain('UNAUTHORIZED_EXPIRED_SESSION');
    });

    it('handles 403 access denied errors gracefully', async () => {
      vi.mocked(chatApi.listConversations).mockRejectedValue(new Error('403 Access denied'));

      const controller = new CustomerMessagesScreenController({});
      await controller.init();

      expect(controller.getState().error).toContain('ACCESS_DENIED_MESSAGING');
    });
  });
});
