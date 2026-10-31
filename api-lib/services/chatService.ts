import { db } from '../utils/db.js';

export interface CreateConversationInput {
  conversationType?: string;
  requirementId?: number;
  projectId?: string;
  bookingId?: string;
  consultationBookingId?: string;
  providerId?: string; // legacy support
}

/**
 * Fields of the other participant that a conversation member may see. Full profiles carry
 * phone numbers, emails and addresses, so chat responses select only display fields.
 */
const CHAT_CUSTOMER_SELECT = { id: true, userId: true, fullName: true, profileImageUrl: true, city: true } as const;
const CHAT_PROVIDER_SELECT = { id: true, userId: true, fullName: true, businessName: true, profileImage: true, city: true, verificationStatus: true } as const;
/** Message authors / receipt and reaction users: never the full User row (email, phone, Firebase id). */
const CHAT_USER_SELECT = { id: true, role: true } as const;

export async function logGlobalActivity(
  actorId: string,
  activityType: string,
  description: string,
  targetType?: string,
  targetId?: string
) {
  return await db.globalActivity.create({
    data: {
      actorId,
      activityType,
      description,
      targetType: targetType || null,
      targetId: targetId || null,
    },
  });
}

export async function createConversation(customerId: string, providerIdOrInput: string | CreateConversationInput, legacyInput?: CreateConversationInput) {
  const finalProviderId = typeof providerIdOrInput === 'string' ? providerIdOrInput : providerIdOrInput.providerId || '';
  const finalInput = typeof providerIdOrInput === 'string' ? legacyInput || {} : providerIdOrInput;

  // Resolve profiles
  const customerProfile = await db.customerProfile.findUnique({
    where: { userId: customerId },
  });
  
  if (!customerProfile) {
    throw new Error('Customer profile not found');
  }

  const existing = await db.conversation.findFirst({
    where: {
      customerId: customerProfile.id,
      providerId: finalProviderId,
      conversationType: finalInput.conversationType || 'DIRECT',
      requirementId: finalInput.requirementId || null,
      projectId: finalInput.projectId || null,
      bookingId: finalInput.bookingId || null,
      consultationBookingId: finalInput.consultationBookingId || null,
    },
  });

  if (existing) return existing;

  const conversation = await db.conversation.create({
    data: {
      customerId: customerProfile.id,
      providerId: finalProviderId,
      conversationType: finalInput.conversationType || 'DIRECT',
      requirementId: finalInput.requirementId || null,
      projectId: finalInput.projectId || null,
      bookingId: finalInput.bookingId || null,
      consultationBookingId: finalInput.consultationBookingId || null,
    },
  });

  await logGlobalActivity(
    customerId,
    'CONVERSATION_CREATED',
    `New discussion thread initialized (Type: ${finalInput.conversationType || 'DIRECT'})`
  );

  return conversation;
}

export async function getConversationDetail(id: string) {
  return await db.conversation.findUnique({
    where: { id },
    include: {
      customer: { select: CHAT_CUSTOMER_SELECT },
      provider: { select: CHAT_PROVIDER_SELECT },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: CHAT_USER_SELECT },
          readReceipts: { include: { user: { select: CHAT_USER_SELECT } } },
          reactions: { include: { user: { select: CHAT_USER_SELECT } } },
        },
      },
    },
  });
}

export async function sendMessage(
  conversationIdOrSenderId: string,
  senderIdOrPayload: string | { conversationId: string; content: string; messageType?: string; attachmentUrl?: string },
  content?: string,
  messageType = 'TEXT',
  attachmentUrl?: string
) {
  let finalConversationId = '';
  let finalSenderId = '';
  let finalContent = '';
  let finalMessageType = 'TEXT';
  let finalAttachmentUrl = '';

  if (typeof senderIdOrPayload === 'string') {
    finalConversationId = conversationIdOrSenderId;
    finalSenderId = senderIdOrPayload;
    finalContent = content || '';
    finalMessageType = messageType;
    finalAttachmentUrl = attachmentUrl || '';
  } else {
    finalSenderId = conversationIdOrSenderId;
    finalConversationId = senderIdOrPayload.conversationId;
    finalContent = senderIdOrPayload.content;
    finalMessageType = senderIdOrPayload.messageType || 'TEXT';
    finalAttachmentUrl = senderIdOrPayload.attachmentUrl || '';
  }

  if (!finalConversationId || !finalSenderId) {
    throw new Error('Conversation not found');
  }
  // Only conversation participants may post (throws 'Conversation not found' / 'Access denied').
  await getConversationDetails(finalSenderId, finalConversationId);

  return await db.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        conversationId: finalConversationId,
        senderId: finalSenderId,
        messageType: finalMessageType,
        content: finalContent,
        attachmentUrl: finalAttachmentUrl || null,
      },
      include: {
        sender: { select: CHAT_USER_SELECT },
      },
    });

    await tx.conversation.update({
      where: { id: finalConversationId },
      data: {
        lastMessage: finalMessageType === 'TEXT' ? finalContent : `[${finalMessageType}] Attachment`,
        lastMessageAt: new Date(),
      },
    });

    // Fire activity hook
    await tx.globalActivity.create({
      data: {
        actorId: finalSenderId,
        activityType: 'MESSAGE_SENT',
        description: `Posted a message in conversation thread ${finalConversationId}`,
        targetType: 'CONVERSATION',
        targetId: finalConversationId,
      },
    });

    return msg;
  });
}

