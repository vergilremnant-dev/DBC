import type { AppNotification } from '../../../services/notification/notificationService';
import { NotificationBadge } from './NotificationBadge';

interface NotificationCardProps {
  notification: AppNotification;
  isSelected: boolean;
  onSelect: () => void;
  onToggleRead: (e: React.MouseEvent) => void;
  onToggleArchive: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function NotificationCard({
  notification,
  isSelected,
  onSelect,
  onToggleRead,
  onToggleArchive,
  onDelete,
}: NotificationCardProps) {
  // Category Icons Map
  const categoryIcons = {
    Requirements: '📋',
    Bookings: '📅',
    Messages: '💬',
    Consultations: '🤝',
    Payments: '💳',
    System: '⚙️',
    Promotions: '🎁'
  };

  const icon = notification.category ? categoryIcons[notification.category] : '🔔';

  return (
    <div
      onClick={onSelect}
      className={`border rounded-2xl p-4 transition-all duration-300 cursor-pointer flex flex-col justify-between text-left relative overflow-hidden select-none hover:shadow-md ${
        isSelected
          ? 'border-emerald-600 bg-emerald-50/10 ring-1 ring-emerald-600/10 shadow-sm'
          : 'border-stone-200 bg-white hover:border-stone-300'
      } ${!notification.isRead ? 'border-l-4 border-l-emerald-600' : ''}`}
    >
      <div className="flex gap-3.5 items-start">
        {/* Category Icon */}
        <div className={`p-2.5 rounded-xl border flex items-center justify-center text-lg shadow-inner ${
          !notification.isRead 
            ? 'bg-emerald-50/60 border-emerald-100' 
            : 'bg-stone-50 border-stone-150'
        }`}>
          {icon}
        </div>

        {/* Info Area */}
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5 items-center">
              {notification.category && (
                <NotificationBadge category={notification.category} type="category" />
              )}
              {notification.priority && (
                <NotificationBadge priority={notification.priority} type="priority" />
              )}
            </div>
            <span className="text-2xs text-stone-600 font-bold whitespace-nowrap">
              {notification.createdAt}
            </span>
          </div>

          <h3 className={`text-xs font-bold leading-snug truncate ${
            !notification.isRead ? 'text-stone-950 font-black' : 'text-stone-700'
          }`}>
            {notification.title}
          </h3>

          <p className="text-2xs text-stone-600 font-semibold leading-relaxed line-clamp-1">
            {notification.content}
          </p>
        </div>
      </div>

      {/* Row action toggles */}
      <div className="mt-3.5 pt-3 border-t border-stone-50 flex items-center justify-between gap-4 text-2xs font-black uppercase tracking-wider text-stone-600">
        {/* Left: Unread dot or empty space */}
        <div className="flex items-center gap-1.5">
          {!notification.isRead && (
            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></span>
          )}
          <span className="text-3xs font-bold text-stone-600 select-all font-mono">
            ID: {notification.id.toUpperCase()}
          </span>
        </div>

        {/* Right: Quick action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleRead}
            className="hover:text-emerald-700 font-bold transition cursor-pointer"
            title={notification.isRead ? 'Mark as Unread' : 'Mark as Read'}
          >
            {notification.isRead ? 'Mark Unread' : 'Mark Read'}
          </button>
          
          <button
            onClick={onToggleArchive}
            className="hover:text-indigo-700 font-bold transition cursor-pointer"
          >
            {notification.archived ? 'Restore' : 'Archive'}
          </button>

          <button
            onClick={onDelete}
            className="hover:text-red-700 font-bold transition cursor-pointer text-stone-600"
            title="Delete Notification"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
