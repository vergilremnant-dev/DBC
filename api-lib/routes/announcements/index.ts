import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../../utils/auth.js';
import { db } from '../../utils/db.js';
import { publishAnnouncement } from '../../services/chatService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;
  const user = verifyToken(req);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
  }

  try {
    if (method === 'GET') {
      const list = await db.announcement.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, role: true, customerProfile: { select: { fullName: true } }, providerProfile: { select: { fullName: true, businessName: true } } } },
        },
      });
      return res.status(200).json({ success: true, data: list });
    }

    if (method === 'POST') {
      const userProfile = await db.user.findUnique({ where: { id: user.id } });
      if (userProfile?.role !== 'ADMIN' && userProfile?.role !== 'PROVIDER') {
        return res.status(403).json({ success: false, message: 'Forbidden: Only administrators or providers can broadcast announcements' });
      }

      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({ success: false, message: 'Missing parameters: title, content' });
      }

      const ann = await publishAnnouncement(user.id, title, content);
      return res.status(201).json({ success: true, data: ann, message: 'Announcement broadcasted successfully' });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
