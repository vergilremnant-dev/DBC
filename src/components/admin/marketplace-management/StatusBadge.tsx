interface StatusBadgeProps {
  status: 'Open' | 'Pending Review' | 'Hidden' | 'Reported' | 'Closed' | 'Expired' | string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getBadgeClass = (s: string) => {
    switch (s) {
      case 'Open':
        return 'bg-emerald-50 text-emerald-800 border-emerald-250';
      case 'Pending Review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Hidden':
        return 'bg-stone-100 text-stone-500 border-stone-250';
      case 'Reported':
        return 'bg-rose-50 text-rose-700 border-rose-250';
      case 'Closed':
        return 'bg-stone-50 text-stone-600 border-stone-200';
      case 'Expired':
        return 'bg-stone-100 text-stone-400 border-stone-200';
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
