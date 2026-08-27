import { useNavigate } from 'react-router-dom';
import { BookingStatusBadge } from './BookingStatusBadge';
import { BookingTimeline } from './BookingTimeline';

interface Booking {
  id: string;
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

interface BookingDetailsProps {
  booking: Booking;
  onClose: () => void;
  onReschedule: () => void;
  onCancel: () => void;
}

const getNextStepDescription = (status: string) => {
  const norm = status.trim().toLowerCase();
  if (norm.includes('submitted') || norm.includes('requested')) {
    return 'The professional will review your requirements and get in touch to discuss details.';
  }
  if (norm.includes('review') || norm.includes('accepted') || norm.includes('confirmed')) {
    return 'Discussion is ongoing. Share any site blueprints or specifications with the professional.';
  }
  if (norm.includes('started') || norm.includes('progress')) {
    return 'Your project is active. Work is ongoing according to the agreed milestones.';
  }
  if (norm.includes('completed')) {
    return 'Your project is completed. You can leave a review or download documents.';
  }
  if (norm.includes('cancelled')) {
    return 'This request has been cancelled.';
  }
  if (norm.includes('declined') || norm.includes('rejected')) {
    return 'The professional has declined this request.';
  }
  return 'Review the progress and coordinate with the professional via chat.';
};

export function BookingDetails({ booking, onClose, onReschedule, onCancel }: BookingDetailsProps) {
  const navigate = useNavigate();
  const norm = booking.status.trim().toLowerCase();
  const canRescheduleOrCancel = ['confirmed', 'scheduled', 'under review', 'request submitted'].includes(norm);

  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-lg p-6 space-y-6 text-left transition duration-200">
      
      {/* Header and Close */}
      <div className="flex justify-between items-start gap-4 border-b border-stone-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-stone-900 font-serif">{booking.serviceCategory}</h3>
            <BookingStatusBadge status={booking.status} />
          </div>
          <p className="text-[9px] font-black uppercase text-stone-400 tracking-wider">
            Request ID: {booking.id}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-700 h-6 w-6 rounded-full hover:bg-stone-50 border border-stone-150 flex items-center justify-center transition cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Next Step Info Box */}
      <div className="bg-emerald-50/40 border border-emerald-100/70 p-3.5 rounded-xl space-y-1 text-left">
        <span className="block text-[8px] font-black uppercase text-emerald-800 tracking-wider">
          👉 Next Action Step
        </span>
        <p className="text-[10px] text-stone-600 font-semibold leading-relaxed">
          {getNextStepDescription(booking.status)}
        </p>
      </div>

      {/* Main Metadata Grid */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="space-y-0.5">
          <span className="block text-[8px] uppercase font-black text-stone-400 tracking-wider">Professional Assignment</span>
          <span className="block font-bold text-stone-700">{booking.professionalName}</span>
          <span className="block text-[8px] text-stone-400 font-semibold">{booking.professionalCategory}</span>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[8px] uppercase font-black text-stone-400 tracking-wider">Service Scope</span>
          <span className="block font-bold text-stone-700">{booking.serviceCategory}</span>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[8px] uppercase font-black text-stone-400 tracking-wider">Estimated Budget</span>
          <span className="block font-bold text-stone-750">₹{booking.amount.toLocaleString()}</span>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[8px] uppercase font-black text-stone-400 tracking-wider">Target Start Date</span>
          <span className="block font-bold text-stone-700">{new Date(booking.scheduledDate).toLocaleDateString()}</span>
        </div>
        <div className="space-y-0.5">
          <span className="block text-[8px] uppercase font-black text-stone-400 tracking-wider">Submitted Date</span>
          <span className="block font-bold text-stone-700">{new Date(booking.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="space-y-0.5">
          {/* Empty spacer for alignment */}
        </div>
        <div className="col-span-2 space-y-0.5">
          <span className="block text-[8px] uppercase font-black text-stone-400 tracking-wider">Project Location</span>
          <span className="block font-semibold text-stone-600 leading-relaxed">{booking.address}, {booking.city}</span>
        </div>
      </div>

      {/* Visual Timeline progress bar */}
      <div className="border-t border-stone-100 pt-4">
        <BookingTimeline status={booking.status} />
      </div>

      {/* Booking Notes section */}
      <div className="space-y-1.5 border-t border-stone-100 pt-4 text-xs">
        <span className="block text-[8px] uppercase font-black text-stone-400 tracking-wider">Project Scope & Details</span>
        <p className="text-[10px] text-stone-600 font-medium leading-relaxed whitespace-pre-line bg-stone-50 p-2.5 rounded-xl border border-stone-100">
          {booking.projectTitle}
        </p>
      </div>

      {/* Payments and Messaging Placeholders */}
      <div className="grid grid-cols-2 gap-3 border-t border-stone-100 pt-4">
        <div className="border border-stone-200 rounded-xl p-3 bg-stone-50/50 space-y-1 text-center">
          <span className="block text-[8px] uppercase font-black text-stone-400 tracking-wider">Payments Info</span>
          <span className="block text-[10px] font-black text-emerald-800">💸 Paid Securely</span>
          <span className="block text-[8px] text-stone-400 font-bold uppercase tracking-wide">Secure Transaction</span>
        </div>
        <div className="border border-stone-200 rounded-xl p-3 bg-stone-50/50 space-y-1 text-center">
          <span className="block text-[8px] uppercase font-black text-stone-400 tracking-wider">Messaging Chat</span>
          {!['requested', 'pending', 'request submitted'].includes(norm) ? (
            <button
              onClick={() => navigate('/workspace/inbox')}
              className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline block mx-auto cursor-pointer"
            >
              💬 Open Thread
            </button>
          ) : (
            <button
              className="text-[10px] font-bold text-stone-400 block mx-auto cursor-not-allowed"
              disabled
            >
              💬 Open Thread
            </button>
          )}
          <span className="block text-[7.5px] text-stone-400 font-bold uppercase tracking-wide leading-relaxed">
            {!['requested', 'pending', 'request submitted'].includes(norm)
              ? 'Chat Active'
              : 'Messaging becomes available once a professional is matched to your request'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-stone-100 pt-4 flex flex-col gap-2">
        {canRescheduleOrCancel && (
          <div className="flex gap-2">
            <button
              onClick={onReschedule}
              className="flex-1 dbc-btn dbc-btn-md dbc-btn-secondary"
            >
              Update Start Date
            </button>
            <button
              onClick={() => {
                if (window.confirm("Cancel this project request?\n\nThis action cannot be undone.")) {
                  onCancel();
                }
              }}
              className="dbc-btn dbc-btn-md dbc-btn-danger"
            >
              Cancel Request
            </button>
          </div>
        )}
        
        <button
          onClick={() => alert('Download request summary feature is a mockup indicator.')}
          className="w-full dbc-btn dbc-btn-md dbc-btn-outline"
        >
          Download Request Summary (PDF)
        </button>
      </div>

    </div>
  );
}
