import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Customer & Professional Workspace Responsive Audit (Prompt 26)', () => {

  const projectRoot = path.resolve(__dirname, '../../');

  it('should enforce min-h-[44px] touch target height and no-scrollbar on WorkspaceOverview tabs', () => {
    const pagePath = path.join(projectRoot, 'src/pages/workspace/WorkspaceOverview.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    expect(content).toContain('no-scrollbar');
    expect(content).toContain('min-h-[44px]');
  });

  it('should enforce min-h-[44px] touch target height on TradeProfessionalDashboard status and buttons', () => {
    const pagePath = path.join(projectRoot, 'src/pages/workspace/professional/TradeProfessionalDashboard.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    expect(content).toContain('min-h-[44px]');
  });

  it('should enforce min-h-[44px] touch target height on BookingCard action triggers', () => {
    const cardPath = path.join(projectRoot, 'src/components/workspace/bookings/BookingCard.tsx');
    const content = fs.readFileSync(cardPath, 'utf-8');

    expect(content).toContain('min-h-[44px]');
  });

  it('should enforce min-h-[44px] touch target height on ProfessionalBookings status actions', () => {
    const pagePath = path.join(projectRoot, 'src/pages/workspace/professional/ProfessionalBookings.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    expect(content).toContain('min-h-[44px]');
  });

  it('should enforce min-h-[44px] touch target height on WorkspaceInbox mobile header & composer', () => {
    const pagePath = path.join(projectRoot, 'src/pages/workspace/WorkspaceInbox.tsx');
    const content = fs.readFileSync(pagePath, 'utf-8');

    expect(content).toContain('min-h-[44px]');
  });

});
