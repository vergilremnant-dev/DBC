import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingCard } from '../../components/workspace/bookings/BookingCard';
import { BookingSummaryCard } from '../../components/workspace/bookings/BookingSummaryCard';
import { BookingDetails } from '../../components/workspace/bookings/BookingDetails';
import { BookingEmptyState } from '../../components/workspace/bookings/BookingEmptyState';
import { useAuth } from '../../hooks/auth/useAuth';
import ProfessionalBookings from './professional/ProfessionalBookings';

import { bookingApi } from '../../services/booking/bookingService';
import type { Booking as ApiBooking } from '../../types/booking/bookingTypes';

/** Typed shape of a customer booking record */
interface Booking {
  id: string;
  bookingNumber: string;
  professionalName: string;
  professionalCategory: string;
  projectTitle: string;
  serviceCategory: string;
  city: string;
  address: string;
  scheduledDate: string;
  status: string;
  rawStatus: string;
  amount: number;
  createdAt: string;
}

function mapApiBookingToBooking(b: ApiBooking): Booking {
  let mappedStatus = 'Request Submitted';
  if (b.bookingStatus === 'ACCEPTED') mappedStatus = 'Under Review';
  else if (b.bookingStatus === 'IN_PROGRESS') mappedStatus = 'Project Started';
  else if (b.bookingStatus === 'COMPLETED') mappedStatus = 'Project Completed';
  else if (b.bookingStatus === 'CANCELLED') mappedStatus = 'Cancelled';
  else if (b.bookingStatus === 'REJECTED') mappedStatus = 'Declined';
  else if (b.bookingStatus === 'REQUESTED') mappedStatus = 'Request Submitted';

  return {
    id: b.id,
    bookingNumber: b.bookingNumber || b.id,
    professionalName: b.provider?.fullName || b.provider?.businessName || 'Assigned Professional',
    professionalCategory: b.category?.name || 'Specialist',
    projectTitle: b.notes || `${b.category?.name || 'Service'} Booking`,
    serviceCategory: b.category?.name || 'General Service',
    city: b.city || 'Hyderabad',
    address: b.customerAddress || 'Customer Site',
    scheduledDate: b.preferredDate ? new Date(b.preferredDate).toISOString() : new Date().toISOString(),
    status: mappedStatus,
    rawStatus: b.bookingStatus,
    amount: b.estimatedBudget || 0,
    createdAt: b.createdAt || new Date().toISOString(),
  };
}

