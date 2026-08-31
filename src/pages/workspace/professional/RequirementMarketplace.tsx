import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ==========================================
// Types & Interfaces
// ==========================================
interface Requirement {
  id: string;
  title: string;
  category: 'Architecture' | 'Interior Design' | 'Construction' | 'Renovation' | 'Landscaping' | 'Electrical' | 'Plumbing';
  projectType: string;
  location: string;
  budgetRange: string;
  budgetVal: number;
  expectedTimeline: string;
  datePosted: string;
  postedDaysAgo: number;
  status: 'New' | 'Open' | 'In Review' | 'Closed' | 'Expired';
  description: string;
  isCustomerVerified: boolean;
  imagesCount: number;
  documentsCount: number;
  isSaved: boolean;
  interestSubmitted: boolean;
}

export default function RequirementMarketplace() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [savedOnly, setSavedOnly] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [selectedSort, setSelectedSort] = useState('Newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Express Interest dialog modal state
  const [interestModalId, setInterestModalId] = useState<string | null>(null);

  // Database listings state
  const [requirements, setRequirements] = useState<Requirement[]>([
    {
      id: 'REQ-201',
      title: 'Structural blueprint load-bearing review for Duplex',
      category: 'Architecture',
      projectType: 'Residential Duplex',
      location: 'Gachibowli, Hyderabad',
      budgetRange: '₹45,000 - ₹55,000',
      budgetVal: 50000,
      expectedTimeline: '3 Weeks',
      datePosted: '2 hours ago',
      postedDaysAgo: 0,
      status: 'New',
      description: 'We require a structural design verification audit for a new G+2 residential duplex. Soil load tests have been completed. Column positions need check prior to municipal layouts verification.',
      isCustomerVerified: true,
      imagesCount: 3,
      documentsCount: 4,
      isSaved: false,
      interestSubmitted: false
    },
    {
      id: 'REQ-202',
      title: 'Plumbing distribution piping layout & conduction',
      category: 'Plumbing',
      projectType: 'Commercial Complex',
      location: 'Madhapur, Hyderabad',
      budgetRange: '₹35,005 - ₹40,000',
      budgetVal: 38000,
      expectedTimeline: '2 Weeks',
      datePosted: '1 day ago',
      postedDaysAgo: 1,
      status: 'Open',
      description: ' ME conduiting pipe runs check layout. Standard pressure valves orientation checks required for commercial block water chambers.',
      isCustomerVerified: true,
      imagesCount: 2,
      documentsCount: 1,
      isSaved: true,
      interestSubmitted: false
    },
    {
      id: 'REQ-203',
      title: 'L-Shaped Modular Kitchen space optimizations',
      category: 'Interior Design',
      projectType: 'Premium Apartment',
      location: 'Kondapur, Hyderabad',
      budgetRange: '₹22,000 - ₹28,000',
      budgetVal: 25000,
      expectedTimeline: '1 Week',
      datePosted: '2 days ago',
      postedDaysAgo: 2,
      status: 'Open',
      description: 'Cabinet layout drawing plan and chimney placement alignments in compact kitchen room. Prefers European modular offsets tolerances.',
      isCustomerVerified: false,
      imagesCount: 4,
      documentsCount: 2,
      isSaved: false,
      interestSubmitted: true
    },
    {
      id: 'REQ-204',
      title: 'RCC beams lintel concrete calculations',
      category: 'Construction',
      projectType: 'Independent Villa',
      location: 'Jubilee Hills, Hyderabad',
      budgetRange: '₹1,20,000 - ₹1,50,000',
      budgetVal: 135000,
      expectedTimeline: '4 Weeks',
      datePosted: '3 days ago',
      postedDaysAgo: 3,
      status: 'In Review',
      description: 'Soil test results match verification, reinforcement steel parameters compilation checklist for columns load auditing.',
      isCustomerVerified: true,
      imagesCount: 1,
      documentsCount: 5,
      isSaved: false,
      interestSubmitted: false
    },
    {
      id: 'REQ-205',
      title: 'Rooftop solar slab strength inspection',
      category: 'Renovation',
      projectType: 'Residential Villa',
      location: 'Banjara Hills, Hyderabad',
      budgetRange: '₹30,000 - ₹35,000',
      budgetVal: 32000,
      expectedTimeline: '2 Weeks',
      datePosted: '5 days ago',
      postedDaysAgo: 5,
      status: 'Closed',
      description: 'Review structural layout of roof deck to determine safe load capacity for installing heavy steel rack solar PV modules.',
      isCustomerVerified: true,
      imagesCount: 0,
      documentsCount: 2,
      isSaved: false,
      interestSubmitted: false
    }
  ]);

  // Simulation loader
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleSaveToggle = (id: string) => {
    setRequirements(prev => prev.map(req => {
      if (req.id === id) {
        return { ...req, isSaved: !req.isSaved };
      }
      return req;
    }));
  };

  const handleExpressInterestClick = (id: string) => {
    const req = requirements.find(r => r.id === id);
    if (req?.interestSubmitted) return;
    setInterestModalId(id);
  };

  const handleConfirmInterest = () => {
    if (!interestModalId) return;
    setRequirements(prev => prev.map(req => {
      if (req.id === interestModalId) {
        return { ...req, interestSubmitted: true };
      }
      return req;
    }));
    setInterestModalId(null);
    alert('Your interest has been expressed successfully. Customer notified.');
  };

  // Stats calculation
  const stats = useMemo(() => {
    return {
      available: requirements.filter(r => r.status === 'Open' || r.status === 'New').length,
      newToday: requirements.filter(r => r.status === 'New').length,
      saved: requirements.filter(r => r.isSaved).length,
      interest: requirements.filter(r => r.interestSubmitted).length,
      closed: requirements.filter(r => r.status === 'Closed').length,
    };
  }, [requirements]);

  // Filters & sorting
  const filteredReqs = useMemo(() => {
    let list = requirements.filter(r => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || r.title.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.location.toLowerCase().includes(q) || r.category.toLowerCase().includes(q);
      const matchCat = selectedCategory === 'ALL' || r.category === selectedCategory;
      const matchLoc = selectedLocation === 'ALL' || r.location.includes(selectedLocation);
      const matchSaved = !savedOnly || r.isSaved;
      return matchQuery && matchCat && matchLoc && matchSaved;
    });

    if (selectedSort === 'Newest') {
      list = [...list].sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
    } else if (selectedSort === 'Highest Budget') {
      list = [...list].sort((a, b) => b.budgetVal - a.budgetVal);
    }

    return list;
  }, [requirements, searchQuery, selectedCategory, selectedLocation, selectedSort, savedOnly]);

  // Pagination calculation
  const paginatedReqs = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredReqs.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredReqs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredReqs.length / itemsPerPage);

  if (isLoading) {
    return <SkeletonMarketplace />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 text-left animate-gentle-fade select-none">
      
      {/* 1. Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm relative">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Leads Dispatch Feed</span>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight font-serif">Requirement Marketplace</h1>
          <p className="text-xs text-stone-500 font-medium">Discover new customer requirements that match your trades and services.</p>
        </div>

        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setSavedOnly(!savedOnly)}
            className={`dbc-btn dbc-btn-md ${
              savedOnly ? 'dbc-btn-primary' : 'dbc-btn-secondary bg-white text-stone-750 border-stone-200 hover:bg-stone-50'
            }`}
          >
            {savedOnly ? '★ Showing Bookmarks' : '☆ View Saved'}
          </button>
          <button
            onClick={handleRefresh}
            className="dbc-btn dbc-btn-md dbc-btn-primary"
          >
            Refresh Feed
          </button>
        </div>
      </header>

      {/* 2. Stats cards */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Available leads', count: stats.available, icon: '⚡', color: 'bg-emerald-50 text-emerald-800' },
          { label: 'New Today', count: stats.newToday, icon: '🔥', color: 'bg-blue-50 text-blue-800' },
          { label: 'Saved bids', count: stats.saved, icon: '⭐', color: 'bg-amber-50 text-amber-800' },
          { label: 'Interest Submitted', count: stats.interest, icon: '📤', color: 'bg-indigo-50 text-indigo-800' },
          { label: 'Closed bids', count: stats.closed, icon: '🛑', color: 'bg-stone-100 text-stone-900' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-light-border p-4 rounded-2xl shadow-apple-xs hover:shadow-apple-sm transition flex flex-col justify-between">
            <span className={`text-base p-2 rounded-xl w-fit ${kpi.color}`}>{kpi.icon}</span>
            <div className="mt-4 space-y-0.5">
              <span className="block text-2xl font-black text-stone-900">{kpi.count}</span>
              <span className="block text-[9.5px] font-bold text-stone-450 uppercase tracking-wider">{kpi.label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* 3. Search & Filters */}
      <section className="bg-white border border-light-border p-5 rounded-3xl shadow-apple-sm space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <input
            type="text"
            placeholder="Search matching blueprints, civil excavating..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="dbc-input text-xs"
          />

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="dbc-input text-xs bg-white"
          >
            <option value="ALL">All Categories</option>
            <option value="Architecture">Architecture</option>
            <option value="Interior Design">Interior Design</option>
            <option value="Construction">Construction</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Renovation">Renovation</option>
          </select>

          <select
            value={selectedLocation}
            onChange={e => setSelectedLocation(e.target.value)}
            className="dbc-input text-xs bg-white"
          >
            <option value="ALL">All Locations</option>
            <option value="Gachibowli">Gachibowli</option>
            <option value="Madhapur">Madhapur</option>
            <option value="Kondapur">Kondapur</option>
            <option value="Jubilee Hills">Jubilee Hills</option>
          </select>

          <select
            value={selectedSort}
            onChange={e => setSelectedSort(e.target.value)}
            className="dbc-input text-xs bg-white"
          >
            <option value="Newest">Newest first</option>
            <option value="Highest Budget">Highest budget first</option>
          </select>
        </div>

        <div className="flex justify-between items-center text-[10px] font-bold text-stone-450">
          <span>Found {filteredReqs.length} matching leads</span>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSelectedLocation('ALL');
              setSelectedSort('Newest');
              setSavedOnly(false);
            }}
            className="text-brand-emerald hover:underline uppercase"
          >
            Reset filters
          </button>
        </div>
      </section>

      {/* 4. Listings Cards */}
      <section className="space-y-4">
        {paginatedReqs.length === 0 ? (
          <div className="text-center py-16 bg-white border border-light-border rounded-3xl space-y-3">
            <span className="text-3xl block">📁</span>
            <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest">No matching requirements</h3>
            <p className="text-[10px] text-stone-500 max-w-xs mx-auto">Adjust search parameters or category filter settings above.</p>
          </div>
        ) : (
          paginatedReqs.map(req => (
            <div key={req.id} className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm hover:shadow-apple-md transition-all duration-200 space-y-4">
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-stone-100 border border-light-border text-stone-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {req.category}
                    </span>
                    <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      req.status === 'New' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-stone-50 border-stone-200 text-stone-600'
                    }`}>
                      {req.status}
                    </span>
                    {req.isCustomerVerified && (
                      <span className="bg-blue-50 text-blue-800 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        ✓ Verified Client
                      </span>
                    )}
                  </div>
                  <h3
                    onClick={() => navigate(`/workspace/requirement/${req.id}`)}
                    className="text-sm font-black text-stone-900 leading-tight font-serif mt-1 hover:text-brand-emerald cursor-pointer transition"
                  >
                    {req.title}
                  </h3>
                  <p className="text-[10px] text-stone-450 font-bold uppercase">{req.projectType} &bull; {req.location}</p>
                </div>

                <div className="text-right">
                  <span className="block text-sm font-extrabold text-stone-900">{req.budgetRange}</span>
                  <span className="block text-[8px] text-stone-450 font-bold uppercase mt-0.5">Timeline: {req.expectedTimeline}</span>
                </div>
              </div>

              <p className="text-xs text-stone-600 font-semibold leading-relaxed">{req.description}</p>

              <div className="flex justify-between items-center pt-3 border-t border-light-border/40 text-[9px] text-stone-400 font-bold">
                <span>📁 {req.documentsCount} documents &bull; 📷 {req.imagesCount} images &bull; Posted {req.datePosted}</span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/workspace/requirement/${req.id}`)}
                    className="dbc-btn dbc-btn-sm dbc-btn-outline bg-white"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => handleSaveToggle(req.id)}
                    className="dbc-btn dbc-btn-sm dbc-btn-secondary p-2 bg-white border border-stone-200 hover:bg-stone-50"
                    title="Save bookmark"
                  >
                    {req.isSaved ? '★' : '☆'}
                  </button>
                  
                  <button
                    onClick={() => handleExpressInterestClick(req.id)}
                    disabled={req.interestSubmitted}
                    className={`dbc-btn dbc-btn-sm ${
                      req.interestSubmitted ? 'bg-stone-105 text-stone-400 border border-stone-200 cursor-not-allowed' : 'dbc-btn-primary'
                    }`}
                  >
                    {req.interestSubmitted ? '✓ Interest Submitted' : 'Express Interest'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {/* 5. Pagination */}
      {totalPages > 1 && (
        <footer className="flex justify-between items-center text-xs pt-4 border-t border-light-border/40 font-bold">
          <div className="flex items-center gap-2">
            <span className="text-stone-450">Show</span>
            <select
              value={itemsPerPage}
              onChange={e => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-stone-50 border border-stone-200 rounded-lg py-1 px-2 text-stone-700"
            >
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
            <span className="text-stone-450">per page</span>
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="dbc-btn dbc-btn-sm dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
            >
              Prev
            </button>
            {[...Array(totalPages)].map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx + 1)}
                className={`dbc-btn dbc-btn-sm ${
                  currentPage === idx + 1 ? 'dbc-btn-primary' : 'dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50'
                }`}
              >
                {idx + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="dbc-btn dbc-btn-sm dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
            >
              Next
            </button>
          </div>
        </footer>
      )}

      {/* Express Interest Confirmation Dialog Modal */}
      {interestModalId && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-light-border max-w-sm w-full p-6 rounded-3xl shadow-apple-lg space-y-4">
            <h3 className="text-sm font-black text-stone-900 font-serif">Confirm Interest Bid</h3>
            <p className="text-xs text-stone-600 font-semibold leading-relaxed">
              Are you sure you want to express interest in this requirement? Your verification credentials and business profile details will be shared with the client.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setInterestModalId(null)}
                className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmInterest}
                className="dbc-btn dbc-btn-md dbc-btn-primary"
              >
                Confirm Interest
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// Loading Skeletons
// ==========================================
function SkeletonMarketplace() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left animate-pulse">
      <div className="h-28 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, idx) => (
          <div key={idx} className="h-24 bg-white border border-light-border rounded-2xl p-4"></div>
        ))}
      </div>

      <div className="h-20 bg-white border border-light-border rounded-3xl p-4 shadow-apple-sm"></div>

      <div className="space-y-4">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="h-44 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
        ))}
      </div>
    </div>
  );
}
