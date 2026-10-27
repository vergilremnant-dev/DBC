import { verifyToken } from '../../../utils/auth.js';
import { transitionQuotationStatus } from '../../../services/quotationService.js';
export default async function handler(req, res) {
    const method = req.method;
    if (method !== 'PUT') {
        res.setHeader('Allow', ['PUT']);
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
    const { status, reason } = req.body;
    if (!status) {
        return res.status(400).json({ success: false, message: 'Missing target status parameter' });
    }
    try {
        const updated = await transitionQuotationStatus(Number(paramId), user.id, status, reason);
        return res.status(200).json({
            success: true,
            data: updated,
            message: `Quotation transitioned to ${status} successfully`,
        });
    }
    catch (err) {
        const message = err?.message || '';
        if (/^(Unauthorized|Only the)/.test(message)) {
            return res.status(403).json({ success: false, message });
        }
        if (message.includes('not found')) {
            return res.status(404).json({ success: false, message });
        }
        return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
}