/** Customer-side bookings view. All hooks are called unconditionally here. */
function CustomerBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State controls
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchBookings = () => setRefreshKey((k) => k + 1);

  // Fetch live bookings from API on mount and reload
  useEffect(() => {
    let isMounted = true;
    async function loadBookings() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const liveBookings = await bookingApi.getMyBookings();
        if (isMounted) {
          if (Array.isArray(liveBookings)) {
            const mapped = liveBookings.map(mapApiBookingToBooking);
            setBookings(mapped);
          } else {
            setBookings([]);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.warn('Could not load live bookings from API', err);
          setErrorMessage('Failed to load bookings from server.');
          setBookings([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadBookings();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const handleCancelBooking = async (id: string) => {
    try {
      await bookingApi.cancelBooking(id);
      setBookings((prev) =>
        prev.map((bk) => (bk.id === id ? { ...bk, status: 'Cancelled', rawStatus: 'CANCELLED' } : bk))
      );
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking((prev) => (prev ? { ...prev, status: 'Cancelled', rawStatus: 'CANCELLED' } : null));
      }
      alert('Project request cancelled successfully.');
    } catch (err: unknown) {
      console.error('Failed to cancel on server', err);
      let errorMsg = 'Failed to cancel project request. Please try again.';
      if (err && typeof err === 'object') {
        const anyErr = err as any;
        if (anyErr.response?.data?.message) {
          errorMsg = `Failed to cancel project request: ${anyErr.response.data.message}`;
        } else if (anyErr.message) {
          errorMsg = `Failed to cancel project request: ${anyErr.message}`;
        }
      }
      alert(errorMsg);
    }
  };

  const handleRescheduleBooking = (id: string) => {
    const nextWeek = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    setBookings((prev) =>
      prev.map((bk) =>
        bk.id === id ? { ...bk, status: 'Rescheduled', scheduledDate: nextWeek } : bk
      )
    );
    if (selectedBooking && selectedBooking.id === id) {
      setSelectedBooking((prev) => (prev ? { ...prev, status: 'Rescheduled', scheduledDate: nextWeek } : null));
    }
    alert('Target start date successfully rescheduled for next week.');
  };

  const handleSelectBooking = async (bk: Booking) => {
    setSelectedBooking(bk);
    try {
      const freshBooking = await bookingApi.getBookingDetails(bk.id);
      const mapped = mapApiBookingToBooking(freshBooking as any);
      setSelectedBooking(mapped);
      setBookings((prev) =>
        prev.map((b) => (b.id === bk.id ? mapped : b))
      );
    } catch (err) {
      console.error('Failed to fetch fresh booking details', err);
      let isPermissionOrNotFound = false;
      if (err && typeof err === 'object') {
        const anyErr = err as any;
        if (anyErr.response?.status === 404 || anyErr.response?.status === 403) {
          isPermissionOrNotFound = true;
        }
      }
      if (isPermissionOrNotFound) {
        alert('This project request is no longer available or you do not have permission to view it.');
        setSelectedBooking(null);
        setBookings((prev) => prev.filter((b) => b.id !== bk.id));
      }
    }
  };

  // Active statistics counts based on real live bookings
  const stats = {
    upcoming: bookings.filter((b) => ['scheduled', 'confirmed', 'requested'].includes(b.status.toLowerCase())).length,
    active: bookings.filter((b) => b.status.toLowerCase() === 'in progress').length,
    completed: bookings.filter((b) => b.status.toLowerCase() === 'completed').length,
    cancelled: bookings.filter((b) => ['cancelled', 'declined'].includes(b.status.toLowerCase())).length,
  };

  // Filter & Sort Logic
  const filteredBookings = bookings
    .filter((bk) => {
      const matchSearch = bk.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          bk.professionalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          bk.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || bk.status.toUpperCase() === statusFilter;
      const matchCategory = categoryFilter === 'ALL' || bk.serviceCategory.toUpperCase() === categoryFilter.toUpperCase();
      return matchSearch && matchStatus && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'NEWEST') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'OLDEST') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'UPCOMING') return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      if (sortBy === 'RECENTLY_UPDATED') return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
      return 0;
    });

  // Extract unique categories for filter list
  const uniqueCategories = Array.from(new Set(bookings.map((b) => b.serviceCategory)));

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left relative">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-stone-200 pb-5">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-stone-900 font-serif">Project Requests</h2>
          <p className="text-xs text-stone-500 font-medium">Track timelines, professional assignments, and status of your project requests.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchBookings}
            className="dbc-btn dbc-btn-md dbc-btn-secondary"
            title="Refresh requests"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => navigate('/')}
            className="dbc-btn dbc-btn-md dbc-btn-primary"
          >
            Find a Professional
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800">
          ⚠️ {errorMessage}
        </div>
      )}

      <div className="space-y-6">
        
        {/* Summary Row Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <BookingSummaryCard label="Submitted & Under Review" count={stats.upcoming} icon="📅" colorClass="text-emerald-600 bg-emerald-50/50" />
          <BookingSummaryCard label="In Progress" count={stats.active} icon="⚡" colorClass="text-amber-600 bg-amber-50/50" />
          <BookingSummaryCard label="Completed Projects" count={stats.completed} icon="✓" colorClass="text-sky-600 bg-sky-50/50" />
          <BookingSummaryCard label="Cancelled / Declined" count={stats.cancelled} icon="🚫" colorClass="text-rose-600 bg-rose-50/50" />
        </div>

        {/* Filters & Search Control */}
        <div className="bg-white border border-stone-200 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-3 justify-between">
          
          {/* Search Input */}
          <div className="relative flex items-center bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 w-full md:max-w-xs focus-within:border-emerald-600 focus-within:bg-white transition">
            <span className="text-stone-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Search requests or professionals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-xs text-stone-800 px-2 focus:outline-none"
            />
          </div>

          {/* Select options filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto text-[10px] font-bold text-stone-500 uppercase tracking-wide">
            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-600 transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="REQUEST SUBMITTED">Request Submitted</option>
              <option value="UNDER REVIEW">Under Review</option>
              <option value="PROJECT STARTED">Project Started</option>
              <option value="PROJECT COMPLETED">Project Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="DECLINED">Declined</option>
            </select>

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-600 transition"
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
              className="bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-600 transition"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="UPCOMING">Upcoming First</option>
              <option value="RECENTLY_UPDATED">Recently Updated</option>
            </select>
          </div>

        </div>

        {/* Split viewport: List grid + Detail drawer side panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* List panel */}
          <div className={`space-y-4 lg:col-span-2 ${selectedBooking ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            {loading ? (
              <div className="flex items-center justify-center p-12 bg-white rounded-xl border border-stone-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : filteredBookings.length > 0 ? (
              <div className={`grid grid-cols-1 gap-4 ${selectedBooking ? 'sm:grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                {filteredBookings.map((bk) => (
                  <BookingCard
                    key={bk.id}
                    booking={bk}
                    onSelect={() => handleSelectBooking(bk)}
                  />
                ))}
              </div>
            ) : (
              <BookingEmptyState onAction={() => navigate('/')} />
            )}
          </div>

          {/* Details panel (Drawer overlay/side box) */}
          {selectedBooking && (
            <div className="lg:col-span-1 sticky top-24">
              <BookingDetails
                booking={selectedBooking}
                onClose={() => setSelectedBooking(null)}
                onCancel={() => handleCancelBooking(selectedBooking.id)}
                onReschedule={() => handleRescheduleBooking(selectedBooking.id)}
              />
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

/** Role-dispatching shell — renders ProfessionalBookings for providers, CustomerBookings otherwise.
 *  Hooks (useAuth) are always called unconditionally before any branching. */
export default function WorkspaceBookings() {
  const { user } = useAuth();
  const normRole = (user?.role || '').toUpperCase();

  if (normRole.includes('PROVIDER')) {
    return <ProfessionalBookings />;
  }

  return <CustomerBookings />;
}


