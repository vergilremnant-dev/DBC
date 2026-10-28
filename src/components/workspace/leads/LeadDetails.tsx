import type { LeadData } from './LeadCard';

interface LeadDetailsProps {
  lead: LeadData;
  onClose?: () => void;
  onToggleSave: () => void;
  onExpressInterest: () => void;
}

export function LeadDetails({ lead, onClose, onToggleSave, onExpressInterest }: LeadDetailsProps) {
  return (
    <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm h-full flex flex-col justify-between text-left text-xs font-semibold text-stone-700">
      
      {/* Scrollable contents wrapper */}
      <div className="p-6 space-y-6 flex-1 overflow-y-auto no-scrollbar">
        
        {/* Title / Close button */}
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <span className="bg-stone-50 border border-stone-200 text-stone-600 rounded px-2 py-0.5 text-3xs font-black uppercase self-start">
              {lead.category}
            </span>
            <h3 className="text-base font-bold text-stone-900 font-display leading-snug">
              {lead.title}
            </h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-850 text-base font-bold cursor-pointer leading-none p-1 bg-stone-50 rounded-lg hover:bg-stone-100 transition"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dynamic statistics overview */}
        <div className="grid grid-cols-2 gap-3 border-t border-b border-stone-100 py-4">
          <div className="space-y-0.5 bg-stone-50/40 p-2.5 rounded-xl border border-stone-100">
            <span className="block text-3xs uppercase font-bold text-stone-400">Budget Bracket</span>
            <strong className="text-emerald-800 font-mono text-sm block mt-0.5">{lead.budget}</strong>
          </div>
          <div className="space-y-0.5 bg-stone-50/40 p-2.5 rounded-xl border border-stone-100">
            <span className="block text-3xs uppercase font-bold text-stone-400">Match Rating</span>
            <strong className="text-stone-900 text-sm block mt-0.5">{lead.matchScore}% Score</strong>
          </div>
          <div className="space-y-0.5 bg-stone-50/40 p-2.5 rounded-xl border border-stone-100">
            <span className="block text-3xs uppercase font-bold text-stone-400">Project Area Size</span>
            <strong className="text-stone-700 block mt-0.5">{lead.projectSize}</strong>
          </div>
          <div className="space-y-0.5 bg-stone-50/40 p-2.5 rounded-xl border border-stone-100">
            <span className="block text-3xs uppercase font-bold text-stone-400">Target Duration</span>
            <strong className="text-stone-700 block mt-0.5">{lead.estimatedTimeline}</strong>
          </div>
        </div>

        {/* Detailed description */}
        <div className="space-y-2">
          <span className="block text-3xs uppercase font-bold text-stone-400 tracking-wider">
            Project Description
          </span>
          <p className="text-xs text-stone-500 font-medium leading-relaxed bg-stone-50/20 border border-stone-100 rounded-xl p-3">
            {lead.descriptionPreview} This project requires careful calculations, local municipal permissions, and coordinate verification before foundations planning.
          </p>
        </div>

        {/* Preferred timelines */}
        <div className="grid gap-3 sm:grid-cols-2 text-2xs">
          <div className="space-y-0.5">
            <span className="block text-3xs uppercase font-bold text-stone-400">Preferred Start Date</span>
            <span className="text-stone-850 font-bold">15-Aug-2026</span>
          </div>
          <div className="space-y-0.5">
            <span className="block text-3xs uppercase font-bold text-stone-400">Client Coordinates</span>
            <span className="text-stone-850 font-bold">{lead.location}</span>
          </div>
        </div>

        {/* Customer notes placeholder */}
        <div className="space-y-2 bg-amber-50/30 border border-amber-100 rounded-xl p-3">
          <div className="flex items-center gap-1 text-3xs uppercase font-black text-amber-850">
            <span>💡</span>
            <span>Customer Core Guidelines</span>
          </div>
          <p className="text-2xs text-stone-500 font-semibold leading-relaxed">
            Prefer local materials sourcing to control delivery delays. Site inspections must be scheduled on weekends if possible.
          </p>
        </div>

        {/* Attachment blueprints placeholder */}
        <div className="space-y-2">
          <span className="block text-3xs uppercase font-bold text-stone-400 tracking-wider">
            Attachments & Blueprints (1)
          </span>
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-stone-150 bg-stone-50/50 hover:bg-stone-50 transition cursor-pointer select-none">
            <div className="flex items-center gap-2">
              <span className="text-lg">📄</span>
              <div className="space-y-0.5">
                <span className="block text-2xs font-bold text-stone-700">Site_Dimensions_Plan.pdf</span>
                <span className="block text-3xs text-stone-400">1.8 MB • PDF Blueprint</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => alert('Mock blueprint files downloaded successfully.')}
              className="text-2xs font-black uppercase text-emerald-800 hover:underline"
            >
              Get File
            </button>
          </div>
        </div>

        {/* Activity Status Timeline placeholder */}
        <div className="space-y-3 pt-3 border-t border-stone-100">
          <span className="block text-3xs uppercase font-bold text-stone-400 tracking-wider">
            Opportunity Activity History
          </span>
          <div className="space-y-2 font-medium text-2xs text-stone-500">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
              <span>Requirement published to marketplace • {lead.postedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              <span>2 local professionals expressed interest</span>
            </div>
          </div>
        </div>

      </div>

      {/* Persistent CTA Buttons Row */}
      <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-2">
        <button
          onClick={onToggleSave}
          className={`flex-1 rounded-xl border px-4 py-3 font-bold text-xs uppercase tracking-wider transition cursor-pointer text-center ${
            lead.isSaved
              ? 'bg-indigo-50 border-indigo-200 text-indigo-750'
              : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          {lead.isSaved ? 'Saved Opportunity' : 'Save Lead'}
        </button>

        <button
          onClick={onExpressInterest}
          className={`flex-1 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer text-center ${
            lead.hasExpressedInterest
              ? 'bg-stone-200 text-stone-500 border border-stone-300 cursor-not-allowed'
              : 'bg-stone-900 hover:bg-stone-850 text-white border border-stone-900 shadow-sm'
          }`}
          disabled={lead.hasExpressedInterest}
        >
          {lead.hasExpressedInterest ? 'Interest Logged' : 'Express Interest'}
        </button>
      </div>

    </div>
  );
}
