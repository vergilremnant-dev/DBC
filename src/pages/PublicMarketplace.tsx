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
  'electrician': 100,
  'plumber': 95,
  'waterproof': 90,
  'paint': 85,
  'carpen': 80,
  'tile': 75,
  'false ceiling': 70,
  'brick': 65,
  'formwork': 60,
  'elevation': 55,
};

const getPopularityScore = (name: string) => {
  const norm = name.toLowerCase();
  for (const [key, score] of Object.entries(CATEGORY_POPULARITY_SCORES)) {
    if (norm.includes(key)) return score;
  }
  return 0;
};

const isConsultantCategory = (catName: string): boolean => {
  const lower = catName.toLowerCase();
  return (
    lower.includes('architect') ||
    lower.includes('structural') ||
    lower.includes('interior') ||
    lower.includes('landscape')
  );
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
    homeAssistant,
    setHomeAssistant,
  } = useNavigation();

  // Hero Discovery Module States & Refs
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

  // Assistant getters/setters mapped from Navigation Context
  const quizStep = homeAssistant.step;
  const quizGoal = homeAssistant.goal;
  const quizArea = homeAssistant.area;
  const quizBudget = homeAssistant.budget;
  const quizTimeline = homeAssistant.timeline;

  const setQuizStep = (step: number | ((prev: number) => number)) => {
    const nextStep = typeof step === 'function' ? step(homeAssistant.step) : step;
    setHomeAssistant({ ...homeAssistant, step: nextStep });
  };
  const setQuizGoal = (goal: string) => setHomeAssistant({ ...homeAssistant, goal });
  const setQuizArea = (area: string) => setHomeAssistant({ ...homeAssistant, area });
  const setQuizBudget = (budget: string) => setHomeAssistant({ ...homeAssistant, budget });
  const setQuizTimeline = (timeline: string) => setHomeAssistant({ ...homeAssistant, timeline });

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

  const getRecommendedPartners = () => {
    const matchedConsultants: string[] = [];
    const matchedServices: string[] = [];
    const matchedProjects: HomeProject[] = [];

    if (quizGoal === 'Build a New Home') {
      matchedConsultants.push('Architects', 'Structural Engineers');
      matchedServices.push('Plumbing', 'Electrical', 'Waterproofing', 'Brick Work');
      const cp = HOME_PROJECTS.find(p => p.title.includes('Construction'));
      if (cp) matchedProjects.push(cp);
    } else if (quizGoal === 'Outdoor & Landscape' || quizArea === 'Garden' || quizArea === 'Exterior') {
      matchedConsultants.push('Landscape Designers');
      matchedServices.push('Waterproofing', 'Electrical');
      const gp = HOME_PROJECTS.find(p => p.title.includes('Garden'));
      if (gp) matchedProjects.push(gp);
    } else {
      // Renovate or interior design focus
      matchedConsultants.push('Interior Designers', 'Architects');
      matchedServices.push('Carpentry', 'Electrical', 'Painting', 'False Ceiling');
      const kp = HOME_PROJECTS.find(p => p.title.includes('Kitchen'));
      const lp = HOME_PROJECTS.find(p => p.title.includes('Living'));
      if (kp) matchedProjects.push(kp);
      if (lp) matchedProjects.push(lp);
    }

    return {
      consultants: matchedConsultants,
      services: matchedServices,
      projects: matchedProjects
    };
  };

  // Filter out consultants from categories
  const executionCategories = categories.filter((cat) => !isConsultantCategory(cat.name));

  // Apply collar filter
  const filteredExecutionCategories = executionCategories.filter((cat) => {
    if (collarFilter === 'ALL') return true;
    return cat.categoryType === collarFilter;
  });

  // Sort by popularity ranking score
  const sortedCategories = [...filteredExecutionCategories].sort(
    (a, b) => getPopularityScore(b.name) - getPopularityScore(a.name)
  );

  return (
    <div className="bg-light-stone text-stone-black font-sans min-h-screen bg-concrete-grain">

      {/* Spacious Hero Section */}
      <section className="relative overflow-hidden border-b border-light-border/40 py-16 sm:py-24 bg-arch-grid">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Brand Story and CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left animate-gentle-fade">
            <span className="dbc-badge dbc-badge-verified">
              📍 Serving {selectedCity} & Region
            </span>
            <h1 className="text-display text-stone-black leading-[1.05] tracking-tight">
              Design. Build.<br />
              <span className="text-brand-emerald italic font-light">Connect.</span>
            </h1>
            <p className="text-subtitle text-stone-gray max-w-lg leading-relaxed font-medium">
              A premium digital ecosystem for architecture, design, and construction. Connect with verified local professionals, discuss your scope requirements, and track long-term project execution from blueprints to completion.
            </p>

            {/* Hero Discovery Module */}
            <div className="bg-white border border-stone-200 rounded-2xl p-3.5 shadow-sm space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3 w-full max-w-xl transition-all duration-200 focus-within:ring-2 focus-within:ring-brand-emerald/15 focus-within:border-brand-emerald">
              
              {/* Location Select (Group 1: flex-shrink-0) */}
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
                  <div className="absolute left-0 mt-2 w-56 rounded-xl border border-light-border bg-white p-3 shadow-apple-lg z-50 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
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

              {/* Search Bar Input (Group 2: flex-1) */}
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
                  className="w-full bg-transparent text-xs font-semibold text-stone-850 placeholder:text-stone-400 focus:outline-none border-none p-0"
                />
              </div>

              {/* Separator Line (Hidden on Mobile) */}
              <span className="hidden sm:block h-6 w-px bg-stone-200 flex-shrink-0" />

              {/* Filters Action (Group 3: flex-shrink-0) */}
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
                  <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-64 rounded-xl border border-light-border bg-white p-4 shadow-apple-lg z-50 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
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
            
            {/* Button Actions */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => setQuizStep(1)}
                className="dbc-btn dbc-btn-xl dbc-btn-primary shadow-apple-sm"
              >
                Start Your Project
              </button>
              <button
                onClick={() => handleConsultantClick('Architects')}
                className="dbc-btn dbc-btn-xl dbc-btn-outline bg-white"
              >
                Browse Professionals
              </button>
            </div>

            {/* Micro Trust strip */}
            <div className="flex items-center gap-4 text-[9px] text-stone-gray font-black uppercase tracking-widest pt-2">
              <span className="flex items-center gap-1">✓ Verified Professional Profiles</span>
              <span>•</span>
              { /* <span className="flex items-center gap-1">✓ Zero Broker Fees</span> */}
              <span className="flex items-center gap-1">✓ Trusted Partnerships</span>
            </div>
          </div>

          {/* Right Column: Architectural Visual Drafting Composition */}
          <div className="lg:col-span-5 hidden lg:flex justify-center relative animate-gentle-fade">
            <div className="relative w-full max-w-[380px] aspect-square rounded-3xl border border-light-border bg-white shadow-apple-lg overflow-hidden p-6 bg-blueprint-grid">
              
              {/* Animated Blueprint Drawing SVG */}
              <svg viewBox="0 0 320 240" fill="none" className="w-full h-full opacity-90">
                <line x1="20" y1="30" x2="300" y2="30" stroke="rgba(4, 120, 87, 0.15)" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="20" y1="120" x2="300" y2="120" stroke="rgba(4, 120, 87, 0.15)" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="20" y1="210" x2="300" y2="210" stroke="rgba(4, 120, 87, 0.15)" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="50" y1="10" x2="50" y2="230" stroke="rgba(4, 120, 87, 0.15)" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="160" y1="10" x2="160" y2="230" stroke="rgba(4, 120, 87, 0.15)" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="270" y1="10" x2="270" y2="230" stroke="rgba(4, 120, 87, 0.15)" strokeWidth="1" strokeDasharray="3 3" />
                
                {/* Structural geometry blueprint lines */}
                <path d="M 50 210 L 270 210 L 270 120 L 160 50 L 50 120 Z" stroke="#047857" strokeWidth="1.5" className="animate-blueprint-draw" />
                <circle cx="160" cy="130" r="45" stroke="rgba(139, 90, 43, 0.25)" strokeWidth="1" strokeDasharray="4 4" />
                
                {/* Axis Labels */}
                <text x="160" y="25" textAnchor="middle" fill="rgba(4, 120, 87, 0.5)" fontSize="6" fontFamily="monospace">ELEVATION 0.00</text>
                <text x="160" y="225" textAnchor="middle" fill="rgba(4, 120, 87, 0.5)" fontSize="6" fontFamily="monospace">AXIS Y-COORD</text>
              </svg>

              {/* Floating Glass Panel Visual */}
              <div className="absolute bottom-6 right-6 w-44 glass-reflection bg-white/70 backdrop-blur-md border border-white/80 rounded-xl p-3 shadow-apple-md text-left animate-soft-float">
                <span className="block text-[7px] font-black uppercase text-stone-gray tracking-wider">Project Phase 01</span>
                <span className="block text-[9.5px] font-extrabold text-stone-black mt-0.5">Villa Layout Design</span>
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-light-border/40">
                  <div className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse"></div>
                  <span className="text-[7.5px] text-brand-emerald font-black uppercase">Verified Coordinates</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Trust Strip */}
      <section className="border-b border-light-border/40 bg-white/45 backdrop-blur-md py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 grid grid-cols-2 md:grid-cols-5 gap-6 text-center text-stone-gray">
          {[
            { label: 'Verified Profiles', icon: '🛡️' },
            { label: 'Secure Platform', icon: '💬' },
            { label: 'Transparent Quotes', icon: '📊' },
            { label: 'Project Tracking', icon: '⚙%' },
            { label: 'Direct Communication', icon: '⭐' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-center gap-2">
              <span className="text-sm">{item.icon.replace('%', '')}</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-stone-gray">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Project Kickstart Hub / Wizard */}
      <section className="mx-auto w-full max-w-6xl px-4 pt-12 sm:px-6">
        <div className="bg-white border border-light-border rounded-3xl p-6 sm:p-8 shadow-apple-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-emerald/5 rounded-full filter blur-[80px] pointer-events-none"></div>

          {quizStep === 0 ? (
            <div className="space-y-8 text-left">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-light-border pb-6">
                <div className="space-y-2">
                  <h2 className="text-title text-stone-black leading-tight">
                    How would you like to start?
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-gray font-semibold leading-relaxed">
                    Select a workflow path below. We'll guide you from initial drafting designs to manual trade execution.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* Guided Route */}
                <div className="lg:col-span-6 group bg-light-stone/30 border border-light-border hover:border-brand-emerald/40 hover:shadow-apple-sm rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden h-full">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl p-2 bg-white rounded-xl border border-light-border">🤖</span>
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">AI-Project Assistant</h3>
                          <span className="inline-block text-[8px] font-black text-brand-emerald bg-brand-emerald/5 px-2 py-0.5 rounded border border-brand-emerald/10 mt-0.5">
                            Interactive Route
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-stone-gray font-bold">PATH 01</span>
                    </div>
                    <p className="text-xs text-stone-gray leading-relaxed font-semibold">
                      Receive personalized trade and architectural recommendation parameters in under a minute.
                    </p>
                  </div>
                  <div className="pt-6">
                    <button
                      onClick={() => setQuizStep(1)}
                      className="w-full dbc-btn dbc-btn-primary h-11 text-xs uppercase tracking-wider cursor-pointer"
                    >
                      Start Assistant
                    </button>
                  </div>
                </div>

                {/* Direct Request Route */}
                <div className="lg:col-span-6 group bg-transparent border border-dashed border-stone-300 hover:border-stone-400 hover:bg-white rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative h-full">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl p-2 bg-white rounded-xl border border-light-border">👷</span>
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Advisor Coordination</h3>
                          <span className="inline-block text-[8px] font-black text-stone-gray bg-light-stone px-2 py-0.5 rounded border border-light-border mt-0.5">
                            Direct Route
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-stone-gray font-bold">PATH 02</span>
                    </div>
                    <p className="text-xs text-stone-gray leading-relaxed font-semibold">
                      Prefer speaking directly with a design coordinator? Request a free callback session.
                    </p>
                  </div>
                  <div className="pt-6">
                    <button
                      onClick={() => navigate('/request-callback')}
                      className="w-full dbc-btn dbc-btn-outline h-11 text-xs uppercase tracking-wider cursor-pointer bg-white"
                    >
                      Request Callback
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : quizStep < 5 ? (
            <div className="space-y-6 text-left">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-stone-gray">
                  <span>Step {quizStep} of 4</span>
                  <span>{Math.round((quizStep / 4) * 100)}% Complete</span>
                </div>
                <div className="dbc-progress-bar">
                  <div
                    className="dbc-progress-fill"
                    style={{ width: `${(quizStep / 4) * 100}%` }}
                  />
                </div>
              </div>

              {/* Step 1: Goal */}
              {quizStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">What are you planning?</h3>
                  <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                    {['Build a New Home', 'Renovate My Home', 'Interior Design', 'Office Renovation', 'Repairs & Maintenance', 'Outdoor & Landscape'].map((option) => (
                      <button
                        key={option}
                        onClick={() => { setQuizGoal(option); setQuizStep(2); }}
                        className={`p-4 rounded-xl text-left border text-xs font-bold transition duration-200 hover:border-brand-emerald hover:bg-brand-emerald/5 cursor-pointer ${
                          quizGoal === option ? 'border-brand-emerald bg-brand-emerald/5 text-brand-emerald font-black' : 'border-light-border text-stone-gray'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Area */}
              {quizStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Which area are you working on?</h3>
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                    {['Kitchen', 'Bathroom', 'Living Room', 'Bedroom', 'Entire Home', 'Office', 'Garden', 'Exterior'].map((option) => (
                      <button
                        key={option}
                        onClick={() => { setQuizArea(option); setQuizStep(3); }}
                        className={`p-4 rounded-xl text-left border text-xs font-bold transition duration-200 hover:border-brand-emerald hover:bg-brand-emerald/5 cursor-pointer ${
                          quizArea === option ? 'border-brand-emerald bg-brand-emerald/5 text-brand-emerald font-black' : 'border-light-border text-stone-gray'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Budget */}
              {quizStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">What's your estimated budget?</h3>
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                    {['Under ₹1 Lakh', '₹1–5 Lakhs', '₹5–15 Lakhs', '₹15 Lakhs+'].map((option) => (
                      <button
                        key={option}
                        onClick={() => { setQuizBudget(option); setQuizStep(4); }}
                        className={`p-4 rounded-xl text-left border text-xs font-bold transition duration-200 hover:border-brand-emerald hover:bg-brand-emerald/5 cursor-pointer ${
                          quizBudget === option ? 'border-brand-emerald bg-brand-emerald/5 text-brand-emerald font-black' : 'border-light-border text-stone-gray'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Timeline */}
              {quizStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">When would you like to begin?</h3>
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                    {['Immediately', 'Within 1 Month', 'Within 3 Months', 'Just Exploring'].map((option) => (
                      <button
                        key={option}
                        onClick={() => { setQuizTimeline(option); setQuizStep(5); }}
                        className={`p-4 rounded-xl text-left border text-xs font-bold transition duration-200 hover:border-brand-emerald hover:bg-brand-emerald/5 cursor-pointer ${
                          quizTimeline === option ? 'border-brand-emerald bg-brand-emerald/5 text-brand-emerald font-black' : 'border-light-border text-stone-gray'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setQuizStep((prev) => prev - 1)}
                  className="text-stone-gray hover:text-stone-black font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    setQuizStep(0);
                    setQuizGoal('');
                    setQuizArea('');
                    setQuizBudget('');
                    setQuizTimeline('');
                  }}
                  className="text-rose-600 hover:underline font-bold text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // Quiz completed recommendations
            <div className="space-y-6 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border pb-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-stone-black">Project Plan Output</h3>
                  <p className="text-xs text-stone-gray font-semibold">
                    Parameters: <span className="font-extrabold text-stone-black">{quizGoal}</span> ({quizArea}) at budget range <span className="font-extrabold text-stone-black">{quizBudget}</span>.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setQuizStep(0);
                    setQuizGoal('');
                    setQuizArea('');
                    setQuizBudget('');
                    setQuizTimeline('');
                  }}
                  className="dbc-btn dbc-btn-md dbc-btn-secondary"
                >
                  Restart Assistant
                </button>
              </div>

              <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                {/* Consultants */}
                <div className="space-y-3">
                  <span className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">01. Blueprint Experts</span>
                  <div className="space-y-2">
                    {getRecommendedPartners().consultants.map((c) => (
                      <div
                        key={c}
                        onClick={() => handleConsultantClick(c)}
                        className="group flex items-center justify-between p-4 rounded-2xl border border-light-border hover:border-brand-emerald hover:bg-light-stone/30 cursor-pointer transition bg-white shadow-apple-sm"
                      >
                        <div className="space-y-0.5">
                          <span className="block text-xs font-extrabold text-stone-black group-hover:text-brand-emerald transition">{c}</span>
                          <span className="block text-[8px] text-stone-gray font-bold uppercase">Blueprints & Designs</span>
                        </div>
                        <span className="text-stone-gray group-hover:text-brand-emerald font-black">→</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Services */}
                <div className="space-y-3">
                  <span className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">02. Execution Trades</span>
                  <div className="space-y-2">
                    {getRecommendedPartners().services.map((s) => (
                      <div
                        key={s}
                        onClick={() => handleProfessionClick(s)}
                        className="group flex items-center justify-between p-4 rounded-2xl border border-light-border hover:border-brand-emerald hover:bg-light-stone/30 cursor-pointer transition bg-white shadow-apple-sm"
                      >
                        <div className="space-y-0.5">
                          <span className="block text-xs font-extrabold text-stone-black group-hover:text-brand-emerald transition">{s}</span>
                          <span className="block text-[8px] text-stone-gray font-bold uppercase">Contractor Specialists</span>
                        </div>
                        <span className="text-stone-gray group-hover:text-brand-emerald font-black">→</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Projects */}
                <div className="space-y-3">
                  <span className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">03. Project References</span>
                  <div className="space-y-2">
                    {getRecommendedPartners().projects.map((p) => (
                      <div
                        key={p.title}
                        onClick={() => setSelectedProject(p)}
                        className="group flex items-center justify-between p-4 rounded-2xl border border-light-border hover:border-brand-emerald hover:bg-light-stone/30 cursor-pointer transition bg-white shadow-apple-sm"
                      >
                        <div className="space-y-0.5">
                          <span className="block text-xs font-extrabold text-stone-black group-hover:text-brand-emerald transition">{p.title}</span>
                          <span className="block text-[8px] text-stone-gray font-bold uppercase">Timeline: {p.duration}</span>
                        </div>
                        <span className="text-stone-gray group-hover:text-brand-emerald font-black">→</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Direct Coordinate Action */}
              <div className="bg-brand-emerald/5 border border-brand-emerald/10 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-black">Ready to post coordinates?</h4>
                  <p className="text-[10px] text-stone-gray font-semibold">Post your spatial requirements and get direct offers from verified local builders.</p>
                </div>
                <button
                  onClick={() => navigate('/request-callback')}
                  className="dbc-btn dbc-btn-lg dbc-btn-primary whitespace-nowrap"
                >
                  Coordinate Now
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How DBC Works Timeline Flow */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 space-y-10">
        <div className="max-w-2xl text-left space-y-2">
          <h2 className="text-title text-stone-black">How DBC Works</h2>
          <p className="text-xs text-stone-gray font-semibold">
            One unified pipeline managing your design coordinates, trades, and payment transactions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch relative">
          {[
            { step: '01', title: 'Find Service', label: 'Explore Partners', desc: 'Explore construction, design and related manual trade professionals active in your region.' },
            { step: '02', title: 'Discuss Project', label: 'Share Scope', desc: 'Detail your scope parameters, timelines, and approximate budgets directly with the professional.' },
            { step: '03', title: 'Receive Proposal', label: 'Get Quote', desc: 'Discuss project particulars and receive structural design coordinate or milestone quote proposals.' },
            { step: '04', title: 'Start Project', label: 'Agree Terms', desc: 'Finalize milestones and contract terms. Work begins only when you authorize start parameters.' },
            { step: '05', title: 'Manage Project', label: 'Track Progress', desc: 'Communicate with partners, verify milestones, and release stage payments in your dashboard.' },
          ].map((item, idx) => (
            <div key={idx} className="dbc-card p-4.5 flex flex-col justify-between hover:shadow-apple-md transition-all relative bg-white border border-light-border rounded-2xl">
              <div className="space-y-3 text-left">
                <span className="text-xs font-black text-brand-emerald/40 tracking-widest block">{item.step}</span>
                <div className="space-y-1">
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-stone-black">{item.title}</h3>
                  <span className="block text-[7.5px] font-black uppercase bg-light-stone text-stone-gray px-1.5 py-0.5 rounded max-w-max border border-light-border">
                    {item.label}
                  </span>
                  <p className="text-[10.5px] text-stone-500 leading-relaxed font-semibold pt-1">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services Categories Section */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 space-y-8 bg-dot-grid rounded-3xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-light-border/60 pb-6">
          <div className="space-y-2 text-left">
            <h2 className="text-title text-stone-black">Trade Execution Categories</h2>
            <p className="text-xs text-stone-gray font-semibold">
              Find manual contractors and engineering specialists.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-light-border shadow-apple-sm">
            {(['ALL', 'BLUE_COLLAR', 'WHITE_COLLAR'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setCollarFilter(filter)}
                className={`text-[9px] font-black uppercase tracking-wider px-4 py-2 rounded-full transition cursor-pointer ${
                  collarFilter === filter
                    ? 'bg-light-stone text-stone-black font-extrabold shadow-sm'
                    : 'text-stone-gray hover:text-stone-black'
                }`}
              >
                {filter === 'ALL' ? 'All Services' : filter === 'BLUE_COLLAR' ? 'Manual Trade' : 'Consulting'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="h-28 rounded-3xl bg-white border border-light-border animate-pulse shadow-apple-sm"></div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {sortedCategories.length > 0 ? (
              sortedCategories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => navigate(`/category/${cat.id}/providers?city=${encodeURIComponent(selectedCity)}`)}
                  className="dbc-card-interactive bg-white border border-light-border p-5 cursor-pointer flex items-center justify-between gap-4 shadow-apple-sm"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span className="text-2xl flex-shrink-0">{getIconEmoji(cat.icon)}</span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-stone-black truncate">{cat.name}</h4>
                      <span className="block text-[8px] text-stone-gray font-semibold truncate mt-0.5">
                        {providersLoading ? '...' : `${getCategoryProCount(cat.id)} Verified Pros`}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[7px] font-black px-2 py-0.5 rounded uppercase tracking-wider border flex-shrink-0 ${
                    cat.categoryType === 'BLUE_COLLAR'
                      ? 'bg-light-stone text-stone-gray border-light-border'
                      : 'bg-emerald-50 text-brand-emerald border-brand-emerald/20'
                  }`}>
                    {cat.categoryType === 'BLUE_COLLAR' ? 'Manual' : 'Consult'}
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-white border border-dashed border-light-border rounded-3xl p-8 text-center">
                <span className="text-xl">🔍</span>
                <p className="text-xs text-stone-gray font-bold mt-2">No active trade categories found.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Featured Professionals */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 space-y-6">
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
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
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
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 space-y-10">
        <div className="max-w-2xl text-left space-y-2">
          <h2 className="text-title text-stone-black">Client Feedback</h2>
          <p className="text-xs text-stone-gray font-semibold">
            What architects, contractors, and builders say about collaborating on DBC.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 space-y-6">
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
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="bg-stone-900 text-white rounded-3xl p-8 sm:p-12 text-center bg-arch-grid relative overflow-hidden border border-stone-800 shadow-xl">
          <div className="absolute inset-0 bg-brand-emerald/5 rounded-full filter blur-[100px]"></div>
          <div className="relative z-10 max-w-xl mx-auto space-y-6">
            <h3 className="text-xl sm:text-3xl font-bold font-serif text-white">
              Start Your Dream Project Today
            </h3>
            <p className="text-xs text-stone-400 font-semibold leading-relaxed">
              Join DBC to connect directly with builders, Plumbers, Electricians, and structural engineers in {selectedCity} with no middleman commissions.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setQuizStep(1)}
                className="dbc-btn dbc-btn-xl dbc-btn-primary"
              >
                Get Started
              </button>
              <button
                onClick={() => navigate('/search')}
                className="dbc-btn dbc-btn-xl dbc-btn-outline border-stone-750 text-white hover:bg-stone-850"
              >
                Browse Professionals
              </button>
            </div>
          </div>
        </div>
      </section>

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
