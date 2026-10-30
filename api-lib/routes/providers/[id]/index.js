import { getProviderById } from '../../../services/providerService.js';
import { toPublicProvider } from '../../../utils/publicProvider.js';
export default async function handler(req, res) {
    const { id } = req.query;
    const paramId = Array.isArray(id) ? id[0] : id;
    if (!paramId) {
        return res.status(400).json({ success: false, message: 'Missing provider ID parameter' });
    }
    const method = req.method;
    if (method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
    }
    try {
        const profile = await getProviderById(paramId);
        // Subscription check to mask phone number
        const { verifyToken } = await import('../../../utils/auth.js');
        const { verifyActiveSubscription } = await import('../../../services/subscriptionService.js');
        const user = verifyToken(req);
        const hasActive = user ? (user.role === 'ADMIN' || user.id === profile.userId || await verifyActiveSubscription(user.id)) : false;
        if (!hasActive) {
            if (profile.phoneNumber) {
                profile.phoneNumber = profile.phoneNumber.substring(0, 3) + 'XXXXXX' + profile.phoneNumber.substring(profile.phoneNumber.length - 2);
            }
        }
        // Public DTO: phone (masked above unless entitled) is the only contact field exposed.
        return res.status(200).json({ success: true, data: toPublicProvider(profile, { includePhone: true }) });
    }
    catch (err) {
        const message = err.message || '';
        if (message.includes('not found')) {
            return res.status(404).json({ success: false, message });
        }
        return res.status(500).json({ success: false, message });
    }
}
