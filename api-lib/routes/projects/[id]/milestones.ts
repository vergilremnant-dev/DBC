import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '../../../utils/auth.js';
import { db } from '../../../utils/db.js';
import { createProjectMilestone, updateProjectMilestone, deleteProjectMilestone } from '../../../services/projectService.js';

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
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { customer: true, provider: true },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const isCustomer = project.customer?.userId === user.id;
    const isProvider = project.provider?.userId === user.id;

    if (!isCustomer && !isProvider) {
      return res.status(403).json({ success: false, message: 'Forbidden: You do not have access to this project' });
    }

    if (method === 'GET') {
      const milestones = await db.projectMilestone.findMany({
        where: { projectId },
        include: { workOrders: true },
        orderBy: { createdAt: 'asc' },
      });
      return res.status(200).json({ success: true, data: milestones });
    }

    if (method === 'POST') {
      if (!isProvider) {
        return res.status(403).json({ success: false, message: 'Only assigned professional can create project milestones' });
      }

      const { name, description, budgetAllocation, plannedStart, plannedEnd, status } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, message: 'Missing milestone name' });
      }

      const ms = await createProjectMilestone(
        projectId,
        user.id,
        name,
        description,
        budgetAllocation ? Number(budgetAllocation) : undefined,
        plannedStart ? new Date(plannedStart) : undefined,
        plannedEnd ? new Date(plannedEnd) : undefined
      );

      if (status && status !== ms.status) {
        const updated = await updateProjectMilestone(projectId, ms.id, user.id, { status });
        return res.status(201).json({
          success: true,
          data: updated,
          message: 'Milestone created successfully',
        });
      }

      return res.status(201).json({
        success: true,
        data: ms,
        message: 'Milestone created successfully',
      });
    }

    if (method === 'PUT') {
      if (!isProvider) {
        return res.status(403).json({ success: false, message: 'Only assigned professional can update project milestones' });
      }

      const { milestoneId, name, description, budgetAllocation, plannedStart, plannedEnd, status, completionPercentage } = req.body;

      if (!milestoneId) {
        return res.status(400).json({ success: false, message: 'Missing milestoneId' });
      }

      const updated = await updateProjectMilestone(projectId, milestoneId, user.id, {
        name,
        description,
        budgetAllocation: budgetAllocation !== undefined ? Number(budgetAllocation) : undefined,
        plannedStart: plannedStart ? new Date(plannedStart) : undefined,
        plannedEnd: plannedEnd ? new Date(plannedEnd) : undefined,
        status,
        completionPercentage: completionPercentage !== undefined ? Number(completionPercentage) : undefined,
      });

      return res.status(200).json({
        success: true,
        data: updated,
        message: 'Milestone updated successfully',
      });
    }

    if (method === 'DELETE') {
      if (!isProvider) {
        return res.status(403).json({ success: false, message: 'Only assigned professional can delete project milestones' });
      }

      const milestoneId = (req.body?.milestoneId || req.query.milestoneId) as string;

      if (!milestoneId) {
        return res.status(400).json({ success: false, message: 'Missing milestoneId parameter' });
      }

      const result = await deleteProjectMilestone(projectId, milestoneId, user.id);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Milestone deleted successfully',
      });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

