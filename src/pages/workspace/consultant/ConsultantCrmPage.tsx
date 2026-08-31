import { useState, useMemo, useEffect, startTransition } from 'react';

// ==========================================
// Types & Interfaces
// ==========================================
interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  projectTitle: string;
  location: string;
  status: 'Active' | 'Inactive' | 'Returning' | 'New';
  health: 'Healthy' | 'Needs Follow-up' | 'Inactive' | 'Waiting for Response' | 'Completed';
  lastInteraction: string;
  nextFollowUp: string;
  budget: string;
  tags: string[];
  notes: string;
}

interface FollowUp {
  id: string;
  customerName: string;
  type: 'Call' | 'Meeting' | 'Site Visit';
  date: string;
  status: 'Upcoming' | 'Overdue' | 'Completed';
}

export default function ConsultantCrmPage() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [healthFilter, setHealthFilter] = useState('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>('CUST-101');

  // Customer List state
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: 'CUST-101',
      fullName: 'Ramesh Kumar',
      email: 'ramesh.kumar@example.com',
      phone: '+91 98765 43210',
      projectTitle: 'Modern Villa Vastu Alignment',
      location: 'Gachibowli, Hyderabad',
      status: 'Active',
      health: 'Healthy',
      lastInteraction: '2026-08-01',
      nextFollowUp: '2026-08-05',
      budget: '₹45,00,000',
      tags: ['VIP', 'Premium Project'],
      notes: 'Client is concerned about foundation soil strength. Send Soil Hydrology report.'
    },
    {
      id: 'CUST-102',
      fullName: 'Sita Sharma',
      email: 'sita.sharma@example.com',
      phone: '+91 91234 56789',
      projectTitle: 'Modular Kitchen Space Optimization',
      location: 'Madhapur, Hyderabad',
      status: 'Returning',
      health: 'Needs Follow-up',
      lastInteraction: '2026-07-28',
      nextFollowUp: '2026-08-03',
      budget: '₹22,00,000',
      tags: ['Returning Customer'],
      notes: 'Awaiting updated kitchen draft file from interior architect.'
    },
    {
      id: 'CUST-103',
      fullName: 'Vikram Singh',
      email: 'vikram.singh@example.com',
      phone: '+91 94401 23456',
      projectTitle: 'Commercial Layout Permit Review',
      location: 'Jubilee Hills, Hyderabad',
      status: 'New',
      health: 'Waiting for Response',
      lastInteraction: '2026-07-30',
      nextFollowUp: '2026-08-08',
      budget: '₹65,00,000',
      tags: ['High Priority', 'Urgent'],
      notes: 'Submitted municipal checklist review. Waiting for client seal.'
    }
  ]);

  // Follow-up center list
  const [followups, setFollowups] = useState<FollowUp[]>([
    { id: 'fup-1', customerName: 'Ramesh Kumar', type: 'Call', date: '05-Aug-2026', status: 'Upcoming' },
    { id: 'fup-2', customerName: 'Sita Sharma', type: 'Meeting', date: '03-Aug-2026', status: 'Upcoming' },
    { id: 'fup-3', customerName: 'Vikram Singh', type: 'Site Visit', date: '29-Jul-2026', status: 'Overdue' }
  ]);

  // Notes state (autosave simulator)
  const [activeNotes, setActiveNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Sync selected customer notes
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    if (selectedCustomer) {
      startTransition(() => {
        setActiveNotes(selectedCustomer.notes);
      });
    }
  }, [selectedCustomerId, selectedCustomer]);

  // Autosave simulator
  useEffect(() => {
    if (isLoading || !selectedCustomerId) return;
    startTransition(() => {
      setIsSavingNotes(true);
    });
    const timer = setTimeout(() => {
      setCustomers(prev => prev.map(c => c.id === selectedCustomerId ? { ...c, notes: activeNotes } : c));
      startTransition(() => {
        setIsSavingNotes(false);
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [activeNotes, isLoading, selectedCustomerId]);

  // Startup timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    return {
      activeCount: customers.filter(c => c.status === 'Active').length,
      newCount: customers.filter(c => c.status === 'New').length,
      pendingFup: followups.filter(f => f.status === 'Upcoming' || f.status === 'Overdue').length,
      completedCount: 38, // Mock count
      returningCount: customers.filter(c => c.status === 'Returning').length,
    };
  }, [customers, followups]);

  // Apply filters
  const filteredCustomers = useMemo(() => {
    return customers.filter(cust => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q ||
        cust.fullName.toLowerCase().includes(q) ||
        cust.projectTitle.toLowerCase().includes(q) ||
        cust.location.toLowerCase().includes(q) ||
        cust.id.toLowerCase().includes(q) ||
        cust.phone.includes(q) ||
        cust.email.toLowerCase().includes(q);

      const matchStatus = statusFilter === 'ALL' || cust.status === statusFilter;
      const matchHealth = healthFilter === 'ALL' || cust.health === healthFilter;

      return matchQuery && matchStatus && matchHealth;
    });
  }, [customers, searchQuery, statusFilter, healthFilter]);

  const handleCompleteFollowUp = (id: string) => {
    setFollowups(prev => prev.map(f => f.id === id ? { ...f, status: 'Completed' } : f));
  };

  const handleAddTag = (tag: string) => {
    if (!selectedCustomerId || !tag) return;
    setCustomers(prev => prev.map(c => {
      if (c.id === selectedCustomerId && !c.tags.includes(tag)) {
        return { ...c, tags: [...c.tags, tag] };
      }
      return c;
    }));
  };

  if (isLoading) {
    return <SkeletonCRM />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 text-left animate-gentle-fade select-none">
      
      {/* 1. Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm relative">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider"> central database </span>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">Customer Relationship Management</h1>
          <p className="text-xs text-stone-500 font-medium">Manage customer relationship logs, scheduled follow-ups, and notes histories.</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => {
              const notesPrompt = prompt('Enter a quick note for selected customer:');
              if (notesPrompt) setActiveNotes(prev => prev + '\n- ' + notesPrompt);
            }}
            className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
          >
            Add Customer Note
          </button>
          <button
            onClick={() => {
              const fupName = prompt('Enter customer name for follow-up:');
              if (fupName) {
                setFollowups(prev => [...prev, { id: `fup-${Date.now()}`, customerName: fupName, type: 'Call', date: '08-Aug-2026', status: 'Upcoming' }]);
              }
            }}
            className="dbc-btn dbc-btn-md dbc-btn-primary"
          >
            Create Follow-up
          </button>
        </div>
      </header>

      {/* 2. KPI Statistics Summary Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Active Customers', count: stats.activeCount, icon: '👥', color: 'bg-emerald-50 text-emerald-800' },
          { label: 'New Customers', count: stats.newCount, icon: '🌟', color: 'bg-blue-50 text-blue-800' },
          { label: 'Pending Follow-ups', count: stats.pendingFup, icon: '⏳', color: 'bg-amber-50 text-amber-800' },
          { label: 'Completed Consults', count: stats.completedCount, icon: '✅', color: 'bg-stone-100 text-stone-850' },
          { label: 'Returning Customers', count: stats.returningCount, icon: '🔄', color: 'bg-indigo-50 text-indigo-800' },
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

      {/* 3. Search & Filters Panel */}
      <section className="bg-white border border-light-border p-5 rounded-2xl shadow-apple-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <span className="absolute left-3.5 top-3 text-stone-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Search by name, ID, project, location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="dbc-input py-2 px-10"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="dbc-input bg-white py-2 px-3"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Returning">Returning</option>
              <option value="New">New</option>
            </select>
          </div>

          <div>
            <select
              value={healthFilter}
              onChange={e => setHealthFilter(e.target.value)}
              className="dbc-input bg-white py-2 px-3"
            >
              <option value="ALL">All Health Statuses</option>
              <option value="Healthy">Healthy</option>
              <option value="Needs Follow-up">Needs Follow-up</option>
              <option value="Waiting for Response">Waiting for Response</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </section>

      {/* Two-Column CRM view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Customer Cards List */}
        <div className={`space-y-4 ${selectedCustomerId ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          {filteredCustomers.length === 0 ? (
            <div className="bg-white border border-light-border p-12 rounded-3xl text-center space-y-4 shadow-apple-sm">
              <span className="text-3xl block">👥</span>
              <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest">No customers matching criteria</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCustomers.map(cust => {
                const isSelected = cust.id === selectedCustomerId;
                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomerId(isSelected ? null : cust.id)}
                    className={`p-5 rounded-3xl border text-left cursor-pointer transition duration-300 ${
                      isSelected
                        ? 'bg-brand-emerald/5 border-brand-emerald/40 shadow-xs'
                        : 'bg-white border-light-border hover:bg-stone-50/50 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex justify-between items-start pb-2 border-b border-light-border/40 gap-2">
                      <div>
                        <h4 className="text-xs font-black text-stone-900">{cust.fullName}</h4>
                        <span className="block text-[8px] text-stone-400 font-bold uppercase tracking-wider">{cust.id} &bull; {cust.location}</span>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          cust.health === 'Healthy' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}>
                          {cust.health}
                        </span>
                        <span className="bg-stone-100 text-stone-700 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {cust.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-700 font-semibold pt-2.5">Project: {cust.projectTitle}</p>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9.5px] text-stone-450 font-bold uppercase tracking-wider pt-3 border-t border-light-border/40 mt-3">
                      <span>Last interaction: {cust.lastInteraction}</span>
                      <span>Next follow-up: {cust.nextFollowUp}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Customer Detailed Profile Panel */}
        {selectedCustomer && (
          <aside className="lg:col-span-6 space-y-6 text-left animate-in slide-in-from-right-3 duration-250">
            
            {/* 4. Customer Info Details */}
            <div className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
              <div className="flex justify-between items-start border-b border-light-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-emerald text-white font-black flex items-center justify-center text-sm uppercase shrink-0">
                    {selectedCustomer.fullName.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-stone-900">{selectedCustomer.fullName}</h3>
                    <span className="text-[9px] text-stone-400 font-bold uppercase">{selectedCustomer.id}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomerId(null)} className="text-stone-400 hover:text-stone-900 text-sm transition">✕</button>
              </div>

              <div className="space-y-2.5 text-[11px] text-stone-600 font-medium">
                <p>📞 <strong>Phone:</strong> {selectedCustomer.phone}</p>
                <p>✉️ <strong>Email:</strong> {selectedCustomer.email}</p>
                <p>📍 <strong>Project Location:</strong> {selectedCustomer.location}</p>
                <p>💰 <strong>Project Budget:</strong> {selectedCustomer.budget}</p>
              </div>

              {/* Tags Panel */}
              <div className="space-y-1.5 pt-3 border-t border-light-border/40">
                <span className="block text-[8px] font-black uppercase text-stone-450 tracking-wider">Relationship Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCustomer.tags.map((t, idx) => (
                    <span key={idx} className="bg-stone-100 text-stone-700 text-[8.5px] font-bold px-2 py-0.5 rounded border border-light-border/40 uppercase">
                      {t}
                    </span>
                  ))}
                  <button
                    onClick={() => {
                      const newTag = prompt('Enter a custom tag:');
                      if (newTag) handleAddTag(newTag);
                    }}
                    className="text-[8.5px] font-bold text-brand-emerald hover:underline"
                  >
                    + Add Tag
                  </button>
                </div>
              </div>
            </div>

            {/* 5. Autosaved Consultant Notes */}
            <div className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
              <div className="flex justify-between items-center text-[10px] text-stone-400 font-semibold">
                <span>🔒 Consultant-only logs</span>
                {isSavingNotes && <span className="text-brand-emerald animate-pulse">Autosaving...</span>}
              </div>
              <textarea
                value={activeNotes}
                onChange={e => setActiveNotes(e.target.value)}
                placeholder="Draft relationship notes here..."
                className="dbc-input h-32 resize-none"
              />
            </div>

            {/* 6. Smart Assistant Advice */}
            <div className="bg-gradient-to-br from-stone-950 to-stone-900 border border-stone-850 p-6 rounded-3xl shadow-apple-sm text-white space-y-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
              <div className="space-y-0.5">
                <span className="text-[8.5px] font-black uppercase text-emerald-400 tracking-wider">CRM Smart Assistant</span>
                <h3 className="text-xs font-black">AI Follow-up suggestions</h3>
              </div>
              <ul className="space-y-2 text-[10px] text-stone-300 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✦</span>
                  <span>Contact {selectedCustomer.fullName} concerning next scheduled {selectedCustomer.nextFollowUp} task.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">✦</span>
                  <span>Soil hydrology reports are pre-compiled in workspace tabs.</span>
                </li>
              </ul>
            </div>

            {/* 7. Follow-up Center panel */}
            <div className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
              <h3 className="text-xs font-black uppercase text-stone-900">CRM Scheduled Tasks</h3>
              <div className="space-y-3">
                {followups.map(fup => (
                  <div key={fup.id} className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <strong className="block text-stone-900 font-bold">{fup.customerName} ({fup.type})</strong>
                      <span className="block text-[8px] text-stone-400 font-bold uppercase mt-0.5">Due date: {fup.date} &bull; Status: {fup.status}</span>
                    </div>
                    {fup.status !== 'Completed' && (
                      <button
                        onClick={() => handleCompleteFollowUp(fup.id)}
                        className="text-brand-emerald text-[9px] font-black uppercase tracking-wider hover:underline"
                      >
                        Complete Task
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </aside>
        )}

      </div>

    </div>
  );
}

// ==========================================
// Loading Skeletons
// ==========================================
function SkeletonCRM() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 text-left animate-pulse">
      <div className="h-28 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, idx) => (
          <div key={idx} className="h-24 bg-white border border-light-border rounded-2xl p-4"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 h-96 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
        <div className="lg:col-span-6 h-96 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
      </div>
    </div>
  );
}
