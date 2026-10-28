interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionClick?: () => void;
}

export function SectionHeader({ title, subtitle, actionLabel, onActionClick }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-stone-150 pb-2">
      <div className="space-y-0.5">
        <h3 className="text-sm font-bold text-stone-900 font-display leading-none">
          {title}
        </h3>
        {subtitle && (
          <p className="text-2xs text-stone-400 font-semibold uppercase tracking-wider">
            {subtitle}
          </p>
        )}
      </div>

      {actionLabel && onActionClick && (
        <button
          onClick={onActionClick}
          className="text-2xs font-black text-emerald-700 hover:text-emerald-900 transition uppercase tracking-wider cursor-pointer"
        >
          {actionLabel} &rarr;
        </button>
      )}
    </div>
  );
}
