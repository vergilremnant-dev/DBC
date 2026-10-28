interface EmptyStateProps {
  type?: 'users' | 'search' | 'customer' | 'consultant' | 'professional' | string;
  onResetFilters?: () => void;
}

export default function EmptyState({ type = 'users', onResetFilters }: EmptyStateProps) {
  const getContent = () => {
    switch (type) {
      case 'search':
        return {
          icon: '🔍',
          title: 'No Search Results Found',
          description: 'Try adjusting your keywords, search terms, or role filters to discover matching users.',
        };
      case 'customer':
        return {
          icon: '👤',
          title: 'No Customers Found',
          description: 'There are currently no customer account records matching the active filters.',
        };
      case 'consultant':
        return {
          icon: '🎓',
          title: 'No Consultants Found',
          description: 'There are currently no specialist consultant account profiles registered on the platform.',
        };
      case 'professional':
        return {
          icon: '🛠️',
          title: 'No Professionals Found',
          description: 'There are currently no trade service professionals registered in the workspace directory.',
        };
      case 'users':
      default:
        return {
          icon: '👥',
          title: 'No Users Registered',
          description: 'No matching user profiles or accounts exist in the primary identity database.',
        };
    }
  };

  const info = getContent();

  return (
    <div className="bg-white border border-light-border p-8 rounded-3xl text-center space-y-4 shadow-apple-sm max-w-md mx-auto my-8 select-none">
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
          Reset Search Filters
        </button>
      )}
    </div>
  );
}
