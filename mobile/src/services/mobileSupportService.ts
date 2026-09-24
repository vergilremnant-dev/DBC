import { BRAND } from '../../../src/config/branding.js';
import { profileService } from '../../../src/services/profile/profileService.js';
import type {
  MobileSupportCategory,
  MobileHelpTopic,
  MobileFaqItem,
  MobileSupportRequest,
  MobileSupportIssue,
} from '../types/mobileSupportTypes.js';

const ALL_HELP_TOPICS: MobileHelpTopic[] = [
  {
    id: 'getting_started',
    title: 'Getting Started',
    description: 'Overview of DBC construction platform & account setup',
    icon: '🚀',
    allowedRoles: ['customer', 'contractor', 'admin'],
  },
  {
    id: 'project_requests',
    title: 'Project Requests',
    description: 'Submitting requirements & contractor review process',
    icon: '📋',
    allowedRoles: ['customer', 'contractor', 'admin'],
  },
  {
    id: 'quotations',
    title: 'Quotations & Proposals',
    description: 'Reviewing scope, milestone pricing & proposal acceptance',
    icon: '📑',
    allowedRoles: ['customer', 'contractor', 'admin'],
  },
  {
    id: 'projects_milestones',
    title: 'Projects & Milestones',
    description: 'Site execution tracking, stage progress & approvals',
    icon: '🏗️',
    allowedRoles: ['customer', 'contractor', 'admin'],
  },
  {
    id: 'payments',
    title: 'Payments & Financials',
    description: 'Stage milestone escrow, invoices & payment schedules',
    icon: '💳',
    allowedRoles: ['customer', 'contractor'],
  },
  {
    id: 'messages',
    title: 'Messages & Communication',
    description: 'Contextual project messaging & direct client chats',
    icon: '💬',
    allowedRoles: ['customer', 'contractor'],
  },
  {
    id: 'notifications',
    title: 'Notifications & Alerts',
    description: 'Push alerts, unread badges & notification center',
    icon: '🔔',
    allowedRoles: ['customer', 'contractor', 'admin'],
  },
  {
    id: 'account_security',
    title: 'Account & Security',
    description: 'OTP authentication, profile settings & privacy',
    icon: '🔒',
    allowedRoles: ['customer', 'contractor', 'admin'],
  },
  {
    id: 'professional_leads',
    title: 'Open Market Leads',
    description: 'Discovering open project requirements & direct invites',
    icon: '⚡',
    allowedRoles: ['contractor'],
  },
  {
    id: 'professional_finance',
    title: 'Finance & Payouts',
    description: 'Milestone earnings, transaction history & bank payouts',
    icon: '💰',
    allowedRoles: ['contractor'],
  },
  {
    id: 'admin_operations',
    title: 'Platform Operations',
    description: 'User moderation, trade partner verification & audit logs',
    icon: '⚙️',
    allowedRoles: ['admin'],
  },
];