export async function editMessage(messageId: string, userId: string, newContent: string) {
  const msg = await db.message.findUnique({ where: { id: messageId } });
  if (!msg) throw new Error('Message not found');
  if (msg.senderId !== userId) throw new Error('Unauthorized edit access');

  return await db.message.update({
    where: { id: messageId },
    data: {
      content: newContent,
      isEdited: true,
    },
  });
}

export async function deleteMessage(messageId: string, userId: string) {
  const msg = await db.message.findUnique({ where: { id: messageId } });
  if (!msg) throw new Error('Message not found');
  if (msg.senderId !== userId) throw new Error('Unauthorized deletion access');

  return await db.message.update({
    where: { id: messageId },
    data: {
      content: 'This message was deleted',
      isDeleted: true,
    },
  });
}

export async function updateReadReceipt(messageId: string, userId: string) {
  const existing = await db.readReceipt.findFirst({
    where: { messageId, userId },
  });

  if (existing) return existing;

  return await db.readReceipt.create({
    data: {
      messageId,
      userId,
    },
  });
}

export async function reactToMessage(messageId: string, userId: string, reaction: string) {
  await db.messageReaction.deleteMany({
    where: { messageId, userId, reaction },
  });

  return await db.messageReaction.create({
    data: {
      messageId,
      userId,
      reaction,
    },
  });
}

export async function updateUserPresence(userId: string, status: string) {
  return await db.userPresence.upsert({
    where: { userId },
    update: {
      status,
      lastSeenAt: new Date(),
    },
    create: {
      userId,
      status,
    },
  });
}

export async function publishAnnouncement(authorId: string, title: string, content: string) {
  const ann = await db.announcement.create({
    data: {
      authorId,
      title,
      content,
    },
  });

  await logGlobalActivity(
    authorId,
    'ANNOUNCEMENT_PUBLISHED',
    `Broadcasted system announcement: "${title}"`
  );

  return ann;
}

// === LEGACY SUPPORT ROUTE WRAPPERS ===

export async function listConversations(userId: string) {
  const customerProfile = await db.customerProfile.findUnique({ where: { userId } });
  const providerProfile = await db.providerProfile.findFirst({ where: { userId } });

  const whereConditions: any[] = [];
  if (customerProfile) {
    whereConditions.push({ customerId: customerProfile.id });
  }
  if (providerProfile) {
    whereConditions.push({ providerId: providerProfile.id });
  }

  if (whereConditions.length === 0) {
    return [];
  }

  return await db.conversation.findMany({
    where: {
      OR: whereConditions,
    },
    include: {
      customer: { select: CHAT_CUSTOMER_SELECT },
      provider: { select: CHAT_PROVIDER_SELECT },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getConversationDetails(userId: string, conversationId: string) {
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      customer: { select: CHAT_CUSTOMER_SELECT },
      provider: { select: CHAT_PROVIDER_SELECT },
    },
  });

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  const customerProfile = await db.customerProfile.findUnique({ where: { userId } });
  const providerProfile = await db.providerProfile.findFirst({ where: { userId } });

  const isCustomer = customerProfile && conversation.customerId === customerProfile.id;
  const isProvider = providerProfile && conversation.providerId === providerProfile.id;

  if (!isCustomer && !isProvider) {
    throw new Error('Access denied: You are not a participant in this conversation');
  }

  return conversation;
}

export async function getMessages(userId: string, conversationId: string) {
  await getConversationDetails(userId, conversationId);

  return await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: { select: CHAT_USER_SELECT },
      readReceipts: true,
      reactions: true,
    },
  });
}

export async function markConversationAsRead(userId: string, conversationId: string) {
  await getConversationDetails(userId, conversationId);

  return await db.message.updateMany({
    where: { conversationId, senderId: { not: userId }, isRead: false },
    data: { isRead: true },
  });
}

export async function markMessageAsRead(userId: string, messageId: string) {
  const message = await db.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error('Message not found');
  }

  await getConversationDetails(userId, message.conversationId);

  return await db.message.update({
    where: { id: messageId },
    data: { isRead: true },
  });
}
