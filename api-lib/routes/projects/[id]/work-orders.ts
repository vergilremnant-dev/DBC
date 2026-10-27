import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../../../utils/auth.js';
import { getProjectAccess } from '../../../services/projectAccess.js';
import { db } from '../../../utils/db.js';
import { createWorkOrder } from '../../../services/projectService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;
  const user = verifyToken(req);

  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token' });
  }

  const { id } = req.query;
  const projectId = Array.isArray(id) ? id[0] : id;

  if (!projectId) {
    return res.status(400).json({ success: false, message: 'Missing project ID parameter' });
  }

  try {
    const access = await getProjectAccess(projectId, user);
    if (!access) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    if (!access.isMember && !access.isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have access to this project' });
    }

    if (method === 'GET') {
      const wos = await db.workOrder.findMany({
        where: { projectId },
        include: { assignedResource: { include: { user: true } } },
        orderBy: { createdAt: 'asc' },
      });
      return res.status(200).json({ success: true, data: wos });
    }

    if (method === 'POST') {
      if (!(access.isProvider)) {
        return res.status(403).json({ success: false, message: 'Only the assigned professional can create work orders' });
      }
      const { title, description, priority, dueDate, estimatedHours, assignedResourceId, milestoneId } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, message: 'Missing work order title' });
      }

      const wo = await createWorkOrder(projectId, user.id, {
        title,
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
        assignedResourceId,
        milestoneId,
      });

      return res.status(201).json({
        success: true,
        data: wo,
        message: 'Work Order created successfully',
      });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
