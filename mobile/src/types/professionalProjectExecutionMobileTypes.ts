import type { ProjectStatus } from '../../src/types/contractor/ProjectTypes.js';
import type {
  MobileMilestoneItem,
  MobileDocumentItem,
  MobileTimelineEvent,
} from './projectExecutionMobileTypes.js';

export type ProfessionalProjectAction =
  | 'START_PLANNING'
  | 'START_PROJECT'
  | 'MARK_READY_FOR_COMPLETION'
  | 'MANAGE_MILESTONES'
  | 'UPLOAD_DOCUMENTS'
  | 'MESSAGE_CUSTOMER';

export interface ProfessionalProjectOverview {
  id: string;
  requirementId?: number;
  quotationId?: number;
  title: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceCategory: string;
  status: ProjectStatus;
  statusLabel: string;
  progressPercentage: number;
  startDate?: string;
  targetCompletionDate?: string;
  totalBudget: number;
  totalBudgetFormatted: string;
  amountReceived: number;
  amountReceivedFormatted: string;
  pendingBalance: number;
  pendingBalanceFormatted: string;
  currentMilestoneName?: string;
  nextMilestoneName?: string;
  completedMilestonesCount: number;
  totalMilestonesCount: number;
  supportedActions: ProfessionalProjectAction[];
  updatedAt: string;
}

export interface ProfessionalMilestoneUpdateForm {
  milestoneId: string;
  status?: string;
  completionPercentage?: number;
  notes?: string;
}

export interface ProfessionalDocumentUploadForm {
  name: string;
  fileUrl: string;
  fileType?: string;
}
