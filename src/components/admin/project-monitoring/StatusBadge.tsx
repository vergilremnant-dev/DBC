interface StatusBadgeProps {
  status: 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled' | string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getBadgeClass = (s: string) => {
    switch (s) {
      case 'Planning':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'In Progress':
        return 'bg-emerald-50 text-emerald-850 border-emerald-250';
      case 'On Hold':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Completed':
        return 'bg-stone-50 text-stone-600 border-stone-200';
      case 'Cancelled':
        return 'bg-stone-100 text-stone-450 border-stone-250';
      default:
        return 'bg-stone-50 text-stone-850 border-stone-200';
    }
  };

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider border ${getBadgeClass(status)}`}
    >
      {status}
    </span>
  );
}
