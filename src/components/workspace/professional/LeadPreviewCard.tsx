export interface LeadPreviewData {
  id: string;
  title: string;
  category: string;
  budget: string;
  location: string;
  postedDate: string;
}

interface LeadPreviewCardProps {
  leads: LeadPreviewData[];
}

export function LeadPreviewCard({ leads }: LeadPreviewCardProps) {
  return (
    <div className="divide-y divide-stone-100 bg-white border border-stone-200 rounded-3xl p-5 shadow-sm space-y-3.5">
      {leads.map((lead) => (
        <div
          key={lead.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 first:pt-0 text-left text-xs font-semibold text-stone-700"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-stone-900 font-display leading-none">
                {lead.title}
              </h4>
              <span className="bg-stone-50 border border-stone-200 text-stone-600 rounded px-2 py-0.5 text-3xs font-black uppercase">
                {lead.category}
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-2xs text-stone-500 font-bold">
              <span>📍 {lead.location}</span>
              <span>•</span>
              <span>Posted {lead.postedDate}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="block text-3xs uppercase font-bold text-stone-500">Budget</span>
            <span className="text-xs font-black text-emerald-800 font-mono">
              {lead.budget}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
