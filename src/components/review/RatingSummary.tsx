import type { RatingSummary as RatingSummaryType } from '../../types/review/reviewTypes';
import { StarRating } from './StarRating';

interface RatingSummaryProps {
  summary: RatingSummaryType;
}

export function RatingSummary({ summary }: RatingSummaryProps) {
  const { averageRating, totalReviews } = summary;

  const distribution = [
    { stars: 5, count: summary.rating5Count },
    { stars: 4, count: summary.rating4Count },
    { stars: 3, count: summary.rating3Count },
    { stars: 2, count: summary.rating2Count },
    { stars: 1, count: summary.rating1Count },
  ];

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 grid gap-6 sm:grid-cols-[140px_1fr] items-center">
      {/* Overall Score */}
      <div className="text-center sm:border-r sm:border-stone-200 sm:pr-6 py-2">
        <p className="text-3xs font-bold uppercase tracking-wider text-stone-450 text-stone-500">Average Rating</p>
        <h3 className="text-3xl font-extrabold text-stone-900 font-display mt-1">{averageRating.toFixed(1)}</h3>
        <div className="flex justify-center mt-1.5">
          <StarRating rating={Math.round(averageRating)} size="md" />
        </div>
        <p className="text-2xs text-stone-400 mt-2 font-bold uppercase tracking-wider">
          {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}
        </p>
      </div>

      {/* Progress Breakdown */}
      <div className="space-y-1.5">
        {distribution.map((row) => {
          const percent = totalReviews > 0 ? (row.count / totalReviews) * 100 : 0;
          return (
            <div key={row.stars} className="flex items-center gap-3 text-xs">
              <span className="w-8 font-bold text-stone-500 text-right">{row.stars} ★</span>
              <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden border border-stone-100">
                <div
                  className="h-full bg-emerald-650 bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="w-8 text-stone-400 font-semibold text-right">{row.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
