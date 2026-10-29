interface AccountInfoCardProps {
  accountType: string;
  memberSince: string;
  lastLogin: string;
  status: string;
  role: string;
  appVersion?: string;
}

export function AccountInfoCard({
  accountType,
  memberSince,
  lastLogin,
  status,
  role,
  appVersion = 'v2.1.0-beta',
}: AccountInfoCardProps) {
  const infoItems = [
    { label: 'Account Type', value: accountType },
    { label: 'User Role ID', value: role },
    { label: 'Member Registration', value: memberSince },
    { label: 'Last Activity Login', value: lastLogin },
    { label: 'Account System Status', value: status, isBadge: true },
    { label: 'Core Platform Version', value: appVersion, isMono: true }
  ];

  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-4 text-left">
      <div className="border-b border-stone-100 pb-2">
        <h3 className="text-sm font-bold text-stone-900 font-display">Account System Information</h3>
        <p className="text-3xs font-bold text-stone-500 uppercase tracking-widest">
          Read-only registration metadata & licensing attributes
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 text-xs font-semibold text-stone-600">
        {infoItems.map((item, idx) => (
          <div key={idx} className="p-3 bg-stone-50/50 rounded-xl border border-stone-100 flex flex-col justify-between gap-1">
            <span className="text-3xs uppercase font-bold text-stone-500">{item.label}</span>
            {item.isBadge ? (
              <span className="text-emerald-800 bg-emerald-50 border border-emerald-100 rounded self-start px-2 py-0.5 text-3xs font-black uppercase">
                {item.value}
              </span>
            ) : item.isMono ? (
              <span className="text-stone-900 font-mono text-2xs">{item.value}</span>
            ) : (
              <span className="text-stone-900">{item.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
