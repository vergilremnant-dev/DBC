/**
 * Public (unauthenticated marketplace) representations of provider data.
 *
 * Explicit allowlists: anything not listed here — login email, user/auth ids,
 * phone numbers, Firebase identifiers, customer records inside reviews — is never
 * sent to public discovery responses. Add a field only if it is safe to publish.
 */

const PROVIDER_FIELDS = [
  'id',
  'fullName',
  'businessName',
  'profileImage',
  'coverImage',
  'description',
  'experienceYears',
  'city',
  'state',
  'serviceAreas',
  'categoryId',
  'verificationStatus',
  'averageRating',
  'totalReviews',
  'rating1Count',
  'rating2Count',
  'rating3Count',
  'rating4Count',
  'rating5Count',
  'totalBookings',
  'isAvailable',
  'isFeatured',
  'canProvideServices',
  'canProvideConsultation',
  'consultationFee',
  'totalConsultations',
  'createdAt',
] as const;

const CATEGORY_FIELDS = ['id', 'name', 'slug', 'categoryType', 'description', 'imageUrl', 'icon', 'parentId', 'isActive', 'isFeatured', 'displayOrder'] as const;
const PORTFOLIO_FIELDS = ['id', 'title', 'description', 'projectType', 'imageUrl', 'createdAt'] as const;
const REVIEW_FIELDS = ['id', 'rating', 'reviewTitle', 'reviewDescription', 'wouldRecommend', 'providerResponse', 'isVerified', 'createdAt'] as const;

type AnyRecord = Record<string, unknown>;

function pick(source: AnyRecord, keys: readonly string[]): AnyRecord {
  const out: AnyRecord = {};
  for (const k of keys) if (k in source) out[k] = source[k];
  return out;
}

export function toPublicCategory(category: unknown): AnyRecord | null {
  return category && typeof category === 'object' ? pick(category as AnyRecord, CATEGORY_FIELDS) : null;
}

/** "Priya Sharma" → "Priya S." — reviewers are shown by first name and initial only. */
export function publicDisplayName(fullName: unknown): string {
  const parts = String(fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'DBC customer';
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
}

export interface PublicProviderOptions {
  /**
   * Include `phoneNumber`. Only for the profile endpoint, which already masks it
   * unless the viewer is the owner, an admin or an active subscriber.
   */
  includePhone?: boolean;
}

export function toPublicProvider(provider: unknown, options: PublicProviderOptions = {}): AnyRecord {
  const p = (provider ?? {}) as AnyRecord;
  const out = pick(p, PROVIDER_FIELDS);
  if ('category' in p) out.category = toPublicCategory(p.category);
  if (options.includePhone && typeof p.phoneNumber === 'string') out.phoneNumber = p.phoneNumber;
  if (Array.isArray(p.portfolios)) out.portfolios = p.portfolios.map((x) => pick(x as AnyRecord, PORTFOLIO_FIELDS));
  if (Array.isArray(p.reviews)) {
    out.reviews = (p.reviews as AnyRecord[])
      .filter((r) => r.isVisible !== false)
      .map((r) => ({
        ...pick(r, REVIEW_FIELDS),
        customer: r.customer ? { fullName: publicDisplayName((r.customer as AnyRecord).fullName) } : null,
      }));
  }
  return out;
}

export const toPublicProviders = (list: unknown[]): AnyRecord[] => list.map((p) => toPublicProvider(p));
