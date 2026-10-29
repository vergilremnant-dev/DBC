import type { Review } from '../../types/review/reviewTypes';
import { StarRating } from './StarRating';

interface ReviewCardProps {
  review: Review;
  onReplyClick?: (reviewId: string) => void;
  canReply?: boolean;
}

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function ReviewCard({ review, onReplyClick, canReply = false }: ReviewCardProps) {
  const getCustomerDisplayName = (name?: string) => {
    if (!name) return 'Verified Customer';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  };

  return (
    <div className="border border-stone-200 bg-white rounded-xl p-5 shadow-sm space-y-4">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900 text-sm">{getCustomerDisplayName(review.customer?.fullName)}</span>
            {review.isVerified && (
              <span className="text-3xs font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-2xs text-stone-500 font-semibold">{formatDate(review.createdAt)}</span>
          </div>
        </div>

        {review.wouldRecommend !== undefined && (
          <span className={`text-3xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
            review.wouldRecommend 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
              : 'bg-stone-50 border-stone-200 text-stone-500'
          }`}>
            {review.wouldRecommend ? '👍 Recommends' : '😐 Neutral'}
          </span>
        )}
      </div>

      {/* Title & Body */}
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-stone-900 leading-snug">{review.reviewTitle}</h4>
        <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">{review.reviewDescription}</p>
      </div>

      {/* Provider Response */}
      {review.providerResponse && (
        <div className="bg-stone-50 border-l-2 border-amber-600 p-4 rounded-r-lg mt-3 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-stone-900">Provider Response</span>
            <span className="text-3xs text-stone-400 font-semibold">Replied</span>
          </div>
          <p className="text-stone-600 leading-relaxed">{review.providerResponse}</p>
        </div>
      )}

      {/* Action to reply */}
      {canReply && !review.providerResponse && onReplyClick && (
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => onReplyClick(review.id)}
            className="rounded bg-stone-900 hover:bg-stone-855 text-white text-2xs font-bold px-3 py-1.5 transition cursor-pointer"
          >
            Reply
          </button>
        </div>
      )}
    </div>
  );
}
