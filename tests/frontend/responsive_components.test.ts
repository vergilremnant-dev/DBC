import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Responsive Components & Form Controls Audit (Prompt 25)', () => {

  const projectRoot = path.resolve(__dirname, '../../');

  it('should enforce max-h-[85vh] and overflow-y-auto on AuthChallengeModal overlay', () => {
    const modalPath = path.join(projectRoot, 'src/components/auth/AuthChallengeModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf-8');

    expect(content).toContain('max-h-[85vh]');
    expect(content).toContain('overflow-y-auto');
    expect(content).toContain('min-h-[44px]');
  });

  it('should enforce max-h-[85vh] and overflow-y-auto on PaymentCheckoutModal container', () => {
    const modalPath = path.join(projectRoot, 'src/components/workspace/payments/PaymentCheckoutModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf-8');

    expect(content).toContain('max-h-[85vh]');
    expect(content).toContain('overflow-y-auto');
    expect(content).toContain('min-h-[44px]');
  });

  it('should enforce min-h-[44px] touch target height on LoginForm inputs & buttons', () => {
    const formPath = path.join(projectRoot, 'src/components/auth/LoginForm.tsx');
    const content = fs.readFileSync(formPath, 'utf-8');

    expect(content).toContain('min-h-[44px]');
    expect(content).toContain('remember-me');
  });

  it('should ensure RequirementsTable includes overflow-x-auto scroll wrapper and 44px touch actions', () => {
    const tablePath = path.join(projectRoot, 'src/components/admin/marketplace-management/RequirementsTable.tsx');
    const content = fs.readFileSync(tablePath, 'utf-8');

    expect(content).toContain('overflow-x-auto');
    expect(content).toContain('min-h-[44px]');
  });

});