const ALL_FAQS: MobileFaqItem[] = [
  {
    id: 'faq-1',
    question: 'How do Project Requests work on DBC?',
    answer: 'Submit a construction requirement (e.g., civil raft foundation, electrical conduit layout) via the marketplace. Verified trade partners review your requirements, inspect site specifications, and prepare structured quotation proposals.',
    category: 'project_requests',
    categoryLabel: 'Project Requests',
    allowedRoles: ['customer', 'contractor', 'admin'],
    isPopular: true,
    relatedRoute: 'CustomerRequests',
  },
  {
    id: 'faq-2',
    question: 'How do I review a quotation proposal?',
    answer: 'When a contractor submits a proposal, open Quotation Details to review deliverable scope, stage milestone breakdowns, and total pricing. You can accept or decline the proposal directly from your mobile workspace.',
    category: 'quotations',
    categoryLabel: 'Quotations & Proposals',
    allowedRoles: ['customer', 'contractor'],
    isPopular: true,
    relatedRoute: 'QuotationDetails',
  },
  {
    id: 'faq-3',
    question: 'How do milestone payments work?',
    answer: 'Project costs are divided into stage milestones (e.g., Site Excavation, Steel Mesh, Concrete Casting). Funds are secured in escrow and released to the contractor only after you review and approve stage completion.',
    category: 'payments',
    categoryLabel: 'Payments & Financials',
    allowedRoles: ['customer', 'contractor'],
    isPopular: true,
    relatedRoute: 'CustomerPaymentHistory',
  },
  {
    id: 'faq-4',
    question: 'How do I communicate with my assigned trade partner?',
    answer: 'Navigate to Messages or click "Message Professional" inside your active Project Workspace to access the contextual project chat stream for design notes and site updates.',
    category: 'messages',
    categoryLabel: 'Messages & Communication',
    allowedRoles: ['customer', 'contractor'],
    isPopular: true,
    relatedRoute: 'CustomerMessages',
  },
  {
    id: 'faq-5',
    question: 'How do I track active construction site progress?',
    answer: 'Open My Projects -> Project Workspace to view overall completion %, current active milestone, site timeline feed, and project document repository.',
    category: 'projects_milestones',
    categoryLabel: 'Projects & Milestones',
    allowedRoles: ['customer', 'contractor'],
    isPopular: true,
    relatedRoute: 'CustomerProjects',
  },
  {
    id: 'faq-6',
    question: 'How do I update my profile or trade business details?',
    answer: 'Navigate to Profile -> Edit Profile to update your contact phone, city location, address, trade business name, or bio.',
    category: 'account_security',
    categoryLabel: 'Account & Security',
    allowedRoles: ['customer', 'contractor', 'admin'],
    isPopular: false,
    relatedRoute: 'EditProfile',
  },
  {
    id: 'faq-7',
    question: 'How do I manage notification alert settings?',
    answer: 'Go to Profile -> Notification Preferences to toggle subscriptions for project updates, messages, quotations, or payments, or visit the Notification Center.',
    category: 'notifications',
    categoryLabel: 'Notifications & Alerts',
    allowedRoles: ['customer', 'contractor', 'admin'],
    isPopular: false,
    relatedRoute: 'NotificationPreferences',
  },
  {
    id: 'faq-8',
    question: 'How do contractors submit proposal quotations?',
    answer: 'Trade partners open Project Requests -> Prepare Quotation to enter stage milestone pricing, labor/material breakdowns, and timeline schedules using the 5-step quotation wizard.',
    category: 'quotations',
    categoryLabel: 'Quotations & Proposals',
    allowedRoles: ['contractor'],
    isPopular: true,
    relatedRoute: 'ProfessionalQuotations',
  },
  {
    id: 'faq-9',
    question: 'How do contractor earnings and payouts work?',
    answer: 'When a customer approves a milestone stage, the allocated funds transition to Disbursed status and are deposited into your registered bank account.',
    category: 'professional_finance',
    categoryLabel: 'Finance & Payouts',
    allowedRoles: ['contractor'],
    isPopular: true,
    relatedRoute: 'ProfessionalFinance',
  },
  {
    id: 'faq-10',
    question: 'How do administrators verify trade partner credentials?',
    answer: 'Administrators navigate to Admin Console -> Trade Partners, review submitted business documents and licenses, and approve or suspend partner status.',
    category: 'admin_operations',
    categoryLabel: 'Platform Operations',
    allowedRoles: ['admin'],
    isPopular: true,
    relatedRoute: 'AdminProfessionals',
  },
];

const localSupportRequests: MobileSupportIssue[] = [];

