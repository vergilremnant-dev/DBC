/**
 * DBC Mobile Project Execution Types.
 * Domain models for Project Overview, Milestones, Milestone Details, Approval Context, Timeline, & Documents.
 */

import { ProjectApproval, ProjectDocument, ProjectMilestone, ProjectStatus, ProjectTimeline } from '../../src/types/contractor/ProjectTypes';

export type MobileMilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | string;

export interface MobileProjectOverview {
  id: string;
  requirementId?: number;
  quotationId?: number;
  title: string;
  providerId: string;
  providerName: string;
  providerCity?: string;
  providerRating?: number;
  status: ProjectStatus;
  statusLabel: string;
  progressPercentage: number;
  startDate?: string;
  expectedCompletionDate?: string;
  totalBudgetFormatted?: string;
  currentMilestoneName?: string;
  nextMilestoneName?: string;
  hasPendingApproval: boolean;
  pendingApprovalId?: string;
  pendingApprovalTargetId?: string;
  updatedAt: string;
}

export interface MobileMilestoneItem {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  budgetAllocation: number;
  budgetFormatted: string;
  completionPercentage: number;
  status: MobileMilestoneStatus;
  statusLabel: string;
  hasPendingApproval: boolean;
  approvalId?: string;
}

export interface MobileTimelineEvent {
  id: string;
  projectId: string;
  eventType: string;
  description: string;
  actorEmail?: string;
  timestamp: string;
  formattedDate: string;
}

export interface MobileDocumentItem {
  id: string;
  projectId: string;
  name: string;
  fileUrl: string;
  fileType: string;
  uploadedByEmail?: string;
  createdAt: string;
  formattedDate: string;
}

export interface MilestoneApprovalContext {
  projectId: string;
  milestoneId: string;
  approvalId: string;
  milestoneName: string;
}
