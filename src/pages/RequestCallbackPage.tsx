import { useState, useEffect, startTransition } from 'react';

import { categoryApi } from '../services/category/categoryService';
import { callbackApi } from '../services/callback/callbackService';
import { validateCallbackRequest, validateEmail } from '../utils/callbackValidation';
import { BRAND } from '../config/branding';
import type { ServiceCategory } from '../types/category/categoryTypes';
import type { CallbackRequest } from '../types/callback/callbackTypes';
import { useNavigation } from '../context/NavigationContext';

export function RequestCallbackPage() {
  const { selectedCity } = useNavigation();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState(selectedCity);
  const state = 'Telangana';
  const [preferredLanguage, setPreferredLanguage] = useState('Telugu');
  const [serviceCategoryId, setServiceCategoryId] = useState('');
  const [projectType, setProjectType] = useState('Renovation');
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [preferredCallTime, setPreferredCallTime] = useState('Anytime');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);

  // Sync city state when selectedCity changes
  useEffect(() => {
    startTransition(() => {
      setCity(selectedCity);
    });
  }, [selectedCity]);
  const [error, setError] = useState('');
  const [submittedRequest, setSubmittedRequest] = useState<CallbackRequest | null>(null);

  // Status tracking states
  const [trackRef, setTrackRef] = useState('');
  const [trackedStatus, setTrackedStatus] = useState<CallbackRequest | null>(null);
  const [trackError, setTrackError] = useState('');
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      try {
        const list = await categoryApi.getCategories();
        setCategories(list);
      } catch (err: unknown) {
        console.error(err);
      }
    }
    loadCategories();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmittedRequest(null);

    const validation = validateCallbackRequest(fullName, phoneNumber);
    if (!validation.valid) {
      setError(validation.error || 'Form validation failed');
      return;
    }

    if (email && !validateEmail(email)) {
      setError('Please enter a valid email format');
      return;
    }

    setLoading(true);
    try {
      const response = await callbackApi.createCallback({
        fullName,
        phoneNumber,
        email: email || undefined,
        city,
        state,
        preferredLanguage,
        serviceCategoryId: serviceCategoryId ? Number(serviceCategoryId) : undefined,
        projectType,
        estimatedBudget: estimatedBudget ? Number(estimatedBudget) : undefined,
        preferredCallTime,
        message,
        source: 'Website',
      });
      setSubmittedRequest(response);
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(axiosMsg || (err instanceof Error ? err.message : 'Failed to submit callback request'));
    } finally {
      setLoading(false);
    }
  }

  async function handleTrackStatus(e: React.FormEvent) {
    e.preventDefault();
    setTrackError('');
    setTrackedStatus(null);

    if (!trackRef.trim()) {
      setTrackError('Please enter a reference number');
      return;
    }

    setTracking(true);
    try {
      const response = await callbackApi.trackCallbackStatus(trackRef.trim());
      setTrackedStatus(response);
    } catch (err: unknown) {
      const axiosMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setTrackError(axiosMsg || (err instanceof Error ? err.message : 'Reference number not found'));
    } finally {
      setTracking(false);
    }
  }

  return (
    <div className="bg-warm-cream text-stone-900 font-sans pb-16">

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 grid gap-8 lg:grid-cols-3">
        {/* Left Column: Input Form sheets */}
        <section className="lg:col-span-2 space-y-6">
          {submittedRequest ? (
            <div className="rounded-2xl border border-emerald-250 bg-white p-8 shadow-sm text-center border-emerald-100">
              <span className="text-5xl">🎉</span>
              <h1 className="mt-4 text-2xl font-bold text-emerald-950 font-display">Callback Request Submitted!</h1>
              <p className="mt-2 text-xs sm:text-sm text-stone-600">
                An expert coordinator from {BRAND.name} will call you to plan your project details.
              </p>
              <div className="mt-6 inline-block bg-stone-50 border border-stone-100 px-6 py-4 rounded-xl">
                <span className="block text-3xs uppercase font-bold tracking-wider text-stone-500">Your Reference Number</span>
                <strong className="text-xl font-mono text-stone-900 select-all tracking-wide">{submittedRequest.referenceNumber}</strong>
              </div>
              <p className="mt-4 text-2xs text-stone-500">Copy and save this reference number to track call progress.</p>
              <button
                onClick={() => setSubmittedRequest(null)}
                className="mt-8 rounded-lg bg-stone-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-stone-850 hover:shadow transition cursor-pointer"
              >
                Submit Another Request
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm">
              <h1 className="text-2xl font-bold text-stone-900 font-display">Talk to our Experts</h1>
              <p className="mt-1 text-xs text-stone-600">
                Provide your contact information and details. We will call you for a free consultation.
              </p>

              {error && (
                <div role="alert" className="mt-4 rounded-lg bg-rose-50 border border-rose-100 p-4 text-xs text-rose-800 leading-relaxed">
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-2xs font-bold uppercase tracking-wider text-stone-500">Full Name *</label>
                    <input aria-label="Full Name"
                      type="text"
                      required
                      placeholder="e.g. Sanjay Chagantipati"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-medium text-stone-900 outline-none transition duration-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50/50"
                    />
                  </div>

                  <div>
                    <label className="text-2xs font-bold uppercase tracking-wider text-stone-500">Phone Number *</label>
                    <input aria-label="Phone Number"
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-medium text-stone-900 outline-none transition duration-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-2xs font-bold uppercase tracking-wider text-stone-500">Email Address (Optional)</label>
                  <input aria-label="Email Address (Optional)"
                    type="email"
                    placeholder="e.g. name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-medium text-stone-900 outline-none transition duration-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50/50"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-2xs font-bold uppercase tracking-wider text-stone-500">City</label>
                    <input aria-label="City"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-medium text-stone-900 outline-none transition duration-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50/50"
                    />
                  </div>

                  <div>
                    <label className="text-2xs font-bold uppercase tracking-wider text-stone-500">Preferred Language</label>
                    <select aria-label="Preferred Language"
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-medium text-stone-900 outline-none transition duration-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50/50"
                    >
                      <option>Telugu</option>
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Tamil</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-2xs font-bold uppercase tracking-wider text-stone-500">Service Category (Optional)</label>
                    <select aria-label="Service Category (Optional)"
                      value={serviceCategoryId}
                      onChange={(e) => setServiceCategoryId(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-medium text-stone-900 outline-none transition duration-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50/50"
                    >
                      <option value="">Select Service</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-2xs font-bold uppercase tracking-wider text-stone-500">Project Type</label>
                    <select aria-label="Project Type"
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-medium text-stone-900 outline-none transition duration-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50/50"
                    >
                      <option>Home Construction</option>
                      <option>Renovation</option>
                      <option>Interior Design</option>
                      <option>Waterproofing</option>
                      <option>Electrical/Plumbing Planning</option>
                      <option>Budget Planning</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-2xs font-bold uppercase tracking-wider text-stone-500">Estimated Budget (Optional)</label>
                    <input aria-label="Estimated Budget (Optional)"
                      type="number"
                      placeholder="e.g. 50000"
                      value={estimatedBudget}
                      onChange={(e) => setEstimatedBudget(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-medium text-stone-900 outline-none transition duration-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50/50"
                    />
                  </div>

                  <div>
                    <label className="text-2xs font-bold uppercase tracking-wider text-stone-500">Preferred Call Time</label>
                    <select aria-label="Preferred Call Time"
                      value={preferredCallTime}
                      onChange={(e) => setPreferredCallTime(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-medium text-stone-900 outline-none transition duration-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50/50"
                    >
                      <option>Anytime</option>
                      <option>Morning (9 AM - 12 PM)</option>
                      <option>Afternoon (12 PM - 4 PM)</option>
                      <option>Evening (4 PM - 7 PM)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-2xs font-bold uppercase tracking-wider text-stone-500">Message / Project Brief</label>
                  <textarea aria-label="Message / Project Brief"
                    placeholder="Provide details about the work required..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-medium text-stone-900 outline-none transition duration-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50/50 resize-y min-h-24"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-emerald-700 py-3 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300 shadow cursor-pointer mt-2"
                >
                  {loading ? 'Registering Request...' : 'Submit Callback Request'}
                </button>
              </form>
            </div>
          )}
        </section>

        {/* Right Column: Track status widget */}
        <section className="space-y-6">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-stone-900 font-display">Track Callback Request</h3>
            <p className="text-2xs text-stone-500 mt-1">Already submitted a request? Check its status here.</p>

            {trackError && (
              <div role="alert" className="mt-3 rounded-lg bg-rose-50 border border-rose-100 p-3 text-xs text-rose-800 leading-relaxed">
                ⚠️ {trackError}
              </div>
            )}

            <form onSubmit={handleTrackStatus} className="mt-5 space-y-3">
              <input
                type="text"
                placeholder="Enter Reference Number"
                value={trackRef}
                onChange={(e) => setTrackRef(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-medium text-stone-900 outline-none transition duration-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50/50"
              />
              <button
                type="submit"
                disabled={tracking}
                className="w-full rounded-lg bg-stone-900 py-2.5 text-xs font-bold text-white hover:bg-stone-850 hover:shadow transition disabled:opacity-50 cursor-pointer"
              >
                {tracking ? 'Checking...' : 'Check Status'}
              </button>
            </form>

            {trackedStatus && (
              <div className="mt-6 border-t border-stone-100 pt-5 space-y-4">
                <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
                  <span className="text-3xs font-bold text-stone-500 uppercase tracking-wider block">Status</span>
                  <p className="mt-0.5 text-xs font-extrabold text-emerald-800 uppercase tracking-wide">{trackedStatus.status}</p>
                </div>
                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <span className="text-3xs font-bold text-stone-500 uppercase tracking-wider block">Name</span>
                    <p className="text-xs font-semibold text-stone-850">{trackedStatus.fullName}</p>
                  </div>
                  <div>
                    <span className="text-3xs font-bold text-stone-500 uppercase tracking-wider block">Preferred Time</span>
                    <p className="text-xs font-semibold text-stone-850">{trackedStatus.preferredCallTime}</p>
                  </div>
                </div>
                {trackedStatus.category?.name && (
                  <div>
                    <span className="text-3xs font-bold text-stone-500 uppercase tracking-wider block">Category</span>
                    <p className="text-xs font-semibold text-stone-850">{trackedStatus.category.name}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
