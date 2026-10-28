import { useState, useRef, useEffect } from 'react';
import { notificationApi } from '../../services/notification/notificationService';
import type { AppNotification } from '../../services/notification/notificationService';

interface NotificationButtonProps {
  role: string;
}

export function NotificationButton({ role }: NotificationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    [...notificationApi.getNotifications(role)]
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Keep notifications in sync when new ones arrive
    const unsubscribe = notificationApi.subscribe(() => {
      setNotifications([...notificationApi.getNotifications(role)]);
    });

    return () => unsubscribe();
  }, [role]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notificationApi.getUnreadCount(role);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-9 h-9 flex items-center justify-center rounded-full border border-light-border bg-white text-stone-gray hover:text-stone-black hover:bg-light-stone transition relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald ${isOpen ? 'bg-light-stone text-stone-black' : ''}`}
        aria-label="View notifications"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-brand-emerald text-white rounded-full flex items-center justify-center text-3xs font-black border border-white shadow-apple-sm animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-light-border bg-white p-3.5 shadow-apple-lg z-50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between border-b border-light-border pb-2">
            <span className="text-3xs font-extrabold uppercase tracking-wider text-stone-gray">Activity Logs</span>
            <button
              onClick={() => notificationApi.markAllAsRead()}
              className="text-3xs font-extrabold text-brand-emerald hover:underline cursor-pointer focus:outline-none"
            >
              Mark all read
            </button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    notificationApi.markAsRead(item.id);
                    setIsOpen(false);
                  }}
                  className={`p-2.5 rounded-xl border transition cursor-pointer text-left ${item.isRead ? 'bg-light-stone/40 border-light-border opacity-60' : 'bg-brand-emerald/5 border-brand-emerald/10 hover:bg-brand-emerald/10'}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h5 className={`text-xs font-black truncate ${item.isRead ? 'text-stone-gray' : 'text-stone-black'}`}>{item.title}</h5>
                    <span className="text-3xs text-stone-gray font-semibold whitespace-nowrap">{item.createdAt}</span>
                  </div>
                  <p className="text-2xs text-stone-gray mt-0.5 leading-relaxed font-medium">{item.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center text-xs text-stone-gray/80 py-6">No recent notifications found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
