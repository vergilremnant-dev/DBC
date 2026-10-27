import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../../../utils/auth.js';
import { db } from '../../../utils/db.js';
import { sendMessage, getConversationDetails } from '../../../services/chatService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;
  const user = verifyToken(req);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
  }

  const { id } = req.query;
  const conversationId = Array.isArray(id) ? id[0] : id;

  if (!conversationId) {
    return res.status(400).json({ success: false, message: 'Missing conversation ID parameter' });
  }

  try {
    // Participant check for every method (throws 'not found' / 'Access denied').
    await getConversationDetails(user.id, conversationId);

    if (method === 'GET') {
      const messages = await db.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: true,
          readReceipts: true,
          reactions: true,
        },
      });
      return res.status(200).json({ success: true, data: messages });
    }

    if (method === 'POST') {
      const { content, messageType, attachmentUrl } = req.body;
      if (!content) {
        return res.status(400).json({ success: false, message: 'Missing message content' });
      }

      const msg = await sendMessage(conversationId, user.id, content, messageType, attachmentUrl);
      return res.status(201).json({ success: true, data: msg });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  } catch (err: any) {
    const message = err?.message || '';
    if (message.includes('not found')) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    if (message.includes('Access denied')) {
      return res.status(403).json({ success: false, message: 'Access denied: You are not a participant in this conversation' });
    }
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
}
