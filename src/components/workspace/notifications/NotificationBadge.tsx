import type { AppNotification } from '../../../services/notification/notificationService';

interface NotificationBadgeProps {
  category?: AppNotification['category'];
  priority?: AppNotification['priority'];
  type?: 'category' | 'priority';
}

export function NotificationBadge({ category, priority, type = 'category' }: NotificationBadgeProps) {
  if (type === 'priority' && priority) {
    const priorityStyles = {
      High: 'bg-rose-50 border border-rose-100 text-rose-700 font-extrabold',
      Medium: 'bg-amber-50 border border-amber-100 text-amber-700 font-bold',
      Low: 'bg-stone-50 border border-stone-150 text-stone-600 font-medium'
    };

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-2xs uppercase tracking-wider ${priorityStyles[priority]}`}>
        {priority} Priority
      </span>
    );
  }

  if (type === 'category' && category) {
    const categoryStyles = {
      Requirements: { style: 'bg-emerald-50 border border-emerald-100 text-emerald-800', icon: '📋' },
      Bookings: { style: 'bg-blue-50 border border-blue-100 text-blue-800', icon: '📅' },
      Messages: { style: 'bg-purple-50 border border-purple-100 text-purple-800', icon: '💬' },
      Consultations: { style: 'bg-indigo-50 border border-indigo-100 text-indigo-800', icon: '🤝' },
      Payments: { style: 'bg-cyan-50 border border-cyan-100 text-cyan-800', icon: '💳' },
      System: { style: 'bg-stone-50 border border-stone-200 text-stone-700', icon: '⚙️' },
      Promotions: { style: 'bg-pink-50 border border-pink-100 text-pink-800', icon: '🎁' }
    };

    const config = categoryStyles[category] || { style: 'bg-stone-50 border border-stone-100 text-stone-600', icon: '🔔' };

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold ${config.style}`}>
        <span>{config.icon}</span>
        <span>{category}</span>
      </span>
    );
  }

  return null;
}
