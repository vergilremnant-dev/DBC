import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import type { ProviderProfile } from '../../types/provider/providerTypes';
import { ServiceIcon } from './ServiceIcon';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'DB';

/** Request-a-quote entry point. The request workflow itself is unchanged in this phase. */
const quoteRequestPath = (p: Pick<ProviderProfile, 'id' | 'categoryId'>) =>
  `/book-service?providerId=${encodeURIComponent(p.id)}&categoryId=${p.categoryId}`;

/**
 * Professional discovery card. Uses public profile fields only (no contact details, emails or account ids).
 */
export function ProfessionalResultCard({ provider, showService = true }: { provider: ProviderProfile; showService?: boolean }) {
  const { isAuthenticated, user } = useAuth();
  const name = provider.businessName || provider.fullName;
  const subName = provider.businessName && provider.businessName !== provider.fullName ? provider.fullName : null;
  const verified = provider.verificationStatus === 'VERIFIED';
  const location = [provider.city, provider.state].filter(Boolean).join(', ');
  // Only customers (or guests, who are asked to sign in) can request quotes.
  const canRequest = !isAuthenticated || user?.role === 'ROLE_CUSTOMER';

  return (
    <article className="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-4 shadow-xs transition hover:shadow-md sm:p-5">
      <div className="flex items-start gap-3.5">
        {provider.profileImage ? (
          <img src={provider.profileImage} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-2xl bg-stone-100 object-cover" />
        ) : (
          <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-base font-bold text-white">
            {initials(name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold leading-snug text-stone-900 [overflow-wrap:anywhere]">
            <Link to={`/professional/${provider.id}`} className="hover:underline focus-visible:outline-none focus-visible:underline">
              {name}
            </Link>
          </h3>
          {subName && <p className="text-sm text-stone-600 [overflow-wrap:anywhere]">{subName}</p>}
          {verified && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800" title="Verified by DBC">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="m5 12 4.5 4.5L19 7" />
              </svg>
              Verified
            </span>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600">
            {showService && provider.category && (
              <span className="inline-flex items-center gap-1 font-medium text-emerald-800">
                <ServiceIcon slug={provider.category.slug} className="h-3.5 w-3.5" />
                {provider.category.name}
              </span>
            )}
            {location && <span>{location}</span>}
            {provider.experienceYears > 0 && <span>{provider.experienceYears} yrs experience</span>}
          </div>
        </div>
      </div>

      {provider.description && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-stone-700">{provider.description}</p>}

      <div className={`mt-auto grid gap-2 pt-4 ${canRequest ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <Link to={`/professional/${provider.id}`} className="dbc-btn dbc-btn-secondary min-h-[44px] px-2">
          View Profile
        </Link>
        {canRequest && (
          <Link to={quoteRequestPath(provider)} className="dbc-btn dbc-btn-primary min-h-[44px] px-2">
            Request a Quote
          </Link>
        )}
      </div>
    </article>
  );
}
