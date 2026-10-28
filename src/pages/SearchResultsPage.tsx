import { useState, useEffect, startTransition } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchApi } from '../services/search/searchService';
import { providerApi } from '../services/provider/providerService';
import { useAuth } from '../hooks/auth/useAuth';
import { AuthChallengeModal } from '../components/auth/AuthChallengeModal';
import type { ProviderProfile } from '../types/provider/providerTypes';

// Sub-components
import { MarketplaceTabs } from '../components/marketplace/MarketplaceTabs';
import type { MarketplaceTabType } from '../components/marketplace/MarketplaceTabs';
import { FilterPanel } from '../components/marketplace/FilterPanel';
import type { FilterState } from '../components/marketplace/FilterPanel';
import { ProfessionalCard } from '../components/marketplace/ProfessionalCard';
import type { ProfessionalData } from '../components/marketplace/ProfessionalCard';
import { ConsultantCard } from '../components/marketplace/ConsultantCard';
import { ServiceCard } from '../components/marketplace/ServiceCard';
import type { ServiceData } from '../components/marketplace/ServiceCard';
import { ProjectCard } from '../components/marketplace/ProjectCard';
import type { ProjectData } from '../components/marketplace/ProjectCard';
import { ProfilePreview } from '../components/marketplace/ProfilePreview';
import { ComparisonTable } from '../components/marketplace/ComparisonTable';
import type { CompareItem } from '../components/marketplace/ComparisonTable';
import { EmptyState } from '../components/marketplace/EmptyState';
import { SkeletonCard } from '../components/marketplace/SkeletonCard';

// Quick categories for discovery pills
const QUICK_SPECIALTIES = [
  'All Specialties',
  'Civil Contractors',
  'Architects',
  'Interior Designers',
  'Structural Engineers',
  'Electrical & HVAC',
  'Masonry & Fitout',
];

// Service and project templates for rich card simulation
const SERVICE_TEMPLATES = [
  { name: 'Standard Layout Fitout', timeline: '3-5 Days', price: '₹4,000 - ₹12,000' },
  { name: 'Premium Coordination Plan', timeline: '1-2 Weeks', price: '₹12,000 - ₹25,050' },
  { name: 'Emergency Inspection Call', timeline: '24 Hours', price: '₹1,500 - ₹3,000' },
];

