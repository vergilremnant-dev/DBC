import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryApi } from '../services/category/categoryService';
import { searchApi } from '../services/search/searchService';
import { useAuth } from '../hooks/auth/useAuth';
import type { ServiceCategory } from '../types/category/categoryTypes';
import type { ProviderProfile } from '../types/provider/providerTypes';
import { useNavigation } from '../context/NavigationContext';
import { BrandLogo } from '../components/common/BrandLogo';

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

interface HomeProject {
  title: string;
  desc: string;
  img: string;
  budget: string;
  duration: string;
  professions: string[];
}

const HOME_PROJECTS: HomeProject[] = [
  {
    title: "Modern Kitchen Renovation",
    desc: "Complete modular upgrade featuring custom storage cabinets, ventilation fixtures, and piping work.",
    img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80",
    budget: "₹2,50,000 - ₹5,00,000",
    duration: "4-6 Weeks",
    professions: ["Interior Designers", "Carpentry", "Electrical", "Plumbing"],
  },
  {
    title: "Luxury Living Room Makeover",
    desc: "Redesign featuring ambient lighting false ceilings, wall painting, and tailored cabinet setups.",
    img: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80",
    budget: "₹1,50,000 - ₹3,00,000",
    duration: "3-4 Weeks",
    professions: ["Interior Designers", "False Ceiling", "Painting", "Electrical", "Carpentry"],
  },
  {
    title: "Complete Home Construction",
    desc: "End-to-end villa construction starting from blueprint layout designs to brick masonry execution.",
    img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
    budget: "₹2,200 - ₹2,800 / sq ft",
    duration: "8-12 Months",
    professions: ["Architects", "Structural Engineers", "Brick Work", "Waterproofing", "Plumbing"],
  },
  {
    title: "Landscape Garden Setup",
    desc: "Backyard terrace setups, outdoor landscape plans, and garden element installations.",
    img: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80",
    budget: "₹80,000 - ₹2,00,000",
    duration: "2-3 Weeks",
    professions: ["Landscape Designers", "Waterproofing", "Electrical"],
  },
];

const CATEGORY_POPULARITY_SCORES: Record<string, number> = {
  'architect': 105,
  'interior': 102,
  'structural': 101,
  'electrician': 100,
  'electrical': 100,
  'plumber': 95,
  'plumbing': 95,
  'waterproof': 90,
  'paint': 85,
  'carpen': 80,
  'tile': 75,
  'false ceiling': 70,
  'brick': 65,
  'mason': 65,
  'civil': 62,
  'formwork': 60,
  'elevation': 55,
  'landscape': 52,
};

const getPopularityScore = (name: string) => {
  const norm = name.toLowerCase();
  for (const [key, score] of Object.entries(CATEGORY_POPULARITY_SCORES)) {
    if (norm.includes(key)) return score;
  }
  return 0;
};

