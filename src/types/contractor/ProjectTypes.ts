export type ProjectStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'PLANNING'
  | 'READY_TO_START'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'BLOCKED'
  | 'UNDER_REVIEW'
  | 'COMPLETED'
  | 'CUSTOMER_APPROVAL'
  | 'CLOSED'
  | 'ARCHIVED'
  | 'CANCELLED'
  | 'SUSPENDED'
  | 'DELAYED'
  | 'REOPENED';

export interface Project {
  id: string;
  requirementId: number;
  customerId: string;
  providerId: string;
  quotationId: number;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    fullName: string;
    phoneNumber: string;
  };
  provider?: {
    id: string;
    fullName: string;
    businessName: string;
  };
  requirement?: {
    id: number;
    title: string;
    description: string;
    location: string;
  };
  quotation?: {
    id: number;
    totalAmount: number;
    warrantyMonths?: number | null;
  };
  phases?: ProjectPhase[];
  milestones?: ProjectMilestone[];
  workOrders?: WorkOrder[];
  resources?: ProjectResource[];
  progressLogs?: ProgressLog[];
  documents?: ProjectDocument[];
  approvals?: ProjectApproval[];
  timeline?: ProjectTimeline[];
}

export interface ProjectPhase {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  budgetAllocation: number;
  completionPercentage: number;
  status: string;
  createdAt: string;
  workOrders?: WorkOrder[];
}

export interface WorkOrder {
  id: string;
  projectId: string;
  milestoneId?: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string;
  completionNotes?: string;
  assignedResourceId?: string;
  assignedResource?: ProjectResource;
  createdAt: string;
}

export interface ProjectResource {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  assignedAt: string;
  user?: {
    id: string;
    email: string;
    fullName?: string;
  };
}

export interface ProgressLog {
  id: string;
  projectId: string;
  reporterId: string;
  completionPercentage: number;
  notes: string;
  evidenceUrl?: string;
  reportType: string;
  createdAt: string;
  reporter?: {
    id: string;
    email: string;
  };
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  fileUrl: string;
  fileType: string;
  uploadedById: string;
  createdAt: string;
  uploadedBy?: {
    id: string;
    email: string;
  };
}

export interface ProjectApproval {
  id: string;
  projectId: string;
  approverId: string;
  targetType: string;
  targetId: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  approver?: {
    id: string;
    email: string;
  };
}

export interface ProjectTimeline {
  id: string;
  projectId: string;
  actorId: string;
  eventType: string;
  description: string;
  createdAt: string;
  actor?: {
    id: string;
    email: string;
  };
}
