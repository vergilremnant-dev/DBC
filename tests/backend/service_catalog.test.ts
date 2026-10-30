import { describe, it, expect } from 'vitest';
import {
  SERVICE_CATALOG,
  RETIRED_SLUGS,
  resolveServices,
  tokenize,
  sortCategoriesForDisplay,
  planCatalogMigration,
  activeCountAfterPlan,
  type ExistingCategoryRow,
} from '../../api-lib/utils/serviceCatalog.js';

const WHITE = ['Vastu', 'Architect', 'Interior Designer', 'Structured Engineer', 'Project Management', 'Quantity Surveyor', 'Quality Controller', 'Landscape Engineer', 'Geotechnical'];
const BLUE = ['Carpenter', 'Painter', 'Fall Ceiling', 'Granite Mason', 'Water Proofing', 'Pest Control', 'Door Fitter', 'Plumber', 'Electrician', 'Tiles Mason', 'Brick Mason', 'Farm Work/Centering', 'Glass Worker', 'UPVC'];

const top = (q: string) => resolveServices(q)[0]?.service.label;

/** Rows as created by prisma/seed.js + seed_active_partners.js (duplicate slugs) — test data only. */
function legacyRows(): ExistingCategoryRow[] {
  const seed: Array<[string, string, string]> = [
    ['Plumbing', 'plumbing', 'BLUE_COLLAR'], ['Electrical', 'electrical', 'BLUE_COLLAR'], ['Carpentry', 'carpentry', 'BLUE_COLLAR'],
    ['Painting', 'painting', 'BLUE_COLLAR'], ['AC Repair', 'ac-repair', 'BLUE_COLLAR'], ['CCTV Installation', 'cctv-installation', 'BLUE_COLLAR'],
    ['Cleaning', 'cleaning', 'BLUE_COLLAR'], ['Waterproofing', 'waterproofing', 'BLUE_COLLAR'], ['Pest Control', 'pest-control', 'BLUE_COLLAR'],
    ['False Ceiling', 'false-ceiling', 'BLUE_COLLAR'], ['Tiles', 'tiles', 'BLUE_COLLAR'], ['Masonry', 'masonry', 'BLUE_COLLAR'],
    ['Architect', 'architect', 'WHITE_COLLAR'], ['Interior Designer', 'interior-designer', 'WHITE_COLLAR'], ['Civil Engineer', 'civil-engineer', 'WHITE_COLLAR'],
    ['Structural Engineer', 'structural-engineer', 'WHITE_COLLAR'], ['Landscape Designer', 'landscape-designer', 'WHITE_COLLAR'],
    ['Quantity Surveyor', 'quantity-surveyor', 'WHITE_COLLAR'], ['Vastu Consultant', 'vastu-consultant', 'WHITE_COLLAR'],
    ['Architecture', 'architecture', 'WHITE_COLLAR'], ['Interior design', 'interior-design', 'WHITE_COLLAR'],
  ];
  return seed.map(([name, slug, categoryType], i) => ({
    id: i + 1, name, slug, categoryType, workforceTypeId: null, isActive: true, deletedAt: null, displayOrder: 0, providerCount: (i % 3) + 1,
  }));
}

/** Applies a plan to in-memory rows the same way the migration script does. */
function applyPlan(rows: ExistingCategoryRow[]) {
  const plan = planCatalogMigration(rows);
  const next = rows.map((r) => ({ ...r }));
  const byId = new Map(next.map((r) => [r.id, r]));
  let nextId = Math.max(...next.map((r) => r.id)) + 1;
  for (const a of plan.actions) {
    if (a.kind === 'MERGE_DUPLICATE') {
      byId.get(a.intoId)!.providerCount += byId.get(a.id)!.providerCount;
      Object.assign(byId.get(a.id)!, { isActive: false, providerCount: 0, ...(a.renameTo ? { name: a.renameTo } : {}) });
    } else if (a.kind === 'RETIRE') byId.get(a.id)!.isActive = false;
    else if (a.kind === 'UPDATE') Object.assign(byId.get(a.id)!, { ...a.to, deletedAt: null });
    else if (a.kind === 'CREATE') next.push({ id: nextId++, name: a.name, slug: a.slug, categoryType: a.categoryType, displayOrder: a.displayOrder, isActive: true, deletedAt: null, workforceTypeId: null, providerCount: 0 });
  }
  return { plan, rows: next };
}

