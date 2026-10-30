import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../../../utils/auth.js';
import { getRequirementById, updateRequirement, deleteRequirement } from '../../../services/requirementService.js';
import { db } from '../../../utils/db.js';
import { getProviderAccess, toProviderView, toCustomerView } from '../../../services/projectRequestService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;
  const user = verifyToken(req);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
  }

  const { id } = req.query;
  const paramId = Array.isArray(id) ? id[0] : id;

  if (!paramId) {
    return res.status(400).json({ success: false, message: 'Missing requirement ID parameter' });
  }

  const requirementId = Number(paramId);

  if (isNaN(requirementId)) {
    return res.status(400).json({ success: false, message: 'Invalid requirement ID format' });
  }

  try {
    if (method === 'GET') {
      const requirement = await getRequirementById(requirementId);
      if (!requirement) {
        return res.status(404).json({ success: false, message: 'Requirement not found' });
      }
      // Owner and admins see the full request; professionals only with access, and with limited customer data.
      if (user.role === 'ADMIN') return res.status(200).json({ success: true, data: requirement });
      if (requirement.customer?.userId === user.id) return res.status(200).json({ success: true, data: toCustomerView(requirement) });
      if (user.role === 'PROVIDER') {
        const provider = await db.providerProfile.findFirst({ where: { userId: user.id }, select: { id: true } });
        const access = provider ? await getProviderAccess(provider.id, requirementId) : null;
        if (access?.allowed) return res.status(200).json({ success: true, data: toProviderView(requirement, access) });
      }
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have access to this request' });
    }

    if (method === 'PUT') {
      const { title, description, serviceCategory, serviceCategoryId, location, budgetMin, budgetMax, preferredStartDate } = req.body;
      const updated = await updateRequirement(requirementId, user.id, {
        title,
        description,
        serviceCategory,
        serviceCategoryId: serviceCategoryId ? Number(serviceCategoryId) : undefined,
        location,
        budgetMin: budgetMin !== undefined ? Number(budgetMin) : undefined,
        budgetMax: budgetMax !== undefined ? Number(budgetMax) : undefined,
        preferredStartDate: preferredStartDate ? new Date(preferredStartDate) : undefined,
      });
      return res.status(200).json({ success: true, data: updated, message: 'Requirement updated successfully' });
    }

    if (method === 'DELETE') {
      await deleteRequirement(requirementId, user.id);
      return res.status(200).json({ success: true, message: 'Requirement deleted successfully' });
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
