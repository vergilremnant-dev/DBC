import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Phase 1 Final Responsive QA & Regression Audit (Module 28)', () => {

  const projectRoot = path.resolve(__dirname, '../../');

  describe('1. Global Responsive System & Overflow Protection (Module 23)', () => {
    it('should enforce min-width 320px and overflow-x hidden in index.css', () => {
      const cssPath = path.join(projectRoot, 'src/index.css');
      const content = fs.readFileSync(cssPath, 'utf-8');

      expect(content).toContain('min-width: 320px');
      expect(content).toContain('overflow-x: hidden');
      expect(content).toContain('.no-scrollbar');
    });
  });

  describe('2. Navigation & Mobile Interaction (Module 24)', () => {
    it('should enforce body scroll locking & Escape listener in MobileDrawer', () => {
      const drawerPath = path.join(projectRoot, 'src/components/navigation/MobileDrawer.tsx');
      const content = fs.readFileSync(drawerPath, 'utf-8');

      expect(content).toContain('overflow = \'hidden\'');
      expect(content).toContain('Escape');
    });

    it('should calculate active sub-routes cleanly in MobileBottomNav', () => {
      const navPath = path.join(projectRoot, 'src/components/navigation/MobileBottomNav.tsx');
      const content = fs.readFileSync(navPath, 'utf-8');

      expect(content).toContain('location.pathname');
      expect(content).toContain('startsWith');
    });
  });

  describe('3. Responsive Forms, Modals & Touch Targets (Module 25)', () => {
    it('should constrain modal overlays with max-h-[85vh] and overflow-y-auto', () => {
      const modalPath = path.join(projectRoot, 'src/components/auth/AuthChallengeModal.tsx');
      const content = fs.readFileSync(modalPath, 'utf-8');

      expect(content).toContain('max-h-[85vh]');
      expect(content).toContain('overflow-y-auto');
      expect(content).toContain('min-h-[44px]');
    });

    it('should enforce min-h-[44px] touch targets on LoginForm inputs and submit button', () => {
      const formPath = path.join(projectRoot, 'src/components/auth/LoginForm.tsx');
      const content = fs.readFileSync(formPath, 'utf-8');

      expect(content).toContain('min-h-[44px]');
    });

    it('should contain data table scrolling in RequirementsTable', () => {
      const tablePath = path.join(projectRoot, 'src/components/admin/marketplace-management/RequirementsTable.tsx');
      const content = fs.readFileSync(tablePath, 'utf-8');

      expect(content).toContain('overflow-x-auto');
    });
  });

  describe('4. Customer & Professional Workspace Responsiveness (Module 26)', () => {
    it('should enforce touch scrolling sub-tabs in WorkspaceOverview', () => {
      const pagePath = path.join(projectRoot, 'src/pages/workspace/WorkspaceOverview.tsx');
      const content = fs.readFileSync(pagePath, 'utf-8');

      expect(content).toContain('no-scrollbar');
      expect(content).toContain('min-h-[44px]');
    });

    it('should enforce 44px touch target buttons in TradeProfessionalDashboard and BookingCard', () => {
      const dashPath = path.join(projectRoot, 'src/pages/workspace/professional/TradeProfessionalDashboard.tsx');
      const cardPath = path.join(projectRoot, 'src/components/workspace/bookings/BookingCard.tsx');

      expect(fs.readFileSync(dashPath, 'utf-8')).toContain('min-h-[44px]');
      expect(fs.readFileSync(cardPath, 'utf-8')).toContain('min-h-[44px]');
    });

    it('should support mobile view switching in WorkspaceInbox', () => {
      const inboxPath = path.join(projectRoot, 'src/pages/workspace/WorkspaceInbox.tsx');
      const content = fs.readFileSync(inboxPath, 'utf-8');

      expect(content).toContain('mobileView');
      expect(content).toContain('min-h-[44px]');
    });
  });

  describe('5. Public Website, Discovery & Request Handoff (Module 27)', () => {
    it('should enforce 44px touch targets on ProfessionalCard and PublicProfessionalProfilePage CTAs', () => {
      const cardPath = path.join(projectRoot, 'src/components/marketplace/ProfessionalCard.tsx');
      const profilePath = path.join(projectRoot, 'src/pages/PublicProfessionalProfilePage.tsx');

      expect(fs.readFileSync(cardPath, 'utf-8')).toContain('min-h-[44px]');
      expect(fs.readFileSync(profilePath, 'utf-8')).toContain('min-h-[44px]');
    });

    it('should preserve request context params in BookServicePage', () => {
      const bookPath = path.join(projectRoot, 'src/pages/customer/BookServicePage.tsx');
      const content = fs.readFileSync(bookPath, 'utf-8');

      expect(content).toContain('providerId');
      expect(content).toContain('categoryId');
      expect(content).toContain('timeline');
      expect(content).toContain('budget');
    });
  });

});
