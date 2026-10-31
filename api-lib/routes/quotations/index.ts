import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../../utils/auth.js';
import { db } from '../../utils/db.js';
import { createQuotation } from '../../services/quotationService.js';
import { QuotationStatus } from '@prisma/client';
import { toPublicProvider } from '../../utils/publicProvider.js';
import { ProviderAccessError, requireVerifiedProvider } from '../../services/providerEligibility.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;
  const user = verifyToken(req);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
  }

  if (method === 'POST') {
    try {
      // Only ACTIVE, DBC-verified professionals may quote (role and profile status read from the database).
      const gate = await requireVerifiedProvider(user);
      if (!gate.ok) return res.status(gate.status).json({ success: false, code: gate.code, message: gate.message });
      const providerProfile = gate.provider;

      const {
        requirementId,
        priceModel,
        totalAmount,
        estimatedDurationDays,
        warrantyMonths,
        proposal,
        milestones,
        attachments,
      } = req.body;

      if (!requirementId || !priceModel || totalAmount === undefined || !estimatedDurationDays || !proposal) {
        return res.status(400).json({ success: false, message: 'Missing required quotation parameters' });
      }

      const quotation = await createQuotation(providerProfile.id, user.id, {
        requirementId: Number(requirementId),
        priceModel,
        totalAmount: Number(totalAmount),
        estimatedDurationDays: Number(estimatedDurationDays),
        warrantyMonths: warrantyMonths ? Number(warrantyMonths) : undefined,
        proposal,
        milestones: milestones?.map((m: any) => ({
          ...m,
          cost: Number(m.cost),
          durationDays: m.durationDays ? Number(m.durationDays) : undefined,
          dueAt: m.dueAt ? new Date(m.dueAt) : undefined,
        })),
        attachments,
      });

      return res.status(201).json({
        success: true,
        data: quotation,
        message: 'Quotation created successfully',
      });
    } catch (err: any) {
      if (err instanceof ProviderAccessError) return res.status(403).json({ success: false, code: err.code, message: err.message });
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (method === 'GET') {
    const { requirementId, status, limit = '10', offset = '0' } = req.query;
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const offsetNum = Math.max(0, Number(offset));

    try {
      const whereClause: any = {};

      if (requirementId) {
        whereClause.requirementId = Number(requirementId);
      }

      // Check user role:
      const userProfile = await db.user.findUnique({ where: { id: user.id } });

      if (userProfile?.role === 'PROVIDER') {
        const providerProfile = await db.providerProfile.findFirst({ where: { userId: user.id } });
        whereClause.providerId = providerProfile?.id || 'non-existent';
      } else if (userProfile?.role === 'CUSTOMER') {
        // Customers can see submitted quotations for their requirements
        const customerProfile = await db.customerProfile.findUnique({ where: { userId: user.id } });
        whereClause.requirement = { customerId: customerProfile?.id || 'non-existent' };
        whereClause.status = { not: QuotationStatus.DRAFT }; // Hide drafts from customers
      }

      if (status) {
        // Customers never see drafts, even when filtering by status.
        if (userProfile?.role === 'CUSTOMER' && status === QuotationStatus.DRAFT) {
          return res.status(200).json({ success: true, data: [] });
        }
        whereClause.status = status as QuotationStatus;
      }

      const quotations = await db.quotation.findMany({
        where: whereClause,
        take: limitNum,
        skip: offsetNum,
        orderBy: { createdAt: 'desc' },
        include: {
          provider: true,
          proposal: true,
          milestones: true,
        },
      });

      return res.status(200).json({
        success: true,
        // The professional is shown with public profile fields only (no login email or account ids).
        data: quotations.map((q: any) => ({ ...q, provider: q.provider ? toPublicProvider(q.provider) : null })),
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
}
