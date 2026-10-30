import { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getTrendingProfessionals,
  getMostBookedServices,
  getNewlyVerifiedProfessionals,
  getSimilarProfessionals,
  getRelatedServices
} from '../../services/recommendationService.js';
import { getCached, setCached } from '../../utils/cache.js';
import { toPublicProviders } from '../../utils/publicProvider.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = req.method;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, message: `Method ${method} Not Allowed` });
  }

  const { type, limit = 5, providerId, categoryId } = req.query;
  const parsedLimit = Number(limit);

  try {
    const cacheKey = `recommendation:${type}:${parsedLimit}:${providerId || ''}:${categoryId || ''}`;
    const cachedData = getCached<unknown>(cacheKey);
    if (cachedData) {
      return res.status(200).json({ success: true, data: cachedData });
    }

    let data: unknown = null;

    switch (type) {
      case 'trending':
        data = toPublicProviders(await getTrendingProfessionals(parsedLimit));
        break;
      case 'most-booked':
        data = await getMostBookedServices(parsedLimit);
        break;
      case 'newly-verified':
        data = toPublicProviders(await getNewlyVerifiedProfessionals(parsedLimit));
        break;
      case 'similar':
        if (!providerId) {
          return res.status(400).json({ success: false, message: 'Provider ID is required for similar recommendations.' });
        }
        data = toPublicProviders(await getSimilarProfessionals(String(providerId), parsedLimit));
        break;
      case 'related-services':
        if (!categoryId) {
          return res.status(400).json({ success: false, message: 'Category ID is required for related services.' });
        }
        data = await getRelatedServices(Number(categoryId), parsedLimit);
        break;
      default:
        return res.status(400).json({ success: false, message: `Invalid recommendation type: ${type}` });
    }

    // Cache the recommendation data for 5 minutes
    setCached(cacheKey, data, 5 * 60 * 1000);

    return res.status(200).json({ success: true, data });
  } catch (err: unknown) {
    return res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Internal Server Error' });
  }
}
