import { VercelResponse } from '@vercel/node';
import { VercelRequestWithUser } from '../../middleware/authMiddleware.js';
import { requirePermission } from '../../middleware/permissionMiddleware.js';
import { getProfile, upsertCustomerProfile, upsertProviderProfile } from '../../services/profileService.js';
import { ServiceChangeError } from '../../services/providerEligibility.js';
import { Role } from '@prisma/client';

async function handler(req: VercelRequestWithUser, res: VercelResponse) {
  const method = req.method;
  const user = req.user!;

  if (method === 'GET') {
    try {
      const profile = await getProfile(user.id, user.role);
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Profile not found' });
      }
      return res.status(200).json({ success: true, role: user.role, data: profile });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  } else if (method === 'POST' || method === 'PUT') {
    try {
      let data;
      if (user.role === Role.CUSTOMER) {
        data = await upsertCustomerProfile(user.id, req.body);
      } else if (user.role === Role.PROVIDER) {
        data = await upsertProviderProfile(user.id, req.body);
      } else {
        return res.status(403).json({ success: false, message: 'Admins do not require profile records' });
      }
      return res.status(200).json({ success: true, data });
    } catch (err: any) {
      if (err instanceof ServiceChangeError) return res.status(err.status).json({ success: false, code: err.code, message: err.message });
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.validationErrors) {
          return res.status(400).json({ success: false, errors: parsed.validationErrors });
        }
      } catch (_jsonErr) {
        // Fall through to the generic server error response below.
      }
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT']);
  return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
}

export default requirePermission('profile:update')(handler);
