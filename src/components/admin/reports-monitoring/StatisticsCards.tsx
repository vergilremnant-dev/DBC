interface StatisticsCardsProps {
  totalUsers: number;
  activeProjects: number;
  openRequirements: number;
  completedProjects: number;
  pendingVerifications: number;
  submittedQuotations: number;
  onTabSelect?: (tab: any) => void;
}

export default function StatisticsCards({
  totalUsers,
  activeProjects,
  openRequirements,
  completedProjects,
  pendingVerifications,
  submittedQuotations,
  onTabSelect,
}: StatisticsCardsProps) {
  const cards = [
    { icon: '👥', count: totalUsers, label: 'Total Users', desc: 'Registered platform users', color: 'bg-blue-50 text-blue-800', tab: 'users' },
    { icon: '💼', count: activeProjects, label: 'Active Projects', desc: 'Ongoing trade milestones', color: 'bg-emerald-50 text-emerald-805', tab: 'projects' },
    { icon: '🛒', count: openRequirements, label: 'Open Requirements', desc: 'Bidding marketplace opportunities', color: 'bg-purple-50 text-purple-800', tab: 'marketplace' },
    { icon: '✅', count: completedProjects, label: 'Completed Projects', desc: 'Total successful projects', color: 'bg-stone-100 text-stone-800', tab: 'projects' },
    { icon: '⏳', count: pendingVerifications, label: 'Pending Verifications', desc: 'Credentials awaiting audit', color: 'bg-rose-50 text-rose-800', tab: 'verifications' },
    { icon: '📄', count: submittedQuotations, label: 'Submitted Quotations', desc: 'Active trade bid proposals', color: 'bg-amber-50 text-amber-800' },
  ];

  return (
    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 select-none">
      {cards.map((card, idx) => {
        const content = (
          <>
            <span className={`text-sm p-2 rounded-xl w-fit ${card.color}`}>
              {card.icon}
            </span>
            <div className="mt-4 space-y-0.5">
              <span className="block text-xl font-black text-stone-900 leading-none">
                {card.count.toLocaleString()}
              </span>
              <span className="block text-3xs font-black text-stone-900 uppercase tracking-wider">
                {card.label}
              </span>
              <span className="block text-3xs text-stone-450 font-medium">
                {card.desc}
              </span>
            </div>
          </>
        );

        if (card.tab && onTabSelect) {
          return (
            <button
              key={idx}
              onClick={() => onTabSelect(card.tab)}
              className="bg-white border border-light-border p-4 rounded-2xl shadow-apple-xs hover:shadow-apple-sm hover:border-emerald-600/30 transition-all duration-200 transform hover:-translate-y-0.5 flex flex-col justify-between text-left cursor-pointer focus:outline-none"
            >
              {content}
            </button>
          );
        }

        return (
          <div 
            key={idx}
            className="bg-white border border-light-border p-4 rounded-2xl shadow-apple-xs flex flex-col justify-between text-left"
          >
            {content}
          </div>
        );
      })}
    </section>
  );
}
