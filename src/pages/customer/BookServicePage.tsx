import React, { useState, useEffect, startTransition } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { bookingApi } from '../../services/booking/bookingService';
import { searchApi } from '../../services/search/searchService';
import { CustomerPageShell } from '../../components/customer/CustomerPageShell';
import { useNavigation } from '../../context/NavigationContext';
import type { ProviderProfile } from '../../types/provider/providerTypes';

export function BookServicePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedCity } = useNavigation();

  const urlProviderId = searchParams.get('providerId') || '';
  const urlCategoryId = Number(searchParams.get('categoryId') || 0);
  const urlCity = searchParams.get('city');
  const urlTimeline = searchParams.get('timeline');
  const urlBudget = searchParams.get('budget');
  const urlNotes = searchParams.get('notes') || searchParams.get('intent');

  const [providerId, setProviderId] = useState(urlProviderId);
  const [categoryId, setCategoryId] = useState(urlCategoryId);
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);

  const [providersList, setProvidersList] = useState<ProviderProfile[]>([]);
  const [fetchingOptions, setFetchingOptions] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState('');
  const [time] = useState('10:00 AM');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState(urlCity || selectedCity || 'Hyderabad');
  const [state, setState] = useState('Telangana');
  const [notes, setNotes] = useState(urlNotes || '');
  const [timeline, setTimeline] = useState(urlTimeline || '1–3 months');
  const [budgetRange, setBudgetRange] = useState(urlBudget || '₹5L – ₹15L');

  const [loading, setLoading] = useState(false);
  const submittingRef = React.useRef(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdBookingNumber, setCreatedBookingNumber] = useState('');

  // Sync city state when selectedCity changes (if not explicitly overridden by URL)
  useEffect(() => {
    startTransition(() => {
      if (selectedCity && !urlCity) setCity(selectedCity);
    });
  }, [selectedCity, urlCity]);

  // Load provider details if providerId is in URL, or load options if missing
  useEffect(() => {
    let isMounted = true;
    async function loadMeta() {
      setFetchingOptions(true);
      try {
        const provsRes = await searchApi.searchProviders({ limit: 50 }).catch(() => ({ data: [] }));

        if (!isMounted) return;

        const provs = (provsRes && provsRes.data) || [];
        setProvidersList(provs);

        if (urlProviderId) {
          const match = provs.find((p: ProviderProfile) => p.id === urlProviderId);
          if (match) {
            setSelectedProvider(match);
            setProviderId(match.id);
            if (match.categoryId) setCategoryId(match.categoryId);
          }
        } else if (provs.length > 0) {
          // Default to first available provider
          setProviderId(provs[0].id);
          setSelectedProvider(provs[0]);
          if (provs[0].categoryId) setCategoryId(provs[0].categoryId);
        }
      } catch (e) {
        console.error('Error loading booking prerequisites', e);
      } finally {
        if (isMounted) setFetchingOptions(false);
      }
    }
    loadMeta();
    return () => {
      isMounted = false;
    };
  }, [urlProviderId, urlCategoryId]);

  const handleProviderSelectChange = (newPid: string) => {
    setProviderId(newPid);
    const match = providersList.find((p) => p.id === newPid);
    if (match) {
      setSelectedProvider(match);
      if (match.categoryId) setCategoryId(match.categoryId);
    }
  };

  const getProviderInitials = (name?: string) => {
    if (!name) return 'DBC';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const formatDateLabel = (d: string) => {
    if (!d) return 'Select date';
    try {
      const parsed = new Date(d + 'T00:00:00');
      return parsed.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return d;
    }
  };

  const BUDGET_MAPPING: Record<string, number | null> = {
    'Under ₹1 Lakh': 50000,
    '₹1L – ₹5L': 300000,
    '₹5L – ₹15L': 1000000,
    '₹15L – ₹50L': 3250000,
    '₹50L+': 7500000,
    'To Be Discussed': null,
  };

  async function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current || loading) return;

    submittingRef.current = true;
    setLoading(true);
    setError('');
    setMessage('');

    if (!providerId) {
      setError('Please select a professional before requesting a quote.');
      setLoading(false);
      submittingRef.current = false;
      return;
    }

    if (!date) {
      setError('Please select a target start date.');
      setLoading(false);
      submittingRef.current = false;
      return;
    }

    if (!address.trim()) {
      setError('Please provide the service location address.');
      setLoading(false);
      submittingRef.current = false;
      return;
    }

    if (!notes.trim()) {
      setError('Please provide a project description explaining what you want to build or discuss.');
      setLoading(false);
      submittingRef.current = false;
      return;
    }

    try {
      const fullNotes = `Expected Timeline: ${timeline}\nBudget Range: ${budgetRange}\n\nProject Description:\n${notes}`;
      const numericBudget = BUDGET_MAPPING[budgetRange] || null;

      const response = await bookingApi.createBooking({
        providerId,
        categoryId: categoryId || 1,
        preferredDate: date,
        preferredTime: time,
        customerAddress: address,
        city,
        state,
        notes: fullNotes,
        estimatedBudget: numericBudget,
      });

      setCreatedBookingNumber(response.bookingNumber);
      setIsSubmitted(true);
    } catch (err: unknown) {
      let errMsg = 'Failed to submit request';
      if (axios.isAxiosError(err)) {
        errMsg = err.response?.data?.message || err.message || errMsg;
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }

  if (isSubmitted) {
    return (
      <CustomerPageShell>
        <div className="mx-auto max-w-xl text-center space-y-8 py-12 animate-in fade-in zoom-in duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-3xl mx-auto border border-emerald-200 shadow-xs font-serif font-black">
            ✓
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-serif">
              Project Request Submitted
            </h1>
            <p className="text-sm text-stone-600 font-medium leading-relaxed">
              Your project request <span className="font-extrabold text-stone-900">#{createdBookingNumber}</span> has been successfully sent to <span className="font-extrabold text-stone-900">{selectedProvider?.fullName || selectedProvider?.businessName || 'DBC Professional'}</span>.
            </p>
          </div>

          <div className="bg-white border border-stone-200 rounded-3xl p-6 text-left space-y-4 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-900">What happens next?</h3>
            <div className="space-y-3">
              {[
                { label: 'Project request dispatched to professional', checked: true },
                { label: 'Initial specifications verified by DBC', checked: true },
                { label: 'Professional reviews requirements & drawings', checked: false, current: true },
                { label: 'Professional contacts you via chat or phone', checked: false },
                { label: 'Discuss details & receive structural quote proposal', checked: false },
                { label: 'Authorize proposal & release milestones in your dashboard', checked: false }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-[11.5px] font-semibold">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] flex-shrink-0 border ${
                    item.checked 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                      : item.current 
                        ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse' 
                        : 'bg-stone-50 text-stone-300 border-stone-200'
                  }`}>
                    {item.checked ? '✓' : item.current ? '→' : '•'}
                  </span>
                  <span className={`${item.checked ? 'text-stone-400 line-through font-normal' : item.current ? 'text-stone-900 font-black' : 'text-stone-500 font-semibold'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/workspace/bookings')}
              className="dbc-btn dbc-btn-primary h-11 px-6 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              View My Requests
            </button>
            <button
              onClick={() => navigate('/')}
              className="dbc-btn dbc-btn-outline h-11 px-6 rounded-lg text-xs font-bold uppercase tracking-wider bg-white cursor-pointer"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      </CustomerPageShell>
    );
  }

  return (
    <CustomerPageShell>
      <div className="mx-auto max-w-5xl space-y-6 text-left">
        {/* Page Header */}
        <div className="border-b border-stone-200/80 pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-50 border border-emerald-200/80 text-[10px] font-black uppercase tracking-widest text-emerald-800 mb-2">
                <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Verified Project Inquiry
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-serif">
                Request Project Quote
              </h1>
              <p className="mt-1 text-sm text-stone-600 font-medium">
                Submit your project requirements and spatial parameters to receive a coordinate proposal.
              </p>
            </div>

            <Link
              to="/search"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-600 hover:text-emerald-800 transition"
            >
              <span>← Browse all professionals</span>
            </Link>
          </div>
        </div>

        {/* Status Messages */}
        {message && (
          <div className="rounded-2xl bg-emerald-50/90 border border-emerald-200 p-4 text-xs font-bold text-emerald-900 flex items-center gap-3 shadow-xs animate-in fade-in">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs flex-shrink-0">
              ✓
            </span>
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-rose-50/90 border border-rose-200 p-4 text-xs font-bold text-rose-900 flex items-center gap-3 shadow-xs animate-in fade-in">
            <span className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs flex-shrink-0">
              ⚠️
            </span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleBookingSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form & Professional Details (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Professional Selection (if not locked by URL) */}
              {!urlProviderId && providersList.length > 0 && (
                <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
                  <label className="block text-[11px] font-black uppercase tracking-wider text-stone-600 mb-2">
                    Select Professional
                  </label>
                  <div className="relative">
                    <select
                      value={providerId}
                      onChange={(e) => handleProviderSelectChange(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition appearance-none cursor-pointer pr-10"
                      required
                    >
                      {providersList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.fullName} — {p.businessName || p.category?.name || 'Professional'} ({p.city})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Professional Card */}
              {selectedProvider && (
                <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs relative overflow-hidden bg-blueprint-grid">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      {selectedProvider.profileImage ? (
                        <img
                          src={selectedProvider.profileImage}
                          alt={selectedProvider.fullName}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border border-emerald-200/80 shadow-xs flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-white font-extrabold flex items-center justify-center text-lg sm:text-xl uppercase shadow-xs flex-shrink-0 border border-emerald-600">
                          {getProviderInitials(selectedProvider.fullName)}
                        </div>
                      )}

                      {/* Name & Details Hierarchy */}
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                            {selectedProvider.fullName}
                          </h2>
                        </div>

                        <p className="text-xs font-semibold text-stone-600">
                          {selectedProvider.businessName || selectedProvider.category?.name || 'Verified DBC Professional'}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1 text-[11px] text-stone-500 font-medium">
                          {/* Rating */}
                          <span className="inline-flex items-center gap-1 font-bold text-stone-800">
                            <span className="text-amber-500">★</span>
                            {selectedProvider.averageRating ? selectedProvider.averageRating.toFixed(1) : '5.0'}
                            {selectedProvider.totalReviews !== undefined && (
                              <span className="font-normal text-stone-500">({selectedProvider.totalReviews})</span>
                            )}
                          </span>

                          <span className="text-stone-300">•</span>

                          {/* Location */}
                          <span className="inline-flex items-center gap-1 text-stone-600">
                            <svg className="w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {selectedProvider.city}{selectedProvider.state ? `, ${selectedProvider.state}` : ''}
                          </span>

                          {/* Real Statistics Only (Experience / Bookings if present) */}
                          {selectedProvider.experienceYears > 0 && (
                            <>
                              <span className="text-stone-300">•</span>
                              <span className="text-stone-700 font-semibold">
                                {selectedProvider.experienceYears}+ Yrs Exp
                              </span>
                            </>
                          )}

                          {selectedProvider.totalBookings > 0 && (
                            <>
                              <span className="text-stone-300">•</span>
                              <span className="text-stone-700 font-semibold">
                                {selectedProvider.totalBookings} Projects Completed
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Verified Badge */}
                    <div className="flex-shrink-0 self-start">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider shadow-2xs">
                        <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                        Verified Professional
                      </span>
                    </div>
                  </div>

                  {selectedProvider.description && (
                    <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-600 font-normal leading-relaxed">
                      {selectedProvider.description}
                    </div>
                  )}
                </div>
              )}

              {/* Section 1: Expected Project Start & Timeline */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 font-black text-[10px] flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-sm font-bold text-stone-900 tracking-tight">
                      Expected Project Start & Timeline
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500 font-medium mt-1 ml-7">
                    Select your expected project start date.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-1">
                  {/* Target Start Date */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-stone-600 mb-1.5">
                      Target Start Date <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        min={todayStr}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full h-11 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Project Location & Scope */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-700 font-black text-[10px] flex items-center justify-center">
                      2
                    </span>
                    <h3 className="text-sm font-bold text-stone-900 tracking-tight">
                      Project Location & Scope
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500 font-medium mt-1 ml-7">
                    Provide the property address, timeline, budget range, and project scope details.
                  </p>
                </div>

                <div className="space-y-4 pt-1">
                  {/* Service Address */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-stone-600 mb-1.5">
                      Service Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Flat 104, Plot 82, Road No. 36, Jubilee Hills"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full h-11 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                    />
                  </div>

                  {/* City & State Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-stone-600 mb-1.5">
                        City <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full h-11 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-stone-600 mb-1.5">
                        State <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full h-11 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  {/* Project Timeline */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-stone-600 mb-1.5">
                      Project Timeline <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={timeline}
                        onChange={(e) => setTimeline(e.target.value)}
                        className="w-full h-11 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition appearance-none cursor-pointer pr-10"
                      >
                        <option value="Immediately">Immediately</option>
                        <option value="Within 1 month">Within 1 month</option>
                        <option value="1–3 months">1–3 months</option>
                        <option value="3–6 months">3–6 months</option>
                        <option value="6+ months">6+ months</option>
                        <option value="Not decided yet">Not decided yet</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Approximate Budget */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-stone-600 mb-1.5">
                      Approximate Budget <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={budgetRange}
                        onChange={(e) => setBudgetRange(e.target.value)}
                        className="w-full h-11 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition appearance-none cursor-pointer pr-10"
                      >
                        <option value="Under ₹1 Lakh">Under ₹1 Lakh</option>
                        <option value="₹1L – ₹5L">₹1L – ₹5L</option>
                        <option value="₹5L – ₹15L">₹5L – ₹15L</option>
                        <option value="₹15L – ₹50L">₹15L – ₹50L</option>
                        <option value="₹50L+">₹50L+</option>
                        <option value="To Be Discussed">To Be Discussed</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Project Description */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-stone-600 mb-1.5">
                      Project Description & Scope Requirements <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      placeholder="Explain what you want to build, renovate, design, or repair. Mention any dimensions, special instructions, or specifications..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-stone-200 bg-white p-3.5 text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Sticky Booking Summary Card & Action (5 Cols) */}
            <div className="lg:col-span-5 lg:sticky lg:top-18 space-y-4">
              <div className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 shadow-sm space-y-5">
                
                {/* Summary Title */}
                <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Request Summary
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Step 3
                  </span>
                </div>

                {/* Summary Fields Breakdown */}
                <div className="space-y-3.5 text-xs">
                  {/* Service */}
                  <div className="flex justify-between items-start gap-3">
                    <span className="text-stone-500 font-medium">Service</span>
                    <span className="font-bold text-stone-900 text-right">
                      {selectedProvider?.category?.name || 'General Construction & Architecture'}
                    </span>
                  </div>

                  {/* Professional */}
                  <div className="flex justify-between items-start gap-3 border-t border-stone-100 pt-2.5">
                    <span className="text-stone-500 font-medium">Professional</span>
                    <span className="font-bold text-stone-900 text-right">
                      {selectedProvider?.fullName || 'Not selected'}
                    </span>
                  </div>

                  {/* Start Date */}
                  <div className="flex justify-between items-start gap-3 border-t border-stone-100 pt-2.5">
                    <span className="text-stone-500 font-medium">Start Date</span>
                    <span className={`font-bold text-right ${date ? 'text-stone-900' : 'text-stone-400 font-normal italic'}`}>
                      {date ? formatDateLabel(date) : 'Choose date'}
                    </span>
                  </div>

                  {/* Expected Timeline */}
                  <div className="flex justify-between items-start gap-3 border-t border-stone-100 pt-2.5">
                    <span className="text-stone-500 font-medium">Timeline</span>
                    <span className="font-bold text-stone-900 text-right">{timeline}</span>
                  </div>

                  {/* Budget */}
                  <div className="flex justify-between items-start gap-3 border-t border-stone-100 pt-2.5">
                    <span className="text-stone-500 font-medium">Budget Range</span>
                    <span className="font-bold text-stone-900 text-right">{budgetRange}</span>
                  </div>

                  {/* Address */}
                  <div className="flex justify-between items-start gap-3 border-t border-stone-100 pt-2.5">
                    <span className="text-stone-500 font-medium">Address</span>
                    <span className={`font-bold text-right max-w-[200px] truncate ${address ? 'text-stone-900' : 'text-stone-400 font-normal italic'}`}>
                      {address ? `${address}, ${city}` : 'Enter address'}
                    </span>
                  </div>
                </div>

                {/* Payment Messaging Info Box */}
                <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-3.5 space-y-1.5 text-left">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-black uppercase text-emerald-800 tracking-wider">
                    <span>💵 Zero Upfront Payments</span>
                  </div>
                  <p className="text-[10px] text-stone-600 font-medium leading-relaxed">
                    No payment is required to submit this project request. You will discuss the project scope and proposal with the professional before starting work.
                  </p>
                </div>

                {/* Trust & Guarantee Box */}
                <div className="rounded-xl bg-stone-50 border border-stone-200/80 p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-stone-800">
                    <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>DBC Verified Quality Standards</span>
                  </div>
                  <p className="text-[10px] text-stone-500 font-medium leading-normal pl-5.5">
                    Direct on-site scope evaluation and milestone tracking via your DBC workspace.
                  </p>
                </div>

                {/* 8. Confirm Booking Button */}
                <button
                  type="submit"
                  disabled={loading || fetchingOptions || !providerId}
                  className="w-full h-12 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-black uppercase tracking-wider transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <span>Submit Request</span>
                  )}
                </button>

                <p className="text-[10px] text-stone-400 text-center font-medium">
                  By confirming, a project quote request is dispatched to the professional.
                </p>

              </div>
            </div>

          </div>
        </form>
      </div>
    </CustomerPageShell>
  );
}

