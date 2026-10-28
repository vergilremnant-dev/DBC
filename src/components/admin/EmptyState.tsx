interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  actionText?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  description,
  icon = '📂',
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="bg-white border border-light-border p-8 rounded-3xl text-center space-y-4 shadow-apple-sm select-none max-w-md mx-auto my-6">
      <span className="text-3xl block" role="img" aria-hidden="true">
        {icon}
      </span>
      <div className="space-y-1">
        <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest">
          {title}
        </h4>
        <p className="text-2xs text-stone-500 font-medium leading-relaxed">
          {description}
        </p>
      </div>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="dbc-btn dbc-btn-primary py-2 px-4 text-3xs font-black uppercase tracking-wider transition cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
