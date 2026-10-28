import { useEffect, useState, startTransition } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { categoryApi } from '../services/category/categoryService';
import { searchApi } from '../services/search/searchService';
import { providerApi } from '../services/provider/providerService';
import { useAuth } from '../hooks/auth/useAuth';
import { AuthChallengeModal } from '../components/auth/AuthChallengeModal';
import type { ServiceCategory } from '../types/category/categoryTypes';
import type { ProviderProfile } from '../types/provider/providerTypes';
import type { ProviderSearchParams } from '../types/search/searchTypes';
import { useNavigation } from '../context/NavigationContext';

const getIconEmoji = (iconName: string | null): string => {
  if (!iconName) return '🛠️';
  const lower = iconName.toLowerCase();
  if (lower.includes('plumb')) return '🚰';
  if (lower.includes('elect')) return '⚡';
  if (lower.includes('carpen') || lower.includes('wood')) return '🪚';
  if (lower.includes('paint')) return '🎨';
  if (lower.includes('ac') || lower.includes('air')) return '❄️';
  if (lower.includes('cctv') || lower.includes('sec')) return '📹';
  if (lower.includes('clean') || lower.includes('wash')) return '🧹';
  if (lower.includes('water') || lower.includes('rain')) return '☔';
  if (lower.includes('pest') || lower.includes('bug')) return '🐜';
  if (lower.includes('ceil')) return '🏠';
  if (lower.includes('tile') || lower.includes('floor')) return '🧱';
  if (lower.includes('mason') || lower.includes('brick')) return '🏗️';
  if (lower.includes('architect') || lower.includes('blueprint')) return '📐';
  if (lower.includes('design') || lower.includes('decor')) return '🛋️';
  if (lower.includes('civil') || lower.includes('eng')) return '👷';
  if (lower.includes('struc') || lower.includes('cal')) return '📊';
  if (lower.includes('land')) return '🌳';
  if (lower.includes('survey') || lower.includes('quant') || lower.includes('bill')) return '📋';
  if (lower.includes('vastu') || lower.includes('vasthu')) return '☯️';
  return '🛠️';
};

