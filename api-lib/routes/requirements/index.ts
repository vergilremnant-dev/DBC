import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../../utils/auth.js';
import { db } from '../../utils/db.js';
import { createRequirement } from '../../services/requirementService.js';
import { RequirementStatus } from '@prisma/client';
import { INVITE_CONVERSATION_TYPE, toProviderView } from '../../services/projectRequestService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;

  if (method === 'POST') {
    const user = verifyToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
    }

    try {
      const customerProfile = await db.customerProfile.findUnique({
        where: { userId: user.id },
      });

      if (!customerProfile) {
        return res.status(400).json({
          success: false,
          message: 'Customer profile required before submitting a requirement.',
        });
      }

      const {
        title,
        description,
        serviceCategory,
        serviceCategoryId,
        location,
        budgetMin,
        budgetMax,
        preferredStartDate,
        status,
        attachments,
      } = req.body;

      if (!title || !description || !serviceCategory || !location || budgetMin === undefined || budgetMax === undefined) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const requirement = await createRequirement(customerProfile.id, user.id, {
        title,
        description,
        serviceCategory,
        serviceCategoryId: serviceCategoryId ? Number(serviceCategoryId) : null,
        location,
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
        preferredStartDate: preferredStartDate ? new Date(preferredStartDate) : null,
        // Clients may only create drafts or submitted/published requests; later states are workflow-driven.
        status: ['DRAFT', 'SUBMITTED', 'PUBLISHED'].includes(String(status)) ? (status as RequirementStatus) : undefined,
        attachments,
      });

      return res.status(201).json({
        id: requirement.id,
        status: requirement.status,
        message: 'Requirement created successfully',
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  if (method === 'GET') {
    // Discovery search feed for providers / admin
    const user = verifyToken(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
    }

    const {
      search,
      categoryId,
      location,
      status,
      minBudget,
      maxBudget,
      limit = '10',
      cursor,
    } = req.query;

    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const cursorNum = cursor ? Number(cursor) : undefined;

    try {
      const whereClause: any = {};

      // Filter by category
      if (categoryId) {
        whereClause.serviceCategoryId = Number(categoryId);
      }

      // Filter by location
      if (location) {
        whereClause.location = { contains: String(location), mode: 'insensitive' };
      }

      // Filter by status (providers see PUBLISHED, admins see everything, customers see their own)
      const userProfile = await db.user.findUnique({ where: { id: user.id } });
      
      if (userProfile?.role === 'PROVIDER') {
        // Providers browse open requests only (not drafts, other customers' later stages, or requests invited to others).
        whereClause.status = RequirementStatus.PUBLISHED;
        whereClause.conversations = { none: { conversationType: INVITE_CONVERSATION_TYPE } };
      } else if (userProfile?.role === 'CUSTOMER') {
        const customerProfile = await db.customerProfile.findUnique({ where: { userId: user.id } });
        whereClause.customerId = customerProfile?.id || 'non-existent';
        if (status) {
          whereClause.status = status as RequirementStatus;
        }
      } else if (userProfile?.role === 'ADMIN') {
        if (status) {
          whereClause.status = status as RequirementStatus;
        }
      }

      // Filter by budget range
      if (minBudget !== undefined) {
        whereClause.budgetMin = { gte: Number(minBudget) };
      }
      if (maxBudget !== undefined) {
        whereClause.budgetMax = { lte: Number(maxBudget) };
      }

      // Keyword text search matching title or description
      if (search) {
        whereClause.OR = [
          { title: { contains: String(search), mode: 'insensitive' } },
          { description: { contains: String(search), mode: 'insensitive' } },
        ];
      }

      const requirements = await db.requirement.findMany({
        where: whereClause,
        take: limitNum,
        skip: cursorNum ? 1 : 0,
        cursor: cursorNum ? { id: cursorNum } : undefined,
        orderBy: { id: 'asc' },
        include: {
          customer: true,
          attachments: true,
        },
      });

      const nextCursor = requirements.length === limitNum ? requirements[requirements.length - 1].id : null;

      return res.status(200).json({
        success: true,
        // Professionals never receive customer records from the open feed.
        data: userProfile?.role === 'PROVIDER' ? requirements.map((r) => toProviderView(r, { invited: false, engaged: false })) : requirements,
        nextCursor,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
}
