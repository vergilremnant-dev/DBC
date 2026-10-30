import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchProviders, globalSearch } from '../../api-lib/services/searchService.js';
import { parseNaturalLanguageQuery } from '../../api-lib/utils/queryParser.js';
import suggestionsHandler from '../../api-lib/routes/search/suggestions.js';
import { db } from '../../api-lib/utils/db.js';

vi.mock('../../api-lib/utils/db.js', () => {
  return {
    db: {
      providerProfile: { findMany: vi.fn() },
      serviceCategory: { findMany: vi.fn() },
    },
  };
});

// Active categories as they exist after the catalog migration (test data only).
const ACTIVE = [
  { id: 9, slug: 'electrical', name: 'Electrician', categoryType: 'BLUE_COLLAR' },
  { id: 3, slug: 'interior-designer', name: 'Interior Designer', categoryType: 'WHITE_COLLAR' },
  { id: 5, slug: 'waterproofing', name: 'Water Proofing', categoryType: 'BLUE_COLLAR' },
  { id: 12, slug: 'masonry', name: 'Brick Mason', categoryType: 'BLUE_COLLAR' },
  { id: 14, slug: 'tiles', name: 'Tiles Mason', categoryType: 'BLUE_COLLAR' },
  { id: 30, slug: 'granite-mason', name: 'Granite Mason', categoryType: 'BLUE_COLLAR' },
];

const providerFind = () => vi.mocked(db.providerProfile.findMany);
const categoryFind = () => vi.mocked(db.serviceCategory.findMany);

beforeEach(() => {
  providerFind().mockReset();
  categoryFind().mockReset();
  // Behaves like Prisma: only active categories whose slug/id is requested.
  categoryFind().mockImplementation((async (args: any) => {
    const where = args?.where ?? {};
    return ACTIVE.filter((c) => (where.slug?.in ? where.slug.in.includes(c.slug) : true) && (where.id?.in ? where.id.in.includes(c.id) : true));
  }) as any);
  providerFind().mockResolvedValue([] as any);
});

const lastWhere = () => (providerFind().mock.calls.at(-1)![0] as any).where;

describe('Search Service Unit Tests', () => {
  it('should query providers with keyword filter', async () => {
    providerFind().mockResolvedValueOnce([{ id: '1', fullName: 'John Doe', businessName: 'John Plumb', categoryId: 1 } as any]);

    const result = await searchProviders({ search: 'John' });
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(1);
    expect(result.data[0].fullName).toBe('John Doe');
    expect(lastWhere().OR).toEqual([
      { fullName: { contains: 'John', mode: 'insensitive' } },
      { businessName: { contains: 'John', mode: 'insensitive' } },
      { description: { contains: 'John', mode: 'insensitive' } },
    ]);
  });

  it.each([
    ['electrical work', [9]],
    ['interior', [3]],
    ['water leak protection', [5]],
    ['granite work', [30]],
    ['mason', [30, 14, 12]],
  ])('matches "%s" to service categories %j as well as names', async (q, ids) => {
    await searchProviders({ search: q });
    expect(lastWhere().OR[0]).toEqual({ categoryId: { in: ids } });
    expect(lastWhere().OR[1]).toEqual({ fullName: { contains: q, mode: 'insensitive' } });
  });

  it('only returns providers in active categories and supports workforce filtering', async () => {
    await searchProviders({});
    expect(lastWhere().category).toEqual({ isActive: true, deletedAt: null });
    await searchProviders({ workforce: 'WHITE_COLLAR' });
    expect(lastWhere().category).toEqual({ isActive: true, deletedAt: null, categoryType: 'WHITE_COLLAR' });
  });

  it('does not match retired services through free text', async () => {
    await searchProviders({ search: 'cctv' });
    expect(lastWhere().OR.some((c: any) => 'categoryId' in c)).toBe(false);
  });

  it('paginates with a Prisma cursor that follows the sort order', async () => {
    providerFind().mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }, { id: 'c' }] as any);
    const page = await searchProviders({ limit: 2 });
    expect(page.data.map((p: any) => p.id)).toEqual(['a', 'b']);
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toBe('b');

    await searchProviders({ limit: 2, cursor: 'b' });
    const args = providerFind().mock.calls.at(-1)![0] as any;
    expect(args.cursor).toEqual({ id: 'b' });
    expect(args.skip).toBe(1);
    expect(args.take).toBe(3);
    expect(args.where.id).toBeUndefined();
  });

  it('uses a default page size of 20 and caps it at 100', async () => {
    await searchProviders({});
    expect((providerFind().mock.calls.at(-1)![0] as any).take).toBe(21);
    await searchProviders({ limit: 5000 });
    expect((providerFind().mock.calls.at(-1)![0] as any).take).toBe(101);
  });

  it('global search returns resolver-matched active categories in relevance order', async () => {
    const res = await globalSearch('mason');
    expect(res.categories.map((c: any) => c.name)).toEqual(['Granite Mason', 'Tiles Mason', 'Brick Mason']);
  });
});

describe('Natural language query parser', () => {
  it.each([
    ['Painter', 'Painter'],
    ['Architect', 'Architect'],
    ['Granite Mason', 'Granite Mason'],
    ['water leak protection', 'water leak protection'],
    ['Need an interior designer for a villa', 'interior designer villa'],
  ])('keeps words intact: "%s" → "%s"', (q, expected) => {
    expect(parseNaturalLanguageQuery(q).search).toBe(expected);
  });

  it('extracts the city and removes it from the search text', () => {
    expect(parseNaturalLanguageQuery('plumber in Hyderabad')).toEqual({ city: 'Hyderabad', search: 'plumber' });
    expect(parseNaturalLanguageQuery('carpenter whitefield').city).toBe('Bangalore');
  });

  it('extracts experience, budget and verification without corrupting keywords', () => {
    const p = parseNaturalLanguageQuery('verified electrician with 5+ years under 2 lakh');
    expect(p.experience).toBe(5);
    expect(p.maxBudget).toBe(200000);
    expect(p.verifiedOnly).toBe(true);
    expect(p.search).toBe('electrician');
  });
});

describe('Search suggestions endpoint', () => {
  const call = async (q: string) => {
    let body: any;
    const res: any = { status: () => res, json: (b: any) => ((body = b), res), setHeader: () => res };
    await suggestionsHandler({ method: 'GET', query: { q } } as any, res);
    return body;
  };

  it('suggests services via the catalog resolver (synonyms included)', async () => {
    const body = await call('leak');
    expect(body.success).toBe(true);
    expect(body.suggestions.categories.map((c: any) => c.name)).toEqual(['Water Proofing']);
  });

  it('returns popular searches from the new catalog for short input', async () => {
    const body = await call('a');
    expect(body.suggestions.popularSearches).toContain('Electrician');
    expect(body.suggestions.popularSearches).not.toContain('Contractor');
  });
});
