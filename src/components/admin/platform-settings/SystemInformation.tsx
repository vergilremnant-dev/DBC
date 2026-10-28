import SectionCard from './SectionCard';

interface SystemInfoRow {
  label: string;
  value: string;
  status?: 'healthy' | 'warning' | 'error' | 'unknown';
}

const STATUS_STYLES = {
  healthy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  unknown: 'bg-stone-100 text-stone-500 border-stone-200',
};

const STATUS_LABELS = {
  healthy: '● Healthy',
  warning: '⚠ Warning',
  error: '✕ Error',
  unknown: '— Unknown',
};

function InfoRow({ label, value, status }: SystemInfoRow) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3.5 border-b border-light-border/60 last:border-b-0">
      <span className="text-xs font-bold text-stone-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-stone-800 font-mono">{value}</span>
        {status && (
          <span className={`text-3xs font-black uppercase tracking-wider px-2 py-0.5 rounded border ${STATUS_STYLES[status]}`}>
            {STATUS_LABELS[status]}
          </span>
        )}
      </div>
    </div>
  );
}

export default function SystemInformation() {
  const rows: SystemInfoRow[] = [
    { label: 'Application Version', value: 'v2.0.0-rc.1' },
    { label: 'Environment', value: 'Production', status: 'healthy' },
    { label: 'API Version', value: 'REST API v1.0' },
    { label: 'Database Version', value: 'PostgreSQL 16.3', status: 'healthy' },
    { label: 'Storage Usage', value: '14.7 GB / 100 GB (14.7%)', status: 'healthy' },
    { label: 'Last Backup', value: 'Pending backend integration', status: 'unknown' },
    { label: 'System Status', value: 'All services operational', status: 'healthy' },
    { label: 'Uptime', value: '99.94% (last 30 days)' },
  ];

  return (
    <SectionCard title="System Information" subtitle="Read-only runtime and infrastructure details." icon="🖥️" badge="Read-Only">
      <div aria-label="System information table" role="region">
        {rows.map(row => (
          <InfoRow key={row.label} {...row} />
        ))}
      </div>
      <p className="text-3xs text-stone-400 font-medium mt-4 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
        ℹ️ Live system metrics require backend health endpoints. Values shown are indicative. Full telemetry available in Phase 2.
      </p>
    </SectionCard>
  );
}