export function CategoryProvidersPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();

  const q = searchParams.get('q') || '';
  const city = searchParams.get('city') || '';

  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Hook into category state preservation from navigation context
  const { categoryStates, setCategoryState } = useNavigation();
  const currentCategoryState = categoryStates[id || ''] || {};

  // Sorting and Filtering mapped to Navigation Context
  const sortBy = (currentCategoryState.sorting as ProviderSearchParams['sort']) || 'relevance';
  const setSortBy = (val: ProviderSearchParams['sort']) => setCategoryState(id || '', { sorting: val });

  const workforceFilter = (currentCategoryState.collarFilter as string) || 'ALL';
  const setWorkforceFilter = (val: string) => setCategoryState(id || '', { collarFilter: val });

  // Auth interceptor
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Selected single provider details modal
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);

  const categoryId = id ? parseInt(id, 10) : null;

  // Close the detail dialog with Escape
  useEffect(() => {
    if (!selectedProvider) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedProvider(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedProvider]);

  useEffect(() => {
    if (!categoryId || isNaN(categoryId)) {
      startTransition(() => {
        setErrorMsg('Invalid category ID');
        setLoading(false);
      });
      return;
    }

    async function loadCategoryAndProviders() {
      try {
        setLoading(true);
        setErrorMsg('');
        
        // Fetch all categories to locate the target one
        const cats = await categoryApi.getCategories();
        const found = cats.find((c) => c.id === categoryId);
        if (!found) {
          setErrorMsg('Category not found');
          return;
        }
        setCategory(found);

        // Fetch service providers matching category
        const res = await searchApi.searchProviders({
          categoryId,
          search: q || undefined,
          city: city || undefined,
          sort: sortBy,
        });
        setProviders(res.data);
      } catch (err: unknown) {
        console.error('Failed to load category providers page data', err);
        setErrorMsg(err instanceof Error ? err.message : 'Unable to retrieve category providers');
      } finally {
        setLoading(false);
      }
    }

    loadCategoryAndProviders();
  }, [categoryId, q, city, sortBy]);

  const filteredProviders = providers.filter((p) => {
    if (workforceFilter === 'ALL') return true;
    return p.category?.categoryType === workforceFilter;
  });

  const handleBookService = (provider: ProviderProfile) => {
    const action = () => {
      navigate(`/book-service?providerId=${provider.id}&categoryId=${provider.categoryId}`);
    };

    if (!isAuthenticated) {
      setPendingAction(() => action);
      setAuthMessage('You must be signed in to submit a project coordinate request.');
      setIsAuthModalOpen(true);
      return;
    }

    if (user?.role !== 'ROLE_CUSTOMER') {
      setErrorMsg('Only customers can book providers.');
      return;
    }

    action();
  };

  const handleProviderClick = async (providerId: string) => {
    try {
      const details = await providerApi.getProvider(providerId);
      setSelectedProvider(details);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  return (
    <div className="bg-warm-cream text-stone-900 font-sans">
      <main className="dbc-container py-8 sm:py-12 space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-xs font-bold text-brand-emerald hover:text-brand-emerald/90 flex items-center gap-1 transition cursor-pointer"
          >
            ← Back to All Categories
          </button>
        </div>

        {/* Category Header Card */}
        {category && (
          <div className="p-6 sm:p-8 rounded-2xl border border-light-border bg-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="text-5xl p-3 bg-warm-cream rounded-xl">{getIconEmoji(category.icon)}</div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black font-display text-stone-900">{category.name}</h1>
                  <span className={`text-3xs font-bold px-2 py-0.5 rounded-full border uppercase ${category.categoryType === 'BLUE_COLLAR' ? 'bg-stone-100 text-stone-700 border-light-border' : 'bg-warm-cream text-wood-brown border-light-border'}`}>
                    {category.categoryType === 'BLUE_COLLAR' ? 'Blue Collar' : 'White Collar'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1 leading-relaxed max-w-2xl">{category.description || 'Verified local partners for construction, design, and long-term project requirements.'}</p>
              </div>
            </div>
            
            {/* Workforce Filter selector inside category */}
            <div className="flex bg-warm-cream p-0.5 rounded-full border border-light-border">
              <button
                onClick={() => setWorkforceFilter('ALL')}
                className={`text-3xs font-bold px-2.5 py-1 rounded-full transition cursor-pointer ${workforceFilter === 'ALL' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-850'}`}
              >
                All
              </button>
              <button
                onClick={() => setWorkforceFilter('BLUE_COLLAR')}
                className={`text-3xs font-bold px-2.5 py-1 rounded-full transition flex items-center gap-1 cursor-pointer ${workforceFilter === 'BLUE_COLLAR' ? 'bg-white text-stone-900 shadow-xs border border-light-border' : 'text-stone-500 hover:text-stone-850'}`}
              >
                Blue
              </button>
              <button
                onClick={() => setWorkforceFilter('WHITE_COLLAR')}
                className={`text-3xs font-bold px-2.5 py-1 rounded-full transition flex items-center gap-1 cursor-pointer ${workforceFilter === 'WHITE_COLLAR' ? 'bg-white text-stone-900 shadow-xs border border-light-border' : 'text-stone-500 hover:text-stone-850'}`}
              >
                White
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="rounded-lg bg-rose-50 border border-rose-100 p-4 text-xs font-semibold text-rose-700">
            {errorMsg}
          </div>
        )}

        {/* Category Sorting Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-light-border pb-4">
          <div>
            <h2 className="text-lg font-bold font-display text-stone-900">Available Professionals</h2>
            <p className="text-xs text-stone-500">Showing {filteredProviders.length} active service partners</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as ProviderSearchParams['sort'])}
              className="text-2xs font-bold text-stone-650 bg-white border border-light-border px-3.5 py-1.5 rounded-full shadow-xs focus:outline-none cursor-pointer hover:bg-warm-cream transition font-semibold"
            >
              <option value="relevance">Relevance Sort</option>
              <option value="rating">Highest Rating</option>
              <option value="experience">Most Experience</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest Partners</option>
            </select>
          </div>
        </div>

        {/* Directory Grid / Loader */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="rounded-2xl border border-light-border bg-white p-6 space-y-4 shadow-xs">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-16 rounded skeleton-pulse"></div>
                  <div className="h-4 w-8 rounded skeleton-pulse"></div>
                </div>
                <div className="h-6 w-3/4 rounded skeleton-pulse"></div>
                <div className="h-4 w-1/2 rounded skeleton-pulse"></div>
                <div className="space-y-2 mt-4">
                  <div className="h-3 w-full rounded skeleton-pulse"></div>
                  <div className="h-3 w-full rounded skeleton-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-light-border p-12 text-center bg-white shadow-xs">
            <p className="text-stone-400 text-sm font-medium">No verified professionals available in this category field.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProviders.map((p) => {
              const isBlueCollar = p.category?.categoryType === 'BLUE_COLLAR';
              return (
                <div
                  key={p.id}
                  className="flex flex-col justify-between rounded-3xl border border-light-border bg-white p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${isBlueCollar ? 'bg-stone-500' : 'bg-wood-brown'}`}></span>
                        <span className={`text-3xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border font-black ${isBlueCollar ? 'text-stone-700 bg-stone-100 border-light-border' : 'text-wood-brown bg-warm-cream border-light-border'}`}>
                          {isBlueCollar ? 'Blue Collar' : 'White Collar'}
                        </span>
                      </div>
                      <span className="text-2xs font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">{p.averageRating > 0 ? `⭐ ${p.averageRating.toFixed(1)}` : 'New'}</span>
                    </div>

                    <h3 className="mt-4 text-base font-extrabold text-stone-900 leading-tight font-display">{p.fullName}</h3>
                    {p.businessName && <p className="text-xs font-semibold text-stone-400 mt-0.5">{p.businessName}</p>}
                    
                    <p className="mt-3 text-xs text-stone-500 font-semibold">📍 {p.city}, {p.state}</p>
                    <p className="text-2xs text-stone-400 font-bold uppercase tracking-wider mt-1">💼 {p.experienceYears} Years Experience</p>
                    
                    <p className="mt-4 text-xs text-stone-600 line-clamp-3 leading-relaxed">
                      {p.description || 'No business description provided.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-light-border flex gap-2">
                    <button
                      onClick={() => handleProviderClick(p.id)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold uppercase border border-light-border bg-white text-stone-700 hover:bg-warm-cream transition duration-200 cursor-pointer"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => handleBookService(p)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold uppercase text-white bg-brand-emerald hover:bg-brand-emerald/90 transition duration-200 cursor-pointer shadow-xs"
                    >
                      Discuss Project
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Provider detail modal */}
      {selectedProvider && (
        <div className="dbc-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedProvider(null); }}>
          <div role="dialog" aria-modal="true" className="dbc-modal dbc-modal-xl space-y-6">
            <button
              onClick={() => setSelectedProvider(null)}
              className="dbc-modal-close absolute top-4 right-4 z-10 bg-white/90 shadow-sm" aria-label="Close dialog"
            >
              ✕
            </button>
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-full bg-warm-cream flex items-center justify-center text-3xl">👤</div>
              <div>
                <h3 className="text-xl font-bold font-display text-stone-955">{selectedProvider.fullName}</h3>
                <p className="text-xs text-stone-500 font-medium">{selectedProvider.businessName || 'Independent Partner'}</p>
                <p className="text-xs text-stone-450 mt-1">📍 {selectedProvider.city}, {selectedProvider.state}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 border-y border-light-border py-4 text-center">
              <div>
                <span className="block text-lg font-bold text-stone-950">{selectedProvider.experienceYears} Years</span>
                <span className="text-3xs text-stone-450 uppercase font-black">Experience</span>
              </div>
              <div>
                <span className="block text-lg font-bold text-stone-955">{selectedProvider.averageRating > 0 ? `⭐ ${selectedProvider.averageRating.toFixed(1)}` : 'New'}</span>
                <span className="text-3xs text-stone-450 uppercase font-black">Rating</span>
              </div>
              <div>
                <span className="block text-lg font-bold text-stone-955">₹{selectedProvider.consultationFee || '0'}</span>
                <span className="text-3xs text-stone-450 uppercase font-black">Consultation</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs uppercase font-bold text-stone-455 tracking-widest mb-2">About Professional</h4>
              <p className="text-xs text-stone-600 leading-relaxed">{selectedProvider.description || 'No detailed description available.'}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedProvider(null)}
                className="flex-1 border border-light-border hover:bg-warm-cream rounded-xl py-2.5 text-xs font-bold uppercase transition cursor-pointer"
              >
                Close Profile
              </button>
              <button
                onClick={() => {
                  setSelectedProvider(null);
                  handleBookService(selectedProvider);
                }}
                className="flex-1 bg-brand-emerald hover:bg-brand-emerald/90 text-white rounded-xl py-2.5 text-xs font-bold uppercase transition shadow-xs cursor-pointer"
              >
                Request Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal Guard */}
      <AuthChallengeModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        message={authMessage}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }}
      />
    </div>
  );
}
