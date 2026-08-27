import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ==========================================
// Types & Interfaces
// ==========================================
interface Project {
  id: string;
  name: string;
  customerName: string;
  progress: number;
  stage: string;
  deadline: string;
  status: 'In Progress' | 'Delayed' | 'Completed';
}

interface Requirement {
  id: string;
  title: string;
  category: string;
  location: string;
  budget: string;
  postedDate: string;
  status: string;
}

interface Quotation {
  id: string;
  customerName: string;
  requirementTitle: string;
  amount: string;
  status: 'Pending Review' | 'Accepted' | 'Draft';
  date: string;
}

interface TimelineItem {
  time: string;
  title: string;
  desc: string;
  type: 'visit' | 'meeting' | 'task';
}

export default function TradeProfessionalDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [availability, setAvailability] = useState<'Available' | 'Busy' | 'Off-duty'>('Available');
  const [availabilityOpen, setAvailabilityOpen] = useState(false);

  // Database list
  const [projects] = useState<Project[]>([
    { id: 'PRJ-201', name: 'Jubilee Hills Duplex Foundation', customerName: 'Ramesh Kumar', progress: 75, stage: 'Raft Slab Reinforcement', deadline: '2026-08-25', status: 'In Progress' },
    { id: 'PRJ-202', name: 'Madhapur Penthouse MEP conduiting', customerName: 'Sita Sharma', progress: 45, stage: 'Wall Electrical chasing', deadline: '2026-09-10', status: 'In Progress' },
    { id: 'PRJ-203', name: 'Gachibowli Commercial Soil Excavation', customerName: 'Vikram Singh', progress: 95, stage: 'Site soil backfilling', deadline: '2026-08-05', status: 'In Progress' },
    { id: 'PRJ-204', name: 'Kondapur Villa Masonry plastering', customerName: 'Priya Nair', progress: 10, stage: 'Materials procurement', deadline: '2026-10-15', status: 'In Progress' },
    { id: 'PRJ-205', name: 'Banjara Hills Office ceiling partition', customerName: 'Vijay Kulkarni', progress: 100, stage: 'Handover complete', deadline: '2026-07-28', status: 'Completed' }
  ]);

  const [requirements] = useState<Requirement[]>([
    { id: 'REQ-501', title: '500 Sq Yd excavation & soil testing', category: 'Construction', location: 'Gachibowli, Hyd', budget: '₹65,000', postedDate: '3 hours ago', status: 'Open' },
    { id: 'REQ-502', title: 'MEP conduits layout design & execution', category: 'Electrical', location: 'Madhapur, Hyd', budget: '₹40,000', postedDate: '5 hours ago', status: 'Open' },
    { id: 'REQ-503', title: 'RCC lintel casting for 2 floors', category: 'Civil Masonry', location: 'Kondapur, Hyd', budget: '₹1,20,000', postedDate: '1 day ago', status: 'Open' }
  ]);

  const [quotations] = useState<Quotation[]>([
    { id: 'QT-801', customerName: 'Ramesh Kumar', requirementTitle: 'Raft Foundation Excavation', amount: '₹1,15,000', status: 'Pending Review', date: '2026-07-30' },
    { id: 'QT-802', customerName: 'Sita Sharma', requirementTitle: 'Plumbing conduit pipes routing', amount: '₹38,000', status: 'Draft', date: '2026-08-01' }
  ]);

  const schedule: TimelineItem[] = [
    { time: '10:00 AM', title: 'Site Inspection Visit', desc: 'Verify steel bar spacing at Jubilee Hills residential lot.', type: 'visit' },
    { time: '02:00 PM', title: 'MEP Coordination Video Call', desc: 'Align electrical drawings layout with Sita Sharma.', type: 'meeting' },
    { time: '04:00 PM', title: 'Procurement list Sign-off', desc: 'Approve cement bags purchase order delivery invoices.', type: 'task' }
  ];

  const notifications = [
    { text: 'New requirement matched: RCC lintel casting at Kondapur.', time: '30 mins ago' },
    { text: 'Sita Sharma accepted structural blueprint amendments.', time: '2 hours ago' },
    { text: 'Reminder: Site visit scheduled tomorrow at Madhapur.', time: '4 hours ago' }
  ];

  // Startup loader
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const handleExpressInterest = (id: string) => {
    alert(`Interest expressed successfully for ${id}. Customer notified.`);
  };

  const handleSaveReq = (id: string) => {
    alert(`Requirement ${id} saved to bookmarks.`);
  };

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 text-left animate-gentle-fade select-none">
      
      {/* 1. Header Dashboard Overview */}
      <header className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider">Operational Console</span>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">Welcome back, Apex Architect & Build</h1>
          <p className="text-xs text-stone-500 font-medium">Saturday, August 1 &bull; Greeting: Make progress and drive site safety rules.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="relative">
            <button
              onClick={() => setAvailabilityOpen(!availabilityOpen)}
              className="flex items-center gap-2 px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-700 hover:bg-stone-100 transition shadow-xs cursor-pointer focus:outline-none"
            >
              <span className={`w-2 h-2 rounded-full ${
                availability === 'Available' ? 'bg-emerald-500' : availability === 'Busy' ? 'bg-amber-500' : 'bg-rose-500'
              }`}></span>
              Status: {availability}
              <span className="text-[9px]">▼</span>
            </button>
            {availabilityOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-stone-200 rounded-xl shadow-lg z-50 overflow-hidden">
                {(['Available', 'Busy', 'Off-duty'] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => {
                      setAvailability(opt);
                      setAvailabilityOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-stone-50 text-xs font-semibold text-stone-700 block"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/workspace/leads')}
            className="dbc-btn dbc-btn-md dbc-btn-primary"
          >
            Browse Leads
          </button>
        </div>
      </header>

      {/* 2. KPI Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: 'Active Projects', value: '4', desc: 'In progress', icon: '🏗️', color: 'bg-emerald-50 text-emerald-800', path: '/workspace/projects' },
          { label: 'Available leads', value: '18', desc: 'Matching trades', icon: '⚡', color: 'bg-blue-50 text-blue-800', path: '/workspace/leads' },
          { label: 'Pending Quotes', value: '2', desc: 'Awaiting client review', icon: '⏳', color: 'bg-amber-50 text-amber-800', path: '/workspace/quotations' },
          { label: 'Completed projects', value: '42', desc: 'Successful handovers', icon: '✅', color: 'bg-indigo-50 text-indigo-800', path: '/workspace/projects' },
          { label: 'Project Requests', value: '1', desc: 'Review required', icon: '📋', color: 'bg-stone-100 text-stone-900', path: '/workspace/bookings' },
          { label: 'Unread chats', value: '0', desc: 'Messages center logs', icon: '✉️', color: 'bg-purple-50 text-purple-800', path: '/workspace/inbox' },
        ].map((kpi, idx) => (
          <button 
            key={idx} 
            onClick={() => navigate(kpi.path)}
            className="bg-white border border-light-border p-4 rounded-2xl shadow-apple-xs hover:shadow-apple-sm hover:border-emerald-600/30 transition flex flex-col justify-between cursor-pointer text-left focus:outline-none"
          >
            <span className={`text-base p-2 rounded-xl w-fit ${kpi.color}`}>{kpi.icon}</span>
            <div className="mt-4 space-y-0.5">
              <span className="block text-2xl font-black text-stone-900">{kpi.value}</span>
              <span className="block text-[9.5px] font-bold text-stone-450 uppercase tracking-wider">{kpi.label}</span>
              <span className="block text-[8px] text-stone-400 font-semibold">{kpi.desc}</span>
            </div>
          </button>
        ))}
      </section>

      {/* Three Column Grid layouts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column details (Col span 8) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Active Projects card */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-light-border/40">
              <div>
                <h3 className="text-xs font-black uppercase text-stone-900 font-serif">Active Projects</h3>
                <p className="text-[10px] text-stone-400 font-medium">Construction tracking milestones</p>
              </div>
              <button onClick={() => navigate('/workspace/projects')} className="text-[9.5px] font-black uppercase text-brand-emerald hover:underline cursor-pointer">
                View All Projects
              </button>
            </div>

            <div className="space-y-4">
              {projects.length === 0 ? (
                <div className="p-6 text-center space-y-3 bg-stone-50 border border-stone-200 border-dashed rounded-2xl">
                  <p className="text-xs text-stone-500 font-semibold">No active projects in progress yet.</p>
                  <button
                    onClick={() => navigate('/workspace/leads')}
                    className="px-3.5 py-2 bg-brand-emerald hover:bg-emerald-800 text-white rounded-xl font-black text-[10px] uppercase tracking-wider transition cursor-pointer"
                  >
                    Explore Opportunities
                  </button>
                </div>
              ) : (
                projects.map(proj => (
                  <div key={proj.id} className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-xs space-y-3">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <strong
                          onClick={() => navigate(`/workspace/project/${proj.id}`)}
                          className="text-stone-900 block text-xs hover:text-brand-emerald cursor-pointer transition"
                        >
                          {proj.name}
                        </strong>
                        <span className="text-[10px] text-stone-500 font-bold">Client: {proj.customerName} &bull; Stage: {proj.stage}</span>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        proj.status === 'Completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-blue-50 border-blue-200 text-blue-800'
                      }`}>
                        {proj.status}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-bold text-stone-500">
                        <span>Progress</span>
                        <span>{proj.progress}%</span>
                      </div>
                      <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-brand-emerald h-full" style={{ width: `${proj.progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Available Requirements matching */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-light-border/40">
              <div>
                <h3 className="text-xs font-black uppercase text-stone-900 font-serif">Available Leads Match</h3>
                <p className="text-[10px] text-stone-400">Requirements matching electrical, masonry, civil scopes</p>
              </div>
              <button onClick={() => navigate('/workspace/leads')} className="text-[9.5px] font-black uppercase text-brand-emerald hover:underline cursor-pointer">
                View All Leads
              </button>
            </div>

            <div className="space-y-3">
              {requirements.length === 0 ? (
                <div className="p-6 text-center bg-stone-50 border border-stone-200 border-dashed rounded-2xl">
                  <p className="text-xs text-stone-500 font-semibold">No matching leads available at the moment.</p>
                </div>
              ) : (
                requirements.map(req => (
                  <div key={req.id} className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs">
                    <div>
                      <strong className="text-stone-900 block">{req.title}</strong>
                      <span className="block text-[10px] text-stone-500 font-bold mt-0.5">Budget: {req.budget} &bull; Location: {req.location} &bull; {req.postedDate}</span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleSaveReq(req.id)} className="dbc-btn dbc-btn-sm dbc-btn-outline bg-white">
                        Save Lead
                      </button>
                      <button onClick={() => handleExpressInterest(req.id)} className="dbc-btn dbc-btn-sm dbc-btn-primary">
                        Submit Quote
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Pending Quotations */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-stone-900 border-b border-light-border/40 pb-2">Pending Estimates Quotations</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-light-border text-[9px] font-black uppercase text-stone-400">
                    <th className="py-2">Quotation ID</th>
                    <th className="py-2">Client</th>
                    <th className="py-2">Requirement</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border/40 text-stone-750 font-semibold">
                  {quotations.map(q => (
                    <tr key={q.id}>
                      <td className="py-3 font-bold text-stone-900">{q.id}</td>
                      <td className="py-3">{q.customerName}</td>
                      <td className="py-3 text-stone-500">{q.requirementTitle}</td>
                      <td className="py-3 font-bold text-stone-900">{q.amount}</td>
                      <td className="py-3">
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          q.status === 'Accepted' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}>
                          {q.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>

        {/* Right column details (Col span 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Today's Schedule */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div>
              <h2 className="text-sm font-black text-stone-900 font-serif">Today's Timeline</h2>
              <p className="text-[11px] text-stone-450 font-medium">Chronological site agendas</p>
            </div>

            <div className="space-y-4 relative border-l-2 border-stone-100 pl-4 ml-2">
              {schedule.map((item, idx) => (
                <div key={idx} className="relative space-y-0.5 text-xs font-semibold">
                  <span className="absolute -left-[23px] top-0 w-2 h-2 rounded-full bg-brand-emerald"></span>
                  <span className="block text-[8px] font-bold text-stone-400 uppercase tracking-widest">{item.time}</span>
                  <h4 className="font-bold text-stone-900 leading-tight">{item.title}</h4>
                  <p className="text-stone-500 text-[10px] leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-3">
            <h2 className="text-sm font-black text-stone-900">Quick Shortcuts</h2>
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold">
              {[
                { label: 'Leads', path: '/workspace/leads', icon: '⚡' },
                { label: 'Projects', path: '/workspace/projects', icon: '🏗️' },
                { label: 'Requests', path: '/workspace/bookings', icon: '📋' },
                { label: 'Quotations', path: '/workspace/quotations', icon: '📝' },
                { label: 'Inbox', path: '/workspace/inbox', icon: '✉️' },
                { label: 'Profile', path: '/workspace/profile', icon: '⚙️' }
              ].map((act, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(act.path)}
                  className="p-3 bg-stone-50 border border-stone-200 rounded-xl hover:bg-stone-100 transition cursor-pointer"
                >
                  <span className="text-lg block mb-1">{act.icon}</span>
                  <span className="text-[10px] text-stone-750 block">{act.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Activity Logs & Notifications */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <h2 className="text-sm font-black text-stone-900">Notifications alert</h2>
            <div className="space-y-3 text-xs font-semibold text-stone-600">
              {notifications.map((not, idx) => (
                <div key={idx} className="p-2.5 bg-stone-50 border border-stone-100 rounded-xl flex justify-between items-start gap-2">
                  <p className="leading-tight text-stone-750">{not.text}</p>
                  <span className="text-[7.5px] text-stone-400 font-bold shrink-0">{not.time}</span>
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
