import { BRAND } from '../../../config/branding';
import type { AppNotification } from '../../../services/notification/notificationService';
import { NotificationBadge } from './NotificationBadge';

interface NotificationDetailProps {
  notification: AppNotification;
  onClose?: () => void;
  onToggleRead: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
  onNavigateToModule: (url: string) => void;
}

export function NotificationDetail({
  notification,
  onClose,
  onToggleRead,
  onToggleArchive,
  onDelete,
  onNavigateToModule,
}: NotificationDetailProps) {
  // Map category to details description text
  const categoryModules = {
    Requirements: 'Requirements Management Module',
    Bookings: 'Bookings Management Module',
    Messages: 'Messages & Inbox Module',
    Consultations: 'Consultations & Planning Dashboard',
    Payments: 'Receipts & Subscriptions Pass',
    System: 'System Configuration Logs',
    Promotions: 'Monsoon Offers & Discount Passes'
  };

  const moduleName = notification.category 
    ? categoryModules[notification.category] 
    : `${BRAND.name} General System`;

  const handleActionClick = () => {
    if (notification.actionUrl) {
      onNavigateToModule(notification.actionUrl);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-6 text-left h-full flex flex-col justify-between">
      <div className="space-y-5">
        {/* Header Actions */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <span className="text-2xs font-black uppercase tracking-wider text-stone-400">
            Notification Details
          </span>
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1 bg-stone-50 border border-stone-150 hover:bg-stone-100 text-stone-600 rounded-lg text-xs font-bold"
                aria-label="Close panel"
              >
                Close ✕
              </button>
            )}
          </div>
        </div>

        {/* Categories, Priorities & Timing */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-1.5 items-center">
            {notification.category && (
              <NotificationBadge category={notification.category} type="category" />
            )}
            {notification.priority && (
              <NotificationBadge priority={notification.priority} type="priority" />
            )}
          </div>
          <span className="text-2xs text-stone-400 font-bold">
            Received: {notification.createdAt}
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-base font-extrabold text-stone-950 font-display leading-snug">
            {notification.title}
          </h2>
          <div className="flex items-center gap-1.5 text-2xs font-bold text-stone-400 uppercase">
            <span>Module:</span>
            <span className="text-stone-600">{moduleName}</span>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-stone-50 border border-stone-100 p-2.5 rounded-xl">
            <span className="block text-3xs font-extrabold uppercase text-stone-400">Read Status</span>
            <span className={`inline-block mt-0.5 text-2xs font-black uppercase tracking-wider ${
              notification.isRead 
                ? 'text-emerald-800' 
                : 'text-rose-600'
            }`}>
              {notification.isRead ? 'Already Read' : 'Unread Notification'}
            </span>
          </div>
          <div className="bg-stone-50 border border-stone-100 p-2.5 rounded-xl">
            <span className="block text-3xs font-extrabold uppercase text-stone-400">Archive Status</span>
            <span className={`inline-block mt-0.5 text-2xs font-black uppercase tracking-wider ${
              notification.archived 
                ? 'text-indigo-800' 
                : 'text-stone-500'
            }`}>
              {notification.archived ? 'Archived Item' : 'Active Inbox'}
            </span>
          </div>
        </div>

        {/* Description Body */}
        <div className="space-y-2">
          <span className="block text-2xs uppercase font-bold text-stone-400">Message Description</span>
          <p className="text-xs text-stone-600 font-semibold leading-relaxed bg-stone-50/50 p-4 border border-stone-100 rounded-xl whitespace-pre-line">
            {notification.description || notification.content}
          </p>
        </div>

        {/* Suggested Action CTA */}
        {notification.actionLabel && (
          <div className="bg-emerald-950 text-white p-4 rounded-xl flex items-center justify-between gap-3 border border-emerald-900 shadow-sm">
            <div className="space-y-0.5">
              <span className="block text-3xs font-extrabold uppercase tracking-widest text-emerald-400">Suggested Action</span>
              <h4 className="text-2xs font-bold font-display leading-tight">Inspect matching details in module</h4>
            </div>
            <button
              onClick={handleActionClick}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-2xs font-extrabold uppercase tracking-wider px-3.5 py-2 rounded-lg transition cursor-pointer whitespace-nowrap shadow-sm"
            >
              {notification.actionLabel} &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Detail Action Panel Footer */}
      <div className="pt-4 border-t border-stone-100 flex flex-wrap gap-2 items-center justify-between text-xs font-bold text-stone-500">
        <div className="flex gap-2">
          <button
            onClick={onToggleRead}
            className="rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 px-3.5 py-2 text-stone-700 transition cursor-pointer"
          >
            {notification.isRead ? 'Mark as Unread' : 'Mark as Read'}
          </button>
          
          <button
            onClick={onToggleArchive}
            className="rounded-lg bg-stone-50 hover:bg-stone-100 border border-stone-200 px-3.5 py-2 text-stone-700 transition cursor-pointer"
          >
            {notification.archived ? 'Restore to Inbox' : 'Archive Update'}
          </button>
        </div>

        <button
          onClick={onDelete}
          className="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-150 px-3.5 py-2 transition cursor-pointer"
        >
          Delete Record
        </button>
      </div>
    </div>
  );
}
