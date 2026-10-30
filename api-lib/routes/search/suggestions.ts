import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../utils/db.js';
import { resolveCategoryIds } from '../../services/searchService.js';

const POPULAR_SEARCHES = ['Architect', 'Interior Designer', 'Plumber', 'Electrician', 'Water Proofing'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }

  const { q = '' } = req.query;
  const keyword = String(q).trim().toLowerCase();

  if (!keyword || keyword.length < 2) {
    return res.status(200).json({
      success: true,
      suggestions: {
        categories: [],
        professionals: [],
        locations: ['Hyderabad', 'Bangalore', 'Chennai'],
        popularSearches: POPULAR_SEARCHES,
      },
    });
  }

  try {
    // Services come from the shared catalog resolver (synonyms, partial words, spelling variants);
    // only active categories are suggested.
    const categoryIds = (await resolveCategoryIds(keyword)).slice(0, 5);
    const [categoryRows, professionals] = await Promise.all([
      categoryIds.length
        ? db.serviceCategory.findMany({
            where: { id: { in: categoryIds }, isActive: true, deletedAt: null },
            select: { id: true, name: true, slug: true, categoryType: true },
          })
        : Promise.resolve([]),
      db.providerProfile.findMany({
        where: {
          verificationStatus: 'VERIFIED',
          category: { isActive: true, deletedAt: null },
          OR: [
            { fullName: { contains: keyword, mode: 'insensitive' } },
            { businessName: { contains: keyword, mode: 'insensitive' } },
          ],
        },
        select: { id: true, fullName: true, businessName: true },
        take: 4,
      }),
    ]);

    const categories = categoryIds
      .map((id) => (categoryRows as Array<{ id: number }>).find((c) => c.id === id))
      .filter(Boolean);

    // Popular matching locations list
    const citiesList = ['Hyderabad', 'Bangalore', 'Chennai', 'Mumbai', 'Delhi', 'Pune', 'Kolkata'];
    const matchedLocations = citiesList.filter(c => c.toLowerCase().includes(keyword));

    return res.status(200).json({
      success: true,
      suggestions: {
        categories: categories.map((c: any) => ({ id: c.id, name: c.name, type: 'category', slug: c.slug, categoryType: c.categoryType })),
        professionals: professionals.map((p: any) => ({ id: p.id, name: p.fullName, businessName: p.businessName, type: 'professional' })),
        locations: matchedLocations,
        popularSearches: POPULAR_SEARCHES.filter((term) => term.toLowerCase().includes(keyword)),
      },
    });
  } catch (err: unknown) {
    return res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Internal Server Error' });
  }
}
