import { useState, useMemo, useEffect, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';

// ==========================================
// Types & Interfaces
// ==========================================
export interface RequestData {
  id: string;
  customerName: string;
  avatarUrl?: string;
  requirementTitle: string;
  summary: string;
  description: string;
  category: string;
  location: string;
  budget: string;
  requestedDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'New' | 'Pending Review' | 'Accepted' | 'Scheduled' | 'Completed' | 'Rejected';
  timeSinceRequest: string;
  documentsCount: number;
  consultationMode: 'Video Call' | 'In-Person' | 'Site Visit';
  expectedTimeline: string;
  notes: string;
}

const MOCK_REQUESTS: RequestData[] = [
  {
    id: 'CR-901',
    customerName: 'Amit Patel',
    requirementTitle: 'Modern Villa Structural & Vastu Audit',
    summary: 'Evaluate load-bearing capacity of design layouts and Vastu placement compliance.',
    description: 'We are planning to construct a modern 4BHK villa in Gachibowli. Before submitting blueprints for municipal approval, we need a certified consultant to verify the structural column positions and Vastu orientations for the main entrance and kitchen.',
    category: 'Architecture',
    location: 'Gachibowli, Hyderabad',
    budget: '₹45,000',
    requestedDate: '2026-08-03',
    priority: 'High',
    status: 'New',
    timeSinceRequest: '2 hours ago',
    documentsCount: 4,
    consultationMode: 'Video Call',
    expectedTimeline: '2 Weeks',
    notes: 'Please review the attached structural drafts prior to the call.'
  },
  {
    id: 'CR-902',
    customerName: 'Sanjana Sen',
    requirementTitle: 'Modular Kitchen Space Optimization Design',
    summary: 'Provide space drafting planning, cabinet layout, and ventilation placement.',
    description: 'Looking to optimize storage in an L-shaped kitchen space. Need recommendations on chimney piping locations and standard appliance offsets according to European modular layout designs.',
    category: 'Interior Design',
    location: 'Madhapur, Hyderabad',
    budget: '₹22,000',
    requestedDate: '2026-08-04',
    priority: 'Medium',
    status: 'Pending Review',
    timeSinceRequest: '5 hours ago',
    documentsCount: 2,
    consultationMode: 'In-Person',
    expectedTimeline: '1 Week',
    notes: 'Prefer afternoon slot for physical site visit.'
  },
  {
    id: 'CR-903',
    customerName: 'Rajesh Reddy',
    requirementTitle: 'Duplex Foundation Soil Inspection Report',
    summary: 'Verify soil load bearing capacity and foundation design adjustments.',
    description: 'Requesting expert report on black cotton soil foundation adjustments. Need an architect to recommend whether standard raft foundation is sufficient or pile foundation is required.',
    category: 'Construction',
    location: 'Kondapur, Hyderabad',
    budget: '₹60,000',
    requestedDate: '2026-08-05',
    priority: 'High',
    status: 'Accepted',
    timeSinceRequest: '1 day ago',
    documentsCount: 5,
    consultationMode: 'Site Visit',
    expectedTimeline: '3 Weeks',
    notes: 'Soil test reports have been uploaded.'
  },
  {
    id: 'CR-904',
    customerName: 'Priya Nair',
    requirementTitle: 'Green Energy Rooftop Solar Permitting Check',
    summary: 'Audit roof support beams for heavy solar rack load safety compliance.',
    description: 'Planning to install a 5KW solar array. Need structural consultant to verify roof slab load rating compliance according to national building guidelines.',
    category: 'Renovation',
    location: 'Jubilee Hills, Hyderabad',
    budget: '₹35,000',
    requestedDate: '2026-08-06',
    priority: 'Low',
    status: 'Scheduled',
    timeSinceRequest: '2 days ago',
    documentsCount: 1,
    consultationMode: 'Video Call',
    expectedTimeline: '4 Weeks',
    notes: 'Permit forms are partially pre-filled.'
  },
  {
    id: 'CR-905',
    customerName: 'Vijay Kulkarni',
    requirementTitle: 'Apartment Interior Ceiling Plumbing Audit',
    summary: 'Track ceiling moisture issues and map outlet leakage pathways.',
    description: 'Persistent ceiling moisture in master bathroom. Need plumbing systems architectural designer to locate seepage trace line and suggest redirection pathways.',
    category: 'Plumbing',
    location: 'Banjara Hills, Hyderabad',
    budget: '₹12,000',
    requestedDate: '2026-08-08',
    priority: 'Medium',
    status: 'Completed',
    timeSinceRequest: '3 days ago',
    documentsCount: 0,
    consultationMode: 'In-Person',
    expectedTimeline: '3 Days',
    notes: 'Bathroom layout sketch uploaded.'
  }
];

export default function ConsultationRequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RequestData[]>(MOCK_REQUESTS);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [locationQuery, setLocationQuery] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Confirmations
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    requestId: string;
    action: 'Accept' | 'Reject' | 'Schedule';
  } | null>(null);

  // Simulate loading skeleton
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  // Compute KPI Statistics counts
  const stats = useMemo(() => {
    return {
      newCount: requests.filter(r => r.status === 'New').length,
      pendingCount: requests.filter(r => r.status === 'Pending Review').length,
      acceptedCount: requests.filter(r => r.status === 'Accepted').length,
      rejectedCount: requests.filter(r => r.status === 'Rejected').length,
      scheduledCount: requests.filter(r => r.status === 'Scheduled').length,
      completedCount: requests.filter(r => r.status === 'Completed').length,
    };
  }, [requests]);

  // Handle Action Triggers
  const handleAction = (id: string, action: 'Accept' | 'Reject' | 'Schedule') => {
    setConfirmDialog({ isOpen: true, requestId: id, action });
  };

  const confirmAction = () => {
    if (!confirmDialog) return;
    const { requestId, action } = confirmDialog;
    
    setRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        let newStatus = r.status;
        if (action === 'Accept') newStatus = 'Accepted';
        else if (action === 'Reject') newStatus = 'Rejected';
        else if (action === 'Schedule') newStatus = 'Scheduled';
        return { ...r, status: newStatus };
      }
      return r;
    }));

    setConfirmDialog(null);
  };

  // Filters application
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      // Search text match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        req.customerName.toLowerCase().includes(q) ||
        req.requirementTitle.toLowerCase().includes(q) ||
        req.category.toLowerCase().includes(q) ||
        req.location.toLowerCase().includes(q) ||
        req.id.toLowerCase().includes(q);

      // Category matches
      const matchesCategory = categoryFilter === 'ALL' || req.category === categoryFilter;

      // Status matches
      const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;

      // Priority matches
      const matchesPriority = priorityFilter === 'ALL' || req.priority === priorityFilter;

      // Location match
      const matchesLoc = !locationQuery.trim() || req.location.toLowerCase().includes(locationQuery.toLowerCase().trim());

      return matchesSearch && matchesCategory && matchesStatus && matchesPriority && matchesLoc;
    });
  }, [requests, searchQuery, categoryFilter, statusFilter, priorityFilter, locationQuery]);

  // Paginated requests
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(start, start + itemsPerPage);
  }, [filteredRequests, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / itemsPerPage));

  // Reset page when filters change
  useEffect(() => {
    startTransition(() => {
      setCurrentPage(1);
    });
  }, [searchQuery, categoryFilter, statusFilter, priorityFilter, locationQuery]);

  const selectedRequest = useMemo(() => {
    return requests.find(r => r.id === selectedRequestId) || null;
  }, [requests, selectedRequestId]);

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 text-left animate-gentle-fade select-none">
      
      {/* 1. Page Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm relative">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Expert Center</span>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">Consultation Requests</h1>
          <p className="text-xs text-stone-500 font-medium">Review, prioritize, and respond to customer consultation requests.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 500);
            }}
            className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
          >
            <span>🔄</span> Refresh
          </button>
          <button className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50">
            <span>📤</span> Export
          </button>
        </div>
      </header>

      {/* 2. Statistics Summary Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'New Requests', count: stats.newCount, icon: '💡', color: 'bg-blue-50 text-blue-800' },
          { label: 'Pending Review', count: stats.pendingCount, icon: '⏳', color: 'bg-amber-50 text-amber-800' },
          { label: 'Accepted', count: stats.acceptedCount, icon: '✅', color: 'bg-emerald-50 text-emerald-800' },
          { label: 'Scheduled', count: stats.scheduledCount, icon: '📅', color: 'bg-indigo-50 text-indigo-800' },
          { label: 'Completed', count: stats.completedCount, icon: '⭐', color: 'bg-stone-100 text-stone-850' },
          { label: 'Rejected', count: stats.rejectedCount, icon: '❌', color: 'bg-rose-50 text-rose-800' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-light-border p-4 rounded-2xl shadow-apple-xs hover:shadow-apple-sm transition flex flex-col justify-between">
            <span className={`text-base p-2 rounded-xl w-fit ${stat.color}`}>{stat.icon}</span>
            <div className="mt-4 space-y-0.5">
              <span className="block text-2xl font-black text-stone-900">{stat.count}</span>
              <span className="block text-[9.5px] font-bold text-stone-450 uppercase tracking-wider">{stat.label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* 3. Search & Filter Panel */}
      <section className="bg-white border border-light-border p-5 rounded-2xl shadow-apple-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Global Search */}
          <div className="relative">
            <span className="absolute left-3.5 top-3 text-stone-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Search customer, location, ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="dbc-input py-2 px-10"
            />
          </div>

          {/* Location filter */}
          <div className="relative">
            <span className="absolute left-3.5 top-3 text-stone-400 text-xs">📍</span>
            <input
              type="text"
              placeholder="Filter by city/location..."
              value={locationQuery}
              onChange={e => setLocationQuery(e.target.value)}
              className="dbc-input py-2 px-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="dbc-input bg-white py-2 px-3"
            >
              <option value="ALL">All Categories</option>
              <option value="Architecture">Architecture</option>
              <option value="Interior Design">Interior Design</option>
              <option value="Construction">Construction</option>
              <option value="Renovation">Renovation</option>
              <option value="Plumbing">Plumbing</option>
            </select>
          </div>
        </div>

        {/* Row 2: Status & Priority Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-light-border/40">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase text-stone-400">Status:</span>
            <div className="flex flex-wrap gap-1.5">
              {['ALL', 'New', 'Pending Review', 'Accepted', 'Scheduled', 'Completed', 'Rejected'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition border cursor-pointer ${
                    statusFilter === s ? 'bg-stone-black border-stone-black text-white' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase text-stone-400">Priority:</span>
            <div className="flex gap-1.5">
              {['ALL', 'High', 'Medium', 'Low'].map(p => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition border cursor-pointer ${
                    priorityFilter === p ? 'bg-stone-black border-stone-black text-white' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Requests List and Preview Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Requests List */}
        <div className={`space-y-4 ${selectedRequestId ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          {filteredRequests.length === 0 ? (
            <div className="bg-white border border-light-border p-12 rounded-3xl text-center space-y-4 shadow-apple-sm">
              <span className="text-3xl block">📋</span>
              <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest">No matching requests found</h3>
              <p className="text-xs text-stone-450 max-w-sm mx-auto">Try clearing search inputs or relaxing your filter combinations.</p>
            </div>
          ) : (
            <>
              {paginatedRequests.map(req => (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequestId(req.id === selectedRequestId ? null : req.id)}
                  className={`p-5 rounded-3xl border text-left cursor-pointer transition duration-300 ${
                    req.id === selectedRequestId
                      ? 'bg-brand-emerald/5 border-brand-emerald/40 shadow-xs'
                      : 'bg-white border-light-border hover:bg-stone-50/50 hover:border-stone-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 pb-3 border-b border-light-border/40">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider">{req.id} • {req.category}</span>
                      <h4 className="text-xs font-black text-stone-900">{req.requirementTitle}</h4>
                      <p className="text-[10px] text-stone-600 font-semibold">Client: {req.customerName}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        req.priority === 'High' ? 'bg-rose-50 border-rose-200 text-rose-700' : req.priority === 'Medium' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-stone-550 border-stone-200 text-stone-500'
                      }`}>
                        ⚠️ {req.priority}
                      </span>
                      <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full ${
                        req.status === 'New' ? 'bg-blue-50 text-blue-700' : req.status === 'Pending Review' ? 'bg-amber-50 text-amber-700' : req.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700' : req.status === 'Scheduled' ? 'bg-indigo-50 text-indigo-700' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-600 font-medium py-3 leading-relaxed">{req.summary}</p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] text-stone-450 font-bold uppercase tracking-wider pt-3 border-t border-light-border/40">
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <span>📍 {req.location}</span>
                      <span>💰 Budget: {req.budget}</span>
                      <span>📅 Date: {req.requestedDate}</span>
                    </div>
                    <span className="text-stone-400">{req.timeSinceRequest}</span>
                  </div>

                  {/* Actions inside Card */}
                  <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-light-border/40">
                    {(req.status === 'Accepted' || req.status === 'Scheduled' || req.status === 'Completed') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/workspace/consultation/${req.id}`);
                        }}
                        className="dbc-btn dbc-btn-sm dbc-btn-primary"
                      >
                        Workspace &rarr;
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(req.id, 'Accept');
                      }}
                      disabled={req.status === 'Accepted' || req.status === 'Scheduled' || req.status === 'Completed'}
                      className="dbc-btn dbc-btn-sm dbc-btn-primary"
                    >
                      Accept
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(req.id, 'Schedule');
                      }}
                      disabled={req.status === 'Scheduled' || req.status === 'Completed'}
                      className="dbc-btn dbc-btn-sm dbc-btn-secondary bg-stone-100 border border-stone-300/40"
                    >
                      Schedule
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(req.id, 'Reject');
                      }}
                      disabled={req.status === 'Rejected' || req.status === 'Completed'}
                      className="dbc-btn dbc-btn-sm dbc-btn-danger"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}

              {/* 5. Pagination */}
              <div className="flex items-center justify-between pt-4">
                <span className="text-[10px] text-stone-450 font-bold uppercase tracking-wider">
                  Page {currentPage} of {totalPages} ({filteredRequests.length} requests)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-stone-200 rounded-lg text-xs font-bold text-stone-600 disabled:opacity-40 cursor-pointer"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                        currentPage === i + 1 ? 'bg-stone-black text-white' : 'hover:bg-stone-100 text-stone-600'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-stone-200 rounded-lg text-xs font-bold text-stone-600 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Request Details Preview Side-Panel */}
        {selectedRequest && (
          <aside className="lg:col-span-5 bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4 text-left animate-in slide-in-from-right-3 duration-200">
            <div className="flex justify-between items-start border-b border-light-border pb-4">
              <div>
                <span className="text-[8px] font-black uppercase text-stone-450 tracking-wider">Request Detail Preview</span>
                <h3 className="text-xs font-black text-stone-900 leading-normal">{selectedRequest.requirementTitle}</h3>
              </div>
              <button
                onClick={() => setSelectedRequestId(null)}
                className="text-stone-400 hover:text-stone-900 text-sm transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-[11px] text-stone-600 font-medium">
              <div className="p-3 bg-stone-50 rounded-xl space-y-2 border border-stone-100">
                <p>👤 <strong>Client Name:</strong> {selectedRequest.customerName}</p>
                <p>📍 <strong>Location:</strong> {selectedRequest.location}</p>
                <p>💰 <strong>Estimated Budget:</strong> {selectedRequest.budget}</p>
                <p>📅 <strong>Requested Date:</strong> {selectedRequest.requestedDate}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-stone-400">Detailed Description</span>
                <p className="leading-relaxed bg-stone-50/40 p-3 rounded-xl border border-stone-100">{selectedRequest.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[10.5px]">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="block text-[8px] font-black uppercase text-stone-400">Consult Mode</span>
                  <span className="font-bold text-stone-850">🖥️ {selectedRequest.consultationMode}</span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                  <span className="block text-[8px] font-black uppercase text-stone-400">Expected Timeline</span>
                  <span className="font-bold text-stone-850">⏳ {selectedRequest.expectedTimeline}</span>
                </div>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 flex justify-between items-center">
                <span>📁 Uploaded Documents</span>
                <span className="bg-stone-200 text-stone-800 text-[10px] px-2 py-0.5 rounded-full font-black">
                  {selectedRequest.documentsCount} Files
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-stone-400">Client Notes</span>
                <p className="italic bg-light-stone/20 p-3 rounded-xl border border-light-border/40">"{selectedRequest.notes}"</p>
              </div>
            </div>

            <div className="pt-4 border-t border-light-border/40 flex justify-end gap-2">
              {(selectedRequest.status === 'Accepted' || selectedRequest.status === 'Scheduled' || selectedRequest.status === 'Completed') && (
                <button
                  onClick={() => navigate(`/workspace/consultation/${selectedRequest.id}`)}
                  className="dbc-btn dbc-btn-md dbc-btn-primary"
                >
                  Go to Workspace
                </button>
              )}
              <button
                onClick={() => handleAction(selectedRequest.id, 'Accept')}
                disabled={selectedRequest.status === 'Accepted' || selectedRequest.status === 'Scheduled' || selectedRequest.status === 'Completed'}
                className="dbc-btn dbc-btn-md dbc-btn-primary"
              >
                Accept
              </button>
              <button
                onClick={() => handleAction(selectedRequest.id, 'Reject')}
                disabled={selectedRequest.status === 'Rejected' || selectedRequest.status === 'Completed'}
                className="dbc-btn dbc-btn-md dbc-btn-danger"
              >
                Decline
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* 6. Action Confirmation Modal */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-stone-950/45 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in duration-250">
          <div className="bg-white border border-light-border p-6 rounded-3xl max-w-sm w-full mx-4 shadow-xl space-y-4 animate-in zoom-in-95 duration-150 text-left select-none">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-stone-900 uppercase">Confirm Action</h3>
              <p className="text-xs text-stone-500 font-medium">Are you sure you want to {confirmDialog.action.toLowerCase()} this consultation request?</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`dbc-btn dbc-btn-md ${
                  confirmDialog.action === 'Reject' ? 'dbc-btn-danger' : 'dbc-btn-primary'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// Loading Skeleton Loader
// ==========================================
function SkeletonLoader() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 text-left animate-pulse">
      <div className="h-28 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, idx) => (
          <div key={idx} className="h-24 bg-white border border-light-border p-4 rounded-2xl shadow-apple-xs"></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="h-40 bg-white border border-light-border rounded-3xl p-5 shadow-apple-sm"></div>
          ))}
        </div>
        <div className="lg:col-span-5 h-96 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
      </div>
    </div>
  );
}
