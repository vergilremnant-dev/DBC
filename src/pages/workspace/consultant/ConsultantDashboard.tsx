import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ==========================================
// Types & interfaces
// ==========================================
interface Consultation {
  id: string;
  customerName: string;
  time: string;
  projectType: string;
  meetingType: 'Video Call' | 'In-Person' | 'Site Visit';
  status: 'Active' | 'Upcoming' | 'Pending';
}

interface Request {
  id: string;
  customerName: string;
  summary: string;
  location: string;
  date: string;
  budget: string;
  priority: 'High' | 'Medium' | 'Low';
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  icon: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning';
}

export default function ConsultantDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [availability, setAvailability] = useState<'Available Today' | 'Busy' | 'On Leave'>('Available Today');
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [requests, setRequests] = useState<Request[]>([
    { id: 'req-1', customerName: 'Ramesh Kumar', summary: '3BHK structural plan audit & Vastu consultation', location: 'Gachibowli, Hyderabad', date: '02-Aug-2026', budget: '₹15,000', priority: 'High' },
    { id: 'req-2', customerName: 'Sita Sharma', summary: 'Villa interior design layout check & elevation feedback', location: 'Madhapur, Hyderabad', date: '03-Aug-2026', budget: '₹25,000', priority: 'Medium' },
    { id: 'req-3', customerName: 'Vikram Singh', summary: 'Commercial layout permit layout validation', location: 'Jubilee Hills, Hyderabad', date: '04-Aug-2026', budget: '₹40,000', priority: 'High' },
    { id: 'req-4', customerName: 'Pooja Reddy', summary: 'Duplex kitchen ventilation and cabinet plan review', location: 'Kondapur, Hyderabad', date: '05-Aug-2026', budget: '₹12,000', priority: 'Low' },
    { id: 'req-5', customerName: 'Arjun Mehta', summary: 'Spatial drawing inspection for structural pillars', location: 'Banjara Hills, Hyderabad', date: '06-Aug-2026', budget: '₹20,000', priority: 'Medium' },
  ]);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 850);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { label: "Today's Consultations", value: '3', trend: '+1 new', trendUp: true, icon: '📅', color: 'text-emerald-700 bg-emerald-50', path: '/workspace/bookings' },
    { label: 'Pending Requests', value: '5', trend: 'Needs review', trendUp: false, icon: '💡', color: 'text-amber-700 bg-amber-50', path: '/workspace/leads' },
    { label: 'Completed consultations', value: '38', trend: '+15% MoM', trendUp: true, icon: '✅', color: 'text-blue-700 bg-blue-50', path: '/workspace/bookings' },
    { label: 'Active Customers', value: '12', trend: '+8% MoM', trendUp: true, icon: '👥', color: 'text-indigo-700 bg-indigo-50', path: '/workspace/crm' },
    { label: 'Monthly Earnings', value: '₹48,000', trend: 'Info Only', trendUp: true, icon: '💳', color: 'text-stone-900 bg-stone-100' },
    { label: 'Average Rating', value: '4.95', trend: 'Excellent', trendUp: true, icon: '⭐', color: 'text-amber-500 bg-amber-50' },
  ];

  const schedule: Consultation[] = [
    { id: 'sch-1', customerName: 'Amit Sharma', time: '10:00 AM - 11:00 AM', projectType: 'Vastu Layout Plan Review', meetingType: 'Video Call', status: 'Upcoming' },
    { id: 'sch-2', customerName: 'Neha Reddy', time: '02:00 PM - 03:00 PM', projectType: 'Modern Villa Architectural Advice', meetingType: 'Site Visit', status: 'Active' },
    { id: 'sch-3', customerName: 'Kunal Verma', time: '04:30 PM - 05:30 PM', projectType: 'Kitchen Spatial Cabinets Check', meetingType: 'Video Call', status: 'Upcoming' },
  ];

  const activities: Activity[] = [
    { id: 'act-1', type: 'Booking', description: 'New consultation booked by Vikram Singh', timestamp: '1 hour ago', icon: '📅' },
    { id: 'act-2', type: 'Upload', description: 'Customer Ramesh Kumar uploaded layout drawings', timestamp: '3 hours ago', icon: '📁' },
    { id: 'act-3', type: 'Payment', description: 'Payment of ₹15,000 received from Ramesh Kumar', timestamp: '5 hours ago', icon: '💰' },
    { id: 'act-4', type: 'Update', description: 'Neha Reddy updated project requirement details', timestamp: 'Yesterday', icon: '📝' },
    { id: 'act-5', type: 'Review', description: '5-Star review received from Bob Builder', timestamp: '2 days ago', icon: '⭐' },
  ];

  const notifications: NotificationItem[] = [
    { id: 'not-1', title: 'New Consultation Request', message: 'Ramesh Kumar requested a structural design review', time: '10 mins ago', type: 'info' },
    { id: 'not-2', title: 'Appointment Reminder', message: 'Upcoming Video consultation with Neha Reddy in 1 hour', time: '45 mins ago', type: 'warning' },
    { id: 'not-3', title: 'Document Uploaded', message: 'Kunal Verma shared kitchen structural layout PDF', time: '2 hours ago', type: 'success' },
    { id: 'not-4', title: 'Payment Confirmation', message: 'Consultation fee cleared for Amit Sharma session', time: '4 hours ago', type: 'success' },
    { id: 'not-5', title: 'System Notification', message: 'DBC operational compliance verification successful', time: '1 day ago', type: 'info' },
  ];

  const quickActions = [
    { title: 'View Calendar', description: 'Manage dates & timeslots', icon: '🗓️', path: '/workspace/bookings' },
    { title: 'Open Requests', description: 'Review customer inquiries', icon: '💡', path: '/workspace/leads' },
    { title: 'Create Consultation Report', description: 'Draft technical insights', icon: '📄', path: '/workspace/report/RP-501' },
    { title: 'Manage Availability', description: 'Set operational status', icon: '⚙️', path: '/workspace/bookings' },
    { title: 'View Customers', description: 'See project client profiles', icon: '👥', path: '/workspace/crm' },
    { title: 'Messages', description: 'Access inbox logs', icon: '💬', path: '/workspace/inbox' },
  ];

  const handleAccept = (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const handleDecline = (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 text-left animate-gentle-fade select-none">
      
      {/* 1. Header Section */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm relative">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Good Morning</span>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">Welcome back, John Anderson</h1>
          <p className="text-xs text-stone-500 font-medium">Saturday, August 1 • "Help homeowners make better decisions through expert guidance."</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setAvailabilityOpen(!availabilityOpen)}
            className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
          >
            <span className={`w-2 h-2 rounded-full ${
              availability === 'Available Today' ? 'bg-emerald-500' : availability === 'Busy' ? 'bg-amber-500' : 'bg-rose-500'
            }`}></span>
            {availability}
            <span className="text-[10px]">▼</span>
          </button>
          
          {availabilityOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-stone-200 rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {(['Available Today', 'Busy', 'On Leave'] as const).map(option => (
                <button
                  key={option}
                  onClick={() => {
                    setAvailability(option);
                    setAvailabilityOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-stone-700 hover:bg-stone-50 transition font-medium flex items-center gap-2 cursor-pointer"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    option === 'Available Today' ? 'bg-emerald-500' : option === 'Busy' ? 'bg-amber-500' : 'bg-rose-500'
                  }`}></span>
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* 2. Overview KPI Cards Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {stats.map((stat, idx) => {
          const content = (
            <>
              <div className="flex justify-between items-start">
                <span className={`text-base p-2 rounded-xl ${stat.color}`}>{stat.icon}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                  stat.trendUp ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-500'
                }`}>{stat.trend}</span>
              </div>
              <div className="mt-4 space-y-1">
                <span className="block text-2xl font-black text-stone-900">{stat.value}</span>
                <span className="block text-[10px] font-bold text-stone-450 uppercase tracking-wider">{stat.label}</span>
              </div>
            </>
          );

          if (stat.path) {
            return (
              <button
                key={idx}
                onClick={() => navigate(stat.path!)}
                className="bg-white border border-light-border p-4 rounded-2xl shadow-apple-xs hover:shadow-apple-sm hover:border-emerald-600/30 transition-all duration-350 hover:-translate-y-0.5 flex flex-col justify-between cursor-pointer text-left focus:outline-none"
              >
                {content}
              </button>
            );
          }

          return (
            <div
              key={idx}
              className="bg-white border border-light-border p-4 rounded-2xl shadow-apple-xs flex flex-col justify-between"
            >
              {content}
            </div>
          );
        })}
      </section>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Schedule, Requests & Activities */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 3. Today's Schedule timeline */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black text-stone-900">Today's Schedule</h2>
                <p className="text-[11px] text-stone-450">Active timeline for Saturday consultations</p>
              </div>
              <span className="text-[9px] font-black uppercase text-brand-emerald bg-emerald-50 px-2.5 py-1 rounded-lg">3 Sessions Scheduled</span>
            </div>

            {schedule.length === 0 ? (
              <EmptyState
                message="No scheduled consultations for today."
                actionLabel="View Calendar"
                onAction={() => navigate('/workspace/bookings')}
              />
            ) : (
              <div className="space-y-4 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-light-border">
                {schedule.map(item => (
                  <div key={item.id} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                    item.status === 'Active' ? 'bg-emerald-50/40 border-brand-emerald/30 shadow-xs' : 'bg-stone-50/50 border-stone-200/60'
                  }`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shrink-0 z-10 ${
                      item.status === 'Active' ? 'bg-brand-emerald text-white animate-pulse' : 'bg-stone-250 bg-stone-300 text-stone-600'
                    }`}>
                      {item.status === 'Active' ? '▶' : '•'}
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                      <div>
                        <h4 className="text-xs font-black text-stone-900">{item.customerName}</h4>
                        <span className="text-[10px] text-stone-450">{item.time}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-stone-700 font-semibold">{item.projectType}</span>
                        <span className="text-[9px] text-stone-450 font-bold uppercase tracking-wider">{item.meetingType}</span>
                      </div>
                      <div className="flex justify-end gap-2">
                        {item.status === 'Active' ? (
                          <button
                            onClick={() => navigate('/workspace/consultation/CS-401')}
                            className="dbc-btn dbc-btn-sm dbc-btn-primary"
                          >
                            Join Call
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate('/workspace/consultation/CS-401')}
                            className="dbc-btn dbc-btn-sm dbc-btn-secondary bg-stone-100 border border-stone-300/40"
                          >
                            View Details
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 4. Pending Consultation Requests */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black text-stone-900">Pending Consultation Requests</h2>
                <p className="text-[11px] text-stone-450">Review incoming specifications and approve bookings</p>
              </div>
              <button className="text-[10px] font-black uppercase text-brand-emerald hover:text-emerald-800 transition">View All</button>
            </div>

            {requests.length === 0 ? (
              <EmptyState
                message="No pending consultation requests."
                actionLabel="Manage Availability"
                onAction={() => navigate('/workspace/bookings')}
              />
            ) : (
              <div className="space-y-4">
                {requests.map(req => (
                  <div key={req.id} className="p-4 bg-stone-50/50 border border-stone-200/60 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 hover:border-stone-300">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-stone-900">{req.customerName}</h4>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                          req.priority === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200/60' : req.priority === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-stone-100 text-stone-500'
                        }`}>{req.priority} Priority</span>
                      </div>
                      <p className="text-[11px] text-stone-750 font-medium">{req.summary}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-stone-450 font-semibold">
                        <span>📍 {req.location}</span>
                        <span>📅 Proposed: {req.date}</span>
                        <span>💰 Budget: {req.budget}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleAccept(req.id)}
                        className="dbc-btn dbc-btn-sm dbc-btn-primary"
                      >
                        Accept Request
                      </button>
                      <button
                        onClick={() => handleDecline(req.id)}
                        className="dbc-btn dbc-btn-sm dbc-btn-danger"
                      >
                        Decline Request
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 5. Recent Customer Activity timeline */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div>
              <h2 className="text-sm font-black text-stone-900">Recent Customer Activity</h2>
              <p className="text-[11px] text-stone-450">Historical log of incoming client updates and document submittals</p>
            </div>
            
            <div className="space-y-4 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-px before:bg-light-border">
              {activities.map(act => (
                <div key={act.id} className="flex gap-4 items-start relative">
                  <span className="w-10 h-10 rounded-full border border-light-border bg-stone-50 flex items-center justify-center text-sm shrink-0 z-10">{act.icon}</span>
                  <div className="space-y-0.5 pt-1">
                    <p className="text-[11px] text-stone-800 font-semibold">{act.description}</p>
                    <span className="block text-[9px] text-stone-400 font-bold uppercase tracking-wider">{act.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right Column: Actions, AI insights & Notifications */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* 6. Quick Actions Grid */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div>
              <h2 className="text-sm font-black text-stone-900">Quick Actions</h2>
              <p className="text-[11px] text-stone-450 font-medium">Frequently accessed consultant views</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((act, index) => (
                <button
                  key={index}
                  onClick={() => navigate(act.path)}
                  className="p-3 bg-stone-50/50 hover:bg-warm-cream border border-stone-200/50 hover:border-stone-300 rounded-xl transition text-left cursor-pointer space-y-1.5 focus-visible:ring-2 focus-visible:ring-brand-emerald focus:outline-none"
                >
                  <span className="text-lg block">{act.icon}</span>
                  <h4 className="text-[10px] font-black text-stone-900 leading-tight">{act.title}</h4>
                  <p className="text-[8.5px] text-stone-450 leading-none">{act.description}</p>
                </button>
              ))}
            </div>
          </section>

          {/* 7. AI Insights Card (Placeholder) */}
          <section className="bg-gradient-to-br from-stone-950 to-stone-900 border border-stone-850 p-6 rounded-3xl shadow-apple-sm text-white space-y-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <div className="space-y-0.5">
              <span className="text-[8.5px] font-black uppercase text-emerald-400 tracking-wider">Smart Assistant</span>
              <h3 className="text-xs font-black">AI-powered insights coming soon</h3>
            </div>
            <ul className="space-y-2 text-[10px] text-stone-300 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✦</span>
                <span>Three pending requests need attention.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✦</span>
                <span>One customer has uploaded new documents.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✦</span>
                <span>Tomorrow's schedule is fully booked.</span>
              </li>
            </ul>
          </section>

          {/* 8. Notifications Panel */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black text-stone-900">Notifications</h2>
                <p className="text-[11px] text-stone-450 font-medium">DBC real-time alerts</p>
              </div>
              <span className="text-[8.5px] font-black text-stone-400 uppercase">Latest 5</span>
            </div>

            <div className="space-y-3">
              {notifications.map(not => (
                <div key={not.id} className="p-3 bg-stone-50/50 border border-stone-200/50 rounded-xl flex gap-3 items-start transition-all duration-300 hover:bg-stone-50">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    not.type === 'warning' ? 'bg-amber-500 animate-pulse' : not.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}></span>
                  <div className="space-y-0.5">
                    <h5 className="text-[10px] font-black text-stone-900 leading-tight">{not.title}</h5>
                    <p className="text-[9px] text-stone-500 font-semibold leading-normal">{not.message}</p>
                    <span className="block text-[8px] text-stone-400 font-bold uppercase tracking-wider">{not.time}</span>
                  </div>
                </div>
              ))}
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
function SkeletonDashboard() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 text-left animate-pulse">
      <div className="h-28 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm flex items-center justify-between">
        <div className="space-y-3 w-1/3">
          <div className="h-3 bg-stone-250 bg-stone-200 rounded w-1/4"></div>
          <div className="h-6 bg-stone-250 bg-stone-200 rounded w-full"></div>
          <div className="h-3 bg-stone-250 bg-stone-200 rounded w-3/4"></div>
        </div>
        <div className="h-10 bg-stone-250 bg-stone-200 rounded-xl w-32"></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, idx) => (
          <div key={idx} className="h-28 bg-white border border-light-border p-4 rounded-2xl shadow-apple-xs flex flex-col justify-between">
            <div className="h-8 bg-stone-250 bg-stone-200 rounded-lg w-8"></div>
            <div className="space-y-2">
              <div className="h-5 bg-stone-250 bg-stone-200 rounded w-1/2"></div>
              <div className="h-3 bg-stone-250 bg-stone-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="h-64 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
          <div className="h-96 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
        </div>
        <div className="lg:col-span-4 space-y-8">
          <div className="h-64 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
          <div className="h-80 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Empty States Placeholder
// ==========================================
function EmptyState({ message, actionLabel, onAction }: { message: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="p-8 text-center border border-dashed border-stone-200 rounded-2xl bg-stone-50/50 space-y-3 select-none">
      <span className="text-2xl block">📁</span>
      <p className="text-xs font-bold text-stone-500 uppercase tracking-widest leading-normal">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="dbc-btn dbc-btn-sm dbc-btn-primary mt-1"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