export function PublicMarketplace() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<HomeProject | null>(null);

  // Hook into global navigation context preservation
  const {
    selectedCity,
    setSelectedCity,
    homeCollarFilter: collarFilter,
    setHomeCollarFilter: setCollarFilter,
  } = useNavigation();

  // Search & Filter Module States & Refs
  const [heroSearchVal, setHeroSearchVal] = useState('');
  const [isHeroLocationOpen, setIsHeroLocationOpen] = useState(false);
  const [isHeroFilterOpen, setIsHeroFilterOpen] = useState(false);
  const heroLocationRef = useRef<HTMLDivElement>(null);
  const heroFilterRef = useRef<HTMLDivElement>(null);

  // Click outside listener for hero location/filter dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (heroLocationRef.current && !heroLocationRef.current.contains(event.target as Node)) {
        setIsHeroLocationOpen(false);
      }
      if (heroFilterRef.current && !heroFilterRef.current.contains(event.target as Node)) {
        setIsHeroFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Location-dependent data states
  const [cityProviders, setCityProviders] = useState<ProviderProfile[]>([]);
  const [allProviders, setAllProviders] = useState<ProviderProfile[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);

  // Fetch categories
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const cats = await categoryApi.getCategories();
        setCategories(cats);
      } catch (err: unknown) {
        console.error('Failed to load marketplace content', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isAuthenticated]);

  // Fetch all providers globally once (for fallback display)
  useEffect(() => {
    let active = true;
    async function loadAllProviders() {
      try {
        const res = await searchApi.searchProviders({ limit: 100 });
        if (active) {
          setAllProviders(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load global providers', err);
      }
    }
    loadAllProviders();
    return () => {
      active = false;
    };
  }, []);

  // Fetch city-specific providers dynamically when city changes, with request cancellation
  useEffect(() => {
    let active = true;
    async function loadCityProviders() {
      try {
        setProvidersLoading(true);
        const res = await searchApi.searchProviders({ city: selectedCity, limit: 100 });
        if (active) {
          setCityProviders(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load city providers', err);
      } finally {
        if (active) {
          setProvidersLoading(false);
        }
      }
    }
    loadCityProviders();
    return () => {
      active = false;
    };
  }, [selectedCity]);

  const getCategoryProCount = (categoryId: number) => {
    return cityProviders.filter((p) => p.categoryId === categoryId).length;
  };

  const handleConsultantClick = (name: string) => {
    const matched = categories.find((cat) => cat.name.toLowerCase().includes(name.toLowerCase().slice(0, 5)));
    if (matched) {
      navigate(`/category/${matched.id}/providers?city=${encodeURIComponent(selectedCity)}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(name)}&city=${encodeURIComponent(selectedCity)}`);
    }
  };

  const handleProfessionClick = (professionName: string) => {
    const matched = categories.find((cat) => cat.name.toLowerCase().includes(professionName.toLowerCase().slice(0, 5)));
    if (matched) {
      navigate(`/category/${matched.id}/providers?city=${encodeURIComponent(selectedCity)}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(professionName)}&city=${encodeURIComponent(selectedCity)}`);
    }
    setSelectedProject(null);
  };

  // Filter categories by search and collar type (All, Manual Trade, Consulting)
  const filteredCategories = categories.filter((cat) => {
    if (heroSearchVal.trim()) {
      const q = heroSearchVal.toLowerCase().trim();
      const matchName = cat.name.toLowerCase().includes(q);
      const matchDesc = cat.description?.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    if (collarFilter === 'ALL') return true;
    return cat.categoryType === collarFilter;
  });

  // Sort by popularity ranking score
  const sortedCategories = [...filteredCategories].sort(
    (a, b) => getPopularityScore(b.name) - getPopularityScore(a.name)
  );

  return (
    <div className="bg-light-stone text-stone-black font-sans min-h-screen bg-concrete-grain">

      {/* Main Service-First Marketplace Container */}
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-6 sm:pt-8 pb-12 space-y-12 sm:space-y-16">

        {/* Primary Service Discovery Hero (Urban Company-inspired clean 2-column layout) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

          {/* Left Column: Heading + Search + Service Categories Grid */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-6 text-left">
            
            {/* Location Selector & Search Module */}
            <div className="bg-white border border-stone-200 rounded-2xl p-2.5 sm:p-3 shadow-xs space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:gap-2.5 w-full transition-all duration-200 focus-within:ring-2 focus-within:ring-brand-emerald/15 focus-within:border-brand-emerald">
              
              {/* Location Select */}
              <div className="relative flex-shrink-0" ref={heroLocationRef}>
                <button
                  type="button"
                  onClick={() => setIsHeroLocationOpen(!isHeroLocationOpen)}
                  className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-3 py-2 rounded-xl bg-stone-50 hover:bg-stone-100 text-xs text-stone-850 transition cursor-pointer select-none focus:outline-none"
                  aria-label="Select location"
                >
                  <span className="text-sm">📍</span>
                  <div className="flex flex-col text-left leading-none">
                    <span className="text-[10px] font-extrabold text-stone-black">{selectedCity}</span>
                    <span className="text-[7.5px] text-stone-gray font-semibold tracking-wide whitespace-nowrap mt-0.5">Change City</span>
                  </div>
                  <span className="text-[8px] text-stone-400">▼</span>
                </button>

                {isHeroLocationOpen && (
                  <div className="absolute left-0 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-light-border bg-white p-3 shadow-apple-lg z-50 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="space-y-1">
                      <span className="block text-[9px] uppercase tracking-wider font-extrabold text-stone-gray">Popular Cities</span>
                      {['Hyderabad', 'Chennai', 'Bangalore', 'Mumbai', 'Delhi'].map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => {
                            setSelectedCity(city);
                            setIsHeroLocationOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-md text-xs font-semibold hover:bg-light-stone hover:text-stone-black transition cursor-pointer focus:bg-light-stone focus:outline-none ${selectedCity.toLowerCase() === city.toLowerCase() ? 'bg-brand-emerald/10 text-brand-emerald font-extrabold' : 'text-stone-gray'}`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Separator Line (Hidden on Mobile) */}
              <span className="hidden sm:block h-6 w-px bg-stone-200 flex-shrink-0" />

              {/* Search Bar Input */}
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <span className="text-stone-400 text-sm pointer-events-none select-none">🔍</span>
                <input
                  type="text"
                  placeholder="Search construction services, architects, contractors..."
                  value={heroSearchVal}
                  onChange={(e) => setHeroSearchVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && heroSearchVal.trim()) {
                      navigate(`/search?q=${encodeURIComponent(heroSearchVal.trim())}&city=${encodeURIComponent(selectedCity)}`);
                    }
                  }}
                  className="w-full bg-transparent text-base sm:text-xs font-semibold text-stone-850 placeholder:text-stone-400 focus:outline-none border-none p-0"
                />
              </div>

              {/* Separator Line (Hidden on Mobile) */}
              <span className="hidden sm:block h-6 w-px bg-stone-200 flex-shrink-0" />

              {/* Filters Action */}
              <div className="relative flex-shrink-0" ref={heroFilterRef}>
                <button
                  type="button"
                  onClick={() => setIsHeroFilterOpen(!isHeroFilterOpen)}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-stone-50 hover:bg-stone-100 text-xs text-stone-800 transition cursor-pointer select-none focus:outline-none"
                  aria-label="Advanced filters"
                >
                  <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span className="text-[10px] font-extrabold text-stone-700">Filters</span>
                </button>

                {isHeroFilterOpen && (
                  <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-light-border bg-white p-4 shadow-apple-lg z-50 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="space-y-2">
                      <span className="block text-[9px] uppercase tracking-wider font-extrabold text-stone-gray">Advanced Criteria</span>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-stone-750">Min Rating</label>
                        <select className="w-full text-xs border border-light-border rounded-lg p-1.5 focus:outline-none bg-white">
                          <option>Any rating</option>
                          <option>4.5+ Stars</option>
                          <option>4.0+ Stars</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-stone-750">Experience</label>
                        <select className="w-full text-xs border border-light-border rounded-lg p-1.5 focus:outline-none bg-white">
                          <option>Any experience</option>
                          <option>5+ Years</option>
                          <option>2+ Years</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Header + Filter Pills Bar */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-black tracking-tight font-serif leading-tight">
                  What do you want to build?
                </h1>
                <p className="text-xs text-stone-gray font-medium">
                  Select a category to discover verified professionals and request project quotes in {selectedCity}.
                </p>
              </div>

              {/* Category Scope Filter Pills */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-light-border shadow-2xs self-start sm:self-auto flex-shrink-0">
                {(['ALL', 'BLUE_COLLAR', 'WHITE_COLLAR'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setCollarFilter(filter)}
                    className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full transition cursor-pointer select-none ${
                      collarFilter === filter
                        ? 'bg-brand-emerald text-white font-extrabold shadow-xs'
                        : 'text-stone-gray hover:text-stone-black hover:bg-stone-50'
                    }`}
                  >
                    {filter === 'ALL' ? 'All' : filter === 'BLUE_COLLAR' ? 'Trades' : 'Consulting'}
                  </button>
                ))}
              </div>
            </div>

            {/* Service Categories Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-3.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
                  <div key={idx} className="h-24 rounded-2xl bg-white border border-light-border animate-pulse shadow-2xs"></div>
                ))}
              </div>
            ) : sortedCategories.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-3.5">
                {sortedCategories.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => navigate(`/category/${cat.id}/providers?city=${encodeURIComponent(selectedCity)}`)}
                    className="group relative flex flex-col items-center justify-center p-3 sm:p-3.5 bg-white border border-light-border hover:border-brand-emerald rounded-2xl shadow-2xs hover:shadow-apple-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald text-center cursor-pointer min-h-[96px] w-full"
                  >
                    <div className="w-10 h-10 rounded-xl bg-light-stone/70 group-hover:bg-brand-emerald/10 flex items-center justify-center text-xl transition-colors duration-200 flex-shrink-0">
                      {getIconEmoji(cat.icon || cat.name)}
                    </div>
                    <span className="mt-2 text-xs font-black text-stone-black group-hover:text-brand-emerald transition-colors line-clamp-1 max-w-full">
                      {cat.name}
                    </span>
                    <span className="text-[8.5px] text-stone-gray font-semibold tracking-tight mt-0.5">
                      {providersLoading ? '...' : `${getCategoryProCount(cat.id)} Verified Pros`}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-dashed border-light-border rounded-2xl p-8 text-center space-y-2">
                <span className="text-2xl">🔍</span>
                <p className="text-xs text-stone-black font-bold">No matching categories found.</p>
                <p className="text-[10px] text-stone-gray font-medium">Try clearing your search query or switching filters.</p>
                {heroSearchVal && (
                  <button
                    type="button"
                    onClick={() => setHeroSearchVal('')}
                    className="dbc-btn dbc-btn-sm dbc-btn-secondary text-[10px] mt-2"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )}

          </div>

          {/* Right Column: Tasteful Construction Visual Showcase (Collage) */}
          <div className="lg:col-span-5 xl:col-span-5 hidden lg:flex flex-col gap-4 sticky top-24 animate-gentle-fade">
            
            {/* Primary Featured Construction Card */}
            <div className="relative rounded-3xl overflow-hidden border border-light-border bg-white shadow-apple-md aspect-[16/11] group">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
                alt="Contemporary Villa Construction Project"
                className="w-full h-full object-cover transform group-hover:scale-[1.02] transition duration-500"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent"></div>
              
              {/* Top Badge */}
              <div className="absolute top-3.5 left-3.5 bg-stone-950/70 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border border-stone-800 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Verified Execution Network</span>
              </div>

              {/* Bottom Inset Content */}
              <div className="absolute bottom-4 left-4 right-4 text-left text-white space-y-1">
                <span className="block text-[8px] font-black uppercase tracking-widest text-emerald-300">Turnkey Construction</span>
                <h3 className="text-sm font-extrabold leading-snug text-white">Residential & Commercial Build Coordination</h3>
                <p className="text-[10px] text-stone-300 font-medium line-clamp-1">From blueprint CAD layout to milestone handover.</p>
              </div>
            </div>

            {/* Dual Secondary Visuals Collage */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative rounded-2xl overflow-hidden border border-light-border bg-white shadow-2xs aspect-[16/10] group cursor-pointer"
                   onClick={() => handleConsultantClick('Architects')}>
                <img
                  src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80"
                  alt="Architectural Layout Blueprint Design"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent flex items-end p-3 text-left">
                  <div>
                    <span className="block text-[7.5px] font-black uppercase tracking-wider text-emerald-300">Phase 01</span>
                    <span className="block text-[10.5px] font-extrabold text-white leading-tight">Architectural Design</span>
                  </div>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-light-border bg-white shadow-2xs aspect-[16/10] group cursor-pointer"
                   onClick={() => handleProfessionClick('Electrical')}>
                <img
                  src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80"
                  alt="Specialized Trade Finishing"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent flex items-end p-3 text-left">
                  <div>
                    <span className="block text-[7.5px] font-black uppercase tracking-wider text-emerald-300">Phase 02</span>
                    <span className="block text-[10.5px] font-extrabold text-white leading-tight">Trade Execution</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Marketplace Trust Highlights */}
            <div className="grid grid-cols-3 gap-2 bg-white border border-light-border p-3 rounded-2xl shadow-2xs text-center">
              <div className="space-y-0.5">
                <span className="block text-[10px]">🛡️</span>
                <span className="block text-[8px] font-black uppercase tracking-wider text-stone-black">Vetted Pros</span>
                <span className="block text-[7.5px] text-stone-gray font-medium">Verified Credentials</span>
              </div>
              <div className="space-y-0.5 border-x border-light-border px-1">
                <span className="block text-[10px]">📊</span>
                <span className="block text-[8px] font-black uppercase tracking-wider text-stone-black">Transparent</span>
                <span className="block text-[7.5px] text-stone-gray font-medium">Direct Itemized Quotes</span>
              </div>
              <div className="space-y-0.5">
                <span className="block text-[10px]">💳</span>
                <span className="block text-[8px] font-black uppercase tracking-wider text-stone-black">Milestone Pay</span>
                <span className="block text-[7.5px] text-stone-gray font-medium">Stage Authorizations</span>
              </div>
            </div>

          </div>

        </section>

        {/* Trust Strip */}
        <section className="border-y border-light-border/60 bg-white/60 backdrop-blur-xs py-5 rounded-2xl">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 grid grid-cols-2 md:grid-cols-5 gap-4 text-center text-stone-gray">
            {[
              { label: 'Verified Profiles', icon: '🛡️' },
              { label: 'Secure Platform', icon: '💬' },
              { label: 'Transparent Quotes', icon: '📊' },
              { label: 'Project Tracking', icon: '⚙️' },
              { label: 'Direct Communication', icon: '⭐' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-center gap-2">
                <span className="text-sm">{item.icon}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-stone-gray">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Professionals */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-light-border/60 pb-4">
            <div className="space-y-1 text-left">
              <h2 className="text-title text-stone-black">Featured Partners</h2>
              <p className="text-xs text-stone-gray font-semibold">
                Top-rated contractors currently active in {selectedCity} networks.
              </p>
            </div>
            <span className="dbc-badge dbc-badge-verified">
              🟢 {providersLoading ? 'Syncing...' : `${cityProviders.length > 0 ? cityProviders.length : allProviders.length} Active`}
            </span>
          </div>

          {providersLoading ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="h-44 rounded-3xl bg-white border border-light-border animate-pulse shadow-apple-sm"></div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {(cityProviders.length > 0 ? cityProviders.slice(0, 4) : allProviders.slice(0, 4)).map((pro) => (
                <div
                  key={pro.id}
                  onClick={() => navigate(`/category/${pro.categoryId}/providers?city=${encodeURIComponent(pro.city)}`)}
                  className="dbc-card-interactive bg-white border border-light-border p-5 cursor-pointer flex flex-col justify-between shadow-apple-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-brand-emerald text-white font-extrabold flex items-center justify-center text-xs uppercase shadow-sm">
                        {pro.fullName.charAt(0)}
                      </div>
                      <div className="text-left min-w-0">
                        <span className="block text-xs font-black text-stone-black truncate max-w-[140px]">
                          {pro.businessName || pro.fullName}
                        </span>
                        <span className="block text-[8px] text-stone-gray font-black uppercase truncate">
                          {pro.category?.name || 'Partner'}
                        </span>
                      </div>
                    </div>
                    <p className="text-left text-[10px] text-stone-gray font-semibold leading-relaxed line-clamp-2">
                      {pro.description || `Verified coordination partner offering expert ${pro.category?.name.toLowerCase() || 'trade'} services.`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-light-border/40 pt-3 mt-4">
                    <div className="flex gap-1.5 text-[8px] font-black text-stone-gray uppercase">
                      <span>⭐ {pro.averageRating.toFixed(1)}</span>
                      <span>•</span>
                      <span>📍 {pro.city}</span>
                    </div>
                    <span className="text-[9px] font-bold text-brand-emerald uppercase tracking-wider">View Profile →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Featured Projects & Inspiration Slides (Dark Theme Showcase Wrapper) */}
        <section>
          <div className="bg-stone-950 border border-stone-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-8 relative overflow-hidden bg-blueprint-grid">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-800 pb-4 relative z-10">
              <div className="text-left space-y-2">
                <h2 className="text-title text-white">Popular Curated Projects</h2>
                <p className="text-xs text-stone-400 font-semibold">
                  Click on any project to see required building materials, trade expertise, and average execution timelines.
                </p>
              </div>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
              {HOME_PROJECTS.map((proj, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedProject(proj)}
                  className="group bg-stone-900 border border-stone-850 hover:border-brand-emerald/40 rounded-2xl overflow-hidden shadow-apple-sm hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    <div className="h-32 relative overflow-hidden">
                      <img
                        src={proj.img}
                        alt={proj.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500 opacity-90"
                        loading="lazy"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-stone-950/80 backdrop-blur-sm text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-stone-800">
                        {proj.duration}
                      </div>
                    </div>
                    <div className="p-4 space-y-2 text-left">
                      <h3 className="text-xs font-black text-white truncate group-hover:text-brand-emerald transition">
                        {proj.title}
                      </h3>
                      <p className="text-[10px] text-stone-400 font-semibold line-clamp-2 leading-relaxed">
                        {proj.desc}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 pt-0 flex items-center justify-between text-[9px] font-bold text-brand-emerald uppercase tracking-wider group-hover:text-white transition duration-200">
                    <span>Explore Parameters</span>
                    <span>→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Minimal Testimonials Section */}
        <section className="space-y-8">
          <div className="max-w-2xl text-left space-y-2">
            <h2 className="text-title text-stone-black">Client Feedback</h2>
            <p className="text-xs text-stone-gray font-semibold">
              What architects, contractors, and builders say about collaborating on DBC.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { text: "DBC transformed how we managed our villa construction. We had direct communication with structural engineers and manual trade coordinators in a single unified dashboard view.", author: "K. R. Rao", role: "Villa Owner, Hyderabad" },
              { text: "Verified local specialists, transparent milestone billing. Zero broker fees. This is the exact design coordination toolkit we needed.", author: "Sanjay Chagantipati", role: "Design Lead, Abhista Studios" },
            ].map((item, idx) => (
              <blockquote key={idx} className="bg-white border border-light-border p-6 rounded-2xl text-left space-y-4 shadow-apple-sm">
                <p className="text-xs text-stone-black font-semibold leading-relaxed italic">
                  "{item.text}"
                </p>
                <div className="flex items-center gap-2 pt-2 border-t border-light-border/40">
                  <div className="w-6 h-6 rounded-full bg-light-stone flex items-center justify-center text-[9px] font-bold text-stone-gray">👤</div>
                  <div className="text-[9px] leading-tight">
                    <span className="block font-extrabold text-stone-black">{item.author}</span>
                    <span className="block text-stone-gray font-semibold">{item.role}</span>
                  </div>
                </div>
              </blockquote>
            ))}
          </div>
        </section>

        {/* Project Showcase Masonry Gallery */}
        <section className="space-y-6">
          <div className="text-left space-y-2">
            <h2 className="text-title text-stone-black">Architectural Portfolio</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
              'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80',
              'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80',
            ].map((src, idx) => (
              <div key={idx} className="h-48 md:h-64 rounded-2xl overflow-hidden border border-light-border shadow-apple-sm relative group">
                <img src={src} alt="Showcase architecture layout" className="w-full h-full object-cover transform group-hover:scale-102 transition duration-300" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-4 text-left">
                  <span className="text-[9px] font-bold text-white uppercase tracking-widest">DBC Studio Design</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final Call to Action */}
        <section>
          <div className="bg-stone-900 text-white rounded-3xl p-8 sm:p-12 text-center bg-arch-grid relative overflow-hidden border border-stone-800 shadow-xl">
            <div className="absolute inset-0 bg-brand-emerald/5 rounded-full filter blur-[100px]"></div>
            <div className="relative z-10 max-w-xl mx-auto space-y-6">
              <h3 className="text-xl sm:text-3xl font-bold font-serif text-white">
                Start Your Dream Project Today
              </h3>
              <p className="text-xs text-stone-400 font-semibold leading-relaxed">
                Join DBC to connect directly with builders, plumbers, electricians, and structural engineers in {selectedCity} with no middleman commissions.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => navigate('/search')}
                  className="dbc-btn dbc-btn-xl dbc-btn-primary"
                >
                  Browse All Services
                </button>
                <button
                  onClick={() => handleConsultantClick('Architects')}
                  className="dbc-btn dbc-btn-xl dbc-btn-outline border-stone-750 text-white hover:bg-stone-850"
                >
                  Browse Professionals
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Enterprise Footer */}
      <footer className="bg-white border-t border-light-border py-12 text-left">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <BrandLogo variant="compact" theme="light" />
            <p className="text-[10px] text-stone-gray font-semibold leading-relaxed">
              DBC (Design Build Connect) is a premium ecosystem connecting homeowners with trusted architects, consultants, and contractors.
            </p>
            <span className="block text-[9px] text-stone-gray font-bold">
              © {new Date().getFullYear()} DBC Platform.
            </span>
          </div>

          {/* Links 1: Company */}
          <div className="space-y-3">
            <h4 className="text-[9px] font-black uppercase tracking-wider text-stone-black">Company</h4>
            <ul className="space-y-2 text-[10px] font-semibold text-stone-gray">
              <li><button onClick={() => navigate('/know-more')} className="hover:text-stone-black transition">About Us</button></li>
              <li><button onClick={() => navigate('/know-more')} className="hover:text-stone-black transition">Blog</button></li>
              <li><button onClick={() => navigate('/know-more')} className="hover:text-stone-black transition">Careers</button></li>
            </ul>
          </div>

          {/* Links 2: Services */}
          <div className="space-y-3">
            <h4 className="text-[9px] font-black uppercase tracking-wider text-stone-black">Services</h4>
            <ul className="space-y-2 text-[10px] font-semibold text-stone-gray">
              <li><button onClick={() => handleConsultantClick('Architects')} className="hover:text-stone-black transition">Architecture Layouts</button></li>
              <li><button onClick={() => handleProfessionClick('Electrical')} className="hover:text-stone-black transition">Electrical Fitouts</button></li>
              <li><button onClick={() => handleProfessionClick('Plumbing')} className="hover:text-stone-black transition">Plumbing Systems</button></li>
            </ul>
          </div>

          {/* Links 3: Support */}
          <div className="space-y-3">
            <h4 className="text-[9px] font-black uppercase tracking-wider text-stone-black">Support</h4>
            <ul className="space-y-2 text-[10px] font-semibold text-stone-gray">
              <li><button onClick={() => navigate('/know-more')} className="hover:text-stone-black transition">Help Center</button></li>
              <li><button onClick={() => navigate('/know-more')} className="hover:text-stone-black transition">Terms of Service</button></li>
              <li><button onClick={() => navigate('/know-more')} className="hover:text-stone-black transition">Privacy Policy</button></li>
            </ul>
          </div>

          {/* Links 4: Newsletter */}
          <div className="space-y-3">
            <h4 className="text-[9px] font-black uppercase tracking-wider text-stone-black">Newsletter</h4>
            <p className="text-[10px] text-stone-gray font-semibold leading-relaxed">
              Subscribe to receive weekly architecture layout inspirations and local market contractor indexes.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email..."
                className="w-full text-[10px] border border-light-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-emerald"
              />
              <button
                type="submit"
                className="dbc-btn dbc-btn-md dbc-btn-primary"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      </footer>

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-gentle-fade">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-apple-lg relative border border-light-border text-left">
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 text-stone-gray hover:text-stone-black font-extrabold text-sm cursor-pointer"
            >
              ✕
            </button>
            <div className="space-y-4">
              <div className="h-56 w-full rounded-2xl overflow-hidden border border-light-border bg-light-stone">
                <img src={selectedProject.img} alt={selectedProject.title} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-stone-black">{selectedProject.title}</h3>
                <p className="text-xs text-stone-gray font-semibold leading-relaxed">{selectedProject.desc}</p>
              </div>

              {/* Cost ranges */}
              <div className="grid grid-cols-2 gap-4 bg-light-stone/40 p-4 rounded-2xl border border-light-border/60">
                <div>
                  <span className="block text-[8px] uppercase tracking-wider text-stone-gray font-bold">Estimated Cost</span>
                  <span className="block text-xs font-extrabold text-stone-black mt-0.5">{selectedProject.budget}</span>
                </div>
                <div>
                  <span className="block text-[8px] uppercase tracking-wider text-stone-gray font-bold">Estimated Timeline</span>
                  <span className="block text-xs font-extrabold text-stone-black mt-0.5">{selectedProject.duration}</span>
                </div>
              </div>

              {/* Required trades */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-stone-gray">Required Trade Specialist Partners</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedProject.professions.map((prof) => (
                    <div
                      key={prof}
                      onClick={() => handleProfessionClick(prof)}
                      className="group flex justify-between items-center bg-white border border-light-border hover:border-brand-emerald hover:shadow-apple-sm p-4 rounded-xl cursor-pointer transition duration-250"
                    >
                      <div className="space-y-0.5">
                        <span className="block text-xs font-extrabold text-stone-black group-hover:text-brand-emerald transition">
                          {prof}
                        </span>
                        <span className="block text-[8px] text-stone-gray font-black uppercase">
                          Find Local Partners
                        </span>
                      </div>
                      <span className="text-stone-gray group-hover:text-brand-emerald transition font-black">
                        →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
