import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf-8');

describe('Service discovery routes and data sources', () => {
  const app = read('src/App.tsx');

  it('registers the slug-based service routes and keeps the legacy route as a redirect', () => {
    expect(app).toContain('path="/services" element={<ServicesCatalogPage />}');
    expect(app).toContain('path="/services/:slug" element={<ServiceProfessionalsPage />}');
    expect(app).toContain('path="/category/:id/providers" element={<CategoryProvidersPage />}');
    expect(app).toContain('path="/professional/:id" element={<PublicProfessionalProfilePage />}');
    const legacy = read('src/pages/CategoryProvidersPage.tsx');
    expect(legacy).toContain('<Navigate to={target} replace />');
    expect(legacy).toContain('/services/${encodeURIComponent(slug)}${search}');
  });

  it('uses the categories API as the only catalog source (no hard-coded lists or popularity sorting)', () => {
    const market = read('src/pages/PublicMarketplace.tsx');
    expect(market).toContain('useServiceCatalog');
    for (const gone of ['CATEGORY_POPULARITY_SCORES', 'HOME_PROJECTS', 'getPopularityScore', 'slice(0, 5)', 'unsplash']) {
      expect(market).not.toContain(gone);
    }
    const hook = read('src/hooks/marketplace/useServiceCatalog.ts');
    expect(hook).toContain('categoryApi');
    expect(hook).toContain('.getCategories()');
    // Labels never appear hard-coded in discovery code
    for (const f of ['src/pages/PublicMarketplace.tsx', 'src/pages/ServicesCatalogPage.tsx', 'src/pages/ServiceProfessionalsPage.tsx', 'src/pages/SearchResultsPage.tsx', 'src/components/marketplace/ServiceDirectory.tsx']) {
      const src = read(f);
      for (const label of ['Fall Ceiling', 'Farm Work/Centering', 'Granite Mason', 'Structured Engineer']) expect(src).not.toContain(label);
    }
  });

  it('search uses the backend suggestions API with an accessible combobox', () => {
    const search = read('src/components/marketplace/ServiceSearch.tsx');
    expect(search).toContain('searchApi');
    expect(search).toContain('.getSuggestions(');
    expect(search).toContain('role="combobox"');
    expect(search).toContain('aria-activedescendant');
    expect(search).toContain("'ArrowDown'");
    expect(search).toContain("'Escape'");
    expect(read('src/services/search/searchService.ts')).toContain("'/api/search/suggestions'");
  });

  it('keeps filters in the URL and supports Load more', () => {
    const page = read('src/pages/SearchResultsPage.tsx');
    for (const p of ["params.get('q')", "params.get('city')", "params.get('workforce')", "params.get('service')"]) expect(page).toContain(p);
    expect(page).toContain('results.loadMore');
    expect(read('src/hooks/marketplace/useProviderResults.ts')).toContain('cursor');
  });

  it('replaces the duplicate detail modal with the single profile page', () => {
    const card = read('src/components/marketplace/ProfessionalResultCard.tsx');
    expect(card).toContain('to={`/professional/${provider.id}`}');
    expect(card).toContain('Request a Quote');
    for (const f of ['src/pages/SearchResultsPage.tsx', 'src/pages/ServiceProfessionalsPage.tsx']) expect(read(f)).not.toContain('ProfilePreview');
  });

  it('never falls back to category 1 when a request has no category', () => {
    const book = read('src/pages/customer/BookServicePage.tsx');
    expect(book).not.toContain('categoryId || 1');
    expect(book).toContain('resolvedCategoryId');
  });

  it('cards and profile do not render private contact fields or invented content', () => {
    const card = read('src/components/marketplace/ProfessionalResultCard.tsx');
    expect(card).not.toMatch(/\.(email|phoneNumber|userId)\b/);
    const profile = read('src/pages/PublicProfessionalProfilePage.tsx');
    expect(profile).not.toContain('experienceYears || 5');
    expect(profile).not.toContain('Verified Work');
    expect(profile).not.toContain('images.unsplash.com');
  });
});
