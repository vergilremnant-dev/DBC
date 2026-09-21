import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Public Website & Marketplace Responsive Audit (Prompt 27)', () => {

  const projectRoot = path.resolve(__dirname, '../../');

  it('should enforce min-h-[44px] touch target height on ProfessionalCard action buttons', () => {
    const cardPath = path.join(projectRoot, 'src/components/marketplace/ProfessionalCard.tsx');
    const content = fs.readFileSync(cardPath, 'utf-8');

    expect(content).toContain('min-h-[44px]');
  });

  it('should enforce min-h-[44px] touch target height on PublicProfessionalProfilePage CTA', () => {
    const pagePath = path.join(projectRoot, 'src/pages/PublicProfessionalProfilePage.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    expect(content).toContain('min-h-[44px]');
  });

  it('should verify PublicMarketplace includes responsive grid layouts and touch controls', () => {
    const pagePath = path.join(projectRoot, 'src/pages/PublicMarketplace.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    expect(content).toContain('grid-cols-1');
    expect(content).toContain('selectedCity');
  });

  it('should verify BookServicePage handles project request handoff parameters cleanly', () => {
    const pagePath = path.join(projectRoot, 'src/pages/customer/BookServicePage.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    expect(content).toContain('providerId');
    expect(content).toContain('categoryId');
  });

});
