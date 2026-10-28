interface StatusBadgeProps {
  status: 'Pending' | 'Approved' | 'Rejected' | 'Additional Information Requested' | 'Expired' | string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getBadgeClass = (s: string) => {
    switch (s) {
      case 'Pending':
        return 'bg-amber-50 text-amber-800 border-amber-220';
      case 'Approved':
        return 'bg-emerald-50 text-emerald-850 border-emerald-255';
      case 'Rejected':
        return 'bg-rose-50 text-rose-800 border-rose-220';
      case 'Additional Information Requested':
        return 'bg-blue-50 text-blue-800 border-blue-220';
      case 'Expired':
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
