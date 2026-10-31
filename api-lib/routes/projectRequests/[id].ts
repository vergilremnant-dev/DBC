import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../../utils/auth.js';
import { RequestError, acknowledgeRequest, contactCustomer } from '../../services/projectRequestService.js';
import { requireVerifiedProvider } from '../../services/providerEligibility.js';

/**
 * POST /api/project-requests/:id  { action: 'acknowledge' | 'contact' } — professional actions on a request.
 *  - acknowledge: marks an invited request as under review (validated state transition).
 *  - contact: opens (or reuses) the DBC conversation with the customer for this request.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
  if (user.role !== 'PROVIDER') return res.status(403).json({ success: false, message: 'Only professionals can perform this action.' });

  const raw = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const requirementId = Number(raw);
  if (!Number.isInteger(requirementId) || requirementId <= 0) return res.status(400).json({ success: false, message: 'Invalid request id' });

  try {
    const gate = await requireVerifiedProvider(user);
    if (!gate.ok) return res.status(gate.status).json({ success: false, code: gate.code, message: gate.message });
    const provider = gate.provider;
    const action = req.body?.action;
    if (action === 'acknowledge') {
      const access = await acknowledgeRequest(user.id, provider.id, requirementId);
      return res.status(200).json({ success: true, data: access });
    }
    if (action === 'contact') {
      const conversation = await contactCustomer(user.id, provider.id, requirementId);
      return res.status(200).json({ success: true, data: { conversationId: conversation.id } });
    }
    return res.status(400).json({ success: false, message: 'Unknown action' });
  } catch (err: unknown) {
    if (err instanceof RequestError) return res.status(err.status).json({ success: false, message: err.message });
    const message = err instanceof Error ? err.message : '';
    if (message.startsWith('Invalid status transition')) return res.status(409).json({ success: false, message });
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
}
