import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoutButton } from '../../components/auth/LogoutButton';
import { BrandLogo } from '../../components/common/BrandLogo';
import ConsultantFinancePage from '../workspace/consultant/ConsultantFinancePage';
import { PaymentCheckoutModal } from '../../components/workspace/payments/PaymentCheckoutModal';

type FinanceTab = 'dashboard' | 'estimates' | 'invoices' | 'expenses' | 'refunds';

interface EstimateItem {
  id: string;
  name: string;
  client: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Expired';
  date: string;
}

interface InvoiceRecord {
  id: string;
  ref: string;
  client: string;
  milestone: string;
  amount: number;
  status: 'Paid' | 'Partial' | 'Overdue' | 'Sent' | 'Draft';
  dueDate: string;
}

interface ExpenseRecord {
  id: string;
  category: 'Materials' | 'Labor' | 'Equipment' | 'Travel' | 'Miscellaneous';
  amount: number;
  notes: string;
  date: string;
  status: 'Approved' | 'Pending';
}

interface RefundRequest {
  id: string;
  client: string;
  project: string;
  amount: number;
  reason: string;
  status: 'Requested' | 'Processing' | 'Completed' | 'Rejected';
}

const INITIAL_ESTIMATES: EstimateItem[] = [
  { id: 'est-1', name: 'Ground Foundation & Frame excavation', client: 'Alice Architect', amount: 350000, status: 'Accepted', date: '12 Jul 2026' },
  { id: 'est-2', name: 'Internal bricklaying & MEP conduiting', client: 'Alice Architect', amount: 180000, status: 'Sent', date: '28 Jul 2026' },
];

const INITIAL_INVOICES: InvoiceRecord[] = [
  { id: 'inv-301', ref: 'INV-2026-88', client: 'Alice Architect', milestone: 'Foundation Laying', amount: 120000, status: 'Paid', dueDate: '30 Jul 2026' },
  { id: 'inv-302', ref: 'INV-2026-89', client: 'Alice Architect', milestone: 'Framing Beams Alignment', amount: 85000, status: 'Sent', dueDate: '15 Aug 2026' },
];

const INITIAL_EXPENSES: ExpenseRecord[] = [
  { id: 'exp-501', category: 'Materials', amount: 42000, notes: '50 bags ACC Cement, 4 tons Sand', date: '29 Jul 2026', status: 'Approved' },
  { id: 'exp-502', category: 'Labor', amount: 18000, notes: 'Framing specialists wage daily payout', date: '30 Jul 2026', status: 'Approved' },
];

const INITIAL_REFUNDS: RefundRequest[] = [
  { id: 'ref-901', client: 'Alice Architect', project: 'Green Hills Renovation', amount: 25000, reason: 'Tile batch variation color mismatch correction adjustment', status: 'Processing' },
];

