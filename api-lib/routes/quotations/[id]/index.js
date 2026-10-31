import { verifyToken } from '../../../utils/auth.js';
import { getQuotationById, updateQuotationDraft, deleteQuotationDraft } from '../../../services/quotationService.js';
import { toPublicProvider } from '../../../utils/publicProvider.js';
import { ProviderAccessError } from '../../../services/providerEligibility.js';
export default async function handler(req, res) {
    const method = req.method;
    const user = verifyToken(req);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
    }
    const { id } = req.query;
    const paramId = Array.isArray(id) ? id[0] : id;
    if (!paramId) {
        return res.status(400).json({ success: false, message: 'Missing quotation ID parameter' });
    }
    const quotationId = Number(paramId);
    try {
        if (method === 'GET') {
            const quotation = await getQuotationById(quotationId);
            if (!quotation) {
                return res.status(404).json({ success: false, message: 'Quotation not found' });
            }
            // Pricing and negotiations are private to the quoting professional, the requesting customer and admins.
            const canView = user.role === 'ADMIN' ||
                quotation.provider?.userId === user.id ||
                quotation.requirement?.customer?.userId === user.id;
            if (!canView) {
                return res.status(403).json({ success: false, message: 'Forbidden: You do not have access to this quotation' });
            }
            // Participants see each other through limited views: public professional fields, customer display name only.
            const q = quotation;
            return res.status(200).json({
                success: true,
                data: {
                    ...q,
                    provider: q.provider ? toPublicProvider(q.provider) : null,
                    requirement: q.requirement
                        ? { ...q.requirement, customer: q.requirement.customer ? { id: q.requirement.customer.id, fullName: q.requirement.customer.fullName } : null }
                        : null,
                },
            });
        }
        if (method === 'PUT') {
            const updated = await updateQuotationDraft(quotationId, user.id, req.body);
            return res.status(200).json({
                success: true,
                data: updated,
                message: 'Draft quotation updated successfully',
            });
        }
        if (method === 'DELETE') {
            await deleteQuotationDraft(quotationId, user.id);
            return res.status(200).json({ success: true, message: 'Draft quotation deleted successfully' });
        }
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
    }
    catch (err) {
        if (err instanceof ProviderAccessError)
            return res.status(403).json({ success: false, code: err.code, message: err.message });
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
