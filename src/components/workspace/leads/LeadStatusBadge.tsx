export type LeadStatus = 'Open' | 'Popular' | 'Closing Soon' | 'Assigned' | 'Closed';

interface LeadStatusBadgeProps {
  status: LeadStatus;
}

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const getColors = (val: LeadStatus) => {
    switch (val) {
      case 'Open':
        return 'bg-emerald-50 text-emerald-800 border-emerald-100';
      case 'Popular':
        return 'bg-amber-50 text-amber-800 border-amber-100';
      case 'Closing Soon':
        return 'bg-rose-50 text-rose-800 border-rose-100';
      case 'Assigned':
        return 'bg-blue-50 text-blue-800 border-blue-100';
      case 'Closed':
        default:
        return 'bg-stone-100 text-stone-500 border-stone-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-3xs font-black uppercase tracking-wider border select-none leading-none ${getColors(status)}`}>
      {status}
    </span>
  );
}
