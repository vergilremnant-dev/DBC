import { BookingStatusBadge } from './BookingStatusBadge';

interface Booking {
  id: string;
  bookingNumber?: string;
  professionalName: string;
  professionalCategory: string;
  projectTitle: string;
  serviceCategory: string;
  city: string;
  address: string;
  scheduledDate: string;
  status: string;
  amount: number;
  createdAt: string;
}

interface BookingCardProps {
  booking: Booking;
  onSelect: () => void;
}

export function BookingCard({ booking, onSelect }: BookingCardProps) {
  return (
    <div
      onClick={onSelect}
      className="bg-white border border-stone-200 hover:border-emerald-500 rounded-2xl p-5 shadow-sm hover:shadow-md transition duration-200 text-left cursor-pointer flex flex-col justify-between gap-4 group"
    >
      <div className="space-y-3">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1 min-w-0">
            {/* Professional / Company */}
            <span className="block text-[8px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded w-max">
              Pro: {booking.professionalName}
            </span>
            {/* Service */}
            <h4 className="text-xs font-black text-stone-900 leading-snug group-hover:text-emerald-800 transition truncate">
              {booking.serviceCategory}
            </h4>
          </div>
          {/* Current Status */}
          <BookingStatusBadge status={booking.status} />
        </div>

        {/* Request Date & Info */}
        <div className="text-[10px] text-stone-500 font-semibold space-y-0.5">
          <p>Request Date: <span className="font-bold text-stone-700">{new Date(booking.createdAt).toLocaleDateString()}</span></p>
          <p>Target Start: <span className="font-bold text-stone-700">{new Date(booking.scheduledDate).toLocaleDateString()}</span></p>
        </div>
      </div>

      <div className="border-t border-stone-100 pt-3 flex justify-between items-center text-[9px] font-bold text-stone-400 uppercase tracking-wider">
        {/* Next Action */}
        <span className="text-brand-emerald font-black group-hover:underline min-h-[44px] flex items-center">
          View Request details →
        </span>
        <span>ID: {booking.bookingNumber || booking.id.slice(0, 8)}</span>
      </div>
    </div>
  );
}
