interface StarRatingProps {
  rating: number;
  maxStars?: number;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export function StarRating({
  rating,
  maxStars = 5,
  onRatingChange,
  size = 'md',
  interactive = false,
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'text-2xs gap-0.5',
    md: 'text-xs gap-1',
    lg: 'text-sm gap-1',
  };

  const handleStarClick = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex);
    }
  };

  return (
    <div className={`flex items-center ${sizeClasses[size]}`} aria-label={`Rating: ${rating} out of ${maxStars} stars`}>
      {Array.from({ length: maxStars }).map((_, index) => {
        const starIndex = index + 1;
        const isActive = starIndex <= rating;
        return (
          <span
            key={index}
            onClick={() => handleStarClick(starIndex)}
            className={`transition duration-150 ${
              interactive ? 'cursor-pointer hover:scale-110' : ''
            } ${isActive ? 'text-amber-550 text-amber-500' : 'text-stone-250 text-stone-300'}`}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}
