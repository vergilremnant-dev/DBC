interface EmptyStateProps {
  type?: 'requests' | 'pending' | 'search' | 'documents' | string;
  onResetFilters?: () => void;
}

export default function EmptyState({ type = 'requests', onResetFilters }: EmptyStateProps) {
  const getContent = () => {
    switch (type) {
      case 'pending':
        return {
          icon: '🎉',
          title: 'No Pending Reviews',
          description: 'Good job! The pending verification queue is fully cleared. All active applicants are audited.',
        };
      case 'search':
        return {
          icon: '🔍',
          title: 'No Search Results Found',
          description: 'Try adjusting your search query keywords, applicant role filters, submission dates, or statuses.',
        };
      case 'documents':
        return {
          icon: '📁',
          title: 'No Uploaded Documents',
          description: 'This applicant has not uploaded any identity proof, business registration, or licensing documents yet.',
        };
      case 'requests':
      default:
        return {
          icon: '📋',
          title: 'No Verification Requests',
          description: 'No active or historical credential verification requests exist in the database.',
        };
    }
  };

  const info = getContent();

  return (
    <div className="bg-white border border-light-border p-8 rounded-3xl text-center space-y-4 shadow-apple-sm max-w-md mx-auto my-8 select-none animate-gentle-fade">
      <span className="text-3xl block" role="img" aria-hidden="true">
        {info.icon}
      </span>
      <div className="space-y-1">
        <h4 className="text-xs font-black text-stone-900 uppercase tracking-widest">
          {info.title}
        </h4>
        <p className="text-2xs text-stone-500 font-medium leading-relaxed">
          {info.description}
        </p>
      </div>
      {onResetFilters && (
        <button
          onClick={onResetFilters}
          className="px-4 py-2 bg-brand-emerald hover:bg-emerald-800 text-white rounded-xl text-3xs font-black uppercase tracking-wider transition cursor-pointer"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
}
export type { EmptyStateProps };
