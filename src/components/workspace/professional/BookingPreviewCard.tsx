export interface BookingPreviewData {
  id: string;
  date: string;
  customerName: string;
  projectTitle: string;
  timeRange: string;
  status: string;
}

interface BookingPreviewCardProps {
  bookings: BookingPreviewData[];
}

export function BookingPreviewCard({ bookings }: BookingPreviewCardProps) {
  return (
    <div className="divide-y divide-stone-100 bg-white border border-stone-200 rounded-3xl p-5 shadow-sm space-y-3.5">
      {bookings.map((book) => (
        <div
          key={book.id}
          className="flex items-center justify-between gap-4 pt-3.5 first:pt-0 text-left text-xs font-semibold text-stone-700"
        >
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-stone-900 font-display leading-none">
              {book.projectTitle}
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-2xs text-stone-500 font-bold">
              <span>Client: <strong className="text-stone-600 font-extrabold">{book.customerName}</strong></span>
              <span>•</span>
              <span>🕒 {book.timeRange}</span>
            </div>
          </div>

          <div className="text-right flex flex-col items-end gap-1 select-none">
            <span className="text-2xs font-black font-display text-stone-900 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded shadow-sm">
              {book.date}
            </span>
            <span className="text-3xs font-black uppercase text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded leading-none border border-emerald-100">
              {book.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
