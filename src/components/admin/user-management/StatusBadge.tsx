interface StatusBadgeProps {
  status: 'Active' | 'Inactive' | 'Suspended' | 'Pending Verification' | 'Verified' | 'Rejected' | string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getBadgeClass = (s: string) => {
    switch (s) {
      case 'Active':
      case 'Verified':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Inactive':
        return 'bg-stone-100 text-stone-600 border-stone-200';
      case 'Suspended':
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Pending Verification':
      case 'Pending':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-stone-50 text-stone-800 border-stone-200';
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
