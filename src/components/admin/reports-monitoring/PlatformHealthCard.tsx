interface HealthMetrics {
  app: 'Operational' | 'Degraded' | 'Down';
  db: 'Operational' | 'Degraded' | 'Down';
  storage: 'Operational' | 'Degraded' | 'Down';
  api: 'Operational' | 'Degraded' | 'Down';
  lastBackup: string;
  overall: 'Healthy' | 'Degraded' | 'Critical';
}

interface PlatformHealthCardProps {
  health: HealthMetrics;
}

export default function PlatformHealthCard({ health }: PlatformHealthCardProps) {
  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'Operational':
      case 'Healthy':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Degraded':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Down':
      case 'Critical':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  const systems = [
    { label: 'Application Node', status: health.app },
    { label: 'Cloud Database Storage', status: health.db },
    { label: 'Encrypted File Storage', status: health.storage },
    { label: 'Public Gateway API Services', status: health.api },
  ];

  return (
    <div className="bg-white border border-light-border p-5 rounded-3xl shadow-apple-sm text-left select-none space-y-4">
      <div className="border-b border-light-border/40 pb-2 flex justify-between items-center">
        <h4 className="text-2xs font-black uppercase text-stone-905 tracking-wider">
          🟢 Platform Services Health Status
        </h4>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider border ${getBadgeClass(health.overall)}`}>
          System Status: {health.overall}
        </span>
      </div>

      <div className="space-y-2.5 text-xs font-semibold text-stone-605">
        {systems.map((sys, idx) => (
          <div key={idx} className="flex justify-between items-center border-b border-light-border/30 pb-2">
            <span>{sys.label}</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-bold uppercase border ${getBadgeClass(sys.status)}`}>
              {sys.status}
            </span>
          </div>
        ))}

        <div className="pt-1.5 flex justify-between items-center text-2xs text-stone-500 font-medium">
          <span>Cron Registry Last Backup:</span>
          <span className="font-mono bg-stone-50 border border-stone-200 px-2 py-0.5 rounded">
            {health.lastBackup}
          </span>
        </div>
      </div>
    </div>
  );
}
export type { HealthMetrics };
