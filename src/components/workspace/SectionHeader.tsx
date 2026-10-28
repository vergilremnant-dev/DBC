interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, subtitle, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-stone-100 pb-3 mb-4">
      <div className="space-y-0.5 text-left">
        <h3 className="text-sm font-bold text-stone-900 font-display">{title}</h3>
        {subtitle && <p className="text-2xs text-stone-450 font-semibold">{subtitle}</p>}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-2xs font-black uppercase tracking-wider text-emerald-700 hover:text-emerald-800 transition focus:outline-none focus:underline"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
