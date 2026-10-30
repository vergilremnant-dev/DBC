import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toPublicProvider, publicDisplayName } from '../../api-lib/utils/publicProvider.js';
import { searchProviders, globalSearch } from '../../api-lib/services/searchService.js';
import { listProviders } from '../../api-lib/services/providerService.js';
import { getCategoryBySlug } from '../../api-lib/services/categoryService.js';
import { db } from '../../api-lib/utils/db.js';

vi.mock('../../api-lib/utils/db.js', () => ({
  db: {
    providerProfile: { findMany: vi.fn(), count: vi.fn() },
    serviceCategory: { findMany: vi.fn(), findFirst: vi.fn() },
  },
}));

// A full provider row as Prisma returns it (test data only).
const RAW = {
  id: 'prov-1',
  userId: 'user-secret-1',
  fullName: 'Rahul Bose',
  businessName: 'Bose Interiors',
  email: 'login@example.com',
  phoneNumber: '9876543210',
  firebaseUid: 'fb-uid-1',
  city: 'Hyderabad',
  state: 'Telangana',
  categoryId: 14,
  verificationStatus: 'VERIFIED',
  experienceYears: 6,
  description: 'Interiors',
  user: { id: 'user-secret-1', email: 'login@example.com', password: 'hash' },
  category: { id: 14, name: 'Interior Designer', slug: 'interior-designer', categoryType: 'WHITE_COLLAR', workforceTypeId: 'wf-1', createdAt: 'x' },
  portfolios: [{ id: 'pf1', title: 'Villa', description: 'd', projectType: 'Residential', imageUrl: null, providerId: 'prov-1', createdAt: 'x', updatedAt: 'y' }],
  reviews: [
    { id: 'r1', rating: 5, reviewTitle: 'Great', reviewDescription: 'Good work', isVisible: true, customerId: 'cust-1', customer: { id: 'cust-1', userId: 'u2', fullName: 'Priya Sharma', phoneNumber: '9000000000', address: 'secret' } },
    { id: 'r2', rating: 1, reviewTitle: 'Hidden', reviewDescription: 'x', isVisible: false, customer: { fullName: 'X Y' } },
  ],
};

const FORBIDDEN = ['email', 'userId', 'user', 'firebaseUid', 'password', 'phoneNumber'];
const deepKeys = (v: unknown): string[] =>
  v && typeof v === 'object' ? Object.entries(v as Record<string, unknown>).flatMap(([k, x]) => [k, ...deepKeys(x)]) : [];

describe('Public provider DTO', () => {
  it('drops login email, account ids, auth fields and phone numbers', () => {
    const out = toPublicProvider(RAW);
    for (const k of FORBIDDEN) expect(deepKeys(out)).not.toContain(k);
    expect(out).toMatchObject({ id: 'prov-1', fullName: 'Rahul Bose', businessName: 'Bose Interiors', city: 'Hyderabad', categoryId: 14, verificationStatus: 'VERIFIED' });
    expect(out.category).toEqual({ id: 14, name: 'Interior Designer', slug: 'interior-designer', categoryType: 'WHITE_COLLAR' });
  });

  it('only includes the (already masked) phone when explicitly requested by the profile endpoint', () => {
    expect(toPublicProvider(RAW, { includePhone: true }).phoneNumber).toBe('9876543210');
    expect(toPublicProvider(RAW).phoneNumber).toBeUndefined();
  });

  it('reduces reviewers to first name + initial and hides invisible reviews', () => {
    const out = toPublicProvider(RAW) as any;
    expect(out.reviews).toHaveLength(1);
    expect(out.reviews[0].customer).toEqual({ fullName: 'Priya S.' });
    expect(deepKeys(out.reviews)).not.toContain('customerId');
    expect(deepKeys(out.reviews)).not.toContain('address');
    expect(out.portfolios[0]).toEqual({ id: 'pf1', title: 'Villa', description: 'd', projectType: 'Residential', imageUrl: null, createdAt: 'x' });
    expect(publicDisplayName('')).toBe('DBC customer');
  });
});

describe('Public endpoints return the DTO', () => {
  beforeEach(() => {
    vi.mocked(db.providerProfile.findMany).mockReset().mockResolvedValue([RAW] as any);
    vi.mocked(db.providerProfile.count).mockReset().mockResolvedValue(1 as any);
    vi.mocked(db.serviceCategory.findMany).mockReset().mockResolvedValue([] as any);
  });

  it('search results contain no private fields and no longer join the user table', async () => {
    const res = await searchProviders({ search: 'Bose' });
    for (const k of FORBIDDEN) expect(deepKeys(res.data)).not.toContain(k);
    const args = vi.mocked(db.providerProfile.findMany).mock.calls[0][0] as any;
    expect(args.include).toEqual({ category: true });
  });

  it('global search and the provider listing are sanitised too', async () => {
    const g = await globalSearch('Bose');
    for (const k of FORBIDDEN) expect(deepKeys(g.providers)).not.toContain(k);
    const l = await listProviders({} as any);
    for (const k of FORBIDDEN) expect(deepKeys(l.data)).not.toContain(k);
  });
});

describe('Category lookup by slug or id', () => {
  it('uses the id for numeric params and the slug otherwise', async () => {
    const find = vi.mocked(db.serviceCategory.findFirst).mockResolvedValue(null as any);
    await getCategoryBySlug('2');
    expect((find.mock.calls.at(-1)![0] as any).where).toEqual({ id: 2, deletedAt: null });
    await getCategoryBySlug('electrical');
    expect((find.mock.calls.at(-1)![0] as any).where).toEqual({ slug: 'electrical', deletedAt: null });
  });
});
