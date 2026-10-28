interface QuickActionsProps {
  onTabSelect: (tab: string) => void;
  onViewProjects: () => void;
  onViewSettings: () => void;
  onViewMarketplace: () => void;
}

export default function QuickActions({
  onTabSelect,
  onViewProjects,
  onViewSettings,
  onViewMarketplace,
}: QuickActionsProps) {
  return (
    <div className="bg-white border border-light-border p-5 rounded-3xl shadow-apple-sm space-y-4 text-left select-none">
      <div>
        <h3 className="text-xs font-black uppercase text-stone-900 tracking-wider">
          Quick Actions Panel
        </h3>
        <p className="text-3xs text-stone-450 font-medium">
          Shortcut actions for platform management commands.
        </p>
      </div>

      <div className="grid gap-2 grid-cols-2 text-3xs font-black uppercase tracking-wider text-center">
        <button 
          onClick={() => onTabSelect('users')} 
          className="p-3 bg-stone-50 hover:bg-stone-100 border border-light-border rounded-xl text-stone-800 font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald"
        >
          👤 Manage Users
        </button>
        <button 
          onClick={() => onTabSelect('verifications')} 
          className="p-3 bg-stone-50 hover:bg-stone-100 border border-light-border rounded-xl text-stone-800 font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald"
        >
          ⏳ Review Verifications
        </button>
        <button 
          onClick={onViewMarketplace} 
          className="p-3 bg-stone-50 hover:bg-stone-100 border border-light-border rounded-xl text-stone-800 font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald"
        >
          🛒 Review Marketplace
        </button>
        <button 
          onClick={onViewProjects} 
          className="p-3 bg-stone-50 hover:bg-stone-100 border border-light-border rounded-xl text-stone-800 font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald"
        >
          💼 View Projects
        </button>
        <button 
          onClick={onViewSettings} 
          className="col-span-2 p-3 bg-stone-50 hover:bg-stone-100 border border-light-border rounded-xl text-stone-800 font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald"
        >
          ⚙️ Platform Settings
        </button>
      </div>
    </div>
  );
}
