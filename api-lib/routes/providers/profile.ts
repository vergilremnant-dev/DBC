import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../../utils/auth.js';
import {
  getProviderByUserId,
  createProviderProfile,
  updateProviderProfile,
} from '../../services/providerService.js';
import { ServiceChangeError } from '../../services/providerEligibility.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
  }

  const method = req.method;

  switch (method) {
    case 'GET':
      try {
        const profile = await getProviderByUserId(user.id);
        if (!profile) {
          return res.status(404).json({ success: false, message: 'Provider profile not found for this user' });
        }
        return res.status(200).json({ success: true, data: profile });
      } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
      }

    case 'POST':
      try {
        const newProfile = await createProviderProfile(user.id, req.body);
        return res.status(201).json({
          success: true,
          message: 'Provider profile created successfully',
          data: newProfile,
        });
      } catch (err: any) {
        const message = err.message || '';
        if (
          message.includes('required') ||
          message.includes('Must be') ||
          message.includes('does not exist') ||
          message.includes('exists') ||
          message.includes('Only users')
        ) {
          return res.status(400).json({ success: false, message });
        }
        return res.status(500).json({ success: false, message });
      }

    case 'PUT':
      try {
        const updatedProfile = await updateProviderProfile(user.id, req.body);
        return res.status(200).json({
          success: true,
          message: 'Provider profile updated successfully',
          data: updatedProfile,
        });
      } catch (err: any) {
        if (err instanceof ServiceChangeError) return res.status(err.status).json({ success: false, code: err.code, message: err.message });
        const message = err.message || '';
        if (
          message.includes('not found') ||
          message.includes('Must be') ||
          message.includes('negative') ||
          message.includes('does not exist')
        ) {
          return res.status(400).json({ success: false, message });
        }
        return res.status(500).json({ success: false, message });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }
}
