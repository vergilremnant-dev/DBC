interface SectionCardProps {
  title: string;
  subtitle?: string;
  icon?: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}

export default function SectionCard({ title, subtitle, icon, badge, children, className = '' }: SectionCardProps) {
  return (
    <section
      className={`bg-white border border-light-border rounded-3xl shadow-apple-sm overflow-hidden ${className}`}
      aria-label={title}
    >
      <div className="px-6 py-5 border-b border-light-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon && <span className="text-lg shrink-0" aria-hidden="true">{icon}</span>}
          <div>
            <h2 className="text-sm font-black text-stone-900 font-display leading-snug">{title}</h2>
            {subtitle && <p className="text-2xs text-stone-500 font-medium mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {badge && (
          <span className="text-3xs font-black uppercase tracking-wider text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full shrink-0">
            {badge}
          </span>
        )}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
