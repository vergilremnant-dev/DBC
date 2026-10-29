import { useMemo } from 'react';

interface DashboardHeaderProps {
  adminName: string;
  onTabSelect: (tab: string) => void;
}

export default function DashboardHeader({ adminName, onTabSelect }: DashboardHeaderProps) {
  const currentDate = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Date().toLocaleDateString('en-US', options);
  }, []);

  return (
    <header className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative select-none">
      <div className="space-y-1.5 text-left">
        <span className="text-2xs font-black uppercase text-stone-500 tracking-wider">
          System Dashboard
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-stone-900 font-display leading-tight">
          Welcome, {adminName}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 font-semibold">
          <span>{currentDate}</span>
          <span className="text-stone-300">|</span>
          <span className="flex items-center gap-1.5 text-brand-emerald">
            <span className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse"></span>
            Platform Status: 100% Operational
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <button
          onClick={() => onTabSelect('users')}
          className="px-4 py-2 border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold rounded-xl transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald focus-visible:ring-offset-2"
        >
          👤 User Management
        </button>
        <button
          onClick={() => onTabSelect('verifications')}
          className="px-4 py-2 bg-brand-emerald hover:bg-emerald-800 text-white font-black uppercase tracking-wider rounded-xl transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald focus-visible:ring-offset-2"
        >
          ⏳ Verification Center
        </button>
      </div>
    </header>
  );
}
