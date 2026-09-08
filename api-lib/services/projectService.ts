import { db } from '../utils/db.js';
import { ProjectStatus } from '@prisma/client';
import { validateTransition } from './projectWorkflow.js';

export interface CreateWorkOrderInput {
  milestoneId?: string;
  title: string;
  description?: string;
  priority?: string;
  dueDate?: Date;
  estimatedHours?: number;
  assignedResourceId?: string;
}

export interface ProgressLogInput {
  completionPercentage: number;
  notes: string;
  evidenceUrl?: string;
  reportType?: string;
}

export async function addProjectTimelineEvent(projectId: string, actorId: string, eventType: string, description: string) {
  return await db.projectTimeline.create({
    data: {
      projectId,
      actorId,
      eventType,
      description,
    },
  });
}

export async function getProjectById(id: string) {
  return await db.project.findUnique({
    where: { id },
    include: {
      customer: true,
      provider: true,
      requirement: true,
      quotation: true,
      phases: true,
      milestones: {
        include: { workOrders: true },
        orderBy: { createdAt: 'asc' },
      },
      workOrders: {
        include: { assignedResource: { include: { user: true } } },
        orderBy: { createdAt: 'asc' },
      },
      resources: {
        include: { user: true },
        orderBy: { assignedAt: 'asc' },
      },
      progressLogs: {
        include: { reporter: true },
        orderBy: { createdAt: 'desc' },
      },
      documents: {
        include: { uploadedBy: true },
        orderBy: { createdAt: 'desc' },
      },
      approvals: {
        include: { approver: true },
        orderBy: { createdAt: 'desc' },
      },
      timeline: {
        include: { actor: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function transitionProjectStatus(projectId: string, userId: string, newStatus: ProjectStatus, reason?: string) {
  const existing = await db.project.findUnique({
    where: { id: projectId },
  });

  if (!existing) {
    throw new Error('Project not found');
  }

  // Validate workflow rules
  validateTransition(existing.status, newStatus);

  const updated = await db.project.update({
    where: { id: projectId },
    data: { status: newStatus },
  });

  await addProjectTimelineEvent(
    projectId,
    userId,
    'STATUS_CHANGE',
    reason || `Project status transitioned from ${existing.status} to ${newStatus}`
  );

  return updated;
}

export async function createProjectMilestone(
  projectId: string,
  userId: string,
  name: string,
  description?: string,
  budgetAllocation = 0.0,
  plannedStart?: Date,
  plannedEnd?: Date
) {
  const milestone = await db.projectMilestone.create({
    data: {
      projectId,
      name,
      description: description || null,
      budgetAllocation,
      plannedStart: plannedStart || null,
      plannedEnd: plannedEnd || null,
    },
  });

  await addProjectTimelineEvent(
    projectId,
    userId,
    'MILESTONE',
    `Milestone "${name}" created with budget allocation of INR ${budgetAllocation}`
  );

  return milestone;
}

export async function updateProjectMilestone(
  projectId: string,
  milestoneId: string,
  userId: string,
  updates: {
    name?: string;
    description?: string;
    budgetAllocation?: number;
    plannedStart?: Date;
    plannedEnd?: Date;
    status?: string;
    completionPercentage?: number;
  }
) {
  const existing = await db.projectMilestone.findUnique({
    where: { id: milestoneId },
  });

  if (!existing) {
    throw new Error('Milestone not found');
  }

  if (existing.projectId !== projectId) {
    throw new Error('Milestone does not belong to this project');
  }

  // Validate state transitions if status is changing
  if (updates.status && updates.status !== existing.status) {
    if (existing.status === 'APPROVED' && updates.status !== 'APPROVED') {
      throw new Error('Approved milestone status cannot be changed');
    }
  }

  let actualStart = existing.actualStart;
  let actualEnd = existing.actualEnd;
  let completionPercentage = updates.completionPercentage ?? existing.completionPercentage;

  if (updates.status === 'IN_PROGRESS') {
    if (!actualStart) actualStart = new Date();
    if (updates.completionPercentage === undefined && existing.completionPercentage === 0) {
      completionPercentage = 50.0;
    }
  } else if (updates.status === 'COMPLETED' || updates.status === 'APPROVED') {
    if (!actualEnd) actualEnd = new Date();
    completionPercentage = 100.0;
  } else if (updates.status === 'PENDING') {
    completionPercentage = 0.0;
  }

  const updated = await db.projectMilestone.update({
    where: { id: milestoneId },
    data: {
      name: updates.name ?? existing.name,
      description: updates.description !== undefined ? updates.description : existing.description,
      budgetAllocation: updates.budgetAllocation !== undefined ? updates.budgetAllocation : existing.budgetAllocation,
      plannedStart: updates.plannedStart !== undefined ? updates.plannedStart : existing.plannedStart,
      plannedEnd: updates.plannedEnd !== undefined ? updates.plannedEnd : existing.plannedEnd,
      status: updates.status ?? existing.status,
      completionPercentage,
      actualStart,
      actualEnd,
    },
  });

  await addProjectTimelineEvent(
    projectId,
    userId,
    'MILESTONE_UPDATE',
    `Milestone "${updated.name}" updated (Status: ${updated.status}, Progress: ${updated.completionPercentage}%)`
  );

  return updated;
}

export async function deleteProjectMilestone(projectId: string, milestoneId: string, userId: string) {
  const existing = await db.projectMilestone.findUnique({
    where: { id: milestoneId },
  });

  if (!existing) {
    throw new Error('Milestone not found');
  }

  if (existing.projectId !== projectId) {
    throw new Error('Milestone does not belong to this project');
  }

  if (existing.status === 'APPROVED' || existing.status === 'COMPLETED') {
    throw new Error('Cannot delete a milestone that is already completed or approved');
  }

  await db.projectMilestone.delete({
    where: { id: milestoneId },
  });

  await addProjectTimelineEvent(
    projectId,
    userId,
    'MILESTONE_DELETE',
    `Milestone "${existing.name}" was deleted`
  );

  return { success: true, id: milestoneId };
}

export async function createWorkOrder(projectId: string, userId: string, input: CreateWorkOrderInput) {
  const wo = await db.workOrder.create({
    data: {
      projectId,
      milestoneId: input.milestoneId || null,
      title: input.title,
      description: input.description || null,
      priority: input.priority || 'MEDIUM',
      dueDate: input.dueDate || null,
      estimatedHours: input.estimatedHours || null,
      assignedResourceId: input.assignedResourceId || null,
    },
  });

  await addProjectTimelineEvent(
    projectId,
    userId,
    'WORK_ORDER',
    `Work Order "${input.title}" created with priority ${input.priority}`
  );

  return wo;
}

export async function assignProjectResource(projectId: string, assignerId: string, userId: string, role = 'WORKER') {
  const existing = await db.projectResource.findFirst({
    where: { projectId, userId },
  });

  if (existing) {
    throw new Error('User is already assigned as a resource on this project');
  }

  const resource = await db.projectResource.create({
    data: {
      projectId,
      userId,
      role,
    },
    include: { user: true },
  });

  await addProjectTimelineEvent(
    projectId,
    assignerId,
    'ASSIGNMENT',
    `Assigned ${resource.user.email} to project as ${role}`
  );

  return resource;
}

export async function addProgressLog(projectId: string, reporterId: string, input: ProgressLogInput) {
  const log = await db.progressLog.create({
    data: {
      projectId,
      reporterId,
      completionPercentage: input.completionPercentage,
      notes: input.notes,
      evidenceUrl: input.evidenceUrl || null,
      reportType: input.reportType || 'DAILY',
    },
  });

  await addProjectTimelineEvent(
    projectId,
    reporterId,
    'PROGRESS_UPDATE',
    `Progress updated to ${input.completionPercentage}%: ${input.notes}`
  );

  return log;
}

export async function addProjectDocument(
  projectId: string,
  uploadedById: string,
  name: string,
  fileUrl: string,
  fileType: string
) {
  const doc = await db.projectDocument.create({
    data: {
      projectId,
      name,
      fileUrl,
      fileType,
      uploadedById,
    },
  });

  await addProjectTimelineEvent(
    projectId,
    uploadedById,
    'DOCUMENT',
    `Document "${name}" (${fileType}) uploaded`
  );

  return doc;
}

export async function requestProjectApproval(
  projectId: string,
  requesterId: string,
  targetType: string,
  targetId: string
) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { customer: true },
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const approval = await db.projectApproval.create({
    data: {
      projectId,
      approverId: project.customer.userId, // Customer always approves
      targetType,
      targetId,
    },
  });

  await addProjectTimelineEvent(
    projectId,
    requesterId,
    'APPROVAL',
    `Approval requested from customer for ${targetType} (ID: ${targetId})`
  );

  return approval;
}

export async function submitProjectApproval(approvalId: string, userId: string, isApproved: boolean, remarks?: string) {
  const approval = await db.projectApproval.findUnique({
    where: { id: approvalId },
    include: { project: true },
  });

  if (!approval) {
    throw new Error('Approval request not found');
  }

  if (approval.approverId !== userId) {
    throw new Error('Unauthorized approval signature');
  }

  const status = isApproved ? 'APPROVED' : 'REJECTED';

  const updatedApproval = await db.$transaction(async (tx) => {
    const updated = await tx.projectApproval.update({
      where: { id: approvalId },
      data: {
        status,
        rejectionReason: isApproved ? null : remarks,
      },
    });

    // Handle side-effects (e.g. approve milestone)
    if (approval.targetType === 'MILESTONE') {
      await tx.projectMilestone.update({
        where: { id: approval.targetId },
        data: {
          status,
          actualEnd: isApproved ? new Date() : null,
          completionPercentage: isApproved ? 100.0 : undefined,
        },
      });
    }

    return updated;
  });

  await addProjectTimelineEvent(
    approval.projectId,
    userId,
    'APPROVAL',
    `Customer resolved ${approval.targetType} approval request: ${status}. Remarks: ${remarks || 'None'}`
  );

  return updatedApproval;
}
