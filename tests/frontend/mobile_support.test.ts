import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mobileSupportService } from '../../mobile/src/services/mobileSupportService.js';
import { mobileAuthStore } from '../../mobile/src/state/authStore.js';
import { profileService } from '../../src/services/profile/profileService.js';
import {
  HelpCenterScreenController,
  renderHelpCenterScreen,
} from '../../mobile/src/screens/support/HelpCenterScreen.js';
import {
  FAQScreenController,
  renderFAQScreen,
} from '../../mobile/src/screens/support/FAQScreen.js';
import {
  ContactSupportScreenController,
  renderContactSupportScreen,
} from '../../mobile/src/screens/support/ContactSupportScreen.js';
import {
  SupportIssueDetailsScreenController,
  renderSupportIssueDetailsScreen,
} from '../../mobile/src/screens/support/SupportIssueDetailsScreen.js';

vi.mock('../../src/services/profile/profileService.js', () => ({
  profileService: {
    uploadImage: vi.fn(),
  },
}));

describe('Module 48 — Mobile Help, Support & Issue Resolution', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mobileSupportService.clearLocalIssues();
    await mobileAuthStore.setSession(
      {
        id: 'u-customer-1',
        email: 'customer@example.com',
        name: 'Anand Sharma',
        role: 'customer',
      },
      'test_token_customer'
    );
  });

  describe('1. Mobile Support Service Capabilities', () => {
    it('returns role-aware help topics for customers', async () => {
      const topics = await mobileSupportService.getHelpTopics('customer');
      expect(topics.length).toBeGreaterThan(0);
      const categoryKeys = topics.map((t) => t.id);
      expect(categoryKeys).toContain('project_requests');
      expect(categoryKeys).toContain('payments');
    });

    it('returns role-aware help topics for contractors', async () => {
      const topics = await mobileSupportService.getHelpTopics('contractor');
      const categoryKeys = topics.map((t) => t.id);
      expect(categoryKeys).toContain('quotations');
      expect(categoryKeys).toContain('professional_finance');
    });

    it('returns role-aware help topics for admins', async () => {
      const topics = await mobileSupportService.getHelpTopics('admin');
      const categoryKeys = topics.map((t) => t.id);
      expect(categoryKeys).toContain('admin_operations');
    });

    it('searches FAQs by text query and category filter', async () => {
      const results = await mobileSupportService.searchFaqs('milestone', 'customer');
      expect(results.length).toBeGreaterThan(0);
      const match = results.some(
        (r) => r.question.toLowerCase().includes('milestone') || r.answer.toLowerCase().includes('milestone')
      );
      expect(match).toBe(true);
    });

    it('creates support ticket and stores support issue locally', async () => {
      const issue = await mobileSupportService.createSupportTicket({
        category: 'payments',
        subject: 'Milestone payment delayed',
        description: 'Completed foundation stage but milestone verification is pending.',
        relatedProjectId: 'proj-101',
      });

      expect(issue.ticketId).toMatch(/^SUP-\d{6}$/);
      expect(issue.category).toBe('payments');
      expect(issue.status).toBe('open');
      expect(issue.subject).toBe('Milestone payment delayed');
      expect(issue.contactEmail).toBe('customer@example.com');
      expect(issue.responseNote).toContain('support@dbc.com');
    });

    it('uploads support screenshot attachment using profileService', async () => {
      vi.mocked(profileService.uploadImage).mockResolvedValue('https://dbc.com/uploads/issue1.png');

      const res = await mobileSupportService.uploadSupportAttachment('data:image/png;base64,abc');
      expect(res.url).toBe('https://dbc.com/uploads/issue1.png');
      expect(profileService.uploadImage).toHaveBeenCalledWith('data:image/png;base64,abc', 'support');
    });
  });

  describe('2. Help Center Screen', () => {
    it('initializes and renders help center with topics and FAQs', async () => {
      const controller = new HelpCenterScreenController({ userRole: 'customer' });
      await controller.init();

      const html = renderHelpCenterScreen(controller);
      expect(html).toContain('Help & Support Center');
      expect(html).toContain('Customer Support Topics');
      expect(html).toContain('Browse FAQs');
      expect(html).toContain('support@dbc.com');
    });

    it('updates query and selected category filter in state', async () => {
      const controller = new HelpCenterScreenController({ userRole: 'customer' });
      await controller.init();

      controller.setCategoryFilter('payments');
      expect(controller.getState().selectedCategory).toBe('payments');

      controller.setQuery('payment');
      expect(controller.getState().searchQuery).toBe('payment');
    });
  });

  describe('3. FAQ Screen', () => {
    it('initializes and toggles accordion items', async () => {
      const controller = new FAQScreenController({ userRole: 'customer' });
      await controller.init();

      expect(controller.getState().faqs.length).toBeGreaterThan(0);
      const firstFaqId = controller.getState().faqs[0].id;

      controller.toggleFaq(firstFaqId);
      expect(controller.getState().expandedFaqId).toBe(firstFaqId);

      controller.toggleFaq(firstFaqId);
      expect(controller.getState().expandedFaqId).toBeNull();
    });

    it('renders FAQ screen with search bar and filter badges', async () => {
      const controller = new FAQScreenController({ userRole: 'contractor' });
      await controller.init();

      const html = renderFAQScreen(controller);
      expect(html).toContain('Frequently Asked Questions');
      expect(html).toContain('Search FAQs');
    });
  });

  describe('4. Contact Support Screen', () => {
    it('validates required fields on submission', async () => {
      const controller = new ContactSupportScreenController({ userRole: 'customer' });
      await controller.init();

      await controller.submit();
      expect(controller.getState().error).toBe('Please provide both a subject and a description of your issue.');
    });

    it('submits support issue successfully when required fields are provided', async () => {
      const controller = new ContactSupportScreenController({
        userRole: 'customer',
        initialProjectId: 'proj-555',
      });
      await controller.init();

      controller.updateField('subject', 'Need help with handover document');
      controller.updateField('description', 'Unable to sign off on final handover checklist.');

      await controller.submit();

      expect(controller.getState().submittedIssue).not.toBeNull();
      expect(controller.getState().submittedIssue?.ticketId).toMatch(/^SUP-/);

      const html = renderContactSupportScreen(controller);
      expect(html).toContain('Support Request Logged');
      expect(html).toContain('Ticket ID:');
    });
  });

  describe('5. Support Issue Details Screen', () => {
    it('loads and renders support issue details', async () => {
      const issue = await mobileSupportService.createSupportTicket({
        category: 'quotations',
        subject: 'Quotation clarification',
        description: 'Requesting revision on structural steel specifications.',
      });

      const controller = new SupportIssueDetailsScreenController({ ticketId: issue.ticketId });
      await controller.init();

      expect(controller.getState().issue?.ticketId).toBe(issue.ticketId);

      const html = renderSupportIssueDetailsScreen(controller);
      expect(html).toContain(issue.ticketId);
      expect(html).toContain('Quotation clarification');
      expect(html).toContain('support@dbc.com');
    });
  });
});
