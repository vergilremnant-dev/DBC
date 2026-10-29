import React, { useEffect, useState, useCallback, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppointmentService } from '../../services/contractor/AppointmentService.js';
import type { Appointment } from '../../types/contractor/AppointmentTypes.js';

export function AppointmentSchedulingPage() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states - Booking
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('CONSULTATION');
  const [providerId, setProviderId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Form states - Availability
  const [mondayStart, setMondayStart] = useState('09:00');
  const [mondayEnd, setMondayEnd] = useState('17:00');
  const [tuesdayStart, setTuesdayStart] = useState('09:00');
  const [tuesdayEnd, setTuesdayEnd] = useState('17:00');
  const [wednesdayStart, setWednesdayStart] = useState('09:00');
  const [wednesdayEnd, setWednesdayEnd] = useState('17:00');
  const [thursdayStart, setThursdayStart] = useState('09:00');
  const [thursdayEnd, setThursdayEnd] = useState('17:00');
  const [fridayStart, setFridayStart] = useState('09:00');
  const [fridayEnd, setFridayEnd] = useState('17:00');

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

  const loadAppointmentsList = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const list = await AppointmentService.listAppointments();
      setAppointments(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load scheduled appointments list');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSlots = useCallback(async () => {
    try {
      setLoadingSlots(true);
      const list = await AppointmentService.getAvailableSlots(providerId, bookingDate);
      setAvailableSlots(list);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoadingSlots(false);
    }
  }, [providerId, bookingDate]);

  useEffect(() => {
    startTransition(() => {
      loadAppointmentsList();
    });
  }, [loadAppointmentsList]);

  useEffect(() => {
    if (providerId && bookingDate) {
      startTransition(() => {
        loadSlots();
      });
    }
  }, [providerId, bookingDate, loadSlots]);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !bookingDate || !bookingTime) return;
    try {
      setError('');
      setSuccess('');

      // Build start/end ISO times
      const startIso = `${bookingDate}T${bookingTime}:00.000Z`;
      const endHour = Number(bookingTime.split(':')[0]) + 1;
      const endIso = `${bookingDate}T${endHour.toString().padStart(2, '0')}:00:00.000Z`;

      await AppointmentService.bookAppointment({
        title,
        description,
        eventType,
        startTime: startIso,
        endTime: endIso,
        providerId: providerId || undefined,
      });

      setSuccess('Appointment request sent successfully!');
      setTitle('');
      setDescription('');
      setBookingDate('');
      setBookingTime('');
      await loadAppointmentsList();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  async function handleSaveBlocks(e: React.FormEvent) {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const blocks = [
        { dayOfWeek: 1, startTime: mondayStart, endTime: mondayEnd },
        { dayOfWeek: 2, startTime: tuesdayStart, endTime: tuesdayEnd },
        { dayOfWeek: 3, startTime: wednesdayStart, endTime: wednesdayEnd },
        { dayOfWeek: 4, startTime: thursdayStart, endTime: thursdayEnd },
        { dayOfWeek: 5, startTime: fridayStart, endTime: fridayEnd },
      ];
      await AppointmentService.saveAvailabilityBlocks(blocks);
      setSuccess('Working availability blocks updated successfully!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      setError('');
      setSuccess('');
      await AppointmentService.updateAppointmentStatus(id, status);
      setSuccess(`Appointment transitioned to ${status}`);
      await loadAppointmentsList();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 rounded-full border-4 border-stone-200 border-t-emerald-700 animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-stone-600 uppercase tracking-widest">Loading Scheduler...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-16">
      {/* Top Banner Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <span className="bg-stone-100 text-stone-700 text-2xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Scheduler Engine
              </span>
              <h1 className="text-2xl font-bold text-stone-950 font-display leading-tight">
                Calendar & Appointment Hub
              </h1>
              <p className="text-sm text-stone-500">
                Centralized scheduling console for consultations, visits, site inspections, and progress updates.
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="self-start md:self-auto px-3.5 py-1.5 border border-stone-200 text-stone-600 rounded-lg text-xs font-semibold hover:bg-stone-50 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Messages */}
        {error && (
          <div role="alert" className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
            {error}
          </div>
        )}
        {success && (
          <div role="status" className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl text-sm font-semibold flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></span>
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Scheduled Appointments Board */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-stone-900 font-display mb-4">Upcoming Scheduled Events</h2>
              {appointments.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-sm">
                  No appointments scheduled. Add one using the scheduler wizard on the right.
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((apt) => (
                    <div key={apt.id} className="border border-stone-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-stone-50/50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-50 text-emerald-700 text-3xs font-bold px-1.5 py-0.5 rounded border border-emerald-100 uppercase">
                            {apt.eventType}
                          </span>
                          <span className="text-2xs text-stone-500 font-bold uppercase tracking-wider">
                            Status: {apt.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-stone-900">{apt.title}</h4>
                        {apt.description && <p className="text-xs text-stone-600">{apt.description}</p>}
                        <div className="text-2xs text-stone-500 font-bold uppercase">
                          Time: {new Date(apt.startTime).toLocaleString()} - {new Date(apt.endTime).toLocaleTimeString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {currentUserRole === 'PROVIDER' && apt.status === 'PENDING_CONFIRMATION' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(apt.id, 'CONFIRMED')}
                              className="px-3 py-1 bg-emerald-700 text-white rounded text-xs font-bold uppercase hover:bg-emerald-800"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleStatusChange(apt.id, 'REJECTED')}
                              className="px-3 py-1 bg-red-600 text-white rounded text-xs font-bold uppercase hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'CANCELLED')}
                            className="px-3 py-1 border border-stone-200 text-stone-600 rounded text-xs font-bold uppercase hover:bg-stone-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Appointment Wizard & Availability */}
          <div className="space-y-6">
            {/* Booking Wizard Form (Only for Client) */}
            {currentUserRole === 'CUSTOMER' && (
              <form onSubmit={handleBook} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-stone-950 uppercase tracking-widest font-display">Appointment Wizard</h3>
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-stone-500 uppercase">Event Title</label>
                  <input aria-label="Event Title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Site Visit & Inspection"
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-700"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-stone-500 uppercase">Event Type</label>
                    <select aria-label="Event Type"
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-700"
                    >
                      <option value="CONSULTATION">CONSULTATION</option>
                      <option value="SITE_VISIT">SITE VISIT</option>
                      <option value="INSPECTION">INSPECTION</option>
                      <option value="PROGRESS_REVIEW">PROGRESS REVIEW</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-stone-500 uppercase">Provider UUID</label>
                    <input aria-label="Provider UUID"
                      type="text"
                      value={providerId}
                      onChange={(e) => setProviderId(e.target.value)}
                      placeholder="e.g. uuid-key"
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-700"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-stone-500 uppercase">Select Date</label>
                  <input aria-label="Select Date"
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-700"
                  />
                </div>
                {bookingDate && providerId && (
                  <div className="space-y-1">
                    <label className="text-2xs font-bold text-stone-500 uppercase">Available Time Slots</label>
                    {loadingSlots ? (
                      <div className="text-xs text-stone-400">Loading Slots...</div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-xs text-amber-600 font-semibold">No available slots for this date.</div>
                    ) : (
                      <select
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-700"
                      >
                        <option value="">-- Choose Slot --</option>
                        {availableSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-2xs font-bold text-stone-500 uppercase">Description / Notes</label>
                  <textarea aria-label="Description / Notes"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Discuss drawings and layouts..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-700 h-20"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-emerald-700 text-white text-xs font-bold uppercase rounded-lg hover:bg-emerald-800 transition">
                  Book Slot
                </button>
              </form>
            )}

            {/* Provider availability settings manager */}
            {currentUserRole === 'PROVIDER' && (
              <form onSubmit={handleSaveBlocks} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-stone-950 uppercase tracking-widest font-display">Shift Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-stone-700">Monday</span>
                    <div className="flex items-center gap-1.5">
                      <input type="text" value={mondayStart} onChange={(e) => setMondayStart(e.target.value)} className="w-14 text-center text-xs bg-stone-50 border rounded py-1" />
                      <span className="text-stone-400">-</span>
                      <input type="text" value={mondayEnd} onChange={(e) => setMondayEnd(e.target.value)} className="w-14 text-center text-xs bg-stone-50 border rounded py-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-stone-700">Tuesday</span>
                    <div className="flex items-center gap-1.5">
                      <input type="text" value={tuesdayStart} onChange={(e) => setTuesdayStart(e.target.value)} className="w-14 text-center text-xs bg-stone-50 border rounded py-1" />
                      <span className="text-stone-400">-</span>
                      <input type="text" value={tuesdayEnd} onChange={(e) => setTuesdayEnd(e.target.value)} className="w-14 text-center text-xs bg-stone-50 border rounded py-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-stone-700">Wednesday</span>
                    <div className="flex items-center gap-1.5">
                      <input type="text" value={wednesdayStart} onChange={(e) => setWednesdayStart(e.target.value)} className="w-14 text-center text-xs bg-stone-50 border rounded py-1" />
                      <span className="text-stone-400">-</span>
                      <input type="text" value={wednesdayEnd} onChange={(e) => setWednesdayEnd(e.target.value)} className="w-14 text-center text-xs bg-stone-50 border rounded py-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-stone-700">Thursday</span>
                    <div className="flex items-center gap-1.5">
                      <input type="text" value={thursdayStart} onChange={(e) => setThursdayStart(e.target.value)} className="w-14 text-center text-xs bg-stone-50 border rounded py-1" />
                      <span className="text-stone-400">-</span>
                      <input type="text" value={thursdayEnd} onChange={(e) => setThursdayEnd(e.target.value)} className="w-14 text-center text-xs bg-stone-50 border rounded py-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-stone-700">Friday</span>
                    <div className="flex items-center gap-1.5">
                      <input type="text" value={fridayStart} onChange={(e) => setFridayStart(e.target.value)} className="w-14 text-center text-xs bg-stone-50 border rounded py-1" />
                      <span className="text-stone-400">-</span>
                      <input type="text" value={fridayEnd} onChange={(e) => setFridayEnd(e.target.value)} className="w-14 text-center text-xs bg-stone-50 border rounded py-1" />
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full py-2 bg-stone-900 text-white text-xs font-bold uppercase rounded-lg hover:bg-stone-850 transition">
                  Save Shift Settings
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
