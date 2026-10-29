interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedDate: string;
}

interface UserSummaryProps {
  newRegistrations: number;
  activeCount: number;
  inactiveCount: number;
  recentlyJoined: UserRecord[];
  onViewAll: () => void;
}

export default function UserSummary({
  newRegistrations,
  activeCount,
  inactiveCount,
  recentlyJoined,
  onViewAll,
}: UserSummaryProps) {
  return (
    <div className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-6 text-left select-none">
      <div className="flex justify-between items-center border-b border-light-border/40 pb-3">
        <div>
          <h3 className="text-xs font-black uppercase text-stone-900 tracking-wider">
            User Operations Summary
          </h3>
          <p className="text-2xs text-stone-500 font-medium mt-0.5">
            Platform-wide account growth and recent registrations.
          </p>
        </div>
        <button
          onClick={onViewAll}
          className="text-3xs font-black uppercase text-brand-emerald hover:underline cursor-pointer focus:outline-none"
        >
          View All Users &rarr;
        </button>
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-3 gap-4 text-xs font-bold text-stone-700">
        <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
          <span className="block text-3xs font-black text-stone-600 uppercase tracking-wider">
            New Registrations
          </span>
          <span className="text-base font-extrabold text-blue-900">{newRegistrations}</span>
        </div>
        <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
          <span className="block text-3xs font-black text-stone-600 uppercase tracking-wider">
            Active Users
          </span>
          <span className="text-base font-extrabold text-brand-emerald">{activeCount}</span>
        </div>
        <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
          <span className="block text-3xs font-black text-stone-600 uppercase tracking-wider">
            Inactive Users
          </span>
          <span className="text-base font-extrabold text-stone-800">{inactiveCount}</span>
        </div>
      </div>

      {/* Recently Joined List */}
      <div className="space-y-3">
        <h4 className="text-3xs font-black uppercase text-stone-450 tracking-wider">
          Recently Joined Users
        </h4>
        {recentlyJoined.length === 0 ? (
          <div className="text-center py-6 text-stone-400 text-xs border border-dashed border-stone-200 rounded-xl">
            No recently joined users.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-2xs" aria-label="Recent Registrations Table">
              <thead>
                <tr className="border-b border-light-border text-3xs font-black uppercase text-stone-400">
                  <th className="py-2">User details</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border/40 text-stone-700 font-semibold">
                {recentlyJoined.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2">
                      <strong className="block text-stone-900">{u.name}</strong>
                      <span className="text-3xs text-stone-450 font-normal">{u.email}</span>
                    </td>
                    <td className="py-2">
                      <span className="dbc-badge dbc-badge-progress text-3xs py-0.5">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2">
                      <span className={`dbc-badge text-3xs py-0.5 ${
                        u.status === 'Active' ? 'dbc-badge-completed' : 'dbc-badge-progress'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-2 text-right text-stone-500 font-medium">{u.joinedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
