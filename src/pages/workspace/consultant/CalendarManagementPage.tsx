import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ==========================================
// Types & Interfaces
// ==========================================
type CalendarViewType = 'day' | 'week' | 'month' | 'agenda';

interface Appointment {
  id: string;
  customerName: string;
  projectTitle: string;
  date: string;
  time: string;
  duration: string;
  consultationType: string;
  mode: 'Video Call' | 'In-Person' | 'Site Visit';
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
  priority: 'High' | 'Medium' | 'Low';
  countdownText?: string;
}

interface TimeSlot {
  id: string;
  time: string;
  isBlocked: boolean;
  appointmentId?: string;
}

export default function CalendarManagementPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [calendarView, setCalendarView] = useState<CalendarViewType>('month');
  
  // Statuses & Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modeFilter, setModeFilter] = useState('ALL');
  const priorityFilter = 'ALL';

  // Availability state
  const [workingDays, setWorkingDays] = useState({
    Monday: true, Tuesday: true, Wednesday: true, Thursday: true, Friday: true, Saturday: false, Sunday: false
  });
  const [workingHours, setWorkingHours] = useState('09:00 AM - 06:00 PM');
  const [bufferTime, setBufferTime] = useState('15 mins');

  // Selected Day inside Grid
  const [selectedDay, setSelectedDay] = useState(1);

  // Rescheduling state
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState<string | null>(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState('2026-08-05');
  const [newRescheduleTime, setNewRescheduleTime] = useState('11:00 AM');

  // Confirmations
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Last synced: 5 mins ago');

  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: 'APT-01', customerName: 'Amit Patel', projectTitle: 'Modern Villa Vastu Audit', date: '2026-08-03', time: '10:00 AM', duration: '60 mins', consultationType: 'Structural Design Review', mode: 'Video Call', status: 'Confirmed', priority: 'High', countdownText: 'Starts in 2 hours' },
    { id: 'APT-02', customerName: 'Sanjana Sen', projectTitle: 'Kitchen Space Optimization Design', date: '2026-08-04', time: '02:00 PM', duration: '90 mins', consultationType: 'Interior Space Check', mode: 'In-Person', status: 'Pending', priority: 'Medium', countdownText: 'Tomorrow at 2:00 PM' },
    { id: 'APT-03', customerName: 'Rajesh Reddy', projectTitle: 'Duplex Foundation Soil Inspection', date: '2026-08-05', time: '11:00 AM', duration: '120 mins', consultationType: 'Geotechnical Soil Audit', mode: 'Site Visit', status: 'Confirmed', priority: 'High', countdownText: 'In 4 days' },
    { id: 'APT-04', customerName: 'Priya Nair', projectTitle: 'Solar Rooftop Permitting Check', date: '2026-08-06', time: '04:00 PM', duration: '60 mins', consultationType: 'Renewables Load Permit Check', mode: 'Video Call', status: 'Confirmed', priority: 'Low', countdownText: 'In 5 days' },
    { id: 'APT-05', customerName: 'Vijay Kulkarni', projectTitle: 'Plumbing Ceiling Seepage Audit', date: '2026-07-30', time: '11:00 AM', duration: '60 mins', consultationType: 'Plumbing Redirection Audit', mode: 'In-Person', status: 'Completed', priority: 'Medium' }
  ]);

  // Hourly slots for slot manager
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { id: 'slot-1', time: '09:00 AM - 10:00 AM', isBlocked: false },
    { id: 'slot-2', time: '10:00 AM - 11:00 AM', isBlocked: true, appointmentId: 'APT-01' },
    { id: 'slot-3', time: '11:00 AM - 12:00 PM', isBlocked: false },
    { id: 'slot-4', time: '12:00 PM - 01:00 PM', isBlocked: true }, // Lunch Block
    { id: 'slot-5', time: '02:00 PM - 03:00 PM', isBlocked: false },
    { id: 'slot-6', time: '03:00 PM - 04:00 PM', isBlocked: false },
  ]);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    return {
      todayCount: appointments.filter(a => a.date === '2026-08-03' && a.status !== 'Cancelled').length,
      upcomingCount: appointments.filter(a => a.status === 'Confirmed' && a.date >= '2026-08-03').length,
      pendingCount: appointments.filter(a => a.status === 'Pending').length,
      slotsCount: timeSlots.filter(t => !t.isBlocked).length,
      completedCount: appointments.filter(a => a.status === 'Completed').length,
      cancelledCount: appointments.filter(a => a.status === 'Cancelled').length,
    };
  }, [appointments, timeSlots]);

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const matchStatus = statusFilter === 'ALL' || apt.status === statusFilter;
      const matchMode = modeFilter === 'ALL' || apt.mode === modeFilter;
      const matchPriority = priorityFilter === 'ALL' || apt.priority === priorityFilter;
      return matchStatus && matchMode && matchPriority;
    });
  }, [appointments, statusFilter, modeFilter, priorityFilter]);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncStatus(`Last synced: Just now`);
    }, 1200);
  };

  const toggleDayAvailability = (day: string) => {
    setWorkingDays(prev => ({ ...prev, [day]: !prev[day as keyof typeof prev] }));
  };

  const handleBlockSlot = (slotId: string) => {
    setTimeSlots(prev => prev.map(s => s.id === slotId ? { ...s, isBlocked: !s.isBlocked } : s));
  };

  const confirmReschedule = () => {
    if (!rescheduleAppointmentId) return;
    setAppointments(prev => prev.map(apt => {
      if (apt.id === rescheduleAppointmentId) {
        return {
          ...apt,
          date: newRescheduleDate,
          time: newRescheduleTime,
          countdownText: 'Rescheduled'
        };
      }
      return apt;
    }));
    setRescheduleAppointmentId(null);
    alert('Appointment rescheduled. Notifications dispatched to the client.');
  };

  const cancelAppointment = (id: string) => {
    setAppointments(prev => prev.map(apt => apt.id === id ? { ...apt, status: 'Cancelled' } : apt));
  };

  if (isLoading) {
    return <SkeletonCalendar />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 text-left animate-gentle-fade select-none">
      
      {/* 1. Page Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm relative">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Scheduler Command Center</span>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">Appointments & Calendar</h1>
          <p className="text-xs text-stone-500 font-medium">Manage your consultation schedule, buffer durations, and availability preferences.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
          >
            <span>🔄</span> {isSyncing ? 'Syncing...' : 'Sync Calendar'}
          </button>
          <button
            onClick={() => alert('Appointment manual scheduling wizard is placeholder.')}
            className="dbc-btn dbc-btn-md dbc-btn-primary"
          >
            ➕ Create Appointment
          </button>
        </div>
      </header>

      {/* Sync status tracker */}
      <div className="text-[9px] text-stone-400 font-bold uppercase tracking-wider text-right px-2">
        🟢 Google / Outlook Integration &bull; {syncStatus}
      </div>

      {/* 2. Summary Cards Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Today's Appts", count: stats.todayCount, icon: '📅', color: 'bg-emerald-50 text-emerald-800' },
          { label: 'Upcoming Appts', count: stats.upcomingCount, icon: '👥', color: 'bg-indigo-50 text-indigo-800' },
          { label: 'Pending Confirm', count: stats.pendingCount, icon: '⏳', color: 'bg-amber-50 text-amber-800' },
          { label: 'Available Slots', count: stats.slotsCount, icon: '💡', color: 'bg-blue-50 text-blue-800' },
          { label: 'Completed', count: stats.completedCount, icon: '✅', color: 'bg-stone-100 text-stone-850' },
          { label: 'Cancelled', count: stats.cancelledCount, icon: '🚫', color: 'bg-rose-50 text-rose-800' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-light-border p-4 rounded-2xl shadow-apple-xs hover:shadow-apple-sm transition flex flex-col justify-between">
            <span className={`text-base p-2 rounded-xl w-fit ${stat.color}`}>{stat.icon}</span>
            <div className="mt-4 space-y-0.5">
              <span className="block text-2xl font-black text-stone-900">{stat.count}</span>
              <span className="block text-[9.5px] font-bold text-stone-450 uppercase tracking-wider">{stat.label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Filters, Calendar Grid & List */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Filters panel */}
          <div className="bg-white border border-light-border p-4 rounded-2xl shadow-apple-xs flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2 border border-light-border p-1 bg-stone-50 rounded-xl">
              {(['day', 'week', 'month', 'agenda'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setCalendarView(v)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer ${
                    calendarView === v ? 'bg-stone-black text-white' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {v} View
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="dbc-input bg-white text-xs py-1 px-2 w-auto"
              >
                <option value="ALL">All Status</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <select
                value={modeFilter}
                onChange={e => setModeFilter(e.target.value)}
                className="dbc-input bg-white text-xs py-1 px-2 w-auto"
              >
                <option value="ALL">All Modes</option>
                <option value="Video Call">Video Call</option>
                <option value="In-Person">In-Person</option>
                <option value="Site Visit">Site Visit</option>
              </select>
            </div>
          </div>

          {/* RENDER VIEW: MONTH GRID */}
          {calendarView === 'month' && (
            <div className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-light-border/40">
                <h3 className="text-xs font-black uppercase text-stone-900">August 2026</h3>
                <span className="text-[10px] text-stone-400 font-bold uppercase">Standard Slot grid</span>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-[9px] font-black uppercase tracking-widest text-stone-400 border-b border-light-border/40 pb-2">
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
                <div>Sun</div>
              </div>

              <div className="grid grid-cols-7 gap-2 h-64">
                {Array.from({ length: 31 }).map((_, i) => {
                  const dayNum = i + 1;
                  const hasAppointments = appointments.filter(a => Number(a.date.split('-')[2]) === dayNum && a.status !== 'Cancelled');
                  const isToday = dayNum === 3;
                  const isSelected = dayNum === selectedDay;

                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedDay(dayNum)}
                      className={`p-2 rounded-2xl border text-[10px] font-bold transition text-left flex flex-col justify-between cursor-pointer ${
                        isToday
                          ? 'border-brand-emerald bg-brand-emerald/5 text-brand-emerald'
                          : isSelected
                          ? 'border-stone-800 bg-stone-50'
                          : 'border-light-border bg-stone-50/20 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <span className="font-bold">{dayNum}</span>
                      {hasAppointments.length > 0 && (
                        <span className="block text-[8px] font-black bg-brand-emerald/10 text-brand-emerald px-1 rounded truncate leading-none">
                          {hasAppointments.length} Appt
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* RENDER VIEW: DAY / AGENDA LIST */}
          {(calendarView === 'day' || calendarView === 'agenda' || calendarView === 'week') && (
            <div className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase text-stone-900">Appointments Schedule</h3>
                <p className="text-[10px] text-stone-400">List of bookings matching filters</p>
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="text-center py-8 text-stone-450 border border-dashed border-stone-200 rounded-2xl">
                  No appointments scheduled.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAppointments.map(apt => (
                    <div key={apt.id} className="p-4 bg-stone-50/50 border border-stone-200/50 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-stone-300 transition">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-stone-900">{apt.customerName}</h4>
                          <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full ${
                            apt.priority === 'High' ? 'bg-rose-50 text-rose-700' : 'bg-stone-100 text-stone-600'
                          }`}>{apt.priority} Priority</span>
                          <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full ${
                            apt.status === 'Completed' ? 'bg-stone-100 text-stone-600' : 'bg-emerald-50 text-emerald-800'
                          }`}>{apt.status}</span>
                        </div>
                        <p className="text-[11px] text-stone-700 font-semibold">{apt.projectTitle}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-stone-400 font-bold uppercase">
                          <span>📅 {apt.date} &bull; {apt.time} ({apt.duration})</span>
                          <span>🖥️ {apt.mode}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => navigate('/workspace/consultation/CS-401')}
                          className="dbc-btn dbc-btn-sm dbc-btn-primary"
                        >
                          Workspace
                        </button>
                        <button
                          onClick={() => setRescheduleAppointmentId(apt.id)}
                          disabled={apt.status === 'Completed' || apt.status === 'Cancelled'}
                          className="dbc-btn dbc-btn-sm dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => cancelAppointment(apt.id)}
                          disabled={apt.status === 'Completed' || apt.status === 'Cancelled'}
                          className="dbc-btn dbc-btn-sm dbc-btn-danger"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Side: Availability Panel & Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Availability Settings panel */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div>
              <h2 className="text-sm font-black text-stone-900">Availability Preferences</h2>
              <p className="text-[11px] text-stone-450 font-medium">Configure work slots and buffer limits</p>
            </div>

            <div className="space-y-3.5 text-xs text-stone-700">
              <div className="space-y-1.5">
                <span className="block text-[8px] font-black text-stone-450 uppercase tracking-wider">Working Days</span>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(workingDays).map(day => {
                    const active = workingDays[day as keyof typeof workingDays];
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDayAvailability(day)}
                        className={`px-2.5 py-1 rounded-lg text-[8.5px] font-bold uppercase border transition cursor-pointer ${
                          active ? 'bg-emerald-50 border-brand-emerald text-brand-emerald font-black' : 'bg-white border-stone-200 text-stone-400'
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[8px] font-black text-stone-450 uppercase tracking-wider">Hours Range</span>
                  <input
                    type="text"
                    value={workingHours}
                    onChange={e => setWorkingHours(e.target.value)}
                    className="dbc-input text-xs"
                  />
                </div>
                <div>
                  <span className="block text-[8px] font-black text-stone-450 uppercase tracking-wider">Appointment Buffer</span>
                  <select
                    value={bufferTime}
                    onChange={e => setBufferTime(e.target.value)}
                    className="dbc-input bg-white text-xs py-1.5 px-3"
                  >
                    <option value="5 mins">5 mins</option>
                    <option value="15 mins">15 mins</option>
                    <option value="30 mins">30 mins</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Time Slot Block manager */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div>
              <h2 className="text-sm font-black text-stone-900">Time Slot Manager</h2>
              <p className="text-[11px] text-stone-450 font-medium">Quick block/unblock slots for Aug {selectedDay}</p>
            </div>

            <div className="space-y-2.5">
              {timeSlots.map(slot => (
                <div key={slot.id} className="flex justify-between items-center text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl">
                  <span className={slot.isBlocked ? 'text-stone-400 font-semibold line-through' : 'text-stone-750 font-semibold'}>
                    ⏰ {slot.time} {slot.appointmentId ? '(Appt)' : slot.isBlocked ? '(Blocked)' : ''}
                  </span>
                  <button
                    onClick={() => handleBlockSlot(slot.id)}
                    disabled={!!slot.appointmentId}
                    className={`text-[8.5px] font-black uppercase tracking-wider px-2 py-1 rounded transition disabled:opacity-45 cursor-pointer ${
                      slot.isBlocked ? 'bg-emerald-50 text-brand-emerald' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {slot.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </div>
              ))}
            </div>
          </section>

        </div>

      </div>

      {/* Reschedule Confirmation Modal dialog */}
      {rescheduleAppointmentId && (
        <div className="fixed inset-0 bg-stone-950/45 backdrop-blur-xs flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white border border-light-border p-6 rounded-3xl max-w-sm w-full mx-4 shadow-xl space-y-4 text-left">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-stone-900 uppercase">Reschedule Consultation</h3>
              <p className="text-xs text-stone-500 font-medium">Select a new date and timeslot for consultation review.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[8px] font-black text-stone-450 uppercase">Date</label>
                <input
                  type="date"
                  value={newRescheduleDate}
                  onChange={e => setNewRescheduleDate(e.target.value)}
                  className="dbc-input text-xs"
                />
              </div>
              <div>
                <label className="block text-[8px] font-black text-stone-450 uppercase">Time Slot</label>
                <select
                  value={newRescheduleTime}
                  onChange={e => setNewRescheduleTime(e.target.value)}
                  className="dbc-input bg-white text-xs py-1.5 px-3"
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="04:00 PM">04:00 PM</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRescheduleAppointmentId(null)}
                className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReschedule}
                className="dbc-btn dbc-btn-md dbc-btn-primary"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// Loading Skeletons
// ==========================================
function SkeletonCalendar() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 text-left animate-pulse">
      <div className="h-28 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
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