const PROJECT_TEMPLATES = [
  { name: 'Modern Space Refit', desc: 'End-to-end design layout upgrade using coordinate blueprints and natural materials.', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80' },
  { name: 'Premium Villa Project', desc: 'Structural brickwork planning and interior design blueprint execution.', img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80' },
  { name: 'Minimalist Office Fitout', desc: 'Ambient layout detailing natural timber highlights and premium glass dividers.', img: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80' },
];

export function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();

  // Search query parameters
  const q = searchParams.get('q') || '';
  const cityParam = searchParams.get('city') || '';

  // Core Data States
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Active Tab & View States
  const [activeTab, setActiveTab] = useState<MarketplaceTabType>('professionals');
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(null);
  const [selectedPreviewProvider, setSelectedPreviewProvider] = useState<ProviderProfile | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Search input state
  const [searchInputVal, setSearchInputVal] = useState(q);

  // Comparison State
  const [compareList, setCompareList] = useState<CompareItem[]>([]);
  const [isCompareDrawerOpen, setIsCompareDrawerOpen] = useState(false);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    city: cityParam,
    category: '',
    experienceYears: 0,
    isVerified: false,
    minFee: 0,
  });

  // Sort State
  const [sortBy, setSortBy] = useState<NonNullable<import('../types/search/searchTypes').ProviderSearchParams['sort']>>('relevance');

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Sync parameters on load
  useEffect(() => {
    startTransition(() => {
      setSearchInputVal(q);
      setFilters((prev) => ({ ...prev, city: cityParam }));
    });
  }, [q, cityParam]);

  // Load providers from search API
  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true);
        setErrorMsg('');
        
        const res = await searchApi.searchProviders({
          search: q || undefined,
          city: filters.city || undefined,
          sort: sortBy,
        });
        setProviders(res.data || []);
      } catch (err: unknown) {
        console.error('Failed to load search results', err);
        setErrorMsg(err instanceof Error ? err.message : 'Unable to retrieve search results');
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [q, filters.city, sortBy]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchInputVal.trim()) {
      newParams.set('q', searchInputVal.trim());
    } else {
      newParams.delete('q');
    }
    if (filters.city) {
      newParams.set('city', filters.city);
    } else {
      newParams.delete('city');
    }
    setSearchParams(newParams);
  };

  // Helper lists for the FilterPanel options
  const uniqueCities = Array.from(new Set(providers.map((p) => p.city).filter(Boolean)));
  const uniqueCategories = Array.from(new Set(providers.map((p) => p.category?.name).filter(Boolean)));

  // Filtered Providers calculation
  const filteredList = providers.filter((p) => {
    if (filters.category && p.category?.name !== filters.category) return false;
    if (p.experienceYears < filters.experienceYears) return false;
    if (filters.isVerified && p.verificationStatus !== 'VERIFIED') return false;
    return true;
  });

  // Split results dynamically into Professionals vs Consultants
  const professionals = filteredList.filter((p) => p.category?.categoryType === 'BLUE_COLLAR' || p.category?.categoryType === undefined);
  const consultants = filteredList.filter((p) => p.category?.categoryType === 'WHITE_COLLAR');

  // Dynamic mapping of Services and Projects
  const services: ServiceData[] = [];
  const projects: ProjectData[] = [];

  filteredList.forEach((p, idx) => {
    const templateS = SERVICE_TEMPLATES[idx % SERVICE_TEMPLATES.length];
    services.push({
      id: `svc_${p.id}_${idx}`,
      name: `${p.category?.name || 'Coordination'} - ${templateS.name}`,
      providerName: p.businessName || p.fullName,
      providerId: p.id,
      category: p.category?.name || 'Home Services',
      priceRange: templateS.price,
      timeline: templateS.timeline,
      rating: p.averageRating || 0,
    });

    const templateP = PROJECT_TEMPLATES[idx % PROJECT_TEMPLATES.length];
    projects.push({
      id: `proj_${p.id}_${idx}`,
      name: `${p.businessName || p.fullName} - ${templateP.name}`,
      category: p.category?.name || 'Construction',
      location: `${p.city}, ${p.state}`,
      professionalName: p.fullName,
      completionDate: 'Completed 2026',
      description: templateP.desc,
      img: templateP.img,
    });
  });

  // Calculate Tab Counts
  const tabCounts = {
    professionals: professionals.length,
    consultants: consultants.length,
    services: services.length,
    projects: projects.length,
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      city: '',
      category: '',
      experienceYears: 0,
      isVerified: false,
      minFee: 0,
    });
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('city');
    setSearchParams(newParams);
  };

  // Count active filters
  const activeFilterCount = [
    Boolean(filters.city),
    Boolean(filters.category),
    filters.experienceYears > 0,
    filters.isVerified,
  ].filter(Boolean).length;

  // View Profile Side-panel preview loader
  const handleOpenPreview = async (providerId: string) => {
    try {
      setSelectedPreviewId(providerId);
      const details = await providerApi.getProvider(providerId);
      setSelectedPreviewProvider(details);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Failed to get provider details for preview', err);
    }
  };

  // Add / Remove from Compare List
  const handleToggleCompare = (pro: ProfessionalData) => {
    const exists = compareList.find((item) => item.id === pro.id);
    if (exists) {
      setCompareList(compareList.filter((item) => item.id !== pro.id));
    } else {
      if (compareList.length >= 3) return;
      setCompareList([
        ...compareList,
        {
          id: pro.id,
          fullName: pro.fullName,
          businessName: pro.businessName,
          experienceYears: pro.experienceYears,
          rating: pro.rating || 0,
          skills: pro.skills || ['Coordination', 'Layout Drafting'],
          city: pro.city,
          consultationFee: 500,
        },
      ]);
      setIsCompareDrawerOpen(true);
    }
  };

  // Handle direct Service Booking Redirect
  const handleBookService = (providerId: string, categoryId: number) => {
    const action = () => {
      navigate(`/book-service?providerId=${providerId}&categoryId=${categoryId}`);
    };

    if (!isAuthenticated) {
      setPendingAction(() => action);
      setAuthMessage('You must be signed in to submit a project coordinate request.');
      setIsAuthModalOpen(true);
      return;
    }

    if (user?.role !== 'ROLE_CUSTOMER') {
      setErrorMsg('Only customers can request coordinates.');
      return;
    }

    action();
  };

  return (
    <div className="bg-[#FAF8F5] text-stone-900 font-sans min-h-screen selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* ========================================================================= */}
      {/* 1. HERO DISCOVERY & COMMAND CENTER (COMPACT) */}
      {/* ========================================================================= */}
      <section className="relative pt-4 pb-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-1.5 text-2xs font-bold text-stone-400 mb-3.5">
          <button onClick={() => navigate('/')} className="hover:text-stone-900 transition cursor-pointer">
            Home
          </button>
          <span>/</span>
          <span className="text-emerald-800">Professionals & Talent</span>
        </div>

        {/* Hero Card Container */}
        <div className="bg-stone-950 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-9 shadow-xl relative overflow-hidden bg-blueprint-grid">
          
          {/* Ambient Glow Elements */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-emerald-800/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-1.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-display tracking-tight leading-tight text-white">
              {q ? `Search Results for "${q}"` : 'Find the Right Professional for Your Project'}
            </h1>
            <p className="text-xs text-stone-300 font-normal leading-relaxed max-w-2xl">
              Discover verified contractors, architects, structural consultants, and tradesmen with transparent credentials and milestone tracking.
            </p>
          </div>

          {/* Elevated Search Command Bar (Compact) */}
          <form onSubmit={handleSearchSubmit} className="relative z-10 mt-5 max-w-3xl">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-1.5 rounded-xl sm:rounded-full shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
              
              {/* Search text input */}
              <div className="relative flex-1 flex items-center pl-3">
                <span className="text-stone-400 text-sm mr-2.5">🔍</span>
                <input
                  type="text"
                  value={searchInputVal}
                  onChange={(e) => setSearchInputVal(e.target.value)}
                  placeholder="Search professionals, services, or expertise (e.g. Architect, Civil, Plumbing)..."
                  className="w-full bg-transparent text-white placeholder:text-stone-400 text-xs font-medium focus:outline-none py-1.5 pr-7"
                />
                {searchInputVal && (
                  <button
                    type="button"
                    onClick={() => setSearchInputVal('')}
                    className="absolute right-2.5 w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-2xs font-bold transition cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* City quick dropdown pill */}
              <div className="hidden md:flex items-center px-2.5 py-1 border-l border-white/15">
                <span className="text-stone-400 text-xs mr-1.5">📍</span>
                <select
                  value={filters.city}
                  onChange={(e) => {
                    const city = e.target.value;
                    setFilters((prev) => ({ ...prev, city }));
                    const p = new URLSearchParams(searchParams);
                    if (city) p.set('city', city);
                    else p.delete('city');
                    setSearchParams(p);
                  }}
                  aria-label="Filter by region"
                  className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-stone-900 text-white">All Regions</option>
                  {uniqueCities.map((c) => (
                    <option key={c} value={c} className="bg-stone-900 text-white">{c}</option>
                  ))}
                </select>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="h-9.5 px-5 rounded-lg sm:rounded-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5 flex-shrink-0"
              >
                <span>Find</span>
                <span>→</span>
              </button>

            </div>
          </form>

          {/* Quick Specialty Discovery Shortcut Tags */}
          <div className="relative z-10 flex flex-wrap items-center gap-1.5 pt-4 text-xs text-stone-300">
            <span className="text-3xs font-black uppercase tracking-wider text-stone-400 mr-1">Popular:</span>
            {QUICK_SPECIALTIES.map((spec) => {
              const isSelected = filters.category === spec || (spec === 'All Specialties' && !filters.category);
              return (
                <button
                  key={spec}
                  onClick={() => {
                    if (spec === 'All Specialties') {
                      setFilters((prev) => ({ ...prev, category: '' }));
                    } else {
                      setFilters((prev) => ({ ...prev, category: spec }));
                    }
                  }}
                  className={`px-2.5 py-0.5 rounded-full text-2xs font-medium transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-white/10 hover:bg-white/20 text-stone-200 border border-white/10'
                  }`}
                >
                  {spec}
                </button>
              );
            })}
          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 2. HORIZONTAL MODERN FILTER CONTROLS & SEGMENTED TABS (COMPACT) */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-5">
        
        <div className="bg-white border border-stone-200/90 rounded-2xl p-2.5 sm:p-3 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Segmented Tab Navigator */}
          <div className="w-full lg:w-auto">
            <MarketplaceTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              counts={tabCounts}
            />
          </div>

          {/* Filter Pills & Sort Selector */}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            
            {/* Location Pill */}
            <select
              value={filters.city}
              onChange={(e) => {
                const city = e.target.value;
                setFilters((prev) => ({ ...prev, city }));
                const p = new URLSearchParams(searchParams);
                if (city) p.set('city', city);
                else p.delete('city');
                setSearchParams(p);
              }}
              aria-label="Filter by location"
              className="h-8.5 text-xs font-bold text-stone-800 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg px-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition"
            >
              <option value="">📍 All Locations</option>
              {uniqueCities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Category Pill */}
            <select
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              aria-label="Filter by specialty"
              className="h-8.5 text-xs font-bold text-stone-800 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg px-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition"
            >
              <option value="">🛠️ All Specialties</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Verified Only Toggle Pill */}
            <button
              onClick={() => setFilters((prev) => ({ ...prev, isVerified: !prev.isVerified }))}
              className={`h-8.5 px-3 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                filters.isVerified
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-800 ring-1 ring-emerald-200'
                  : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
              }`}
            >
              <span>🛡️ Verified</span>
              {filters.isVerified && <span>✓</span>}
            </button>

            {/* All Filters Drawer Trigger */}
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className={`h-8.5 px-3 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeFilterCount > 0
                  ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                  : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
              }`}
            >
              <span>⚙️ Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-stone-950 font-black text-3xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-1 pl-1.5 border-l border-stone-200">
              <span className="text-3xs font-bold uppercase tracking-wider text-stone-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                aria-label="Sort options"
                className="h-8.5 text-xs font-bold text-stone-900 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg px-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition"
              >
                <option value="relevance">Recommended</option>
                <option value="rating">Highest Rated</option>
                <option value="experience">Most Experienced</option>
                <option value="price_asc">Fee: Low to High</option>
                <option value="price_desc">Fee: High to Low</option>
              </select>
            </div>

          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 3. RESULT SUMMARY & ACTIVE CHIPS TRAY (COMPACT) */}
      {/* ========================================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-4 text-left">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-stone-200/80">
          <div>
            <h2 className="text-xs sm:text-sm font-bold font-display text-stone-900 uppercase tracking-wide flex items-center gap-1.5">
              <span className="text-emerald-800">{tabCounts[activeTab]}</span>
              <span>
                {activeTab === 'professionals' && 'Verified Professionals'}
                {activeTab === 'consultants' && 'Consulting Architects & Planners'}
                {activeTab === 'services' && 'Pre-Packaged Services'}
                {activeTab === 'projects' && 'Architectural Showcase Blueprints'}
              </span>
            </h2>
            <p className="text-2xs text-stone-500 font-normal mt-0.2">
              Showing verified partners matching your project specifications {filters.city ? `in ${filters.city}` : 'across all regions'}.
            </p>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {filters.city && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-stone-200 text-2xs font-medium text-stone-800 shadow-2xs">
                  <span>📍 {filters.city}</span>
                  <button
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, city: '' }));
                      const p = new URLSearchParams(searchParams);
                      p.delete('city');
                      setSearchParams(p);
                    }}
                    className="text-stone-400 hover:text-rose-600 ml-0.5 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              )}

              {filters.category && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-stone-200 text-2xs font-medium text-stone-800 shadow-2xs">
                  <span>Category: {filters.category}</span>
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, category: '' }))}
                    className="text-stone-400 hover:text-rose-600 ml-0.5 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              )}

              {filters.experienceYears > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-stone-200 text-2xs font-medium text-stone-800 shadow-2xs">
                  <span>Min {filters.experienceYears}+ Yrs</span>
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, experienceYears: 0 }))}
                    className="text-stone-400 hover:text-rose-600 ml-0.5 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              )}

              {filters.isVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-2xs font-bold text-emerald-800 shadow-2xs">
                  <span>🛡️ Verified Only</span>
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, isVerified: false }))}
                    className="text-emerald-700 hover:text-rose-600 ml-0.5 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              )}

              <button
                onClick={handleResetFilters}
                className="text-2xs font-bold text-rose-600 hover:text-rose-800 underline ml-1 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 4. FULL-WIDTH 3-COLUMN DISCOVERY GRID (COMPACT) */}
      {/* ========================================================================= */}
      <main className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-16">
        
        {/* Error Alert */}
        {errorMsg && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-800 text-left mb-5 shadow-2xs">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:gap-5 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <SkeletonCard key={idx} />
            ))}
          </div>
        ) : (
          <div>
            
            {/* Active Tab: Professionals */}
            {activeTab === 'professionals' && (
              <div>
                {professionals.length === 0 ? (
                  <EmptyState
                    title="No Professionals Found"
                    description="Try adjusting your filters, location parameters, or minimum experience years."
                    onReset={handleResetFilters}
                  />
                ) : (
                  <div className="grid gap-4 sm:gap-5 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {professionals.map((pro) => (
                      <ProfessionalCard
                        key={pro.id}
                        professional={{
                          id: pro.id,
                          fullName: pro.fullName,
                          businessName: pro.businessName || undefined,
                          title: pro.category?.name || 'Manual Specialist',
                          experienceYears: pro.experienceYears,
                          city: pro.city,
                          state: pro.state,
                          rating: pro.averageRating || 0,
                          skills: [pro.category?.name || 'Coordination', 'Layout Drafting', 'Civil Execution'],
                          description: pro.description || undefined,
                          isVerified: pro.verificationStatus === 'VERIFIED',
                          coverImage: pro.coverImage,
                          profileImage: pro.profileImage,
                          totalReviews: pro.totalReviews,
                          totalBookings: pro.totalBookings,
                          isAvailable: pro.isAvailable,
                        }}
                        onViewProfile={handleOpenPreview}
                        onContact={(p) => handleBookService(p.id, pro.categoryId)}
                        onAddToCompare={handleToggleCompare}
                        isComparing={!!compareList.find((item) => item.id === pro.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Active Tab: Consultants */}
            {activeTab === 'consultants' && (
              <div>
                {consultants.length === 0 ? (
                  <EmptyState
                    title="No Consultants Found"
                    description="Architects, structural designers, and landscape planners are mapped here. Try another query."
                    onReset={handleResetFilters}
                  />
                ) : (
                  <div className="grid gap-4 sm:gap-5 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {consultants.map((pro) => (
                      <ConsultantCard
                        key={pro.id}
                        consultant={{
                          id: pro.id,
                          fullName: pro.fullName,
                          title: pro.category?.name || 'Planning Consultant',
                          experienceYears: pro.experienceYears,
                          city: pro.city,
                          rating: pro.averageRating || 0,
                          languages: ['English', 'Telugu', 'Hindi'],
                          sessionDuration: '60 Mins Session',
                          fee: pro.consultationFee || 500,
                          specialization: 'Blueprints, structural analysis & layout plans',
                          coverImage: pro.coverImage || undefined,
                        }}
                        onBook={(c) => handleBookService(c.id, pro.categoryId)}
                        onViewProfile={handleOpenPreview}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Active Tab: Services */}
            {activeTab === 'services' && (
              <div>
                {services.length === 0 ? (
                  <EmptyState
                    title="No Services Found"
                    description="No active trade service packages found matching your criteria."
                    onReset={handleResetFilters}
                  />
                ) : (
                  <div className="grid gap-4 sm:gap-5 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {services.map((svc) => (
                      <ServiceCard
                        key={svc.id}
                        service={svc}
                        onBook={(s) => handleBookService(s.providerId, 0)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Active Tab: Projects */}
            {activeTab === 'projects' && (
              <div>
                {projects.length === 0 ? (
                  <EmptyState
                    title="No Completed Projects Found"
                    description="Drafting and architectural showcase galleries are empty for this tag."
                    onReset={handleResetFilters}
                  />
                ) : (
                  <div className="grid gap-4 sm:gap-5 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((proj) => (
                      <ProjectCard
                        key={proj.id}
                        project={proj}
                        onViewDetails={() => navigate(`/search?q=${encodeURIComponent(proj.category)}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* 5. SLIDE-OVER COMPREHENSIVE FILTER DRAWER (DESKTOP & MOBILE) */}
      {/* ========================================================================= */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden text-left">
          <div
            onClick={() => setIsFilterDrawerOpen(false)}
            className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs transition-opacity"
          />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-[420px] max-w-md bg-white border-l border-stone-200 p-6 sm:p-7 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
              
              <div className="space-y-6 overflow-y-auto no-scrollbar pb-6 flex-1">
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <h3 className="text-base font-bold font-display text-stone-900">
                    Discovery Filters
                  </h3>
                  <button
                    onClick={() => setIsFilterDrawerOpen(false)}
                    className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center font-bold text-sm transition cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <FilterPanel
                  filters={filters}
                  onFilterChange={setFilters}
                  onReset={handleResetFilters}
                  categoriesList={uniqueCategories}
                  citiesList={uniqueCities}
                />
              </div>

              <div className="pt-4 border-t border-stone-100 flex gap-2.5">
                <button
                  onClick={handleResetFilters}
                  className="flex-1 h-11 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Reset
                </button>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="flex-2 h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
                >
                  Show Results ({filteredList.length})
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Profile sliding preview side drawer panel */}
      {selectedPreviewId && (
        <ProfilePreview
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setSelectedPreviewId(null);
            setSelectedPreviewProvider(null);
          }}
          professional={selectedPreviewProvider}
          onBook={() => {
            if (selectedPreviewProvider) {
              setIsPreviewOpen(false);
              handleBookService(selectedPreviewProvider.id, selectedPreviewProvider.categoryId);
            }
          }}
        />
      )}

      {/* Comparative Drawer matrix bottom table overlay */}
      {compareList.length > 0 && isCompareDrawerOpen && (
        <ComparisonTable
          items={compareList}
          onRemove={(id) => setCompareList(compareList.filter((item) => item.id !== id))}
          onClose={() => setIsCompareDrawerOpen(false)}
        />
      )}

      {/* Auth verification challenge */}
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
