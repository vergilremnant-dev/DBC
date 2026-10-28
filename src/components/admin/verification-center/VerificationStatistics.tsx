interface VerificationStatisticsProps {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  awaitingReviewCount: number;
  additionalInfoCount: number;
  expiredCount: number;
}

export default function VerificationStatistics({
  pendingCount,
  approvedCount,
  rejectedCount,
  awaitingReviewCount,
  additionalInfoCount,
  expiredCount,
}: VerificationStatisticsProps) {
  const stats = [
    { icon: '⏳', count: pendingCount, label: 'Pending Review', desc: 'Awaiting audit validation', color: 'bg-amber-50 text-amber-800' },
    { icon: '✅', count: approvedCount, label: 'Approved', desc: 'Fully verified partners', color: 'bg-emerald-50 text-emerald-800' },
    { icon: '🚫', count: rejectedCount, label: 'Rejected', desc: 'Failed credential checks', color: 'bg-rose-50 text-rose-700' },
    { icon: '📄', count: awaitingReviewCount, label: 'Docs Awaiting Review', desc: 'File attachment backlog', color: 'bg-blue-50 text-blue-800' },
    { icon: '❓', count: additionalInfoCount, label: 'Info Requested', desc: 'Pending applicant uploads', color: 'bg-purple-50 text-purple-800' },
    { icon: '📆', count: expiredCount, label: 'Expired', desc: 'Timed out submissions', color: 'bg-stone-100 text-stone-600' },
  ];

  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 select-none">
      {stats.map((stat, idx) => (
        <div 
          key={idx} 
          className="bg-white border border-light-border p-4 rounded-2xl shadow-apple-xs hover:shadow-apple-sm transition-all duration-200 transform hover:-translate-y-0.5 flex flex-col justify-between"
        >
          <span className={`text-sm p-2 rounded-xl w-fit ${stat.color}`}>
            {stat.icon}
          </span>
          <div className="mt-4 space-y-0.5 text-left">
            <span className="block text-xl font-black text-stone-900 leading-none">
              {stat.count}
            </span>
            <span className="block text-3xs font-black text-stone-900 uppercase tracking-wider">
              {stat.label}
            </span>
            <span className="block text-3xs text-stone-450 font-medium">
              {stat.desc}
            </span>
          </div>
        </div>
      ))}
    </section>
  );
}