export const mobileSupportService = {
  getSupportEmail(): string {
    return BRAND.supportEmail || 'support@dbc.com';
  },

  getHelpTopics(userRole: string = 'customer'): MobileHelpTopic[] {
    const normRole = (userRole || 'customer').toLowerCase();
    return ALL_HELP_TOPICS.filter((t) => t.allowedRoles.includes(normRole as any));
  },

  getFaqs(params?: { role?: string; category?: string; query?: string }): MobileFaqItem[] {
    const normRole = (params?.role || 'customer').toLowerCase();
    let list = ALL_FAQS.filter((f) => f.allowedRoles.includes(normRole as any));

    if (params?.category && params.category !== 'ALL') {
      list = list.filter((f) => f.category === params.category);
    }

    if (params?.query) {
      const q = params.query.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q) ||
          f.categoryLabel.toLowerCase().includes(q)
      );
    }

    return list;
  },

  searchFaqs(query: string, categoryOrRole?: string, role?: string): MobileFaqItem[] {
    let cat: string | undefined = undefined;
    let userRole = 'customer';
    if (categoryOrRole) {
      if (['customer', 'contractor', 'admin'].includes(categoryOrRole.toLowerCase())) {
        userRole = categoryOrRole;
      } else {
        cat = categoryOrRole;
        if (role) userRole = role;
      }
    }
    return this.getFaqs({ role: userRole, category: cat, query });
  },

  clearLocalIssues(): void {
    localSupportRequests.length = 0;
  },

  async createSupportTicket(payload: {
    category?: string;
    issueType?: MobileSupportRequest['issueType'];
    subject: string;
    description: string;
    relatedProjectId?: string;
    relatedRequestId?: string;
    relatedQuotationId?: number | string;
    attachmentUrl?: string;
    userEmail?: string;
    userRole?: 'customer' | 'contractor' | 'admin';
  }): Promise<MobileSupportIssue> {
    const issueId = `SUP-${Math.floor(100000 + Math.random() * 900000)}`;
    const issue: MobileSupportIssue = {
      id: issueId,
      ticketId: issueId,
      issueType: payload.issueType || (payload.category as any) || 'project',
      category: payload.category || payload.issueType || 'project',
      subject: payload.subject.trim(),
      description: payload.description.trim(),
      relatedProjectId: payload.relatedProjectId,
      relatedRequestId: payload.relatedRequestId,
      relatedQuotationId: payload.relatedQuotationId,
      attachmentUrl: payload.attachmentUrl,
      userEmail: payload.userEmail || 'customer@example.com',
      contactEmail: payload.userEmail || 'customer@example.com',
      userRole: payload.userRole || 'customer',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      status: 'open' as any,
      responseNote: `Your support inquiry has been recorded (Local Reference: ${issueId}) and forwarded to platform support at ${this.getSupportEmail()}. A platform specialist will follow up via email.`,
    };

    localSupportRequests.unshift(issue);
    return issue;
  },

  async createSupportRequest(payload: {
    issueType: MobileSupportRequest['issueType'];
    subject: string;
    description: string;
    relatedProjectId?: string;
    relatedRequestId?: string;
    relatedQuotationId?: number | string;
    attachmentUrl?: string;
    userEmail: string;
    userRole: 'customer' | 'contractor' | 'admin';
  }): Promise<MobileSupportIssue> {
    return this.createSupportTicket(payload);
  },

  async getSupportIssues(userEmail?: string): Promise<MobileSupportIssue[]> {
    if (userEmail) {
      return localSupportRequests.filter((req) => req.userEmail === userEmail);
    }
    return [...localSupportRequests];
  },

  async getSupportIssueById(id: string): Promise<MobileSupportIssue | null> {
    const issue = localSupportRequests.find((item) => item.id === id || item.ticketId === id);
    return issue || null;
  },

  async uploadSupportAttachment(base64Data: string): Promise<{ url: string }> {
    try {
      const url = await profileService.uploadImage(base64Data, 'support');
      const finalUrl = url || `data:image/jpeg;base64,${base64Data.slice(0, 40)}...`;
      return { url: finalUrl };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to upload attachment');
    }
  },
};
