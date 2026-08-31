import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import { WelcomeCard } from '../../components/workspace/WelcomeCard';
import { QuickActionCard } from '../../components/workspace/QuickActionCard';
import { StatCard } from '../../components/workspace/StatCard';
import { ActivityTimeline } from '../../components/workspace/ActivityTimeline';
import { SectionHeader } from '../../components/workspace/SectionHeader';
import { bookingApi } from '../../services/booking/bookingService';
import { subscriptionApi } from '../../services/subscription/subscriptionService';
import type { UserSubscription } from '../../types/subscription/subscriptionTypes';
import { PaymentCheckoutModal } from '../../components/workspace/payments/PaymentCheckoutModal';

// Custom tab type for Customer Dashboard subsections
type DashboardTab = 'dashboard' | 'projects' | 'documents' | 'payments' | 'activity';

const MOCK_ACTIVITIES = [
  {
    id: 'act-1',
    title: 'Milestone Completed',
    description: 'Foundation concrete laying completed and approved by coordinator.',
    time: 'Today at 2:00 PM',
    icon: '🏗️',
  },
  {
    id: 'act-2',
    title: 'Blueprint Uploaded',
    description: 'Alice Architect uploaded "Electrical Layout Plan v1.2" file.',
    time: 'Yesterday',
    icon: '📋',
  },
  {
    id: 'act-3',
    title: 'Booking Confirmed',
    description: 'Direct consultation booking confirmed with Alice Architect (Pro Partner).',
    time: '2 Days Ago',
    icon: '📅',
  },
  {
    id: 'act-4',
    title: 'Payment Processed',
    description: 'Released ₹15,000 for "Structural drafting approval" milestone.',
    time: 'Last Week',
    icon: '💳',
  },
];



const MOCK_PROJECTS = [
  {
    id: 'proj-1',
    name: 'Greenhills Villa Construction',
    type: 'Villa Project',
    location: 'Banjara Hills, Hyderabad',
    progress: 60,
    stage: 'Superstructure Brickwork',
    budget: '₹35L Spent / ₹50L Budget',
    timeline: 'Jan 2026 - Dec 2026',
    health: 'Healthy',
    img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    pros: ['Alice Architect (Designer)', 'Bob Builder (Plumber)'],
  },
];

const MOCK_DOCUMENTS = [
  { id: 'doc-1', name: 'Architectural Ground Plan.pdf', category: 'Blueprints', size: '4.2 MB', date: 'Yesterday', version: 'v1.2' },
  { id: 'doc-2', name: 'Builder Contract signed.pdf', category: 'Contracts', size: '2.1 MB', date: 'Last Week', version: 'v1.0' },
  { id: 'doc-3', name: 'Milestone 1 invoice.pdf', category: 'Invoices', size: '340 KB', date: '3 Days Ago', version: 'v1.0' },
];

const MOCK_PAYMENTS = [
  { id: 'pay-1', invoiceId: 'INV-2026-003', milestone: 'Plumbing piping completed', amount: 25000, status: 'Pending', date: 'Due 05 Aug 2026' },
  { id: 'pay-2', invoiceId: 'INV-2026-001', milestone: 'Structural drafting approval', amount: 15000, status: 'Paid', date: 'Paid 24 Jul 2026' },
];

