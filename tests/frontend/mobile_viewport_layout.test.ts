import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Module 70 — Mobile Viewport, Horizontal Overflow & Responsive Layout Tests', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const indexHtmlPath = path.join(rootDir, 'index.html');
  const navbarPath = path.join(rootDir, 'src/components/navigation/Navbar.tsx');
  const marketplacePath = path.join(rootDir, 'src/pages/PublicMarketplace.tsx');

  it('verifies index.html viewport meta includes viewport-fit=cover without user-scalable=no', () => {
    const content = fs.readFileSync(indexHtmlPath, 'utf-8');
    expect(content).toContain('width=device-width');
    expect(content).toContain('viewport-fit=cover');
    expect(content).not.toContain('user-scalable=no');
    expect(content).not.toContain('maximum-scale=1');
  });

  it('verifies Navbar header container has layout overflow containment and valid SVG sizing', () => {
    const content = fs.readFileSync(navbarPath, 'utf-8');
    // Checks that container has min-w-0
    expect(content).toContain('min-w-0');
    // Checks that hamburger button uses valid standard Tailwind SVG dimensions
    expect(content).not.toContain('w-5.5 h-5.5');
    expect(content).toContain('w-5 h-5');
    // Checks dropdown container max-width protection
    expect(content).toContain('max-w-[calc(100vw-2rem)]');
  });

  it('verifies PublicMarketplace hero inputs prevent auto-zoom and dropdowns specify max-width', () => {
    const content = fs.readFileSync(marketplacePath, 'utf-8');
    // Hero search input has 16px (text-base) on mobile to prevent iOS auto-zoom
    expect(content).toContain('text-base sm:text-xs');
    // Dropdowns use max-width calc to prevent horizontal viewport spilling
    expect(content).toContain('max-w-[calc(100vw-2rem)]');
  });
});
