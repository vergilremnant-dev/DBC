import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../../../utils/auth.js';
import { updateReadReceipt, getConversationDetails } from '../../../services/chatService.js';
import { db } from '../../../utils/db.js';

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

  const { messageId } = req.body;
  if (!messageId) {
    return res.status(400).json({ success: false, message: 'Missing target messageId parameter' });
  }

  try {
    if (method === 'POST') {
      await getConversationDetails(user.id, conversationId);
      const message = await db.message.findFirst({ where: { id: String(messageId), conversationId }, select: { id: true } });
      if (!message) {
        return res.status(404).json({ success: false, message: 'Message not found in this conversation' });
      }
      const receipt = await updateReadReceipt(message.id, user.id);
      return res.status(200).json({ success: true, data: receipt, message: 'Message read receipt updated' });
    }

    res.setHeader('Allow', ['POST']);
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