export function FinanceBillingPage() {
  const [workspaceView, setWorkspaceView] = useState<'PRO' | 'CONSULTANT'>(() => {
    return (localStorage.getItem('dbc_provider_view') as 'PRO' | 'CONSULTANT') || 'PRO';
  });

  useEffect(() => {
    const handleStorage = () => {
      setWorkspaceView((localStorage.getItem('dbc_provider_view') as 'PRO' | 'CONSULTANT') || 'PRO');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FinanceTab>('dashboard');

  // Interactive ledgers
  const [estimates, setEstimates] = useState<EstimateItem[]>(INITIAL_ESTIMATES);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(INITIAL_INVOICES);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(INITIAL_EXPENSES);
  const [refunds, setRefunds] = useState<RefundRequest[]>(INITIAL_REFUNDS);

  // Interactive Payment modal states
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);

  // Estimate composer variables
  const [estName, setEstName] = useState('');
  const estClient = 'Alice Architect';
  const [estMaterials, setEstMaterials] = useState('');
  const [estLabor, setEstLabor] = useState('');
  const [estEquipment, setEstEquipment] = useState('');

  // Invoice generator variables
  const [invRef, setInvRef] = useState('');
  const invClient = 'Alice Architect';
  const [invMilestone, setInvMilestone] = useState('');
  const [invAmount, setInvAmount] = useState('');

  // Expense logger variables
  const [expCategory, setExpCategory] = useState<'Materials' | 'Labor' | 'Equipment' | 'Travel' | 'Miscellaneous'>('Materials');
  const [expAmount, setExpAmount] = useState('');
  const [expNotes, setExpNotes] = useState('');

  // Refund request variables
  const [refAmount, setRefAmount] = useState('');
  const [refReason, setRefReason] = useState('');

  // Session context checks
  const token = localStorage.getItem('token') || globalThis.__accessToken;
  let currentUserRole = 'CUSTOMER';
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserRole = payload.role === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER';
    } catch (e) {
      console.error(e);
    }
  }

  // Add new Estimate
  const handleCreateEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!estName.trim()) return;

    const materials = Number(estMaterials) || 0;
    const labor = Number(estLabor) || 0;
    const equipment = Number(estEquipment) || 0;
    const totalAmount = materials + labor + equipment;

    const newEst: EstimateItem = {
      id: `est-${Date.now()}`,
      name: estName.trim(),
      client: estClient,
      amount: totalAmount,
      status: 'Draft',
      date: new Date().toLocaleDateString('en-IN'),
    };

    setEstimates([...estimates, newEst]);
    setEstName('');
    setEstMaterials('');
    setEstLabor('');
    setEstEquipment('');
    alert(`Estimate draft created for ${totalAmount.toLocaleString()} INR.`);
  };

  // Add new Invoice
  const handleGenerateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invRef.trim() || !invAmount.trim()) return;

    const newInv: InvoiceRecord = {
      id: `inv-${Date.now()}`,
      ref: invRef.trim(),
      client: invClient,
      milestone: invMilestone.trim() || 'General Milestone',
      amount: Number(invAmount) || 0,
      status: 'Draft',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
    };

    setInvoices([...invoices, newInv]);
    setInvRef('');
    setInvMilestone('');
    setInvAmount('');
    alert('Invoice generated and stored as Draft.');
  };

  // Add new Expense
  const handleRecordExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount.trim()) return;

    const newExp: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      category: expCategory,
      amount: Number(expAmount) || 0,
      notes: expNotes.trim() || 'General Expense',
      date: new Date().toLocaleDateString('en-IN'),
      status: 'Pending',
    };

    setExpenses([newExp, ...expenses]);
    setExpAmount('');
    setExpNotes('');
    alert('Expense recorded and submitted for approval.');
  };

  // Submit Refund Request
  const handleRequestRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refAmount.trim() || !refReason.trim()) return;

    const newRef: RefundRequest = {
      id: `ref-${Date.now()}`,
      client: 'Alice Architect',
      project: 'Green Hills Renovation',
      amount: Number(refAmount) || 0,
      reason: refReason.trim(),
      status: 'Requested',
    };

    setRefunds([newRef, ...refunds]);
    setRefAmount('');
    setRefReason('');
    alert('Refund request submitted for verification.');
  };

  // Resolve invoice state override
  const handlePayInvoice = (inv: InvoiceRecord) => {
    setSelectedInvoice(inv);
    setIsPayModalOpen(true);
  };

  const handlePaySuccess = () => {
    if (selectedInvoice) {
      setInvoices(prev =>
        prev.map(inv => (inv.id === selectedInvoice.id ? { ...inv, status: 'Paid' } : inv))
      );
    }
  };

  if (currentUserRole === 'PROVIDER' && workspaceView === 'CONSULTANT') {
    return <ConsultantFinancePage />;
  }

  return (
    <div className="min-h-screen bg-warm-cream text-stone-900 font-sans flex flex-col pb-10">
      
      {/* 1. Header Navigation Shell */}
      <header className="sticky top-0 z-30 border-b border-light-border bg-white shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo variant="header" />
            <span className="rounded bg-stone-900 px-2.5 py-0.5 text-[8.5px] font-black text-white uppercase tracking-wider">
              Finance Desk
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-xs font-bold text-stone-600 hover:text-stone-900 transition bg-light-stone/30 px-3 py-1.5 rounded-xl border border-light-border"
            >
              Exit Workspace
            </button>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* 2. Sub-Tab Switcher Row */}
      <main className="mx-auto max-w-6xl w-full px-4 py-8 sm:px-6 space-y-6 flex-1 text-left">
        
        <section className="flex gap-2 border-b border-stone-200 overflow-x-auto pb-1 text-[9.5px] font-black uppercase tracking-wider no-scrollbar">
          {([
            { id: 'dashboard', label: 'Finance Dashboard', icon: '💳' },
            { id: 'estimates', label: 'Estimate & Quotes', icon: '📋' },
            { id: 'invoices', label: 'Invoice Ledger', icon: '📄' },
            { id: 'expenses', label: 'Expenses Manager', icon: '💰' },
            { id: 'refunds', label: 'Refunds & Wallet', icon: '⚖️' },
          ] as const).map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2.5 border-b-2 font-bold transition whitespace-nowrap cursor-pointer select-none
                  ${isActive 
                    ? 'border-emerald-600 text-emerald-800 font-extrabold' 
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                  }
                `}
              >
                <span>{t.icon}</span>
                <span className="ml-1.5">{t.label}</span>
              </button>
            );
          })}
        </section>

        {/* 3. Tab Contents Layout */}

        {/* FINANCE DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Quick Metrics */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="dbc-card p-5">
                <span className="text-[8.5px] font-black uppercase tracking-wider text-stone-gray">Total Billings</span>
                <h4 className="text-xl font-extrabold text-stone-black mt-1">₹4,20,000</h4>
              </div>
              <div className="dbc-card p-5">
                <span className="text-[8.5px] font-black uppercase tracking-wider text-stone-gray">Pending Receipts</span>
                <h4 className="text-xl font-extrabold text-stone-black mt-1">₹1,85,000</h4>
              </div>
              <div className="dbc-card p-5">
                <span className="text-[8.5px] font-black uppercase tracking-wider text-stone-gray">Operating Expenses</span>
                <h4 className="text-xl font-extrabold text-stone-black mt-1">₹60,000</h4>
              </div>
              <div className="dbc-card p-5">
                <span className="text-[8.5px] font-black uppercase tracking-wider text-stone-gray">Platform Wallet</span>
                <h4 className="text-xl font-extrabold text-brand-emerald mt-1">₹3,40,000</h4>
              </div>
            </div>

            {/* Income line chart */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Net Cash Flow History</h3>
                <div className="p-4 bg-light-stone/20 rounded-2xl border border-light-border">
                  <div className="flex justify-between items-end h-32 gap-3">
                    {[12, 18, 14, 25, 22, 28, 34].map((flow, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="w-full bg-brand-emerald rounded-t-md" style={{ height: `${flow * 3}px` }} />
                        <span className="text-[8px] text-stone-gray/80 font-bold">₹{flow}K</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[8px] text-stone-gray/80 font-black uppercase tracking-wider mt-3 pt-2 border-t border-light-border/40">
                    <span>May 26</span>
                    <span>Jun 26</span>
                    <span>Jul 26 (Current)</span>
                  </div>
                </div>
              </div>

              {/* GST & Tax overview */}
              <div className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Tax Ledger & GST Breakdown</h3>
                <div className="space-y-2 text-[10px] font-semibold text-stone-gray">
                  <p className="flex justify-between border-b border-light-border/45 pb-1.5">
                    <span>CGST Payouts (9%):</span> <strong className="text-stone-black">₹37,800</strong>
                  </p>
                  <p className="flex justify-between border-b border-light-border/45 pb-1.5">
                    <span>SGST Payouts (9%):</span> <strong className="text-stone-black">₹37,800</strong>
                  </p>
                  <p className="flex justify-between border-b border-light-border/45 pb-1.5">
                    <span>TDS Deductions (2%):</span> <strong className="text-stone-black">₹8,400</strong>
                  </p>
                  <p className="flex justify-between">
                    <span>Net Tax compliance status:</span> <strong className="text-brand-emerald">Settled</strong>
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ESTIMATE & QUOTES */}
        {activeTab === 'estimates' && (
          <div className="grid gap-6 sm:grid-cols-2">
            
            {/* Active estimates */}
            <div className="space-y-4">
              <div className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Registered Project Estimates</h3>
                
                {estimates.map((est) => (
                  <div key={est.id} className="p-4 bg-light-stone/20 border border-light-border rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-black text-stone-black">{est.name}</h4>
                      <span className="block text-[8px] text-stone-gray font-bold mt-1">Client: {est.client} &bull; Date: {est.date}</span>
                      <strong className="block text-stone-black mt-1">₹{est.amount.toLocaleString()} INR</strong>
                    </div>
                    <span className={`dbc-badge text-[7.5px] py-0.5 uppercase font-bold ${
                      est.status === 'Accepted' ? 'dbc-badge-completed' : 'dbc-badge-planning'
                    }`}>{est.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Create estimate form */}
            {currentUserRole === 'PROVIDER' && (
              <form onSubmit={handleCreateEstimate} className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Draft Project Estimate</h3>
                
                <input
                  type="text"
                  placeholder="Estimate name (e.g. Masonry Phase 1)"
                  value={estName}
                  onChange={(e) => setEstName(e.target.value)}
                  className="dbc-input"
                  required
                />
                
                <div className="grid gap-4 grid-cols-3 text-xs font-semibold text-stone-gray">
                  <div>
                    <label className="block mb-1">Materials Cost</label>
                    <input
                      type="number"
                      placeholder="INR"
                      value={estMaterials}
                      onChange={(e) => setEstMaterials(e.target.value)}
                      className="dbc-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Labor Cost</label>
                    <input
                      type="number"
                      placeholder="INR"
                      value={estLabor}
                      onChange={(e) => setEstLabor(e.target.value)}
                      className="dbc-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1">Equipment Cost</label>
                    <input
                      type="number"
                      placeholder="INR"
                      value={estEquipment}
                      onChange={(e) => setEstEquipment(e.target.value)}
                      className="dbc-input"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="w-full dbc-btn dbc-btn-primary py-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                  Save Estimate Draft
                </button>
              </form>
            )}

          </div>
        )}

        {/* INVOICE LEDGER */}
        {activeTab === 'invoices' && (
          <div className="grid gap-6 sm:grid-cols-3">
            
            {/* Invoices list */}
            <div className="sm:col-span-2 space-y-4">
              <div className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Invoices Ledger</h3>
                
                <div className="dbc-table-container">
                  <table className="dbc-table" aria-label="Invoices Ledger">
                    <thead>
                      <tr>
                        <th>Invoice Ref</th>
                        <th>Client</th>
                        <th>Milestone</th>
                        <th>Amount</th>
                        <th>Due Date</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="font-semibold text-stone-black">{inv.ref}</td>
                          <td>{inv.client}</td>
                          <td>{inv.milestone}</td>
                          <td>₹{inv.amount.toLocaleString()}</td>
                          <td>{inv.dueDate}</td>
                          <td className="text-right">
                            {inv.status === 'Sent' && currentUserRole === 'CUSTOMER' ? (
                              <button
                                onClick={() => handlePayInvoice(inv)}
                                className="dbc-btn dbc-btn-primary py-1 px-3 text-[9px] font-bold uppercase cursor-pointer"
                              >
                                Pay Invoice
                              </button>
                            ) : (
                              <span className={`dbc-badge text-[7.5px] py-0.5 uppercase ${
                                inv.status === 'Paid' ? 'dbc-badge-completed' : 'dbc-badge-planning'
                              }`}>{inv.status}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Create invoice form */}
            {currentUserRole === 'PROVIDER' && (
              <form onSubmit={handleGenerateInvoice} className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Generate Milestone Invoice</h3>
                
                <input
                  type="text"
                  placeholder="Invoice Reference (e.g. INV-2026-90)"
                  value={invRef}
                  onChange={(e) => setInvRef(e.target.value)}
                  className="dbc-input"
                  required
                />
                <input
                  type="text"
                  placeholder="Milestone Reference (e.g. Beam Alignment completion)"
                  value={invMilestone}
                  onChange={(e) => setInvMilestone(e.target.value)}
                  className="dbc-input"
                  required
                />
                <input
                  type="number"
                  placeholder="Billing Amount (INR)"
                  value={invAmount}
                  onChange={(e) => setInvAmount(e.target.value)}
                  className="dbc-input"
                  required
                />

                <button type="submit" className="w-full dbc-btn dbc-btn-primary py-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                  Send Invoice
                </button>
              </form>
            )}

          </div>
        )}

        {/* EXPENSES MANAGER */}
        {activeTab === 'expenses' && (
          <div className="grid gap-6 sm:grid-cols-3">
            
            {/* Expenses list */}
            <div className="sm:col-span-2 space-y-4">
              <div className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Recorded Project Expenses</h3>
                
                <div className="dbc-table-container">
                  <table className="dbc-table" aria-label="Recorded Expenses">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Description / Notes</th>
                        <th>Amount</th>
                        <th className="text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((exp) => (
                        <tr key={exp.id}>
                          <td>{exp.date}</td>
                          <td>
                            <span className="dbc-badge text-[7.5px] py-0.5">{exp.category}</span>
                          </td>
                          <td>{exp.notes}</td>
                          <td className="font-semibold text-stone-black">₹{exp.amount.toLocaleString()}</td>
                          <td className="text-right">
                            <span className={`dbc-badge text-[7.5px] py-0.5 uppercase ${
                              exp.status === 'Approved' ? 'dbc-badge-completed' : 'dbc-badge-planning'
                            }`}>{exp.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Record expense form */}
            {currentUserRole === 'PROVIDER' && (
              <form onSubmit={handleRecordExpense} className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Log Expense Payout</h3>
                
                <div className="space-y-1.5">
                  <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Expense category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as 'Materials' | 'Labor' | 'Equipment' | 'Travel' | 'Miscellaneous')}
                    className="dbc-input bg-white"
                  >
                    <option value="Materials">Materials purchase</option>
                    <option value="Labor">Labor wages</option>
                    <option value="Equipment">Equipment rentals</option>
                    <option value="Travel">Travel & Logistics</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>

                <input
                  type="number"
                  placeholder="Expense Payout Amount (INR)"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="dbc-input"
                  required
                />
                
                <textarea
                  placeholder="Expense description and material bill metadata..."
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="dbc-input h-20 resize-none"
                  required
                />

                <button type="submit" className="w-full dbc-btn dbc-btn-primary py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer">
                  Log Expense
                </button>
              </form>
            )}

          </div>
        )}

        {/* REFUNDS & WALLET */}
        {activeTab === 'refunds' && (
          <div className="grid gap-6 sm:grid-cols-2 text-left">
            
            {/* Wallet status */}
            <div className="space-y-6">
              <div className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Platform Escrow Wallet</h3>
                
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3">
                  <span className="dbc-badge dbc-badge-completed text-[7.5px] py-0.5">Wallet Balance Active</span>
                  <h4 className="text-2xl font-extrabold text-brand-emerald">₹3,40,000</h4>
                  <p className="text-[10.5px] text-stone-gray font-semibold leading-relaxed">
                    Balance includes milestone advance payments held securely in DBC smart escrow before final project phase sign-offs.
                  </p>
                </div>
              </div>

              {/* Submit refund request */}
              {currentUserRole === 'CUSTOMER' && (
                <form onSubmit={handleRequestRefund} className="dbc-card space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Submit Dispute Refund Request</h3>
                  <input
                    type="number"
                    placeholder="Requested Refund Amount (INR)"
                    value={refAmount}
                    onChange={(e) => setRefAmount(e.target.value)}
                    className="dbc-input"
                    required
                  />
                  <textarea
                    placeholder="Justify refund claim (milestone issues or materials adjustment)..."
                    value={refReason}
                    onChange={(e) => setRefReason(e.target.value)}
                    className="dbc-input h-20 resize-none"
                    required
                  />
                  <button type="submit" className="w-full dbc-btn dbc-btn-primary py-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                    Request Refund
                  </button>
                </form>
              )}
            </div>

            {/* Active refund claims */}
            <div className="space-y-4">
              <div className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Active Refund Requests</h3>
                
                {refunds.map((ref) => (
                  <div key={ref.id} className="p-4 bg-light-stone/20 border border-light-border rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-black text-stone-black">Refund Ref: {ref.id}</h4>
                        <span className="block text-[8px] text-stone-gray font-bold mt-1">Project: {ref.project}</span>
                      </div>
                      <span className="dbc-badge text-[7.5px] py-0.5">{ref.status}</span>
                    </div>
                    <p className="text-[10.5px] text-stone-gray font-semibold leading-relaxed">
                      <strong>Amount:</strong> ₹{ref.amount.toLocaleString()} INR<br />
                      <strong>Reason:</strong> "{ref.reason}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>

      {selectedInvoice && (
        <PaymentCheckoutModal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          onSuccess={handlePaySuccess}
          amount={selectedInvoice.amount}
          milestoneName={selectedInvoice.milestone}
        />
      )}
    </div>
  );
}
