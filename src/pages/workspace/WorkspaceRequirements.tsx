import { useState, useEffect } from 'react';
import { RequirementCard } from '../../components/workspace/requirements/RequirementCard';
import { RequirementSummaryCard } from '../../components/workspace/requirements/RequirementSummaryCard';
import { RequirementDetail } from '../../components/workspace/requirements/RequirementDetail';
import { RequirementForm } from '../../components/workspace/requirements/RequirementForm';
import { EmptyRequirements } from '../../components/workspace/requirements/EmptyRequirements';
import { RequirementService } from '../../services/customer/RequirementService';
import type { RequirementResponse } from '../../types/customer/RequirementTypes';

const INITIAL_REQUIREMENTS: CustomerRequirement[] = [
  {
    id: 'req-1',
    title: 'Modern Villa Blueprint Layout',
    description: 'Looking for a certified architect to draft structural and landscape plans for a 3000 sq.ft. villa.',
    category: 'Architect',
    budgetMin: 50000,
    budgetMax: 80000,
    city: 'Hyderabad',
    address: 'Banjara Hills, Road No 12',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    status: 'Open',
    prosInterestedCount: 2,
  },
  {
    id: 'req-2',
    title: 'Smart Home Automation Integration',
    description: 'Require setup of central smart hub controlling locks, CCTV, and smart thermostats.',
    category: 'CCTV Installation',
    budgetMin: 20000,
    budgetMax: 35000,
    city: 'Hyderabad',
    address: 'Jubilee Hills, Metro Pillar 32',
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    status: 'Draft',
    prosInterestedCount: 0,
  },
];

interface CustomerRequirement {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  city: string;
  address: string;
  createdAt: string;
  status: string;
  prosInterestedCount: number;
}

interface RequirementFormData {
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  city: string;
  address: string;
}

function mapApiReqToCustomerReq(r: RequirementResponse): CustomerRequirement {
  return {
    id: String(r.id),
    title: r.title,
    description: r.description,
    category: r.serviceCategory || 'General',
    budgetMin: r.budgetMin,
    budgetMax: r.budgetMax,
    city: r.location ? r.location.split(',')[0].trim() : 'Hyderabad',
    address: r.location || 'Hyderabad',
    createdAt: r.createdAt,
    status: r.status === 'PUBLISHED' || r.status === 'SUBMITTED' ? 'Open' : r.status === 'DRAFT' ? 'Draft' : r.status === 'CANCELLED' ? 'Cancelled' : r.status === 'COMPLETED' ? 'Completed' : r.status,
    prosInterestedCount: 0,
  };
}

