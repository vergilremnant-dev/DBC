export type ProjectStatus = 'Planning' | 'Scheduled' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const getColors = (val: ProjectStatus) => {
    switch (val) {
      case 'Planning':
        return 'bg-blue-50 text-blue-800 border-blue-100';
      case 'Scheduled':
        return 'bg-indigo-50 text-indigo-800 border-indigo-100';
      case 'In Progress':
        return 'bg-amber-50 text-amber-800 border-amber-100';
      case 'On Hold':
        return 'bg-rose-50 text-rose-800 border-rose-100';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-100';
      case 'Cancelled':
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
