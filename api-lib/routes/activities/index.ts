import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../../utils/auth.js';
import { db } from '../../utils/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;
  const user = verifyToken(req);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
  }

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }

  const { limit = '20', offset = '0' } = req.query;
  const limitNum = Math.min(100, Math.max(1, Number(limit)));
  const offsetNum = Math.max(0, Number(offset));

  try {
    // Security/audit activity is private: users see their own events, admins see all.
    const list = await db.globalActivity.findMany({
      where: user.role === 'ADMIN' ? {} : { actorId: user.id },
      take: limitNum,
      skip: offsetNum,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, role: true, customerProfile: { select: { fullName: true } }, providerProfile: { select: { fullName: true, businessName: true } } } },
      },
    });

    return res.status(200).json({ success: true, data: list });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
