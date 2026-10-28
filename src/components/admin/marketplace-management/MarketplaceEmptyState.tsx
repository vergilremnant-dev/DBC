interface MarketplaceEmptyStateProps {
  type?: 'requirements' | 'reported' | 'search' | 'pending' | string;
  onResetFilters?: () => void;
}

export default function MarketplaceEmptyState({ type = 'requirements', onResetFilters }: MarketplaceEmptyStateProps) {
  const getContent = () => {
    switch (type) {
      case 'reported':
        return {
          icon: '🛡️',
          title: 'No Flagged Listings',
          description: 'The reports queue is empty. There are currently no listings flagged by users for moderation.',
        };
      case 'search':
        return {
          icon: '🔍',
          title: 'No Search Results Found',
          description: 'Try adjusting your keywords, categories, property type filters, or budget ranges.',
        };
      case 'pending':
        return {
          icon: '⏳',
          title: 'No Pending Reviews',
          description: 'All customer posts are fully reviewed and public. There are no drafts or pending approvals.',
        };
      case 'requirements':
      default:
        return {
          icon: '📋',
          title: 'No Requirements Found',
          description: 'No matching customer requirement listings were discovered in the platform marketplace database.',
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
