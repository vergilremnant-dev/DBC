import { verifyToken, hasRole } from '../../../utils/auth.js';
import { adminVerifyProvider } from '../../../services/providerService.js';
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
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: 'Verification status is required' });
        }
        const updated = await adminVerifyProvider(paramId, status);
        await recordAdminAction(user.id, `Admin set provider ${paramId} verification to ${updated.verificationStatus}`, 'PROVIDER_PROFILE', paramId);
        return res.status(200).json({
            success: true,
            message: `Provider profile verification status updated to ${status}`,
            data: updated,
        });
    }
    catch (err) {
        const message = err.message || '';
        if (message.includes('not found') || message.includes('Invalid')) {
            return res.status(400).json({ success: false, message });
        }
        return res.status(500).json({ success: false, message });
    }
}
