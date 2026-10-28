interface NotificationItem {
  id: string;
  type: 'verification' | 'reported' | 'registration' | 'system' | string;
  message: string;
  time: string;
}

interface NotificationPanelProps {
  notifications: NotificationItem[];
  onClearItem?: (id: string) => void;
}

export default function NotificationPanel({ notifications, onClearItem }: NotificationPanelProps) {
  const displayNotifications = notifications.slice(0, 5);

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'verification':
        return 'bg-blue-50/50 border-blue-200 text-blue-800';
      case 'reported':
        return 'bg-rose-50/50 border-rose-200 text-rose-800';
      case 'registration':
        return 'bg-emerald-50/50 border-emerald-200 text-emerald-800';
      case 'system':
      default:
        return 'bg-stone-50 border-stone-200 text-stone-800';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'verification':
        return '⏳';
      case 'reported':
        return '🚨';
      case 'registration':
        return '👤';
      case 'system':
      default:
        return '⚙️';
    }
  };

  return (
    <div className="bg-white border border-light-border p-5 rounded-3xl shadow-apple-sm space-y-4 text-left select-none">
      <div className="border-b border-light-border/40 pb-2 flex justify-between items-center">
        <div>
          <h3 className="text-xs font-black uppercase text-stone-900 tracking-wider">
            Operational Alerts
          </h3>
          <p className="text-3xs text-stone-450 font-medium">
            Items requiring immediate oversight. Latest five only.
          </p>
        </div>
      </div>

      {displayNotifications.length === 0 ? (
        <div className="text-center py-6 text-stone-400 text-xs border border-dashed border-stone-200 rounded-2xl">
          No pending operational alerts.
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayNotifications.map((notif) => (
            <div 
              key={notif.id}
              className={`p-3 border rounded-xl flex items-start gap-2.5 text-xs font-semibold ${getAlertStyle(notif.type)}`}
            >
              <span className="text-sm pt-0.5 shrink-0" role="img" aria-hidden="true">
                {getAlertIcon(notif.type)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="leading-snug text-2xs font-semibold text-stone-850">{notif.message}</p>
                <span className="block text-3xs opacity-75 font-bold uppercase mt-1">
                  {notif.time}
                </span>
              </div>
              {onClearItem && (
                <button
                  onClick={() => onClearItem(notif.id)}
                  className="text-2xs font-bold opacity-60 hover:opacity-100 transition-opacity focus:outline-none"
                  aria-label="Dismiss alert"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
