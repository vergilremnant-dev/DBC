import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../../../utils/auth.js';
import { submitQuotationRevision } from '../../../services/quotationService.js';
import { ProviderAccessError } from '../../../services/providerEligibility.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }

  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
  }

  const { id } = req.query;
  const paramId = Array.isArray(id) ? id[0] : id;

  if (!paramId) {
    return res.status(400).json({ success: false, message: 'Missing quotation ID parameter' });
  }

  const {
    priceModel,
    totalAmount,
    estimatedDurationDays,
    warrantyMonths,
    proposal,
    milestones,
  } = req.body;

  if (!priceModel || totalAmount === undefined || !estimatedDurationDays || !proposal) {
    return res.status(400).json({ success: false, message: 'Missing required parameters for revision' });
  }

  try {
    const updated = await submitQuotationRevision(Number(paramId), user.id, {
      priceModel,
      totalAmount: Number(totalAmount),
      estimatedDurationDays: Number(estimatedDurationDays),
      warrantyMonths: warrantyMonths ? Number(warrantyMonths) : undefined,
      proposal,
      milestones: milestones?.map((m: any) => ({
        ...m,
        cost: Number(m.cost),
        durationDays: m.durationDays ? Number(m.durationDays) : undefined,
        dueAt: m.dueAt ? new Date(m.dueAt) : undefined,
      })),
    });

    return res.status(200).json({
      success: true,
      data: updated,
      message: 'Quotation revised successfully',
    });
  } catch (err: any) {
    if (err instanceof ProviderAccessError) return res.status(403).json({ success: false, code: err.code, message: err.message });
    return res.status(500).json({ success: false, message: err.message });
  }
}
