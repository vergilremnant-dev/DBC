import { useState, useMemo, useEffect } from 'react';

// ==========================================
// Types & Interfaces
// ==========================================
interface Quotation {
  id: string;
  requirementId: string;
  requirementTitle: string;
  customerName: string;
  category: string;
  amount: string;
  submittedDate: string;
  status: 'Draft' | 'Submitted' | 'Accepted' | 'Rejected' | 'Expired';
  lastModified: string;
  scope: string;
  exclusions: string;
  duration: string;
  terms: string;
}

const generateQuotationId = () => `QT-${Date.now().toString().slice(-3)}`;

export default function QuotationManagementPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'LIST' | 'EDITOR' | 'PREVIEW'>('LIST');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Quotations database state
  const [quotations, setQuotations] = useState<Quotation[]>([
    {
      id: 'QT-801',
      requirementId: 'REQ-201',
      requirementTitle: 'Structural blueprint load-bearing review for Duplex',
      customerName: 'Ramesh Kumar',
      category: 'Architecture',
      amount: '₹48,000',
      submittedDate: '2026-07-30',
      status: 'Submitted',
      lastModified: '2026-07-30',
      scope: 'Verify column layout alignment, beam load-bearing calculations, Vastu entrance coordinates.',
      exclusions: 'Actual physical soil testing, municipal approval fee charges.',
      duration: '3 Weeks',
      terms: '50% advance before layout review draft; balance on final report submission.'
    },
    {
      id: 'QT-802',
      requirementId: 'REQ-202',
      requirementTitle: 'Plumbing distribution piping layout & conduction',
      customerName: 'Sita Sharma',
      category: 'Plumbing',
      amount: '₹38,000',
      submittedDate: '---',
      status: 'Draft',
      lastModified: '2026-08-01',
      scope: 'MEP conduits layout planning, valve coordination checks.',
      exclusions: 'Materials procurement charges.',
      duration: '2 Weeks',
      terms: '100% payout post execution approval.'
    }
  ]);

  // Editor form state
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [reqTitle, setReqTitle] = useState('Structural blueprint load-bearing review for Duplex');
  const [clientName, setClientName] = useState('Ramesh Kumar');
  const [quoteCategory, setQuoteCategory] = useState('Architecture');
  const [quoteAmount, setQuoteAmount] = useState('₹45,000');
  const [quoteScope, setQuoteScope] = useState('');
  const [quoteExclusions, setQuoteExclusions] = useState('');
  const [quoteDuration, setQuoteDuration] = useState('3 Weeks');
  const [quoteTerms, setQuoteTerms] = useState('50% advance; balance on final handover.');

  // Preview target quote state
  const [previewQuoteId, setPreviewQuoteId] = useState<string | null>(null);

  // Simulated Startup loader
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    return {
      draft: quotations.filter(q => q.status === 'Draft').length,
      submitted: quotations.filter(q => q.status === 'Submitted').length,
      accepted: quotations.filter(q => q.status === 'Accepted').length,
      rejected: quotations.filter(q => q.status === 'Rejected').length,
      expired: quotations.filter(q => q.status === 'Expired').length,
    };
  }, [quotations]);

  const filteredQuotes = useMemo(() => {
    return quotations.filter(q => {
      const qLower = searchQuery.toLowerCase().trim();
      const matchQuery = !qLower || q.customerName.toLowerCase().includes(qLower) || q.requirementTitle.toLowerCase().includes(qLower) || q.id.toLowerCase().includes(qLower);
      const matchStatus = statusFilter === 'ALL' || q.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [quotations, searchQuery, statusFilter]);

  const handleEdit = (quote: Quotation) => {
    if (quote.status !== 'Draft') {
      alert('Submitted, accepted, or expired quotations are read-only and cannot be modified.');
      return;
    }
    setEditingQuoteId(quote.id);
    setReqTitle(quote.requirementTitle);
    setClientName(quote.customerName);
    setQuoteCategory(quote.category);
    setQuoteAmount(quote.amount);
    setQuoteScope(quote.scope);
    setQuoteExclusions(quote.exclusions);
    setQuoteDuration(quote.duration);
    setQuoteTerms(quote.terms);
    setActiveTab('EDITOR');
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuoteId) {
      // Create new quotation draft
      const newQuote: Quotation = {
        id: generateQuotationId(),
        requirementId: 'REQ-201',
        requirementTitle: reqTitle,
        customerName: clientName,
        category: quoteCategory,
        amount: quoteAmount,
        submittedDate: '---',
        status: 'Draft',
        lastModified: 'Just now',
        scope: quoteScope,
        exclusions: quoteExclusions,
        duration: quoteDuration,
        terms: quoteTerms
      };
      setQuotations([...quotations, newQuote]);
    } else {
      // Update existing quotation draft
      setQuotations(prev => prev.map(q => {
        if (q.id === editingQuoteId) {
          return {
            ...q,
            amount: quoteAmount,
            scope: quoteScope,
            exclusions: quoteExclusions,
            duration: quoteDuration,
            terms: quoteTerms,
            lastModified: 'Just now'
          };
        }
        return q;
      }));
    }
    alert('Quotation draft saved successfully.');
    setActiveTab('LIST');
    resetForm();
  };

  const handlePreview = (quote: Quotation) => {
    setPreviewQuoteId(quote.id);
    setActiveTab('PREVIEW');
  };

  const handleSubmitQuotation = () => {
    if (!previewQuoteId) return;
    setQuotations(prev => prev.map(q => {
      if (q.id === previewQuoteId) {
        return {
          ...q,
          status: 'Submitted',
          submittedDate: new Date().toLocaleDateString('en-IN')
        };
      }
      return q;
    }));
    alert('Proposal quotation submitted successfully to client dashboard.');
    setActiveTab('LIST');
  };

  const handleDuplicate = (quote: Quotation) => {
    const duplicated: Quotation = {
      ...quote,
      id: `QT-DUP-${Date.now().toString().slice(-3)}`,
      status: 'Draft',
      submittedDate: '---',
      lastModified: 'Just now'
    };
    setQuotations([...quotations, duplicated]);
    alert('Quotation duplicated as Draft.');
  };

  const handleDeleteDraft = (id: string) => {
    const q = quotations.find(item => item.id === id);
    if (q?.status !== 'Draft') {
      alert('Only draft quotations can be deleted.');
      return;
    }
    const confirm = window.confirm('Are you sure you want to delete this quotation draft?');
    if (confirm) {
      setQuotations(prev => prev.filter(item => item.id !== id));
      alert('Draft deleted.');
    }
  };

  const resetForm = () => {
    setEditingQuoteId(null);
    setQuoteScope('');
    setQuoteExclusions('');
  };

  const previewQuote = useMemo(() => {
    const targetId = previewQuoteId || editingQuoteId;
    return quotations.find(q => q.id === targetId) || null;
  }, [quotations, previewQuoteId, editingQuoteId]);

  if (isLoading) {
    return <SkeletonQuotation />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 text-left animate-gentle-fade select-none">
      
      {/* 1. Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm relative">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Bid & Proposals</span>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight font-serif">Quotation Management</h1>
          <p className="text-xs text-stone-500 font-medium">Create, manage, and submit professional quotations for customer requirements.</p>
        </div>

        <div className="flex gap-2 text-xs">
          <button
            onClick={() => {
              resetForm();
              setActiveTab('EDITOR');
            }}
            className="dbc-btn dbc-btn-md dbc-btn-primary"
          >
            Create New Quotation
          </button>
        </div>
      </header>

      {/* 2. TAB CONTROLLER: LIST VIEW */}
      {activeTab === 'LIST' && (
        <>
          {/* KPI Stats summary */}
          <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Drafts', count: stats.draft, icon: '✏️', color: 'bg-stone-50 text-stone-700' },
              { label: 'Submitted', count: stats.submitted, icon: '📤', color: 'bg-blue-50 text-blue-800' },
              { label: 'Accepted', count: stats.accepted, icon: '✅', color: 'bg-emerald-50 text-emerald-800' },
              { label: 'Rejected', count: stats.rejected, icon: '🛑', color: 'bg-rose-50 text-rose-800' },
              { label: 'Expired', count: stats.expired, icon: '⏳', color: 'bg-amber-50 text-amber-800' },
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

          {/* Search & Filters */}
          <section className="bg-white border border-light-border p-5 rounded-3xl shadow-apple-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search quotes, clients..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="dbc-input text-xs"
              />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="dbc-input text-xs bg-white"
              >
                <option value="ALL">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Accepted">Accepted</option>
              </select>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
              }}
              className="text-brand-emerald text-[10px] font-black uppercase hover:underline"
            >
              Reset Filters
            </button>
          </section>

          {/* Quotations table list */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm overflow-x-auto">
            {filteredQuotes.length === 0 ? (
              <div className="text-center py-10 text-stone-450">
                No quotations found matching search criteria.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-light-border text-[9px] font-black uppercase text-stone-450">
                    <th className="py-2.5">Quotation ID</th>
                    <th className="py-2.5">Requirement Details</th>
                    <th className="py-2.5">Client</th>
                    <th className="py-2.5">Quoted Amount</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border/40 text-stone-750 font-semibold">
                  {filteredQuotes.map(quote => (
                    <tr key={quote.id}>
                      <td className="py-3 font-bold text-stone-900">{quote.id}</td>
                      <td className="py-3">
                        <strong className="block text-stone-900">{quote.requirementTitle}</strong>
                        <span className="text-[10px] text-stone-450">{quote.category}</span>
                      </td>
                      <td className="py-3 text-stone-500">{quote.customerName}</td>
                      <td className="py-3 font-extrabold text-stone-900">{quote.amount}</td>
                      <td className="py-3">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          quote.status === 'Draft' ? 'bg-stone-50 border-stone-200 text-stone-700' : quote.status === 'Submitted' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-2 shrink-0">
                        {quote.status === 'Draft' ? (
                          <>
                            <button onClick={() => handleEdit(quote)} className="text-[9px] font-black uppercase text-brand-emerald hover:underline">
                              Edit
                            </button>
                            <button onClick={() => handleDeleteDraft(quote.id)} className="text-[9px] font-black uppercase text-rose-600 hover:underline">
                              Delete
                            </button>
                          </>
                        ) : (
                          <button onClick={() => handlePreview(quote)} className="text-[9px] font-black uppercase text-brand-emerald hover:underline">
                            View Proposal
                          </button>
                        )}
                        <button onClick={() => handleDuplicate(quote)} className="text-[9px] font-black uppercase text-stone-400 hover:underline">
                          Duplicate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}

      {/* 3. TAB CONTROLLER: EDITOR WORKSPACE */}
      {activeTab === 'EDITOR' && (
        <form onSubmit={handleSaveDraft} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8 bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-5 text-xs">
            <h3 className="text-sm font-black uppercase text-stone-900 border-b border-light-border/40 pb-2">
              {editingQuoteId ? `Edit Draft ${editingQuoteId}` : 'Create Proposal Quotation'}
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Requirement Target</label>
                <input
                  type="text"
                  value={reqTitle}
                  disabled
                  className="dbc-input bg-stone-100 text-stone-500 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Customer Client Name</label>
                <input
                  type="text"
                  value={clientName}
                  disabled
                  className="dbc-input bg-stone-100 text-stone-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Quoted Amount (INR)</label>
                <input
                  type="text"
                  value={quoteAmount}
                  onChange={e => setQuoteAmount(e.target.value)}
                  className="dbc-input font-extrabold"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Expected duration limits</label>
                <input
                  type="text"
                  value={quoteDuration}
                  onChange={e => setQuoteDuration(e.target.value)}
                  className="dbc-input"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Scope of Work details</label>
              <textarea
                value={quoteScope}
                onChange={e => setQuoteScope(e.target.value)}
                placeholder="List services, measurements coordination, and structural layouts checks..."
                className="dbc-input h-24 resize-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Exclusions (Out of scope)</label>
              <textarea
                value={quoteExclusions}
                onChange={e => setQuoteExclusions(e.target.value)}
                placeholder="List exclusions details (e.g. material bills, site transport fees)..."
                className="dbc-input h-24 resize-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Terms and Conditions</label>
              <textarea
                value={quoteTerms}
                onChange={e => setQuoteTerms(e.target.value)}
                className="dbc-input h-20 resize-none"
                required
              />
            </div>
          </div>

          {/* Sidebar shortcuts */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-3">
              <button
                type="submit"
                className="w-full dbc-btn dbc-btn-md dbc-btn-primary"
              >
                Save Draft
              </button>
              {editingQuoteId && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewQuoteId(editingQuoteId);
                    setActiveTab('PREVIEW');
                  }}
                  className="w-full dbc-btn dbc-btn-md dbc-btn-outline bg-white border border-stone-200 hover:bg-stone-50"
                >
                  Preview Proposal
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveTab('LIST');
                }}
                className="w-full dbc-btn dbc-btn-md dbc-btn-secondary text-stone-500"
              >
                Cancel Changes
              </button>
            </section>
          </div>

        </form>
      )}

      {/* 4. TAB CONTROLLER: PREVIEW PROPOSAL SCREEN */}
      {activeTab === 'PREVIEW' && previewQuote && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Proposal layout column */}
          <div className="lg:col-span-8 bg-white border border-stone-300 p-8 rounded-3xl shadow-apple-md space-y-6 font-serif">
            
            {/* Header info */}
            <div className="flex justify-between items-start border-b border-stone-200 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-brand-emerald tracking-wider font-sans">Business proposal quotation</span>
                <h2 className="text-lg font-black text-stone-900 mt-1">Apex Architecture & Build</h2>
                <p className="text-[9.5px] text-stone-450 font-sans">Hyderabad, India &bull; License: LIC-ARCH-2024-88</p>
              </div>
              <div className="text-right">
                <span className="bg-stone-100 px-2 py-0.5 text-[8.5px] font-black text-stone-600 rounded font-sans uppercase">
                  Quote Ref: {previewQuote.id}
                </span>
                <p className="text-[9.5px] text-stone-400 mt-1 font-sans">Last Update: {previewQuote.lastModified}</p>
              </div>
            </div>

            {/* Client summary */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl font-sans text-xs space-y-1">
              <span className="block text-[8px] font-black text-stone-400 uppercase tracking-wider">Client Recipient</span>
              <strong className="text-stone-900 block">{previewQuote.customerName}</strong>
              <span className="text-stone-500">Project Target: {previewQuote.requirementTitle}</span>
            </div>

            {/* Scope specifications */}
            <div className="space-y-2 text-xs font-sans">
              <span className="block text-[8px] font-black text-stone-400 uppercase tracking-widest">Scope of work services</span>
              <p className="text-stone-750 font-semibold leading-relaxed">{previewQuote.scope}</p>
            </div>

            {/* Exclusions */}
            <div className="space-y-2 text-xs font-sans pt-3 border-t border-light-border/40">
              <span className="block text-[8px] font-black text-stone-450 uppercase tracking-widest">Exclusions details</span>
              <p className="text-stone-700 font-semibold leading-relaxed">{previewQuote.exclusions}</p>
            </div>

            {/* Amount details */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-200 font-sans text-xs">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <span className="block text-[8px] font-black text-emerald-800 uppercase mb-0.5">Estimated Cost</span>
                <span className="text-lg font-extrabold text-brand-emerald">{previewQuote.amount}</span>
              </div>
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl">
                <span className="block text-[8px] font-black text-stone-400 uppercase mb-0.5">Expected Timeline Duration</span>
                <span className="text-lg font-bold text-stone-900">{previewQuote.duration}</span>
              </div>
            </div>

            {/* Terms and conditions */}
            <div className="space-y-2 text-[9.5px] font-sans pt-4 border-t border-stone-200">
              <span className="block text-[8px] font-black text-stone-450 uppercase tracking-widest">Terms & conditions compliance</span>
              <p className="text-stone-400 font-semibold leading-relaxed">{previewQuote.terms}</p>
            </div>

            {/* Signatures */}
            <div className="pt-6 flex justify-between items-end font-sans text-[10px]">
              <div>
                <span className="block border-t border-stone-200 pt-1 w-32 font-bold text-stone-450">John Anderson, Apex</span>
              </div>
              <div className="text-right">
                <span className="block border-t border-stone-200 pt-1 w-32 font-bold text-stone-450">Client Signature</span>
              </div>
            </div>

          </div>

          {/* Quick Actions sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-3">
              {previewQuote.status === 'Draft' ? (
                <button
                  type="button"
                  onClick={handleSubmitQuotation}
                  className="w-full dbc-btn dbc-btn-md dbc-btn-primary"
                >
                  Submit Proposal
                </button>
              ) : (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-center text-xs font-bold text-stone-550">
                  Proposal has been successfully submitted and is read-only.
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setPreviewQuoteId(null);
                  setActiveTab('LIST');
                }}
                className="w-full dbc-btn dbc-btn-md dbc-btn-outline bg-white border border-stone-200 hover:bg-stone-50"
              >
                Back to Quotations List
              </button>
            </section>
          </div>

        </div>
      )}

    </div>
  );
}

// ==========================================
// Loading Skeletons
// ==========================================
function SkeletonQuotation() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left animate-pulse">
      <div className="h-28 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, idx) => (
          <div key={idx} className="h-24 bg-white border border-light-border rounded-2xl p-4"></div>
        ))}
      </div>

      <div className="h-20 bg-white border border-light-border rounded-3xl p-4 shadow-apple-sm"></div>
      <div className="h-64 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
    </div>
  );
}
