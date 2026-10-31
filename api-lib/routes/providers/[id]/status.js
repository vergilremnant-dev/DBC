import { verifyToken, hasRole } from '../../../utils/auth.js';
import { adminUpdateProviderAvailability } from '../../../services/providerService.js';
import { recordAdminAction } from '../../../services/adminSafety.js';
export default async function handler(req, res) {
    const user = verifyToken(req);
    if (!user) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
    }
    if (!hasRole(user, ['ADMIN'])) {
        return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
    }
    const { id } = req.query;
    const paramId = Array.isArray(id) ? id[0] : id;
    if (!paramId) {
        return res.status(400).json({ success: false, message: 'Missing provider ID parameter' });
    }
    const method = req.method;
    if (method !== 'PATCH') {
        res.setHeader('Allow', ['PATCH']);
        return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
    }
    try {
        const { isAvailable } = req.body;
        if (isAvailable === undefined) {
            return res.status(400).json({ success: false, message: 'isAvailable boolean is required' });
        }
        const updated = await adminUpdateProviderAvailability(paramId, Boolean(isAvailable));
        await recordAdminAction(user.id, `Admin set provider ${paramId} availability to ${updated.isAvailable}`, 'PROVIDER_PROFILE', paramId);
        return res.status(200).json({
            success: true,
            message: `Provider availability status updated to ${isAvailable}`,
            data: updated,
        });
    }
    catch (err) {
        const message = err.message || '';
        if (message.includes('not found')) {
            return res.status(400).json({ success: false, message });
        }
        return res.status(500).json({ success: false, message });
    }
}
