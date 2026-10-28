interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

export function EmptyState({ icon, title, description, ctaLabel, onCtaClick }: EmptyStateProps) {
  return (
    <div className="py-12 text-center space-y-3 bg-stone-50/50 border border-stone-200 border-dashed rounded-3xl p-6">
      <span className="text-3xl block select-none">{icon}</span>
      
      <div className="space-y-1">
        <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider">
          {title}
        </h4>
        <p className="text-2xs text-stone-400 font-semibold max-w-xs mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {ctaLabel && onCtaClick && (
        <button
          onClick={onCtaClick}
          className="rounded-lg bg-stone-900 hover:bg-stone-850 px-4 py-1.5 text-2xs font-black text-white uppercase tracking-wider transition cursor-pointer shadow"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
