interface ProjectEmptyStateProps {
  type?: 'projects' | 'search' | 'flagged' | string;
  onResetFilters?: () => void;
}

export default function ProjectEmptyState({ type = 'projects', onResetFilters }: ProjectEmptyStateProps) {
  const getContent = () => {
    switch (type) {
      case 'flagged':
        return {
          icon: '🛡️',
          title: 'No Flagged Projects',
          description: 'The review backlog is clean. There are currently no projects flagged for administrative audit.',
        };
      case 'search':
        return {
          icon: '🔍',
          title: 'No Search Results Found',
          description: 'Try adjusting your keywords, category selections, progress threshold, or address location filters.',
        };
      case 'projects':
      default:
        return {
          icon: '📋',
          title: 'No Projects Discovered',
          description: 'No active or archived construction project contracts exist in the database.',
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
          Reset Portfolio Filters
        </button>
      )}
    </div>
  );
}
