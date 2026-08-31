import { useState, useMemo, useEffect } from 'react';

// ==========================================
// Types & Interfaces
// ==========================================
interface Transaction {
  id: string;
  customerName: string;
  consultationType: string;
  date: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Draft';
  invoiceId: string;
  paymentMethod?: string;
}

export default function ConsultantFinancePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsView, setAnalyticsView] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>('Monthly');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Transactions database
  const [transactions] = useState<Transaction[]>([
    { id: 'TX-101', customerName: 'Ramesh Kumar', consultationType: 'Villa Vastu Layout Audit', date: '2026-08-01', amount: '₹45,000', status: 'Paid', invoiceId: 'INV-5501', paymentMethod: 'NetBanking' },
    { id: 'TX-102', customerName: 'Sita Sharma', consultationType: 'Kitchen Modular Optimizations', date: '2026-07-28', amount: '₹22,000', status: 'Paid', invoiceId: 'INV-5502', paymentMethod: 'UPI' },
    { id: 'TX-103', customerName: 'Vikram Singh', consultationType: 'Commercial Space Permit Check', date: '2026-07-30', amount: '₹40,000', status: 'Pending', invoiceId: 'INV-5503', paymentMethod: 'Credit Card' },
    { id: 'TX-104', customerName: 'Priya Nair', consultationType: 'Solar Slab Load Review', date: '2026-08-05', amount: '₹35,000', status: 'Draft', invoiceId: 'INV-5504' },
    { id: 'TX-105', customerName: 'Vijay Kulkarni', consultationType: 'Ceiling Moisture Drainage check', date: '2026-07-25', amount: '₹12,000', status: 'Overdue', invoiceId: 'INV-5505' }
  ]);

  // Settlement history
  const settlements = [
    { id: 'SET-901', date: '30-Jul-2026', amount: '₹67,000', status: 'Completed' },
    { id: 'SET-902', date: '15-Jul-2026', amount: '₹88,000', status: 'Completed' }
  ];

  // Simulated Startup loader
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    return {
      totalEarnings: '₹1,55,000',
      monthRevenue: '₹67,000',
      pendingPayments: '₹40,000',
      completedPayments: '₹1,15,000',
      avgValue: '₹31,000',
      projectedRevenue: '₹95,000'
    };
  }, []);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || t.customerName.toLowerCase().includes(q) || t.consultationType.toLowerCase().includes(q) || t.id.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [transactions, searchQuery, statusFilter]);

  const handleSendReminder = (id: string) => {
    alert(`Payment reminder notification sent for transaction ${id}.`);
  };

  if (isLoading) {
    return <SkeletonFinance />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 text-left animate-gentle-fade select-none">
      
      {/* 1. Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm relative">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider"> Escrow and Billings </span>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight font-serif">Financial Overview</h1>
          <p className="text-xs text-stone-500 font-medium">Monitor consultation earnings, generate invoices, track settlements, and review revenue trends.</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => alert('Exporting monthly statement ledger to CSV.')}
            className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
          >
            Export Statement
          </button>
          <button
            onClick={() => alert('Downloading tax summary report.')}
            className="dbc-btn dbc-btn-md dbc-btn-primary"
          >
            Download Summary
          </button>
        </div>
      </header>

      {/* 2. KPI Summary Cards Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Earnings', value: stats.totalEarnings, trend: '+12%', icon: '💳', color: 'bg-emerald-50 text-emerald-800' },
          { label: 'Current Month', value: stats.monthRevenue, trend: '+8%', icon: '📈', color: 'bg-blue-50 text-blue-800' },
          { label: 'Pending Payouts', value: stats.pendingPayments, trend: 'Awaiting', icon: '⏳', color: 'bg-amber-50 text-amber-800' },
          { label: 'Completed', value: stats.completedPayments, trend: 'Settled', icon: '✅', color: 'bg-indigo-50 text-indigo-800' },
          { label: 'Avg Sess Value', value: stats.avgValue, trend: 'Stable', icon: '💎', color: 'bg-stone-100 text-stone-900' },
          { label: 'Projected Monthly', value: stats.projectedRevenue, trend: 'Estimated', icon: '🔮', color: 'bg-purple-50 text-purple-800' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-light-border p-4 rounded-2xl shadow-apple-xs hover:shadow-apple-sm transition flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className={`text-base p-2 rounded-xl w-fit ${stat.color}`}>{stat.icon}</span>
              <span className="text-[8.5px] font-black text-stone-400 uppercase">{stat.trend}</span>
            </div>
            <div className="mt-4 space-y-0.5">
              <span className="block text-xl font-black text-stone-900">{stat.value}</span>
              <span className="block text-[9.5px] font-bold text-stone-450 uppercase tracking-wider">{stat.label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Grid: Analytics vs Sidebar info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Chart and Transactions (Col span 8) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Revenue Analytics chart placeholder */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-light-border/40">
              <div>
                <h3 className="text-xs font-black uppercase text-stone-900">Revenue Analytics</h3>
                <p className="text-[10px] text-stone-400 font-medium">Cash flow trend timelines</p>
              </div>
              <div className="flex gap-1 border border-stone-200 p-1 bg-stone-50 rounded-xl text-[8.5px] font-black uppercase tracking-wider">
                {['Daily', 'Weekly', 'Monthly', 'Yearly'].map(view => (
                  <button
                    key={view}
                    onClick={() => setAnalyticsView(view as 'Daily' | 'Weekly' | 'Monthly' | 'Yearly')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      analyticsView === view ? 'bg-stone-black text-white' : 'text-stone-500'
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated bar chart */}
            <div className="p-4 bg-stone-50/50 rounded-2xl border border-stone-200">
              <div className="flex justify-between items-end h-36 gap-4">
                {[15, 22, 18, 30, 45, 28].map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-brand-emerald rounded-t-md transition-all duration-300" style={{ height: `${val * 2.2}px` }} />
                    <span className="text-[8px] text-stone-500 font-bold">₹{val}K</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[8px] text-stone-400 font-black uppercase tracking-wider mt-4 pt-2 border-t border-light-border/40">
                <span>March 26</span>
                <span>April 26</span>
                <span>May 26</span>
                <span>June 26</span>
                <span>July 26</span>
                <span>Aug 26 (Current)</span>
              </div>
            </div>
          </section>

          {/* Transactions Ledger */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xs font-black uppercase text-stone-900">Consultation Earnings Ledger</h3>
                <p className="text-[10px] text-stone-400">Statement breakdown log details</p>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search customer, invoice ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="dbc-input text-xs py-1 px-3"
                />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="dbc-input bg-white text-xs py-1 px-3 w-auto"
                >
                  <option value="ALL">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-light-border text-[9px] font-black uppercase text-stone-400">
                    <th className="py-2.5">Transaction Info</th>
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Invoice Ref</th>
                    <th className="py-2.5">Fee</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border/40 text-stone-750 font-semibold">
                  {filteredTransactions.map(tx => (
                    <tr key={tx.id}>
                      <td className="py-3">
                        <strong className="block text-stone-900">{tx.customerName}</strong>
                        <span className="text-[10px] text-stone-450">{tx.consultationType}</span>
                      </td>
                      <td className="py-3 text-stone-500">{tx.date}</td>
                      <td className="py-3 text-stone-500">{tx.invoiceId}</td>
                      <td className="py-3 font-bold text-stone-900">{tx.amount}</td>
                      <td className="py-3">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          tx.status === 'Paid' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : tx.status === 'Overdue' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {tx.status === 'Overdue' ? (
                          <button
                            onClick={() => handleSendReminder(tx.id)}
                            className="text-[9px] font-black uppercase text-rose-600 hover:underline"
                          >
                            Send Reminder
                          </button>
                        ) : (
                          <button
                            onClick={() => alert(`Opening Invoice detail: ${tx.invoiceId}`)}
                            className="text-[9px] font-black uppercase text-brand-emerald hover:underline"
                          >
                            View Invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>

        {/* Right Column: Invoices, Settlement Payouts & Assistant (Col span 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Smart Assistant panel placeholder */}
          <section className="bg-gradient-to-br from-stone-950 to-stone-900 border border-stone-850 p-6 rounded-3xl shadow-apple-sm text-white space-y-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <div className="space-y-0.5">
              <span className="text-[8.5px] font-black uppercase text-emerald-400 tracking-wider">Financial Assistant</span>
              <h3 className="text-xs font-black">AI Revenue insights</h3>
            </div>
            <ul className="space-y-2 text-[10px] text-stone-300 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✦</span>
                <span>Net earnings are up 12% compared to June averages.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✦</span>
                <span>One invoice (Vijay Kulkarni) is overdue.</span>
              </li>
            </ul>
          </section>

          {/* Payout Settlement details */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div>
              <h2 className="text-sm font-black text-stone-900">Payout Settlements</h2>
              <p className="text-[11px] text-stone-450 font-medium">Escrow deposits withdrawal logs</p>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2.5">
              <span className="dbc-badge dbc-badge-completed text-[7.5px] py-0.5">Available for Payout</span>
              <h4 className="text-2xl font-extrabold text-brand-emerald">₹34,000</h4>
              <button
                onClick={() => {
                  alert('Withdrawal request submitted. Expected settlement to linked bank in 24 hours.');
                }}
                className="w-full dbc-btn dbc-btn-md dbc-btn-primary"
              >
                Withdraw Funds
              </button>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-light-border/40">
              <span className="block text-[8px] font-black uppercase text-stone-450 tracking-wider">Settlement History</span>
              {settlements.map(set => (
                <div key={set.id} className="flex justify-between items-center text-xs p-2 bg-stone-50 border border-stone-100 rounded-xl font-semibold">
                  <span className="text-stone-750">🗓️ {set.date} &bull; {set.id}</span>
                  <span className="text-stone-900 font-bold">{set.amount}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Financial Insights */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-3">
            <h2 className="text-sm font-black text-stone-900">Financial Insights</h2>
            <div className="space-y-2 text-xs font-semibold text-stone-600">
              <p className="flex justify-between border-b border-light-border/40 pb-1.5">
                <span>Top profitable category:</span> <strong className="text-stone-900">Vastu Audits</strong>
              </p>
              <p className="flex justify-between border-b border-light-border/40 pb-1.5">
                <span>Highest earning month:</span> <strong className="text-stone-900">July 2026</strong>
              </p>
              <p className="flex justify-between">
                <span>Top client segment:</span> <strong className="text-stone-900">Villa projects</strong>
              </p>
            </div>
          </section>

        </div>

      </div>

    </div>
  );
}

// ==========================================
// Loading Skeletons
// ==========================================
function SkeletonFinance() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left animate-pulse">
      <div className="h-28 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, idx) => (
          <div key={idx} className="h-24 bg-white border border-light-border rounded-2xl p-4"></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 h-96 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
        <div className="lg:col-span-4 h-96 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
      </div>
    </div>
  );
}
