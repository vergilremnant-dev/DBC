import { useState, useEffect, useMemo } from 'react';
import CalendarManagementPage from '../consultant/CalendarManagementPage';
import { bookingApi } from '../../../services/booking/bookingService';
import type { Booking as ApiBooking, BookingStatus } from '../../../types/booking/bookingTypes';
import { BookingStatusBadge } from '../../../components/workspace/bookings/BookingStatusBadge';

// ==========================================
// Types & Interfaces
// ==========================================
interface ProviderBooking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerPhone?: string;
  customerAddress: string;
  city: string;
  state: string;
  categoryName: string;
  notes: string;
  preferredDate: string;
  preferredTime: string;
  estimatedBudget: number;
  status: BookingStatus;
  createdAt: string;
}

function mapApiToProviderBooking(b: ApiBooking): ProviderBooking {
  return {
    id: b.id,
    bookingNumber: b.bookingNumber || b.id,
    customerName: b.customer?.fullName || 'Customer',
    customerPhone: b.customer?.phoneNumber,
    customerAddress: b.customerAddress || 'Customer Site',
    city: b.city || '',
    state: b.state || '',
    categoryName: b.category?.name || 'Service',
    notes: b.notes || 'Service Request',
    preferredDate: b.preferredDate ? new Date(b.preferredDate).toISOString().split('T')[0] : '',
    preferredTime: b.preferredTime || '10:00 AM',
    estimatedBudget: b.estimatedBudget || 0,
    status: b.bookingStatus,
    createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
  };
}

