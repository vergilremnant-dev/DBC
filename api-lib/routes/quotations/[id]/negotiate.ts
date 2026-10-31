import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../../../utils/auth.js';
import { addNegotiationMessage } from '../../../services/quotationService.js';
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

  const { comment, counterAmount } = req.body;

  if (!comment) {
    return res.status(400).json({ success: false, message: 'Missing comment parameter' });
  }

  try {
    const msg = await addNegotiationMessage(
      Number(paramId),
      user.id,
      comment,
      counterAmount ? Number(counterAmount) : undefined
    );

    return res.status(201).json({
      success: true,
      data: msg,
      message: 'Negotiation comment posted successfully',
    });
  } catch (err: any) {
    if (err instanceof ProviderAccessError) return res.status(403).json({ success: false, code: err.code, message: err.message });
    return res.status(500).json({ success: false, message: err.message });
  }
}
