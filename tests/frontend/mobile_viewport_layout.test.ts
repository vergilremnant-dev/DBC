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

  it('verifies marketplace search inputs prevent auto-zoom and suggestions stay within the viewport', () => {
    const content = fs.readFileSync(marketplacePath, 'utf-8');
    const search = fs.readFileSync(path.join(rootDir, 'src/components/marketplace/ServiceSearch.tsx'), 'utf-8');
    const city = fs.readFileSync(path.join(rootDir, 'src/components/marketplace/CitySelect.tsx'), 'utf-8');
    // The marketplace hero uses the shared search + city controls
    expect(content).toContain('<ServiceSearch');
    expect(content).toContain('<CitySelect');
    // 16px (text-base) inputs on mobile prevent iOS auto-zoom
    expect(search).toContain('text-base');
    expect(city).toContain('text-base');
    expect(city).toContain('sm:text-sm');
    // Suggestions dropdown is anchored to the search box width (left-0 right-0), never wider than the viewport
    expect(search).toContain('absolute left-0 right-0');
  });
});