export default function WorkspaceOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard');
  const [selectedDocCategory, setSelectedDocCategory] = useState('ALL');

  // Interactive Payment states
  const [payments, setPayments] = useState(MOCK_PAYMENTS);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPayItem, setSelectedPayItem] = useState<(typeof MOCK_PAYMENTS)[0] | null>(null);

  const handlePaymentSuccess = () => {
    if (selectedPayItem) {
      setPayments(prev =>
        prev.map(p => (p.id === selectedPayItem.id ? { ...p, status: 'Paid', date: `Paid ${new Date().toLocaleDateString('en-IN')}` } : p))
      );
    }
  };

  const [requirements, setRequirements] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [activeSub, setActiveSub] = useState<UserSubscription | null>(null);

  useEffect(() => {
    // 1. Load Requirements
    const rawReq = localStorage.getItem('dbc_customer_requirements');
    if (rawReq) {
      try {
        setRequirements(JSON.parse(rawReq));
      } catch {
        setRequirements([]);
      }
    }

    // 2. Load Bookings
    async function loadBookings() {
      try {
        const list = await bookingApi.getMyBookings();
        setBookings(list || []);
      } catch (err) {
        console.error('Failed to load dashboard bookings:', err);
      }
    }

    // 3. Load Subscription
    async function loadSubscription() {
      try {
        const sub = await subscriptionApi.getMySubscription();
        setActiveSub(sub);
      } catch (err) {
        console.error('Failed to load dashboard subscription:', err);
      }
    }

    loadBookings();
    loadSubscription();
  }, []);

  const handleAction = (route: string) => {
    navigate(`/workspace/${route}`);
  };

  const getUserName = () => {
    if (!user) return 'Client';
    return user.firstName || user.email.split('@')[0];
  };

  // Filter docs
  const filteredDocs = selectedDocCategory === 'ALL'
    ? MOCK_DOCUMENTS
    : MOCK_DOCUMENTS.filter((d) => d.category.toUpperCase() === selectedDocCategory);

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left relative animate-gentle-fade">
      
      {/* 1. Sub-Tab Selector Navigation */}
      <div className="flex border-b border-light-border p-1 bg-white rounded-2xl shadow-apple-sm max-w-lg">
        {([
          { id: 'dashboard', label: 'Dashboard', icon: '📊' },
          { id: 'projects', label: 'Projects', icon: '🏗️' },
          { id: 'documents', label: 'Documents', icon: '📁' },
          { id: 'payments', label: 'Payments', icon: '💳' },
          { id: 'activity', label: 'Timeline', icon: '🕒' },
        ] as const).map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 text-center py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition cursor-pointer select-none
                ${isActive ? 'bg-light-stone text-stone-black shadow-xs font-extrabold' : 'text-stone-gray'}
              `}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline ml-1">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* RENDER VIEW: OVERVIEW DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Welcome Card Banner */}
          <WelcomeCard
            name={getUserName()}
            completionPercentage={80}
            onCompleteProfile={() => handleAction('settings')}
          />

          {/* ACTION CENTER */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-stone-400">Action Required</h3>
            {payments.filter(p => p.status === 'Pending').length > 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
                <div className="flex items-start sm:items-center gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide">Milestone Payment Pending</h4>
                    <p className="text-[10.5px] text-amber-700 font-semibold mt-0.5">
                      Release funds for "{payments.find(p => p.status === 'Pending')?.milestone}" to proceed with structural work.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const item = payments.find(p => p.status === 'Pending');
                    if (item) {
                      setSelectedPayItem(item);
                      setIsPayModalOpen(true);
                    }
                  }}
                  className="dbc-btn dbc-btn-md dbc-btn-primary bg-amber-800 hover:bg-amber-900 text-white border-none"
                >
                  Release Funds
                </button>
              </div>
            ) : (
              <div className="bg-stone-50 border border-stone-200/50 rounded-2xl p-4 text-left text-xs font-semibold text-stone-500 flex items-center gap-2">
                <span className="text-emerald-700 font-extrabold text-sm">✓</span>
                <span>You're all caught up. No pending actions require your attention.</span>
              </div>
            )}
          </div>

          {/* ONBOARDING STATE FOR NEW CUSTOMERS */}
          {bookings.length === 0 && requirements.length === 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-5 shadow-sm max-w-2xl mx-auto my-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-inner border border-emerald-100">
                🏗️
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-base font-black text-stone-900 font-serif">Start Your First Project</h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                  Find a construction or design professional, share your project requirements, receive custom quotations, and manage milestones end-to-end.
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => navigate('/')}
                  className="dbc-btn dbc-btn-lg dbc-btn-primary"
                >
                  Find a Professional
                </button>
                <button
                  onClick={() => navigate('/workspace/requirements')}
                  className="dbc-btn dbc-btn-lg dbc-btn-secondary"
                >
                  Post Requirements
                </button>
              </div>
            </div>
          )}

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              title="Create Requirement"
              description="Post your project scope"
              icon="➕"
              onClick={() => handleAction('requirements')}
            />
            <QuickActionCard
              title="View Requests"
              description="Track project requests"
              icon="📋"
              onClick={() => handleAction('bookings')}
            />
            <QuickActionCard
              title="Message Professional"
              description="Coordinate via active chats"
              icon="💬"
              onClick={() => navigate('/workspace/inbox')}
            />
            <QuickActionCard
              title={activeSub && activeSub.status === 'ACTIVE' ? "Premium Active" : "View Subscription"}
              description={activeSub && activeSub.status === 'ACTIVE' ? "Manage Active Benefits" : "Explore Premium Pass"}
              icon="💎"
              onClick={() => navigate('/subscriptions')}
            />
          </div>

          {/* Stats Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Active Projects" value={MOCK_PROJECTS.length} icon="🏗️" label="In progress" />
            <StatCard title="Open Bids" value={requirements.length} icon="📋" label="Bidding active" />
            <StatCard title="Pending Payments" value={payments.filter(p => p.status === 'Pending').length} icon="💳" label="Action required" />
            <StatCard title="Blueprints File" value={MOCK_DOCUMENTS.length} icon="📁" label="Uploaded docs" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side: Recent Requirements & Bookings list */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Recent Requirements summary list */}
              <div className="space-y-3">
                <SectionHeader
                  title="Open Requirements"
                  subtitle="Custom project bids and contractor proposals"
                  actionLabel="Manage Requirements"
                  onAction={() => handleAction('requirements')}
                />
                
                {requirements.length === 0 ? (
                  <div className="dbc-card text-center p-8 space-y-4 border border-dashed border-stone-300">
                    <span className="text-3xl block">📋</span>
                    <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider">No Requirements Found</h4>
                    <p className="text-[10px] text-stone-500 font-semibold max-w-sm mx-auto leading-relaxed">
                      Post your project specifications to receive bids from verified architects, vastu consultants, and contractors.
                    </p>
                    <button
                      onClick={() => navigate('/workspace/requirements')}
                      className="dbc-btn dbc-btn-md dbc-btn-primary"
                    >
                      Create Requirement
                    </button>
                  </div>
                ) : (
                  requirements.map((req) => (
                    <div key={req.id} className="dbc-card text-left space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-black text-stone-black">{req.title}</h4>
                          <span className="inline-block text-[8px] font-black uppercase bg-light-stone text-stone-gray px-2 py-0.5 rounded border border-light-border mt-1">
                            {req.category}
                          </span>
                        </div>
                        <span className="dbc-badge dbc-badge-progress">{req.status}</span>
                      </div>
                      <p className="text-[10px] text-stone-gray leading-relaxed font-semibold">{req.description}</p>
                      <div className="border-t border-light-border/40 pt-2 flex justify-between items-center text-[9px] font-bold text-stone-gray uppercase">
                        <span>Target Budget: ₹{(req.budgetMin || 0).toLocaleString()} - ₹{(req.budgetMax || 0).toLocaleString()}</span>
                        <button onClick={() => handleAction('requirements')} className="text-brand-emerald font-black hover:underline cursor-pointer focus:outline-none">Manage Proposals →</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>

            {/* Right side: Summary Activity logs */}
            <div className="dbc-card space-y-4 h-fit">
              <SectionHeader title="Recent Activity" subtitle="Updates regarding your layout blueprints and requests" />
              <ActivityTimeline activities={MOCK_ACTIVITIES.slice(0, 3)} />
            </div>
          </div>
        </div>
      )}

      {/* RENDER VIEW: ACTIVE PROJECTS */}
      {activeTab === 'projects' && (
        <div className="space-y-5">
          <SectionHeader title="Active Projects" subtitle="Track progress, health status, and assigned specialists." />
          
          <div className="grid gap-6 sm:grid-cols-2">
            {MOCK_PROJECTS.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="dbc-card overflow-hidden flex flex-col justify-between p-0 border border-light-border cursor-pointer transition hover:shadow-md"
              >
                <div className="h-44 relative bg-light-stone">
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                  <div className="absolute bottom-3 left-3 bg-stone-900/80 backdrop-blur-sm text-white text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-stone-850">
                    📍 {p.location}
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-stone-black">{p.name}</h4>
                      <span className="block text-[8px] text-stone-gray font-black uppercase tracking-wider mt-0.5">Stage: {p.stage}</span>
                    </div>
                    <span className="dbc-badge dbc-badge-verified">💚 {p.health}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[8px] font-black uppercase text-stone-gray">
                      <span>Completion</span>
                      <span>{p.progress}%</span>
                    </div>
                    <div className="dbc-progress-bar">
                      <div className="dbc-progress-fill" style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>

                  {/* Summary list */}
                  <div className="text-[10px] text-stone-gray font-semibold space-y-1 pt-2 border-t border-light-border/40">
                    <p className="flex justify-between"><span>Timeline:</span> <strong className="text-stone-black">{p.timeline}</strong></p>
                    <p className="flex justify-between"><span>Cost Status:</span> <strong className="text-stone-black">{p.budget}</strong></p>
                    <p className="flex justify-between"><span>Team assigned:</span> <strong className="text-stone-black">{p.pros.join(', ')}</strong></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RENDER VIEW: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <SectionHeader title="Project Documents" subtitle="Centralized blueprints, contracts, and invoices." />
            
            <button
              onClick={() => alert('Mock document upload interface active. Ready to store CAD blueprints.')}
              className="dbc-btn dbc-btn-md dbc-btn-primary"
            >
              Upload Document +
            </button>
          </div>

          {/* Category Filter list */}
          <div className="flex flex-wrap gap-2 pt-2 text-[9px] font-black uppercase tracking-wider">
            {['ALL', 'BLUEPRINTS', 'CONTRACTS', 'INVOICES'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedDocCategory(cat)}
                className={`px-3 py-1.5 rounded-full border transition cursor-pointer
                  ${selectedDocCategory === cat 
                    ? 'bg-stone-black text-white border-stone-black' 
                    : 'bg-white text-stone-gray border-light-border hover:bg-light-stone'
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="dbc-table-container mt-4">
            <table className="dbc-table" aria-label="Documents listing">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Version</th>
                  <th>Size</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => (
                  <tr key={doc.id}>
                    <td className="font-semibold text-stone-black">📄 {doc.name}</td>
                    <td>
                      <span className="dbc-badge dbc-badge-verified text-[7.5px] py-0.5">
                        {doc.category}
                      </span>
                    </td>
                    <td>{doc.version}</td>
                    <td>{doc.size}</td>
                    <td>{doc.date}</td>
                    <td className="text-right">
                      <button
                        onClick={() => alert(`Downloading ${doc.name} (simulated link)...`)}
                        className="text-brand-emerald font-black hover:underline cursor-pointer focus:outline-none"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER VIEW: PAYMENTS */}
      {activeTab === 'payments' && (
        <div className="space-y-5">
          <SectionHeader title="Payments & Billings" subtitle="Verify milestone invoices, payment receipts, and histories." />
          
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="dbc-card text-center p-5">
              <span className="text-[8px] font-black uppercase text-stone-gray tracking-wider">Total Contract Budget</span>
              <h3 className="text-base font-extrabold text-stone-black mt-1">₹50,00,000</h3>
            </div>
            <div className="dbc-card text-center p-5">
              <span className="text-[8px] font-black uppercase text-stone-gray tracking-wider">Paid Amount</span>
              <h3 className="text-base font-extrabold text-brand-emerald mt-1">
                ₹{payments.filter(p => p.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
              </h3>
            </div>
            <div className="dbc-card text-center p-5">
              <span className="text-[8px] font-black uppercase text-stone-gray tracking-wider">Pending Release</span>
              <h3 className="text-base font-extrabold text-amber-700 mt-1">
                ₹{payments.filter(p => p.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
              </h3>
            </div>
          </div>

          <div className="dbc-table-container">
            <table className="dbc-table" aria-label="Payments listing">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Milestone Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date/Due</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((pay) => (
                  <tr key={pay.id}>
                    <td className="font-semibold text-stone-black">{pay.invoiceId}</td>
                    <td>{pay.milestone}</td>
                    <td className="font-extrabold text-stone-black">₹{pay.amount.toLocaleString()}</td>
                    <td>
                      <span className={`dbc-badge text-[7.5px] py-0.5 ${
                        pay.status === 'Paid' ? 'dbc-badge-completed' : 'dbc-badge-progress'
                      }`}>
                        {pay.status}
                      </span>
                    </td>
                    <td>{pay.date}</td>
                    <td className="text-right">
                      {pay.status === 'Pending' ? (
                        <button
                          onClick={() => {
                            setSelectedPayItem(pay);
                            setIsPayModalOpen(true);
                          }}
                          className="dbc-btn dbc-btn-sm dbc-btn-primary"
                        >
                          Release Funds
                        </button>
                      ) : (
                        <button
                          onClick={() => alert('Downloading milestone receipt PDF...')}
                          className="text-stone-gray font-black hover:underline cursor-pointer focus:outline-none"
                        >
                          Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER VIEW: ACTIVITY TIMELINE */}
      {activeTab === 'activity' && (
        <div className="dbc-card space-y-4 max-w-2xl mx-auto">
          <SectionHeader title="Chronological Activity History" subtitle="DBC system and coordinator event logs." />
          <ActivityTimeline activities={MOCK_ACTIVITIES} />
        </div>
      )}

      {selectedPayItem && (
        <PaymentCheckoutModal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          onSuccess={handlePaymentSuccess}
          amount={selectedPayItem.amount}
          milestoneName={selectedPayItem.milestone}
        />
      )}

    </div>
  );
}
