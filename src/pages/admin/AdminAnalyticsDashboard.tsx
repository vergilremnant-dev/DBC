import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoutButton } from '../../components/auth/LogoutButton';
import { analyticsApi } from '../../services/analytics/analyticsService';
import { categoryApi } from '../../services/category/categoryService';
import { BRAND } from '../../config/branding';
import type { ServiceCategory } from '../../types/category/categoryTypes';
import type {
  OverviewData,
  BookingsData,
  ProvidersData,
  CustomersData,
  SubscriptionsData,
  ConsultationsData,
  CallbacksData,
  ContentData,
} from '../../types/analytics/analyticsTypes';

export function AdminAnalyticsDashboard() {
  const navigate = useNavigate();

  // Filter parameters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [city, setCity] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Categories list for dropdown
  const [categories, setCategories] = useState<ServiceCategory[]>([]);

  // Selected tab
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'bookings' | 'providers' | 'customers' | 'consultations' | 'content'>('overview');

  // Loading & error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Tab data states
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [revenue, setRevenue] = useState<SubscriptionsData | null>(null);
  const [bookings, setBookings] = useState<BookingsData | null>(null);
  const [providers, setProviders] = useState<ProvidersData | null>(null);
  const [customers, setCustomers] = useState<CustomersData | null>(null);
  const [consultations, setConsultations] = useState<ConsultationsData | null>(null);
  const [callbacks, setCallbacks] = useState<CallbacksData | null>(null);
  const [content, setContent] = useState<ContentData | null>(null);

  const fetchCategories = React.useCallback(async () => {
    try {
      const list = await categoryApi.getCategories();
      React.startTransition(() => {
        setCategories(list);
      });
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }, []);

  const loadTabData = React.useCallback(async () => {
    React.startTransition(() => {
      setLoading(true);
      setError('');
    });
    
    const params = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      city: city || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
    };

    try {
      if (activeTab === 'overview') {
        const data = await analyticsApi.getOverview(params);
        React.startTransition(() => {
          setOverview(data);
        });
      } else if (activeTab === 'revenue') {
        const data = await analyticsApi.getSubscriptions(params);
        React.startTransition(() => {
          setRevenue(data);
        });
      } else if (activeTab === 'bookings') {
        const data = await analyticsApi.getBookings(params);
        React.startTransition(() => {
          setBookings(data);
        });
      } else if (activeTab === 'providers') {
        const data = await analyticsApi.getProviders(params);
        React.startTransition(() => {
          setProviders(data);
        });
      } else if (activeTab === 'customers') {
        const data = await analyticsApi.getCustomers(params);
        React.startTransition(() => {
          setCustomers(data);
        });
      } else if (activeTab === 'consultations') {
        const [consultData, callData] = await Promise.all([
          analyticsApi.getConsultations(params),
          analyticsApi.getCallbacks(params),
        ]);
        React.startTransition(() => {
          setConsultations(consultData);
          setCallbacks(callData);
        });
      } else if (activeTab === 'content') {
        const data = await analyticsApi.getContent(params);
        React.startTransition(() => {
          setContent(data);
        });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to sync metrics from data warehouse';
      React.startTransition(() => {
        setError(errMsg);
      });
    } finally {
      React.startTransition(() => {
        setLoading(false);
      });
    }
  }, [activeTab, startDate, endDate, city, categoryId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    loadTabData();
  }, [activeTab, loadTabData]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    loadTabData();
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setCity('');
    setCategoryId('');
    setTimeout(() => {
      loadTabData();
    }, 0);
  };

  // CSV Exporter
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (activeTab === 'overview' && overview) {
      csvContent += "Metric,Value\n";
      csvContent += `Total Customers,${overview.totalCustomers}\n`;
      csvContent += `Total Providers,${overview.totalProviders}\n`;
      csvContent += `Active Providers,${overview.activeProviders}\n`;
      csvContent += `Verified Providers,${overview.verifiedProviders}\n`;
      csvContent += `Active Subscriptions,${overview.activeSubscriptions}\n`;
      csvContent += `Total Bookings,${overview.totalBookings}\n`;
      csvContent += `Completed Bookings,${overview.completedBookings}\n`;
      csvContent += `Avg Rating,${overview.avgProviderRating}\n`;
    } else if (activeTab === 'bookings' && bookings) {
      csvContent += "Category,Count\n";
      Object.entries(bookings.categoryDistribution).forEach(([cat, count]) => {
        csvContent += `"${cat}",${count}\n`;
      });
    } else if (activeTab === 'providers' && providers) {
      csvContent += "Provider Name,Business,City,Avg Rating,Bookings Count\n";
      providers.topRated.forEach((p) => {
        csvContent += `"${p.fullName}","${p.businessName || ''}","${p.city}",${p.avgRating},${p.bookingCount}\n`;
      });
    } else {
      csvContent += "Status,Report Type\nNo CSV exporter mapped for this view,Export metrics via screen print.\n";
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${BRAND.name.toLowerCase()}_analytics_${activeTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to draw custom SVG charts
  const renderSVGLineChart = (trend: { label: string; value: number }[]) => {
    if (trend.length === 0) return <div className="text-stone-400 text-xs py-10 text-center">No trend points to display.</div>;

    const maxVal = Math.max(...trend.map((t) => t.value), 1);
    const width = 500;
    const height = 150;
    const padding = 20;

    const points = trend.map((t, idx) => {
      const x = padding + (idx / (trend.length - 1 || 1)) * (width - padding * 2);
      const y = height - padding - (t.value / maxVal) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="w-full bg-stone-50 p-4 rounded-xl border border-stone-150">
        <svg className="w-full h-40 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
          {/* Grid lines */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e5e5e0" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e5e5e0" strokeDasharray="3" />

          {/* Polyline path */}
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            points={points}
            className="transition-all duration-300"
          />

          {/* Points circles */}
          {trend.map((t, idx) => {
            const x = padding + (idx / (trend.length - 1 || 1)) * (width - padding * 2);
            const y = height - padding - (t.value / maxVal) * (height - padding * 2);
            return (
              <g key={idx} className="group cursor-pointer">
                <circle cx={x} cy={y} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                <text x={x} y={y - 8} textAnchor="middle" className="text-[8px] font-bold fill-stone-700 hidden group-hover:block bg-white px-1">
                  {t.value}
                </text>
              </g>
            );
          })}
        </svg>
        
        {/* X labels */}
        <div className="flex justify-between mt-2 text-[9px] font-bold text-stone-400 uppercase tracking-wider px-2">
          <span>{trend[0].label}</span>
          {trend.length > 2 && <span>{trend[Math.floor(trend.length / 2)].label}</span>}
          <span>{trend[trend.length - 1].label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-warm-cream text-stone-950 font-sans flex flex-col">
      <header className="sticky top-0 z-30 border-b border-light-border bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-xl font-black text-stone-900 font-serif">DBC</span>
            <span className="rounded bg-stone-950 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
              BI Portal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-xs font-bold text-stone-600 hover:text-stone-900 transition"
            >
              Exit Workspace
            </button>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl w-full px-4 py-8 sm:px-6 space-y-8 flex-1">
        
        {/* Filters Section */}
        <form onSubmit={handleApplyFilters} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">📊 Filter Options</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClearFilters}
                className="dbc-btn dbc-btn-sm dbc-btn-ghost"
              >
                Clear Filters
              </button>
              <button
                type="submit"
                className="dbc-btn dbc-btn-sm dbc-btn-primary"
              >
                Apply Filters
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4 text-xs font-medium text-stone-700">
            <div>
              <label className="block mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="dbc-input"
              />
            </div>
            <div>
              <label className="block mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="dbc-input"
              />
            </div>
            <div>
              <label className="block mb-1">Target City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Hyderabad"
                className="dbc-input"
              />
            </div>
            <div>
              <label className="block mb-1">Service Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="dbc-input bg-white"
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>

        {/* Tab Headers */}
        <section className="flex gap-2 border-b border-stone-200 overflow-x-auto pb-1 text-xs no-scrollbar">
          {(['overview', 'revenue', 'bookings', 'providers', 'customers', 'consultations', 'content'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 font-bold uppercase tracking-wider transition ${
                activeTab === tab 
                  ? 'border-emerald-600 text-emerald-800' 
                  : 'border-transparent text-stone-500 hover:text-stone-850'
              }`}
            >
              {tab}
            </button>
          ))}
        </section>

        {/* Status Alerts */}
        {error && <div className="rounded-lg bg-red-50 border border-red-100 p-4 text-xs font-semibold text-red-700">{error}</div>}
        {loading && <div className="text-xs text-stone-400 py-4 animate-pulse">Syncing metrics data store...</div>}

        {/* Tab Contents */}
        {!loading && (
          <div className="space-y-6">

            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && overview && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Total Customers</span>
                    <h4 className="text-3xl font-extrabold mt-1 text-stone-900 font-serif">{overview.totalCustomers}</h4>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Active Providers</span>
                    <h4 className="text-3xl font-extrabold mt-1 text-stone-900 font-serif">{overview.activeProviders} <span className="text-xs text-stone-400 font-sans">/ {overview.totalProviders}</span></h4>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Total Bookings</span>
                    <h4 className="text-3xl font-extrabold mt-1 text-stone-900 font-serif">{overview.totalBookings}</h4>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Avg Provider Rating</span>
                    <h4 className="text-3xl font-extrabold mt-1 text-stone-900 font-serif">⭐ {overview.avgProviderRating}</h4>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-stone-900 font-serif border-b border-stone-100 pb-2">Business Operations Details</h3>
                    <div className="space-y-2 text-xs font-semibold text-stone-600">
                      <div className="flex justify-between">
                        <span>Verified Providers Count:</span>
                        <span className="text-stone-900">{overview.verifiedProviders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Subscriptions Count:</span>
                        <span className="text-stone-900">{overview.activeSubscriptions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completed Bookings Count:</span>
                        <span className="text-stone-900">{overview.completedBookings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Consultations:</span>
                        <span className="text-stone-900">{overview.activeConsultations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending Callbacks:</span>
                        <span className="text-stone-900">{overview.pendingCallbacks}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 font-serif border-b border-stone-100 pb-2">Actionable Reporting</h3>
                      <p className="text-xs text-stone-500 mt-2 leading-relaxed">Download overview parameters or specific tab segment metrics directly in CSV spreadsheet format for external reporting.</p>
                    </div>
                    <button
                      onClick={handleExportCSV}
                      className="mt-6 w-full rounded-lg bg-stone-900 hover:bg-stone-850 py-2.5 font-bold text-white text-xs cursor-pointer transition"
                    >
                      Download CSV Report
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* REVENUE TAB */}
            {activeTab === 'revenue' && revenue && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Total Active ARR</span>
                    <h4 className="text-3xl font-extrabold mt-1 text-emerald-800 font-serif">₹{revenue.totalActiveRevenue}</h4>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Active Subscriptions</span>
                    <h4 className="text-3xl font-extrabold mt-1 text-stone-900 font-serif">{revenue.statusBreakdown.active}</h4>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Expired Tiers</span>
                    <h4 className="text-3xl font-extrabold mt-1 text-stone-400 font-serif">{revenue.statusBreakdown.expired}</h4>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-stone-900 font-serif border-b border-stone-100 pb-2">Revenue Share by Plan</h3>
                    <div className="space-y-3">
                      {Object.entries(revenue.revenueByPlan).map(([planName, val]) => (
                        <div key={planName} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-stone-700">
                            <span>{planName}</span>
                            <span>₹{val}</span>
                          </div>
                          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${(val / (revenue.totalActiveRevenue || 1)) * 100}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-stone-900 font-serif border-b border-stone-100 pb-2">Monthly Revenue Trend</h3>
                    {renderSVGLineChart(revenue.monthlyRevenueTrend.map((r) => ({ label: r.month, value: r.revenue })))}
                  </div>
                </div>
              </div>
            )}

            {/* BOOKINGS TAB */}
            {activeTab === 'bookings' && bookings && (
              <div className="space-y-6">
                <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm max-w-xs">
                  <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Total Bookings</span>
                  <h4 className="text-3xl font-extrabold mt-1 text-stone-900 font-serif">{bookings.total}</h4>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-stone-900 font-serif border-b border-stone-100 pb-2">Category Demand split</h3>
                    <div className="space-y-3">
                      {Object.entries(bookings.categoryDistribution).map(([cat, count]) => (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-stone-700">
                            <span>{cat}</span>
                            <span>{count} Requests</span>
                          </div>
                          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-stone-800 h-full rounded-full" style={{ width: `${(count / (bookings.total || 1)) * 100}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-stone-900 font-serif border-b border-stone-100 pb-2">Status Distribution</h3>
                    <div className="space-y-3">
                      {Object.entries(bookings.statusDistribution).map(([status, count]) => (
                        <div key={status} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-stone-700">
                            <span>{status}</span>
                            <span>{count}</span>
                          </div>
                          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${(count / (bookings.total || 1)) * 100}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-stone-900 font-serif border-b border-stone-100 pb-2">Daily Booking Trends</h3>
                  {renderSVGLineChart(bookings.dailyTrend.map((d) => ({ label: d.date.substring(5), value: d.count })))}
                </div>
              </div>
            )}

            {/* PROVIDERS TAB */}
            {activeTab === 'providers' && providers && (
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  
                  {/* Top Rated */}
                  <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-stone-900 font-serif border-b border-stone-100 pb-2">⭐ Top Rated Partners</h3>
                    <div className="divide-y divide-stone-100">
                      {providers.topRated.map((p) => (
                        <div key={p.id} className="py-2.5 flex justify-between items-center text-xs">
                          <div>
                            <h4 className="font-bold text-stone-900">{p.fullName}</h4>
                            <p className="text-[10px] text-stone-400">{p.businessName || 'Freelance'}</p>
                          </div>
                          <span className="font-bold text-stone-800">⭐ {p.avgRating}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Most Booked */}
                  <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-stone-900 font-serif border-b border-stone-100 pb-2">👷 Most Booked Partners</h3>
                    <div className="divide-y divide-stone-100">
                      {providers.mostBooked.map((p) => (
                        <div key={p.id} className="py-2.5 flex justify-between items-center text-xs">
                          <div>
                            <h4 className="font-bold text-stone-900">{p.fullName}</h4>
                            <p className="text-[10px] text-stone-400">{p.city}</p>
                          </div>
                          <span className="font-bold text-stone-800">{p.bookingCount} Bookings</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Awaiting Verification list */}
                  <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4 sm:col-span-2">
                    <h3 className="text-sm font-bold text-stone-900 font-serif border-b border-stone-100 pb-2">⏳ Verification Backlog</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-stone-200 text-stone-400 font-bold uppercase tracking-wider">
                            <th className="pb-2">Provider Name</th>
                            <th className="pb-2">Business</th>
                            <th className="pb-2">City</th>
                            <th className="pb-2">Registered Date</th>
                            <th className="pb-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-medium">
                          {providers.awaitingVerification.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-4 text-center text-stone-400">Backlog clean. All providers verified.</td>
                            </tr>
                          ) : (
                            providers.awaitingVerification.map((p) => (
                              <tr key={p.id} className="hover:bg-stone-50">
                                <td className="py-2.5 font-bold text-stone-900">{p.fullName}</td>
                                <td className="py-2.5 text-stone-500">{p.businessName || 'Individual'}</td>
                                <td className="py-2.5 text-stone-900">{p.city}</td>
                                <td className="py-2.5 text-stone-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                                <td className="py-2.5 text-right">
                                  <button
                                    onClick={() => navigate(`/providers`)}
                                    className="rounded bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100 px-2 py-0.5 font-bold text-[10px] cursor-pointer"
                                  >
                                    Verify
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CUSTOMERS TAB */}
            {activeTab === 'customers' && customers && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Total Customers</span>
                    <h4 className="text-3xl font-extrabold mt-1 text-stone-900 font-serif">{customers.totalCustomers}</h4>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Subscription Adoption</span>
                    <h4 className="text-3xl font-extrabold mt-1 text-emerald-800 font-serif">{(customers.subscriptionAdoptionRate * 100).toFixed(1)}%</h4>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Retention Splits</span>
                    <h4 className="text-3xl font-extrabold mt-1 text-stone-900 font-serif">{customers.returningCustomers} <span className="text-xs text-stone-400 font-sans">Returning</span></h4>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-stone-900 font-serif border-b border-stone-100 pb-2">Client Retention Breakdown</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-stone-700 mb-1">
                          <span>New Customer (Single request)</span>
                          <span>{customers.newCustomers}</span>
                        </div>
                        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-stone-500 h-full rounded-full" style={{ width: `${(customers.newCustomers / (customers.totalCustomers || 1)) * 100}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-bold text-stone-700 mb-1">
                          <span>Repeat Customer (Multi bookings)</span>
                          <span>{customers.returningCustomers}</span>
                        </div>
                        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${(customers.returningCustomers / (customers.totalCustomers || 1)) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-stone-900 font-serif border-b border-stone-100 pb-2">⭐ Most Active Clients</h3>
                    <div className="divide-y divide-stone-100">
                      {customers.mostActiveCustomers.map((c, idx) => (
                        <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                          <span className="font-bold text-stone-900">{c.name}</span>
                          <span className="font-semibold text-stone-500">{c.count} Requests Submitted</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONSULTATIONS TAB */}
            {activeTab === 'consultations' && consultations && callbacks && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Consultation Bookings</span>
                    <h4 className="text-3xl font-extrabold mt-1 text-stone-900 font-serif">{consultations.totalConsultations}</h4>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Consultation Conversion</span>
                    <h4 className="text-3xl font-extrabold mt-1 text-emerald-800 font-serif">{(consultations.conversionRate * 100).toFixed(1)}%</h4>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Callback Requests</span>
                    <h4 className="text-3xl font-extrabold mt-1 text-stone-900 font-serif">{callbacks.totalCallbacks}</h4>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Avg Callback Response Time</span>
                    <h4 className="text-3xl font-extrabold mt-1 text-stone-900 font-serif">{callbacks.avgResponseTimeHours}h</h4>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  
                  {/* Callback Conversions */}
                  <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-stone-900 font-serif border-b border-stone-100 pb-2">Callback Conversion funnel</h3>
                    <div className="space-y-4 text-xs font-semibold text-stone-600">
                      <div className="flex justify-between border-b border-stone-50 pb-2">
                        <span>Total Requests:</span>
                        <span className="text-stone-900 font-bold">{callbacks.totalCallbacks}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-50 pb-2">
                        <span>Pending Follow-ups:</span>
                        <span className="text-amber-700 font-bold">{callbacks.pendingCallbacks}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-50 pb-2">
                        <span>Converted to Consultation:</span>
                        <span className="text-emerald-800 font-bold">{callbacks.convertedToConsultation}</span>
                      </div>
                      <div className="flex justify-between pb-2">
                        <span>Converted to Direct Booking:</span>
                        <span className="text-emerald-800 font-bold">{callbacks.convertedToBooking}</span>
                      </div>
                    </div>
                  </div>

                  {/* Top Consultants */}
                  <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-stone-900 font-serif border-b border-stone-100 pb-2">💬 Top Consulting Partners</h3>
                    <div className="divide-y divide-stone-100">
                      {consultations.topConsultants.map((c, idx) => (
                        <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                          <span className="font-bold text-stone-900">{c.name}</span>
                          <span className="font-semibold text-stone-500">{c.count} Consultations Completed</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONTENT TAB */}
            {activeTab === 'content' && content && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Consultation Bookings Generated</span>
                    <h4 className="text-3xl font-extrabold mt-1 text-emerald-800 font-serif">{content.totalConsultationConversions}</h4>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                    <span className="text-[9px] font-black uppercase tracking-wider text-stone-400">Callback Requests Generated</span>
                    <h4 className="text-3xl font-extrabold mt-1 text-emerald-800 font-serif">{content.totalCallbackConversions}</h4>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-stone-900 font-serif border-b border-stone-100 pb-2">📖 Most Read handbook Categories</h3>
                    <div className="space-y-3">
                      {Object.entries(content.categoryViews).map(([cat, views]) => (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-stone-700">
                            <span>{cat}</span>
                            <span>{views} views</span>
                          </div>
                          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.min(views, 100)}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-stone-900 font-serif border-b border-stone-100 pb-2">📑 Most Viewed Articles</h3>
                    <div className="divide-y divide-stone-100">
                      {content.topViewedArticles.map((art) => (
                        <div key={art.id} className="py-2.5 flex justify-between items-center text-xs">
                          <span className="font-semibold text-stone-900 truncate max-w-xs">{art.title}</span>
                          <span className="font-bold text-stone-600 whitespace-nowrap">👁️ {art.viewsCount} views</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}
