import { describe, it, expect } from 'vitest';
import {
  mobileTouchTargets,
  mobileColors,
  mobileTypography,
  mobileSpacing,
  mobileBorderRadius,
} from '../../mobile/src/theme/themeTokens.js';
import {
  determineInitialNavigationStack,
  resolvePostAuthNavigation,
  mobileNavigationRoutes,
} from '../../mobile/src/navigation/rootNavigation.js';
import { mobileDeepLinkService } from '../../mobile/src/services/mobileDeepLinkService.js';
import { mobileSupportService } from '../../mobile/src/services/mobileSupportService.js';
import { BRAND } from '../../src/config/branding.js';

describe('Module 49 — Mobile UX Polish, Design System Consistency & Production Readiness', () => {
  describe('1. Touch Target & Design Token Compliance', () => {
    it('enforces minimum 44px touch target standard', () => {
      expect(mobileTouchTargets.minTouchArea).toBeGreaterThanOrEqual(44);
      expect(mobileTouchTargets.buttonHeight).toBeGreaterThanOrEqual(44);
      expect(mobileTouchTargets.inputHeight).toBeGreaterThanOrEqual(44);
    });

    it('exposes standardized design system theme tokens', () => {
      expect(mobileColors.primary).toBeDefined();
      expect(mobileColors.surface).toBe('#FFFFFF');
      expect(mobileColors.border).toBeDefined();
      expect(mobileTypography.fontSize.xs).toBe(12);
      expect(mobileTypography.fontSize.title).toBe(30);
      expect(mobileSpacing.md).toBe(16);
      expect(mobileBorderRadius.md).toBe(12);
    });
  });

  describe('2. Navigation Architecture & Route Integrity', () => {
    it('registers public, auth, customer, and professional tab routes', () => {
      expect(mobileNavigationRoutes.public).toContain('MarketplaceHome');
      expect(mobileNavigationRoutes.public).toContain('CategorySearch');
      expect(mobileNavigationRoutes.auth).toContain('Login');
      expect(mobileNavigationRoutes.auth).toContain('OtpVerification');
      expect(mobileNavigationRoutes.customerTabs.map((t) => t.route)).toContain('Overview');
      expect(mobileNavigationRoutes.professionalTabs.map((t) => t.route)).toContain('Dashboard');
    });

    it('resolves initial stack based on authentication status and user role', () => {
      expect(determineInitialNavigationStack({ status: 'unauthenticated' })).toBe('Public');
      expect(
        determineInitialNavigationStack({
          status: 'authenticated',
          user: { id: 'u-1', email: 'c@dbc.com', name: 'Contractor', role: 'contractor' },
        })
      ).toBe('ProfessionalTab');
      expect(
        determineInitialNavigationStack({
          status: 'authenticated',
          user: { id: 'u-2', email: 'cust@dbc.com', name: 'Customer', role: 'customer' },
        })
      ).toBe('CustomerTab');
    });

    it('protects contractor and admin deep-link targets against unauthorized roles', () => {
      const adminTarget = mobileDeepLinkService.resolveDeepLink('/admin/projects', 'customer');
      const evalCustomer = mobileDeepLinkService.evaluateTargetAccess(adminTarget, {
        status: 'authenticated',
        user: { id: 'u-2', email: 'cust@dbc.com', name: 'Customer', role: 'customer' },
      });

      expect(evalCustomer.canNavigate).toBe(false);
      expect(evalCustomer.reason).toBe('UNAUTHORIZED_ROLE_MISMATCH');

      const evalAdmin = mobileDeepLinkService.evaluateTargetAccess(adminTarget, {
        status: 'authenticated',
        user: { id: 'u-3', email: 'admin@dbc.com', name: 'Admin', role: 'admin' },
      });

      expect(evalAdmin.canNavigate).toBe(true);
    });
  });

  describe('3. Terminology & Construction Model Compliance', () => {
    it('uses DBC construction marketplace terminology across help topics and FAQs', async () => {
      const customerTopics = await mobileSupportService.getHelpTopics('customer');
      const topicTitles = customerTopics.map((t) => t.title.toLowerCase());
      
      const containsConstructionTerm = topicTitles.some(
        (t) => t.includes('project') || t.includes('quotation') || t.includes('milestone') || t.includes('payment')
      );
      expect(containsConstructionTerm).toBe(true);

      const faqs = mobileSupportService.getFaqs({ role: 'customer' });
      const faqText = faqs.map((f) => (f.question + ' ' + f.answer).toLowerCase()).join(' ');

      // Enforce zero legacy gig terminology
      expect(faqText).not.toContain('gig worker');
      expect(faqText).not.toContain('instant booking');
      expect(faqText).not.toContain('hourly booking');
      expect(faqText).not.toContain('worker dispatch');
    });
  });

  describe('4. Support Channel & Module 48 Audit Verification', () => {
    it('uses authoritative BRAND support email for support channels', () => {
      const email = mobileSupportService.getSupportEmail();
      expect(email).toBe(BRAND.supportEmail);
      expect(email).toBe('support@dbc.com');
    });

    it('generates local support ticket instance with email dispatch notice', async () => {
      const ticket = await mobileSupportService.createSupportTicket({
        category: 'project',
        subject: 'Site inspection inquiry',
        description: 'Requesting clarification on site excavation progress.',
      });

      expect(ticket.id).toMatch(/^SUP-\d{6}$/);
      expect(ticket.responseNote).toContain('support@dbc.com');
      expect(ticket.status).toBe('open');
    });
  });
});
