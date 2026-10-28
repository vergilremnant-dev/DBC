interface BookingStatusBadgeProps {
  status: string;
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const normalized = (status || '').trim().toLowerCase();

  let style = 'bg-stone-50 border-stone-200 text-stone-600';
  if (normalized === 'confirmed' || normalized === 'accepted' || normalized === 'under review') {
    style = 'bg-emerald-50 border-emerald-300 text-emerald-800 font-extrabold';
  } else if (normalized === 'requested' || normalized === 'pending' || normalized === 'request submitted') {
    style = 'bg-amber-50 border-amber-300 text-amber-800 font-bold';
  } else if (normalized === 'scheduled') {
    style = 'bg-teal-50 border-teal-200 text-teal-800';
  } else if (normalized === 'in progress' || normalized === 'in_progress' || normalized === 'project started') {
    style = 'bg-blue-50 border-blue-200 text-blue-800 font-bold';
  } else if (normalized === 'completed' || normalized === 'project completed') {
    style = 'bg-sky-50 border-sky-300 text-sky-850 font-bold';
  } else if (normalized === 'cancelled') {
    style = 'bg-rose-50 border-rose-200 text-rose-800';
  } else if (normalized === 'declined' || normalized === 'rejected') {
    style = 'bg-stone-100 border-rose-200 text-rose-700';
  } else if (normalized === 'rescheduled') {
    style = 'bg-purple-50 border-purple-200 text-purple-800';
  }

  return (
    <span className={`inline-block text-3xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded border ${style}`}>
      {status}
    </span>
  );
}
