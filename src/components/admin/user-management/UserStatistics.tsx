interface UserStatisticsProps {
  total: number;
  customers: number;
  professionals: number;
  consultants: number;
  admins: number;
  inactive: number;
  pending: number;
}

export default function UserStatistics({
  total,
  customers,
  professionals,
  consultants,
  admins,
  inactive,
  pending,
}: UserStatisticsProps) {
  const cards = [
    { icon: '👥', count: total, label: 'Total Users', desc: 'All registered accounts', color: 'bg-blue-50 text-blue-800' },
    { icon: '👤', count: customers, label: 'Customers', desc: 'Client account users', color: 'bg-indigo-50 text-indigo-800' },
    { icon: '🛠️', count: professionals, label: 'Professionals', desc: 'Verified trade pros', color: 'bg-teal-50 text-teal-800' },
    { icon: '🎓', count: consultants, label: 'Consultants', desc: 'Specialist advisors', color: 'bg-amber-50 text-amber-800' },
    { icon: '🛡️', count: admins, label: 'Administrators', desc: 'Platform operations team', color: 'bg-purple-50 text-purple-800' },
    { icon: '🚫', count: inactive, label: 'Inactive Users', desc: 'Dormant or deactivated', color: 'bg-stone-100 text-stone-700' },
    { icon: '⏳', count: pending, label: 'Pending Verify', desc: 'Awaiting credential checks', color: 'bg-rose-50 text-rose-800' },
  ];

  return (
    <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 select-none">
      {cards.map((card, idx) => (
        <div 
          key={idx} 
          className="bg-white border border-light-border p-4 rounded-2xl shadow-apple-xs hover:shadow-apple-sm transition-all duration-200 transform hover:-translate-y-0.5 flex flex-col justify-between"
        >
          <span className={`text-sm p-2 rounded-xl w-fit ${card.color}`}>
            {card.icon}
          </span>
          <div className="mt-4 space-y-0.5 text-left">
            <span className="block text-xl font-black text-stone-900 leading-none">
              {card.count}
            </span>
            <span className="block text-3xs font-black text-stone-900 uppercase tracking-wider">
              {card.label}
            </span>
            <span className="block text-3xs text-stone-400 font-medium">
              {card.desc}
            </span>
          </div>
        </div>
      ))}
    </section>
  );
}