describe('Service catalog definition', () => {
  it('has exactly 23 services with the exact labels, order and workforce groups', () => {
    expect(SERVICE_CATALOG).toHaveLength(23);
    const group = (w: string) => SERVICE_CATALOG.filter((s) => s.workforce === w).sort((a, b) => a.order - b.order);
    expect(group('WHITE_COLLAR').map((s) => s.label)).toEqual(WHITE);
    expect(group('BLUE_COLLAR').map((s) => s.label)).toEqual(BLUE);
    expect(group('WHITE_COLLAR').map((s) => s.order)).toEqual(WHITE.map((_, i) => i + 1));
    expect(group('BLUE_COLLAR').map((s) => s.order)).toEqual(BLUE.map((_, i) => i + 1));
    expect(new Set(SERVICE_CATALOG.map((s) => s.slug)).size).toBe(23);
  });

  it('keeps existing slugs for services that already existed', () => {
    const slug = (label: string) => SERVICE_CATALOG.find((s) => s.label === label)!.slug;
    expect(slug('Electrician')).toBe('electrical');
    expect(slug('Brick Mason')).toBe('masonry');
    expect(slug('Fall Ceiling')).toBe('false-ceiling');
    expect(slug('Vastu')).toBe('vastu-consultant');
  });

  it('sorts DB rows white-collar first, then by display order', () => {
    const rows = [
      { name: 'Plumber', categoryType: 'BLUE_COLLAR', displayOrder: 8 },
      { name: 'Architect', categoryType: 'WHITE_COLLAR', displayOrder: 2 },
      { name: 'Carpenter', categoryType: 'BLUE_COLLAR', displayOrder: 1 },
      { name: 'Vastu', categoryType: 'WHITE_COLLAR', displayOrder: 1 },
    ];
    expect(sortCategoriesForDisplay(rows).map((r) => r.name)).toEqual(['Vastu', 'Architect', 'Carpenter', 'Plumber']);
  });
});

describe('Service resolver (search)', () => {
  it.each([
    ['electrical work', 'Electrician'],
    ['interior', 'Interior Designer'],
    ['water leak protection', 'Water Proofing'],
    ['false ceiling', 'Fall Ceiling'],
    ['granite work', 'Granite Mason'],
    ['formwork', 'Farm Work/Centering'],
    ['structural engineer', 'Structured Engineer'],
    ['upvc windows', 'UPVC'],
    ['seepage', 'Water Proofing'],
    ['wiring', 'Electrician'],
  ])('"%s" → %s', (q, label) => {
    expect(top(q)).toBe(label);
  });

  it('handles partial words, plurals, case, whitespace and spelling variants', () => {
    expect(top('plumb')).toBe('Plumber');
    expect(top('  PLUMBERS  ')).toBe('Plumber');
    expect(top('tiles')).toBe('Tiles Mason');
    expect(top('electrcian')).toBe('Electrician');
    expect(top('carpanter')).toBe('Carpenter');
    expect(top('vasthu')).toBe('Vastu');
    expect(top('Need a good plumber')).toBe('Plumber');
  });

  it('does not let generic words cause unrelated matches', () => {
    expect(resolveServices('granite work').map((m) => m.service.label)).toEqual(['Granite Mason']);
    expect(resolveServices('electrical work').map((m) => m.service.label)).toEqual(['Electrician']);
    expect(resolveServices('mason').map((m) => m.service.label)).toEqual(['Granite Mason', 'Tiles Mason', 'Brick Mason']);
  });

  it('returns nothing for retired services or unknown text, and can filter by workforce', () => {
    expect(resolveServices('cctv')).toEqual([]);
    expect(resolveServices('ac repair')).toEqual([]);
    expect(resolveServices('qwerty zxcv')).toEqual([]);
    expect(resolveServices('designer', { workforce: 'BLUE_COLLAR' })).toEqual([]);
  });

  it('tokenizes on whole words only (never strips letters inside words)', () => {
    expect(tokenize('Painter in Hyderabad')).toEqual(['painter', 'hyderabad']);
    expect(tokenize('a Granite Mason for an Architect')).toEqual(['granite', 'mason', 'architect']);
  });
});

