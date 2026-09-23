export type MobileSupportCategory =
  | 'getting_started'
  | 'project_requests'
  | 'quotations'
  | 'projects_milestones'
  | 'payments'
  | 'messages'
  | 'notifications'
  | 'account_security'
  | 'professional_leads'
  | 'professional_finance'
  | 'admin_operations';

export interface MobileHelpTopic {
  id: MobileSupportCategory;
  title: string;
  description: string;
  icon: string;
  allowedRoles: Array<'customer' | 'contractor' | 'admin'>;
}

export interface MobileFaqItem {
  id: string;
  question: string;
  answer: string;
  category: MobileSupportCategory;
  categoryLabel: string;
  allowedRoles: Array<'customer' | 'contractor' | 'admin'>;
  isPopular?: boolean;
  relatedRoute?: string;
  relatedParams?: Record<string, any>;
}

export type MobileSupportIssueType =
  | 'project'
  | 'quotation'
  | 'payment'
  | 'account'
  | 'technical'
  | 'communication'
  | 'other';

export interface MobileSupportRequest {
  id: string;
  issueType: MobileSupportIssueType;
  subject: string;
  description: string;
  relatedProjectId?: string;
  relatedRequestId?: string;
  relatedQuotationId?: number | string;
  attachmentUrl?: string;
  userEmail: string;
  userRole: 'customer' | 'contractor' | 'admin';
  createdAt: string;
  status: 'SUBMITTED' | 'IN_REVIEW' | 'RESOLVED';
}

export interface MobileSupportIssue extends MobileSupportRequest {
  updatedAt: string;
  responseNote?: string;
  ticketId?: string;
  category?: string;
  contactEmail?: string;
}