export default function WorkspaceRequirements() {
  // Load list from local storage or defaults
  const [requirements, setRequirements] = useState<CustomerRequirement[]>(() => {
    const raw = localStorage.getItem('dbc_customer_requirements');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return INITIAL_REQUIREMENTS;
      }
    }
    return INITIAL_REQUIREMENTS;
  });

  // State controls
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<CustomerRequirement | null>(null);
  const [selectedRequirement, setSelectedRequirement] = useState<CustomerRequirement | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  // Fetch live requirements from backend
  useEffect(() => {
    let isMounted = true;
    async function loadRequirements() {
      try {
        const data = await RequirementService.getMyRequirements();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const mapped = data.map(mapApiReqToCustomerReq);
          setRequirements(mapped);
          localStorage.setItem('dbc_customer_requirements', JSON.stringify(mapped));
        }
      } catch (err) {
        console.warn('Could not load live requirements from API, using fallback data', err);
      }
    }
    loadRequirements();
    return () => {
      isMounted = false;
    };
  }, []);

  // Persist requirements
  useEffect(() => {
    localStorage.setItem('dbc_customer_requirements', JSON.stringify(requirements));
  }, [requirements]);

  const handlePostOrUpdate = async (formData: RequirementFormData, status: 'Open' | 'Draft') => {
    if (editingRequirement) {
      // Update existing item
      const numId = Number(editingRequirement.id);
      if (!isNaN(numId) && numId > 0) {
        try {
          await RequirementService.updateRequirement(numId, {
            title: formData.title,
            description: formData.description,
            serviceCategory: formData.category,
            location: `${formData.address}, ${formData.city}`,
            budgetMin: formData.budgetMin,
            budgetMax: formData.budgetMax,
          });
        } catch (err) {
          console.warn('Failed to update requirement via API, updating locally', err);
        }
      }

      const updatedItem = { ...editingRequirement, ...formData, status, createdAt: new Date().toISOString() };
      setRequirements((prev) =>
        prev.map((req) =>
          req.id === editingRequirement.id ? updatedItem : req
        )
      );
      setEditingRequirement(null);
      setSelectedRequirement(updatedItem);
    } else {
      // Create new item
      let createdId = `req-${Date.now()}`;
      try {
        const res = await RequirementService.createRequirement({
          title: formData.title,
          description: formData.description,
          serviceCategory: formData.category,
          location: `${formData.address}, ${formData.city}`,
          budgetMin: formData.budgetMin,
          budgetMax: formData.budgetMax,
        });
        if (res && res.id) {
          createdId = String(res.id);
        }
      } catch (err) {
        console.warn('Failed to create requirement via API, saving locally', err);
      }

      const newItem: CustomerRequirement = {
        id: createdId,
        ...formData,
        status,
        createdAt: new Date().toISOString(),
        prosInterestedCount: 0,
      };
      setRequirements((prev) => [newItem, ...prev]);
      setSelectedRequirement(newItem);
    }
    setIsFormOpen(false);
  };

  const handleCancelRequirement = async (id: string) => {
    const numId = Number(id);
    if (!isNaN(numId) && numId > 0) {
      try {
        await RequirementService.updateStatus(numId, 'CANCELLED', 'Cancelled by customer');
      } catch (err) {
        console.warn('Failed to cancel requirement on API', err);
      }
    }
    setRequirements((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: 'Cancelled' } : req))
    );
    setSelectedRequirement(null);
  };

  const handleDuplicateRequirement = (item: CustomerRequirement) => {
    const newItem: CustomerRequirement = {
      ...item,
      id: `req-${Date.now()}`,
      title: `${item.title} (Copy)`,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      prosInterestedCount: 0,
    };
    setRequirements((prev) => [newItem, ...prev]);
    setSelectedRequirement(null);
  };

  const handleDeleteRequirement = async (id: string) => {
    const numId = Number(id);
    if (!isNaN(numId) && numId > 0) {
      try {
        await RequirementService.deleteRequirement(numId);
      } catch (err) {
        console.warn('Failed to delete requirement on API', err);
      }
    }
    setRequirements((prev) => prev.filter((req) => req.id !== id));
    setSelectedRequirement(null);
  };

  // Get active statistics counts
  const stats = {
    open: requirements.filter((r) => r.status.toLowerCase() === 'open').length,
    drafts: requirements.filter((r) => r.status.toLowerCase() === 'draft').length,
    completed: requirements.filter((r) => r.status.toLowerCase() === 'completed').length,
    cancelled: requirements.filter((r) => r.status.toLowerCase() === 'cancelled').length,
  };

  // Filter & Sort Logic
  const filteredRequirements = requirements
    .filter((req) => {
      const matchSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          req.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || req.status.toUpperCase() === statusFilter;
      const matchCategory = categoryFilter === 'ALL' || req.category.toUpperCase() === categoryFilter.toUpperCase();
      return matchSearch && matchStatus && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'NEWEST') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'OLDEST') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'BUDGET_HIGH_LOW') return b.budgetMax - a.budgetMax;
      if (sortBy === 'BUDGET_LOW_HIGH') return a.budgetMin - b.budgetMin;
      return 0;
    });

  // Extract unique categories for filter list
  const uniqueCategories = Array.from(new Set(requirements.map((r) => r.category)));

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left relative">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-stone-200 pb-5">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-stone-900 font-serif">My Requirements</h2>
          <p className="text-xs text-stone-500 font-medium">Manage, edit drafts, and track all of your posted project requirements.</p>
        </div>
        {!isFormOpen && (
          <button
            onClick={() => {
              setEditingRequirement(null);
              setIsFormOpen(true);
            }}
            className="dbc-btn dbc-btn-md dbc-btn-primary"
          >
            + Create Requirement
          </button>
        )}
      </div>

      {/* Main Form Wizard view */}
      {isFormOpen ? (
        <RequirementForm
          initialValues={editingRequirement}
          onSubmit={handlePostOrUpdate}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingRequirement(null);
          }}
        />
      ) : (
        <div className="space-y-6">
          
          {/* Summary Row Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <RequirementSummaryCard label="Open Requirements" count={stats.open} icon="📋" colorClass="text-emerald-600 bg-emerald-50/50" />
            <RequirementSummaryCard label="Saved Drafts" count={stats.drafts} icon="⚙️" colorClass="text-stone-500 bg-stone-100/50" />
            <RequirementSummaryCard label="Completed Contracts" count={stats.completed} icon="✓" colorClass="text-sky-600 bg-sky-50/50" />
            <RequirementSummaryCard label="Cancelled Tickets" count={stats.cancelled} icon="🚫" colorClass="text-rose-600 bg-rose-50/50" />
          </div>

          {/* Filters & Search Control */}
          <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-3 justify-between">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm w-full">
              <span className="absolute inset-y-0 left-3 flex items-center text-stone-400 text-xs pointer-events-none">🔍</span>
              <input
                type="text"
                placeholder="Search specifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="dbc-input pl-8 text-xs w-full"
              />
            </div>

            {/* Select options filters */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto text-[10px] font-bold text-stone-550 uppercase tracking-wide">
              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="dbc-input text-xs bg-white py-1.5"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="DRAFT">Draft</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="COMPLETED">Completed</option>
              </select>

              {/* Category */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="dbc-input text-xs bg-white py-1.5"
              >
                <option value="ALL">All Categories</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat.toUpperCase()}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Sorting */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="dbc-input text-xs bg-white py-1.5"
              >
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
                <option value="BUDGET_HIGH_LOW">Budget: High-Low</option>
                <option value="BUDGET_LOW_HIGH">Budget: Low-High</option>
              </select>
            </div>

          </div>

          {/* Split viewport: List grid + Detail drawer side panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* List panel */}
            <div className={`space-y-4 lg:col-span-2 ${selectedRequirement ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              {filteredRequirements.length > 0 ? (
                <div className={`grid grid-cols-1 gap-4 ${selectedRequirement ? 'sm:grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                  {filteredRequirements.map((req) => (
                    <RequirementCard
                      key={req.id}
                      requirement={req}
                      onSelect={() => setSelectedRequirement(req)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyRequirements
                  onAction={() => {
                    setEditingRequirement(null);
                    setIsFormOpen(true);
                  }}
                />
              )}
            </div>

            {/* Details panel (Drawer overlay/side box) */}
            {selectedRequirement && (
              <div className="lg:col-span-1 sticky top-24">
                <RequirementDetail
                  requirement={selectedRequirement}
                  onClose={() => setSelectedRequirement(null)}
                  onEdit={() => {
                    setEditingRequirement(selectedRequirement);
                    setIsFormOpen(true);
                  }}
                  onCancel={() => handleCancelRequirement(selectedRequirement.id)}
                  onDuplicate={() => handleDuplicateRequirement(selectedRequirement)}
                  onDelete={() => handleDeleteRequirement(selectedRequirement.id)}
                />
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
