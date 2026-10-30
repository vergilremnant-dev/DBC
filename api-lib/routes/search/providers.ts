import { VercelRequest, VercelResponse } from '@vercel/node';
import { searchProviders } from '../../services/searchService.js';
import { parseNaturalLanguageQuery } from '../../utils/queryParser.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }

  try {
    const {
      search,
      categoryId,
      city,
      experience,
      rating,
      verificationStatus,
      isFeatured,
      canProvideServices,
      canProvideConsultation,
      workforce,
      sort,
      cursor,
      limit,
    } = req.query;

    const rawSearch = search ? String(search) : undefined;
    let finalSearch = rawSearch;
    let finalCity = city ? String(city) : undefined;
    let finalExperience = experience ? Number(experience) : undefined;
    let finalVerified = verificationStatus ? String(verificationStatus) : undefined;

    // Apply Intelligent Natural Language query parsing
    if (rawSearch) {
      const parsed = parseNaturalLanguageQuery(rawSearch);
      if (parsed.city && !city) finalCity = parsed.city;
      if (parsed.experience && !experience) finalExperience = parsed.experience;
      if (parsed.verifiedOnly && !verificationStatus) finalVerified = 'VERIFIED';
      if (parsed.search) finalSearch = parsed.search;
    }

    const results = await searchProviders({
      search: finalSearch,
      categoryId: categoryId ? Number(categoryId) : undefined,
      city: finalCity,
      experience: finalExperience,
      rating: rating ? Number(rating) : undefined,
      verificationStatus: finalVerified,
      isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
      canProvideServices: canProvideServices === 'true' ? true : canProvideServices === 'false' ? false : undefined,
      canProvideConsultation: canProvideConsultation === 'true' ? true : canProvideConsultation === 'false' ? false : undefined,
      workforce: workforce === 'WHITE_COLLAR' || workforce === 'BLUE_COLLAR' ? workforce : undefined,
      sort: sort as 'relevance' | 'rating' | 'experience' | 'price_asc' | 'price_desc' | 'newest',
      cursor: cursor ? String(cursor) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return res.status(200).json(results);
  } catch (err: unknown) {
    return res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Internal Server Error' });
  }
}
