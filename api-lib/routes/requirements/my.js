import { verifyToken } from '../../utils/auth.js';
import { db } from '../../utils/db.js';
export default async function handler(req, res) {
    const method = req.method;
    if (method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
    }
    const user = verifyToken(req);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
    }
    try {
        const customerProfile = await db.customerProfile.findUnique({
            where: { userId: user.id },
        });
        if (!customerProfile) {
            return res.status(200).json({ success: true, data: [] });
        }
        const requirements = await db.requirement.findMany({
            where: { customerId: customerProfile.id },
            orderBy: { createdAt: 'desc' },
            include: {
                // List view: attachment metadata only. Photos are inline data URLs and would bloat the response.
                attachments: { select: { id: true, fileName: true, fileType: true } },
                _count: {
                    select: { notes: true, history: true },
                },
            },
        });
        return res.status(200).json({ success: true, data: requirements });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
