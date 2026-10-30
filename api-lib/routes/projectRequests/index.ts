import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../../utils/auth.js';
import { db } from '../../utils/db.js';
import {
  RequestError,
  submitProjectRequest,
  openRequestsFilter,
  engagedRequestsFilter,
  toProviderView,
  INVITE_CONVERSATION_TYPE,
} from '../../services/projectRequestService.js';

/**
 * POST /api/project-requests        — customer submits a project request (optionally to a chosen professional).
 * GET  /api/project-requests?scope= — professional inbox: "invited" (sent to me / engaged) or "open" (my service).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ success: false, message: 'Please sign in to continue.' });

  try {
    if (req.method === 'POST') {
      if (user.role !== 'CUSTOMER') return res.status(403).json({ success: false, message: 'Only customer accounts can submit project requests.' });
      const result = await submitProjectRequest(user.id, req.body ?? {});
      return res.status(result.duplicate ? 200 : 201).json({
        success: true,
        data: { id: result.requirement.id, reference: result.reference, status: result.requirement.status, conversationId: result.conversationId, duplicate: result.duplicate },
      });
    }

    if (req.method === 'GET') {
      if (user.role !== 'PROVIDER') return res.status(403).json({ success: false, message: 'Only professionals have a request inbox.' });
      const provider = await db.providerProfile.findFirst({ where: { userId: user.id }, select: { id: true, categoryId: true } });
      if (!provider) return res.status(403).json({ success: false, message: 'Complete your professional profile first.' });
      const scope = req.query.scope === 'open' ? 'open' : 'invited';
      const where = scope === 'open' ? openRequestsFilter(provider.categoryId) : engagedRequestsFilter(provider.id);
      const rows = await db.requirement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          customer: { select: { fullName: true } },
          conversations: { where: { providerId: provider.id }, select: { id: true, conversationType: true } },
          quotations: { where: { providerId: provider.id }, select: { id: true, status: true, totalAmount: true } },
        },
      });
      const data = rows.map((r) => {
        const invited = r.conversations.some((c) => c.conversationType === INVITE_CONVERSATION_TYPE);
        const engaged = scope === 'invited';
        return { ...toProviderView({ ...r, attachments: [] }, { invited, engaged }), myQuotation: r.quotations[0] ?? null, conversationId: r.conversations[0]?.id ?? null };
      });
      return res.status(200).json({ success: true, data });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  } catch (err: unknown) {
    if (err instanceof RequestError) {
      return res.status(err.status).json({ success: false, message: err.message, fields: (err as RequestError & { fields?: Record<string, string> }).fields });
    }
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
}
