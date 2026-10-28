interface RequirementStatusBadgeProps {
  status: string;
}

export function RequirementStatusBadge({ status }: RequirementStatusBadgeProps) {
  const normalized = status.trim().toLowerCase();

  let style = 'bg-stone-50 border-stone-200 text-stone-600';
  if (normalized === 'open') {
    style = 'bg-emerald-50 border-emerald-100 text-emerald-800';
  } else if (normalized === 'under review') {
    style = 'bg-blue-50 border-blue-100 text-blue-800';
  } else if (normalized === 'quoted') {
    style = 'bg-purple-50 border-purple-100 text-purple-850';
  } else if (normalized === 'in progress') {
    style = 'bg-amber-50 border-amber-100 text-amber-800';
  } else if (normalized === 'completed') {
    style = 'bg-sky-50 border-sky-100 text-sky-850';
  } else if (normalized === 'cancelled') {
    style = 'bg-rose-50 border-rose-100 text-rose-800';
  } else if (normalized === 'draft') {
    style = 'bg-stone-100 border-stone-250 text-stone-550';
  }

  return (
    <span className={`inline-block text-3xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded border ${style}`}>
      {status}
    </span>
  );
}
