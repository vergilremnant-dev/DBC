import { useState } from 'react';

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  category: 'System' | 'Projects' | 'Leads' | 'Requests';
  time: string;
  isRead: boolean;
  priority: 'High' | 'Normal';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'not-1', title: 'New Matching Lead Posted', content: 'A customer posted a requirement: "Kitchen Interior & Cabinets Drafting" in Madhapur.', category: 'Leads', time: '2 hours ago', isRead: false, priority: 'High' },
  { id: 'not-2', title: 'Consultation Request Submitted', content: 'Alice Architect requested a structural engineering consult for 02 Aug 2026.', category: 'Requests', time: '5 hours ago', isRead: false, priority: 'High' },
  { id: 'not-3', title: 'Milestone Completed Approved', content: 'Customer released ₹15,000 payment for structural approval milestone.', category: 'Projects', time: '3 days ago', isRead: true, priority: 'Normal' },
  { id: 'not-4', title: 'DBC Account Verified', content: 'DBC administration approved your premium contractor credentials check.', category: 'System', time: '1 week ago', isRead: true, priority: 'Normal' },
];

export default function ProfessionalNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    alert('All notifications marked as read.');
  };

  const handleMarkRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // Filter list
  const filtered = categoryFilter === 'ALL'
    ? notifications
    : notifications.filter(n => n.category.toUpperCase() === categoryFilter);

  // Stats
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left relative animate-gentle-fade pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-light-border pb-5 gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-stone-900 font-display">Business Notifications</h2>
          <p className="text-xs text-stone-500 font-medium font-semibold">
            Track business updates, direct booking alerts, and client payments history.
          </p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="dbc-btn dbc-btn-secondary py-2 px-4 text-xs font-bold uppercase tracking-wider bg-white border border-light-border cursor-pointer"
        >
          Mark All Read
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="dbc-card text-center p-4">
          <span className="text-3xs font-black uppercase text-stone-gray tracking-wider">Unread Alerts</span>
          <h3 className="text-base font-extrabold text-brand-emerald mt-1">{unreadCount} Pending</h3>
        </div>
        <div className="dbc-card text-center p-4">
          <span className="text-3xs font-black uppercase text-stone-gray tracking-wider">Urgent Priority</span>
          <h3 className="text-base font-extrabold text-amber-700 mt-1">
            {notifications.filter(n => !n.isRead && n.priority === 'High').length} Actionable
          </h3>
        </div>
        <div className="dbc-card text-center p-4">
          <span className="text-3xs font-black uppercase text-stone-gray tracking-wider">Total Received</span>
          <h3 className="text-base font-extrabold text-stone-black mt-1">{notifications.length} Total</h3>
        </div>
      </div>

      {/* Categories filters */}
      <div className="flex flex-wrap gap-2 pt-2 text-3xs font-black uppercase tracking-wider">
        {['ALL', 'SYSTEM', 'PROJECTS', 'LEADS', 'REQUESTS'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-full border transition cursor-pointer
              ${categoryFilter === cat 
                ? 'bg-stone-black text-white border-stone-black' 
                : 'bg-white text-stone-gray border-light-border hover:bg-light-stone'
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notifications list feed */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="dbc-card text-center p-8">No notifications found under this category.</div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkRead(n.id)}
              className={`p-4 rounded-2xl border text-left transition flex justify-between items-start cursor-pointer
                ${n.isRead 
                  ? 'bg-white/80 border-light-border opacity-75' 
                  : 'bg-white border-brand-emerald/20 shadow-xs border-l-4 border-l-brand-emerald'
                }
              `}
            >
              <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`dbc-badge text-3xs py-0.5 ${
                    n.priority === 'High' ? 'dbc-badge-priority' : 'dbc-badge-progress'
                  }`}>
                    {n.category}
                  </span>
                  <h4 className="text-xs font-black text-stone-black truncate">{n.title}</h4>
                </div>
                <p className="text-2xs text-stone-gray font-semibold leading-relaxed">{n.content}</p>
                <span className="block text-3xs text-stone-gray/80 font-bold">{n.time}</span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(n.id);
                }}
                className="text-2xs font-bold text-stone-gray hover:text-rose-600 focus:outline-none"
                title="Remove alert log"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
