import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../../../utils/auth.js';
import { getMessages, markConversationAsRead } from '../../../services/chatService.js';

/** Conversation ids are UUIDs; reject anything else before it reaches the database. */
const CONVERSATION_ID = /^[A-Za-z0-9-]{1,64}$/;

/**
 * GET /api/chat/messages/:conversationId
 * Returns the conversation's messages (oldest first) and marks the other party's messages as read.
 * Only the conversation's customer or provider may read it (enforced by chatService.getConversationDetails).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
  }

  const method = req.method;
  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }

  const { conversationId } = req.query;
  const paramConversationId = Array.isArray(conversationId) ? conversationId[0] : conversationId;

  if (!paramConversationId) {
    return res.status(400).json({ success: false, message: 'Conversation ID parameter is required' });
  }
  if (!CONVERSATION_ID.test(paramConversationId)) {
    return res.status(400).json({ success: false, message: 'Invalid conversation ID' });
  }

  try {
    const messages = await getMessages(user.id, paramConversationId);

    // Bulk read optimization: mark the conversation's incoming messages as read when fetched.
    try {
      await markConversationAsRead(user.id, paramConversationId);
    } catch {
      console.error('[CHAT] Failed to auto-mark conversation as read');
    }

    return res.status(200).json({ success: true, data: messages });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('not found')) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    if (msg.includes('Access denied')) {
      return res.status(403).json({ success: false, message: 'Access denied: You are not a participant in this conversation' });
    }
    console.error('[CHAT] Failed to load messages', err instanceof Error ? err.name : 'Error');
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
}
