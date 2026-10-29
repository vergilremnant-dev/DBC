import { LeadStatusBadge } from './LeadStatusBadge';
import type { LeadStatus } from './LeadStatusBadge';

export interface LeadData {
  id: string;
  title: string;
  category: string;
  budget: string;
  location: string;
  postedDate: string;
  projectSize: string;
  estimatedTimeline: string;
  status: LeadStatus;
  matchScore: number;
  descriptionPreview: string;
  isSaved?: boolean;
  hasExpressedInterest?: boolean;
}

interface LeadCardProps {
  lead: LeadData;
  isSelected: boolean;
  onSelect: () => void;
  onToggleSave: (e: React.MouseEvent) => void;
}

export function LeadCard({ lead, isSelected, onSelect, onToggleSave }: LeadCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`border rounded-3xl p-5 text-left bg-white transition hover:shadow-md cursor-pointer flex flex-col justify-between space-y-4 ${
        isSelected
          ? 'border-emerald-600 ring-2 ring-emerald-600/5 shadow-sm'
          : 'border-stone-200 hover:border-stone-300'
      }`}
    >
      <div className="space-y-2">
        {/* Card Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="bg-stone-50 border border-stone-200 text-stone-600 rounded px-2 py-0.5 text-3xs font-black uppercase">
              {lead.category}
            </span>
            <LeadStatusBadge status={lead.status} />
          </div>
          
          <span className="text-2xs font-black font-display text-emerald-800 bg-emerald-50/50 border border-emerald-100 rounded px-2 py-0.5 select-none leading-none">
            {lead.matchScore}% Match
          </span>
        </div>

        {/* Title & Preview */}
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-stone-900 font-display leading-snug">
            {lead.title}
          </h3>
          <p className="text-2xs text-stone-500 font-semibold leading-relaxed line-clamp-2">
            {lead.descriptionPreview}
          </p>
        </div>
      </div>

      {/* Sizing & Timeline Attributes Grid */}
      <div className="grid grid-cols-3 gap-2 bg-stone-50/50 border border-stone-100 rounded-xl p-2.5 text-3xs font-bold text-stone-600 uppercase tracking-wider">
        <div className="space-y-0.5">
          <span>Budget</span>
          <strong className="block text-emerald-800 font-mono text-xs mt-0.5">{lead.budget}</strong>
        </div>
        <div className="space-y-0.5 border-l border-stone-150 pl-2.5">
          <span>Area Size</span>
          <strong className="block text-stone-700 mt-0.5">{lead.projectSize}</strong>
        </div>
        <div className="space-y-0.5 border-l border-stone-150 pl-2.5">
          <span>Timeline</span>
          <strong className="block text-stone-700 mt-0.5">{lead.estimatedTimeline}</strong>
        </div>
      </div>

      {/* Footer Info Row */}
      <div className="flex items-center justify-between border-t border-stone-50 pt-3 text-2xs font-black uppercase tracking-wider text-stone-600">
        <span>📍 {lead.location} • {lead.postedDate}</span>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSave}
            className={`font-bold transition cursor-pointer flex items-center gap-1 ${
              lead.isSaved ? 'text-indigo-750 hover:text-indigo-900 font-extrabold' : 'hover:text-stone-750'
            }`}
          >
            {lead.isSaved ? '💾 Saved' : '⭐ Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
