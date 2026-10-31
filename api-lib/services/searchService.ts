import { db } from '../utils/db.js';
import { resolveServices, type Workforce } from '../utils/serviceCatalog.js';
import { toPublicProvider, toPublicProviders } from '../utils/publicProvider.js';

export const MAX_SEARCH_LIMIT = 100;
export const DEFAULT_SEARCH_LIMIT = 20;

/** Active (customer-facing) category ids for the catalog services a query resolves to. */
export async function resolveCategoryIds(query: string, workforce?: Workforce): Promise<number[]> {
  const slugs = resolveServices(query, { workforce }).flatMap((m) => [m.service.slug, ...(m.service.aliasSlugs ?? [])]);
  if (!slugs.length) return [];
  const rows = await db.serviceCategory.findMany({
    where: { slug: { in: slugs }, isActive: true, deletedAt: null },
    select: { id: true, slug: true },
  });
  // Best match first.
  const rank = (slug: string) => slugs.indexOf(slug);
  return [...rows].sort((a: { slug: string }, b: { slug: string }) => rank(a.slug) - rank(b.slug)).map((r: { id: number }) => r.id);
}

export interface ProviderSearchParams {
  search?: string;
  categoryId?: number;
  city?: string;
  experience?: number;
  rating?: number;
  verificationStatus?: string;
  isFeatured?: boolean;
  canProvideServices?: boolean;
  canProvideConsultation?: boolean;
  /** WHITE_COLLAR | BLUE_COLLAR — filters by the provider's category type. */
  workforce?: Workforce;
  sort?: 'relevance' | 'rating' | 'experience' | 'price_asc' | 'price_desc' | 'newest';
  cursor?: string;
  limit?: number;
}

export async function searchProviders(params: ProviderSearchParams) {
  const requested = Number(params.limit);
  const limit = Number.isFinite(requested) && requested > 0 ? Math.min(Math.floor(requested), MAX_SEARCH_LIMIT) : DEFAULT_SEARCH_LIMIT;

  // Public discovery only shows providers whose category is active (retired services stay hidden;
  // their providers and history are untouched and still reachable by direct profile link).
  const whereClause: any = {
    category: { isActive: true, deletedAt: null, ...(params.workforce ? { categoryType: params.workforce } : {}) },
  };

  // Free text: providers in any matching service category, or whose own name/business/description matches.
  const search = params.search?.trim();
  if (search) {
    const categoryIds = await resolveCategoryIds(search, params.workforce);
    whereClause.OR = [
      ...(categoryIds.length ? [{ categoryId: { in: categoryIds } }] : []),
      { fullName: { contains: search, mode: 'insensitive' } },
      { businessName: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (params.categoryId) {
    whereClause.categoryId = Number(params.categoryId);
  }

  if (params.city) {
    whereClause.city = { contains: params.city, mode: 'insensitive' };
  }

  if (params.experience) {
    whereClause.experienceYears = { gte: Number(params.experience) };
  }

  if (params.rating) {
    whereClause.averageRating = { gte: Number(params.rating) };
  }

  // Public search only returns DBC-verified professionals with an ACTIVE account. Callers cannot override this
  // (params.verificationStatus is ignored: it used to let anyone list pending or rejected profiles).
  whereClause.verificationStatus = 'VERIFIED';
  whereClause.user = { status: 'ACTIVE' };

  if (params.isFeatured !== undefined) {
    whereClause.isFeatured = params.isFeatured;
  }

  if (params.canProvideServices !== undefined) {
    whereClause.canProvideServices = params.canProvideServices;
  }

  if (params.canProvideConsultation !== undefined) {
    whereClause.canProvideConsultation = params.canProvideConsultation;
  }

  // Sorting
  const orderBy: any[] =
    params.sort === 'rating'
      ? [{ averageRating: 'desc' }, { totalReviews: 'desc' }, { id: 'asc' }]
      : params.sort === 'experience'
      ? [{ experienceYears: 'desc' }, { averageRating: 'desc' }, { id: 'asc' }]
      : params.sort === 'price_asc'
      ? [{ consultationFee: 'asc' }, { averageRating: 'desc' }, { id: 'asc' }]
      : params.sort === 'price_desc'
      ? [{ consultationFee: 'desc' }, { averageRating: 'desc' }, { id: 'asc' }]
      : params.sort === 'newest'
      ? [{ createdAt: 'desc' }, { id: 'asc' }]
      : [
      { isFeatured: 'desc' },
      { averageRating: 'desc' },
      { totalReviews: 'desc' },
      { id: 'asc' },
    ];

  // Fetch take limit + 1 to check if another page is available
  // Cursor pagination: Prisma cursors follow the orderBy (always ending in id), so pages never skip or repeat.
  const providers = await db.providerProfile.findMany({
    where: whereClause,
    orderBy,
    take: limit + 1,
    ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
    include: { category: true },
  });

  const hasMore = providers.length > limit;
  if (hasMore) providers.pop();
  // The cursor is the last item returned; the next page starts right after it.
  const nextCursor: string | null = hasMore && providers.length ? providers[providers.length - 1].id : null;

  return {
    success: true,
    // Public DTO: no login email, user id or phone number.
    data: toPublicProviders(providers),
    nextCursor,
    hasMore,
  };
}

export async function globalSearch(keyword: string) {
  const cleanKeyword = keyword.trim();
  if (!cleanKeyword) {
    return { success: true, categories: [], providers: [] };
  }

  const categoryIds = await resolveCategoryIds(cleanKeyword);
  const [categoryRows, providers] = await Promise.all([
    categoryIds.length
      ? db.serviceCategory.findMany({ where: { id: { in: categoryIds }, isActive: true, deletedAt: null } })
      : Promise.resolve([]),
    db.providerProfile.findMany({
      where: {
        verificationStatus: 'VERIFIED',
        user: { status: 'ACTIVE' },
        category: { isActive: true, deletedAt: null },
        OR: [
          { fullName: { contains: cleanKeyword, mode: 'insensitive' } },
          { businessName: { contains: cleanKeyword, mode: 'insensitive' } },
        ],
      },
      include: {
        category: true,
      },
      take: 5,
    }),
  ]);

  // Keep the resolver's relevance order.
  const categories = categoryIds
    .map((id) => (categoryRows as Array<{ id: number }>).find((c) => c.id === id))
    .filter(Boolean)
    .slice(0, 5);

  return {
    success: true,
    categories,
    providers: toPublicProviders(providers),
  };
}
