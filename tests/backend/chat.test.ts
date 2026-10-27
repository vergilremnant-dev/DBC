import { describe, it, expect, vi } from 'vitest';
import { createConversation, sendMessage, editMessage, deleteMessage, updateReadReceipt, reactToMessage, updateUserPresence } from '../../api-lib/services/chatService.js';
import { db } from '../../api-lib/utils/db.js';

vi.mock('../../api-lib/utils/db.js', () => {
  return {
    db: {
      conversation: {
        findFirst: vi.fn(),
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      message: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      readReceipt: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      messageReaction: {
        deleteMany: vi.fn(),
        create: vi.fn(),
      },
      userPresence: {
        upsert: vi.fn(),
      },
      globalActivity: {
        create: vi.fn(),
      },
      customerProfile: {
        findUnique: vi.fn(),
      },
      providerProfile: {
        findFirst: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(db)),
    },
  };
});

describe('Collaboration Conversation Engine', () => {
  it('should reuse existing conversation if it matches inputs', async () => {
    vi.spyOn(db.customerProfile, 'findUnique').mockResolvedValueOnce({ id: 'cust-123' } as any);
    vi.spyOn(db.conversation, 'findFirst').mockResolvedValueOnce({
      id: 'existing-conv-id',
    } as any);

    const conv = await createConversation('user-cust-id', 'provider-123', {
      conversationType: 'DIRECT',
    });

    expect(conv.id).toBe('existing-conv-id');
  });

  it('should create new conversation if none exists', async () => {
    vi.spyOn(db.customerProfile, 'findUnique').mockResolvedValueOnce({ id: 'cust-123' } as any);
    vi.spyOn(db.conversation, 'findFirst').mockResolvedValueOnce(null);
    vi.spyOn(db.conversation, 'create').mockResolvedValueOnce({
      id: 'new-conv-id',
    } as any);

    const conv = await createConversation('user-cust-id', 'provider-123', {
      conversationType: 'DIRECT',
    });

    expect(conv.id).toBe('new-conv-id');
  });
});

describe('Messaging & Activities Logs', () => {
  it('should append messages and update conversation pointer', async () => {
    vi.spyOn(db.message, 'create').mockResolvedValueOnce({
      id: 'msg-abc',
      content: 'hello',
    } as any);

    const mockUpdate = vi.spyOn(db.conversation, 'update').mockResolvedValueOnce({} as any);
    const mockActivity = vi.spyOn(db.globalActivity, 'create').mockResolvedValueOnce({} as any);

    // Sender must be a participant (Phase 2 authorization): sender-123 owns customer profile cust-123.
    vi.spyOn(db.conversation, 'findUnique').mockResolvedValueOnce({ id: 'conv-123', customerId: 'cust-123', providerId: 'prov-123' } as any);
    vi.spyOn(db.customerProfile, 'findUnique').mockResolvedValueOnce({ id: 'cust-123' } as any);
    vi.spyOn(db.providerProfile, 'findFirst').mockResolvedValueOnce(null);

    const msg = await sendMessage('conv-123', 'sender-123', 'hello');
    expect(msg.content).toBe('hello');
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockActivity).toHaveBeenCalled();
  });

  it('should refuse messages from users who are not conversation participants', async () => {
    vi.spyOn(db.conversation, 'findUnique').mockResolvedValueOnce({ id: 'conv-123', customerId: 'cust-123', providerId: 'prov-123' } as any);
    vi.spyOn(db.customerProfile, 'findUnique').mockResolvedValueOnce({ id: 'someone-else' } as any);
    vi.spyOn(db.providerProfile, 'findFirst').mockResolvedValueOnce(null);
    const mockCreate = vi.spyOn(db.message, 'create');
    mockCreate.mockClear();

    await expect(sendMessage('conv-123', 'outsider-1', 'spam')).rejects.toThrow('Access denied');
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe('Collaborations Extras (Receipts & Reactions)', () => {
  it('should create read receipts successfully', async () => {
    vi.spyOn(db.readReceipt, 'findFirst').mockResolvedValueOnce(null);
    const mockCreate = vi.spyOn(db.readReceipt, 'create').mockResolvedValueOnce({
      id: 'receipt-123',
    } as any);

    const receipt = await updateReadReceipt('msg-123', 'user-123');
    expect(receipt.id).toBe('receipt-123');
    expect(mockCreate).toHaveBeenCalled();
  });

  it('should create message reactions', async () => {
    const mockDelete = vi.spyOn(db.messageReaction, 'deleteMany').mockResolvedValueOnce({} as any);
    const mockCreate = vi.spyOn(db.messageReaction, 'create').mockResolvedValueOnce({
      id: 'react-123',
      reaction: '👍',
    } as any);

    const react = await reactToMessage('msg-123', 'user-123', '👍');
    expect(react.reaction).toBe('👍');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockCreate).toHaveBeenCalled();
  });

  it('should upsert user presence status indicators', async () => {
    const mockUpsert = vi.spyOn(db.userPresence, 'upsert').mockResolvedValueOnce({
      userId: 'user-123',
      status: 'AWAY',
    } as any);

    const pres = await updateUserPresence('user-123', 'AWAY');
    expect(pres.status).toBe('AWAY');
    expect(mockUpsert).toHaveBeenCalled();
  });
});