describe('Catalog migration plan', () => {
  it('ends with exactly 23 active services in catalog order and classification', () => {
    const { plan, rows } = applyPlan(legacyRows());
    expect(plan.conflicts).toEqual([]);
    expect(activeCountAfterPlan(plan)).toBe(23);
    const active = sortCategoriesForDisplay(rows.filter((r) => r.isActive));
    expect(active.map((r) => r.name)).toEqual([...WHITE, ...BLUE]);
    for (const r of active) {
      const svc = SERVICE_CATALOG.find((s) => s.label === r.name)!;
      expect(r.categoryType).toBe(svc.workforce);
      expect(r.displayOrder).toBe(svc.order);
    }
  });

  it('renames in place (same id and slug) and creates only the 8 missing services', () => {
    const before = legacyRows();
    const { plan, rows } = applyPlan(before);
    const electrical = rows.find((r) => r.slug === 'electrical')!;
    expect(electrical.id).toBe(before.find((r) => r.slug === 'electrical')!.id);
    expect(electrical.name).toBe('Electrician');
    expect(plan.actions.filter((a) => a.kind === 'CREATE').map((a) => a.slug).sort()).toEqual(
      ['door-fitter', 'farm-work-centering', 'geotechnical', 'glass-worker', 'granite-mason', 'project-management', 'quality-controller', 'upvc'],
    );
  });

  it('retires obsolete categories without deleting them or moving their providers', () => {
    const before = legacyRows();
    const { plan, rows } = applyPlan(before);
    expect(rows).toHaveLength(before.length + 8); // nothing removed
    for (const slug of RETIRED_SLUGS) {
      const b = before.find((r) => r.slug === slug)!;
      const a = rows.find((r) => r.slug === slug)!;
      expect(a.isActive).toBe(false);
      expect(a.providerCount).toBe(b.providerCount); // providers stay linked
      expect(plan.actions.find((x) => 'id' in x && x.id === b.id)?.kind).toBe('RETIRE');
    }
  });

  it('merges duplicate Architect / Interior Designer categories into the canonical rows', () => {
    const before = legacyRows();
    const { plan, rows } = applyPlan(before);
    const merges = plan.actions.filter((a) => a.kind === 'MERGE_DUPLICATE');
    expect(merges.map((a) => [a.slug, 'intoSlug' in a && a.intoSlug])).toEqual([
      ['architecture', 'architect'],
      ['interior-design', 'interior-designer'],
    ]);
    const total = (list: ExistingCategoryRow[]) => list.reduce((n, r) => n + r.providerCount, 0);
    expect(total(rows)).toBe(total(before)); // no provider lost
    const arch = rows.find((r) => r.slug === 'architect')!;
    expect(arch.providerCount).toBe(before.find((r) => r.slug === 'architect')!.providerCount + before.find((r) => r.slug === 'architecture')!.providerCount);
    expect(rows.find((r) => r.slug === 'architecture')!.isActive).toBe(false);
  });

  it('adopts a duplicate as canonical when the catalog slug is missing', () => {
    const rows = legacyRows().filter((r) => r.slug !== 'architect');
    const plan = planCatalogMigration(rows);
    const arch = plan.actions.find((a) => a.kind === 'UPDATE' && a.slug === 'architecture');
    expect(arch && arch.kind === 'UPDATE' && arch.to.name).toBe('Architect');
  });

  it('frees a catalog label held by a duplicate before renaming the canonical row', () => {
    const rows = legacyRows().map((r) => (r.slug === 'architect' ? { ...r, name: 'Architects' } : r.slug === 'architecture' ? { ...r, name: 'Architect' } : r));
    const plan = planCatalogMigration(rows);
    const merge = plan.actions.find((a) => a.kind === 'MERGE_DUPLICATE' && a.slug === 'architecture');
    expect(merge && merge.kind === 'MERGE_DUPLICATE' && merge.renameTo).toMatch(/duplicate/);
  });

  it('is idempotent: re-planning after apply changes nothing', () => {
    const { rows } = applyPlan(legacyRows());
    const again = planCatalogMigration(rows);
    expect(again.conflicts).toEqual([]);
    expect(again.actions.every((a) => a.kind === 'UNCHANGED' || a.kind === 'ALREADY_RETIRED')).toBe(true);
  });

  it('reactivates a soft-deleted catalog category instead of creating a second one', () => {
    const rows = legacyRows().map((r) => (r.slug === 'plumbing' ? { ...r, isActive: false, deletedAt: '2026-01-01' } : r));
    const plan = planCatalogMigration(rows);
    expect(plan.actions.find((a) => a.kind === 'UPDATE' && a.slug === 'plumbing')).toBeTruthy();
    expect(plan.actions.some((a) => a.kind === 'CREATE' && a.slug === 'plumbing')).toBe(false);
  });
});