export default function ProfessionalBookings() {
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

  const [bookings, setBookings] = useState<ProviderBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<ProviderBooking | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'LIST' | 'CALENDAR'>('LIST');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Availability Settings States
  const [workingHours, setWorkingHours] = useState('09:00 AM - 06:00 PM');
  const [workingDays, setWorkingDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [vacationMode, setVacationMode] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchBookings = () => setRefreshKey((k) => k + 1);

  // Fetch provider bookings from real API on mount and reload
  useEffect(() => {
    let isMounted = true;
    async function loadBookings() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await bookingApi.getProviderBookings();
        if (isMounted) {
          if (Array.isArray(data)) {
            setBookings(data.map(mapApiToProviderBooking));
          } else {
            setBookings([]);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Failed to load provider bookings', err);
          setErrorMessage('Unable to load bookings from server.');
          setBookings([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadBookings();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Lifecycle Action Handlers
  const handleAccept = async (id: string) => {
    setActionLoadingId(id);
    try {
      await bookingApi.acceptBooking(id);
      setBookings(prev =>
        prev.map(b => (b.id === id ? { ...b, status: 'ACCEPTED' as BookingStatus } : b))
      );
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking(prev => prev ? { ...prev, status: 'ACCEPTED' as BookingStatus } : null);
      }
      alert('✓ Project request accepted successfully.');
    } catch (err: any) {
      console.error('Failed to accept request', err);
      const serverMessage = err?.response?.data?.message || err?.message || 'Failed to accept project request.';
      alert(`⚠️ ${serverMessage}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to decline this project request?')) return;
    setActionLoadingId(id);
    try {
      await bookingApi.rejectBooking(id);
      setBookings(prev =>
        prev.map(b => (b.id === id ? { ...b, status: 'REJECTED' as BookingStatus } : b))
      );
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking(prev => prev ? { ...prev, status: 'REJECTED' as BookingStatus } : null);
      }
      alert('Project request declined.');
    } catch (err: any) {
      console.error('Failed to decline request', err);
      const serverMessage = err?.response?.data?.message || err?.message || 'Failed to decline project request.';
      alert(`⚠️ ${serverMessage}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStart = async (id: string) => {
    setActionLoadingId(id);
    try {
      await bookingApi.startBooking(id);
      setBookings(prev =>
        prev.map(b => (b.id === id ? { ...b, status: 'IN_PROGRESS' as BookingStatus } : b))
      );
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking(prev => prev ? { ...prev, status: 'IN_PROGRESS' as BookingStatus } : null);
      }
      alert('✓ Project marked as Started.');
    } catch (err: any) {
      console.error('Failed to start project', err);
      const serverMessage = err?.response?.data?.message || err?.message || 'Failed to update project status.';
      alert(`⚠️ ${serverMessage}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleComplete = async (id: string) => {
    if (!confirm('Confirm marking this project as COMPLETED?')) return;
    setActionLoadingId(id);
    try {
      await bookingApi.completeBooking(id);
      setBookings(prev =>
        prev.map(b => (b.id === id ? { ...b, status: 'COMPLETED' as BookingStatus } : b))
      );
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking(prev => prev ? { ...prev, status: 'COMPLETED' as BookingStatus } : null);
      }
      alert('✓ Project marked as Completed.');
    } catch (err: any) {
      console.error('Failed to complete project', err);
      const serverMessage = err?.response?.data?.message || err?.message || 'Failed to complete project.';
      alert(`⚠️ ${serverMessage}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchSearch =
        b.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.notes.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus =
        statusFilter === 'ALL' ||
        b.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  // Calendar dates with booking events
  const calendarBookings = useMemo(() => {
    return bookings.filter(b => b.preferredDate === selectedCalendarDate);
  }, [bookings, selectedCalendarDate]);

  // Real KPI statistics
  const stats = useMemo(() => {
    return {
      pending: bookings.filter(b => b.status === 'REQUESTED').length,
      active: bookings.filter(b => ['ACCEPTED', 'IN_PROGRESS'].includes(b.status)).length,
      completed: bookings.filter(b => b.status === 'COMPLETED').length,
      totalRevenue: bookings
        .filter(b => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + (b.estimatedBudget || 0), 0),
    };
  }, [bookings]);

  if (workspaceView === 'CONSULTANT') {
    return <CalendarManagementPage />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 text-left animate-gentle-fade select-none">
      
      {/* 1. Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-stone-200 p-6 rounded-3xl shadow-sm relative">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider font-sans">Provider Portal</span>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 leading-tight font-serif">Project Requests & Schedule</h1>
          <p className="text-xs text-stone-500 font-medium">Manage inbound project requests, schedule evaluations, and track milestone executions.</p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={fetchBookings}
            className="px-3.5 py-2 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl font-bold transition cursor-pointer"
            title="Refresh bookings"
          >
            🔄 Refresh
          </button>
          <div className="flex bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveView('LIST')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeView === 'LIST' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setActiveView('CALENDAR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeView === 'CALENDAR' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Calendar View
            </button>
          </div>
        </div>
      </header>

      {errorMessage && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs font-semibold text-amber-800">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* 2. Stats summary */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'New Requests', count: stats.pending, icon: '📩', color: 'bg-amber-50 text-amber-800' },
          { label: 'Active Projects', count: stats.active, icon: '⚡', color: 'bg-emerald-50 text-emerald-800' },
          { label: 'Completed Projects', count: stats.completed, icon: '✓', color: 'bg-sky-50 text-sky-800' },
          { label: 'Completed Value', count: `₹${stats.totalRevenue.toLocaleString()}`, icon: '💰', color: 'bg-purple-50 text-purple-800' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
            <span className={`text-base p-2 rounded-xl w-fit ${kpi.color}`}>{kpi.icon}</span>
            <div className="mt-4 space-y-0.5">
              <span className="block text-2xl font-black text-stone-900">{kpi.count}</span>
              <span className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider">{kpi.label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* 3. Main Workspace Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Bookings List or Calendar (Col span 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Controls Bar */}
          <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center gap-3 justify-between">
            <div className="relative flex items-center bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 w-full sm:max-w-xs focus-within:border-emerald-600 focus-within:bg-white transition">
              <span className="text-stone-400 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Search customer, number, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-xs text-stone-800 px-2 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-stone-600 focus:outline-none focus:border-emerald-600 transition"
              >
                <option value="ALL">All Statuses</option>
                <option value="REQUESTED">New Requests</option>
                <option value="ACCEPTED">Accepted / Confirmed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Declined</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {activeView === 'LIST' ? (
            /* List View */
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center p-16 bg-white rounded-2xl border border-stone-200">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-16 bg-white border border-stone-200 rounded-2xl p-6 text-stone-400 text-xs space-y-2">
                  <span className="text-3xl block">📋</span>
                  <p className="font-bold text-stone-700 text-sm">No bookings found</p>
                  <p className="text-[11px] text-stone-400">Customer requests matching your filter criteria will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBookings.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBooking(b)}
                      className="p-5 bg-white border border-stone-200 hover:border-emerald-500 rounded-2xl shadow-sm transition text-xs space-y-3 cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
                            {b.bookingNumber}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            {b.categoryName}
                          </span>
                        </div>
                        <BookingStatusBadge status={b.status} />
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-stone-900">{b.notes || `${b.categoryName} Request`}</h4>
                          <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                            Customer: <strong className="text-stone-800">{b.customerName}</strong> {b.customerPhone ? `(${b.customerPhone})` : ''}
                          </p>
                          <p className="text-[10px] text-stone-400">
                            📍 {b.customerAddress}, {b.city} {b.state}
                          </p>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <span className="block text-sm font-black text-stone-900">₹{b.estimatedBudget.toLocaleString()}</span>
                          <span className="block text-[10px] font-bold text-stone-500">
                            📅 {b.preferredDate} • {b.preferredTime}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="border-t border-stone-100 pt-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[9px] text-stone-400 font-semibold">
                          Created: {new Date(b.createdAt).toLocaleDateString()}
                        </span>

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {b.status === 'REQUESTED' && (
                            <>
                              <button
                                onClick={() => handleAccept(b.id)}
                                disabled={actionLoadingId === b.id}
                                className="dbc-btn dbc-btn-sm dbc-btn-primary"
                              >
                                Accept Request
                              </button>
                              <button
                                onClick={() => handleReject(b.id)}
                                disabled={actionLoadingId === b.id}
                                className="dbc-btn dbc-btn-sm dbc-btn-danger"
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {b.status === 'ACCEPTED' && (
                            <button
                              onClick={() => handleStart(b.id)}
                              disabled={actionLoadingId === b.id}
                              className="dbc-btn dbc-btn-sm dbc-btn-primary bg-blue-600 hover:bg-blue-750 text-white border-none"
                            >
                              Start Project
                            </button>
                          )}

                          {b.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => handleComplete(b.id)}
                              disabled={actionLoadingId === b.id}
                              className="dbc-btn dbc-btn-sm dbc-btn-primary"
                            >
                              Mark Completed
                            </button>
                          )}

                          {b.status === 'COMPLETED' && (
                            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                              ✓ Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Calendar View */
            <div className="bg-white border border-stone-200 p-6 rounded-3xl shadow-sm space-y-6">
              <div className="flex justify-between items-center pb-2 border-b border-stone-100">
                <h3 className="text-xs font-black uppercase text-stone-900 tracking-wider">Schedule Calendar</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-stone-400 font-bold uppercase">Pick Date:</span>
                  <input
                    type="date"
                    value={selectedCalendarDate}
                    onChange={(e) => setSelectedCalendarDate(e.target.value)}
                    className="border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-700 bg-white"
                  />
                </div>
              </div>

              {/* Day Schedule for Selected Date */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-stone-700">Schedule for {selectedCalendarDate}:</h4>
                {calendarBookings.length === 0 ? (
                  <p className="text-xs text-stone-400 italic py-4">No requests scheduled for this date.</p>
                ) : (
                  calendarBookings.map((cb) => (
                    <div key={cb.id} className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex justify-between items-center text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900">{cb.customerName}</span>
                          <BookingStatusBadge status={cb.status} />
                        </div>
                        <p className="text-[10px] text-stone-500 mt-0.5">{cb.notes} • {cb.preferredTime}</p>
                      </div>
                      <span className="font-bold text-stone-900 text-xs">₹{cb.estimatedBudget}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Selected Booking Details & Availability Settings (Col span 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Detail Side Panel */}
          {selectedBooking ? (
            <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
              <div className="flex justify-between items-start border-b border-stone-100 pb-3">
                <div>
                  <span className="text-[9px] font-black uppercase text-stone-400">{selectedBooking.bookingNumber}</span>
                  <h3 className="text-sm font-bold text-stone-900">{selectedBooking.customerName}</h3>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-stone-400 hover:text-stone-700 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-stone-600">
                <div className="flex justify-between py-1 border-b border-stone-50">
                  <span className="text-[10px] text-stone-400 font-bold uppercase">Status</span>
                  <BookingStatusBadge status={selectedBooking.status} />
                </div>
                <div className="flex justify-between py-1 border-b border-stone-50">
                  <span className="text-[10px] text-stone-400 font-bold uppercase">Category</span>
                  <span className="font-bold text-stone-800">{selectedBooking.categoryName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-50">
                  <span className="text-[10px] text-stone-400 font-bold uppercase">Expected Start Date</span>
                  <span className="font-bold text-stone-800">{selectedBooking.preferredDate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-50">
                  <span className="text-[10px] text-stone-400 font-bold uppercase">Estimated Budget</span>
                  <span className="font-bold text-emerald-800">₹{selectedBooking.estimatedBudget.toLocaleString()}</span>
                </div>
                <div className="py-1">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block mb-0.5">Location</span>
                  <p className="text-stone-800 font-medium">{selectedBooking.customerAddress}, {selectedBooking.city} {selectedBooking.state}</p>
                </div>
                <div className="py-1">
                  <span className="text-[10px] text-stone-400 font-bold uppercase block mb-0.5">Customer Notes</span>
                  <p className="text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-100">{selectedBooking.notes}</p>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="pt-2 border-t border-stone-100 space-y-2">
                {selectedBooking.status === 'REQUESTED' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAccept(selectedBooking.id)}
                      disabled={actionLoadingId === selectedBooking.id}
                      className="dbc-btn dbc-btn-md dbc-btn-primary"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(selectedBooking.id)}
                      disabled={actionLoadingId === selectedBooking.id}
                      className="dbc-btn dbc-btn-md dbc-btn-danger"
                    >
                      Decline
                    </button>
                  </div>
                )}

                {selectedBooking.status === 'ACCEPTED' && (
                  <button
                    onClick={() => handleStart(selectedBooking.id)}
                    disabled={actionLoadingId === selectedBooking.id}
                    className="w-full dbc-btn dbc-btn-md dbc-btn-primary bg-blue-600 hover:bg-blue-750 text-white border-none"
                  >
                    Start Project
                  </button>
                )}

                {selectedBooking.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleComplete(selectedBooking.id)}
                    disabled={actionLoadingId === selectedBooking.id}
                    className="w-full dbc-btn dbc-btn-md dbc-btn-primary"
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {/* Availability Settings panel */}
          <section className="bg-white border border-stone-200 p-6 rounded-3xl shadow-sm space-y-4 text-xs font-semibold text-stone-600">
            <h3 className="text-xs font-black uppercase text-stone-900 border-b border-stone-100 pb-2">Availability Rules</h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[8px] font-black uppercase text-stone-400">Working days</label>
                <div className="flex gap-1 flex-wrap">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => {
                    const active = workingDays.includes(d);
                    return (
                      <button
                        key={d}
                        onClick={() => {
                          setWorkingDays(prev => 
                            prev.includes(d) ? prev.filter(item => item !== d) : [...prev, d]
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[9.5px] font-bold border transition ${
                          active ? 'bg-emerald-700 border-emerald-700 text-white' : 'bg-white border-stone-200 text-stone-700'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <label className="block text-[8px] font-black uppercase text-stone-400">Working hours limits</label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={e => setWorkingHours(e.target.value)}
                  className="dbc-input text-xs"
                />
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-stone-100">
                <div>
                  <strong className="text-stone-800 block">Vacation Mode</strong>
                  <span className="text-[10px] text-stone-400 font-normal">Temporarily pause new inbound requests</span>
                </div>
                <input
                  type="checkbox"
                  checked={vacationMode}
                  onChange={e => setVacationMode(e.target.checked)}
                  className="dbc-checkbox"
                />
              </div>
            </div>
          </section>

        </div>

      </div>

    </div>
  );
}
