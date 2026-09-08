import { FavoriteButton } from './FavoriteButton';

/** Minimal typed shape of a professional profile card used in the preview drawer. */
export interface ProfessionalProfile {
  id: string | number;
  fullName: string;
  businessName?: string;
  title?: string;
  category?: { name: string };
  experienceYears?: number;
  rating?: number;
  city?: string;
  description?: string;
  skills?: string[];
}

interface ProfilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  professional: ProfessionalProfile | null;
  onBook: () => void;
}

export function ProfilePreview({ isOpen, onClose, professional, onBook }: ProfilePreviewProps) {
  if (!isOpen || !professional) return null;

  const getInitials = () => {
    const name = professional.businessName || professional.fullName;
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = professional.businessName || professional.fullName;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-stone-950/50 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Drawer Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-[440px] max-w-md bg-white border-l border-stone-200 p-6 sm:p-7 flex flex-col justify-between shadow-2xl transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right text-left">
          
          <div className="space-y-6 overflow-y-auto no-scrollbar pb-6 flex-1">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800">
                Partner Profile
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-950 flex items-center justify-center font-bold text-sm transition cursor-pointer"
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>

            {/* Profile Avatar info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-white font-black flex items-center justify-center text-lg uppercase shadow-sm flex-shrink-0">
                {getInitials()}
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-stone-900 font-serif leading-snug truncate">
                  {displayName}
                </h3>
                <span className="inline-block text-[9px] text-emerald-800 font-extrabold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-1">
                  {professional.category?.name || professional.title || 'Trade Specialist'}
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 text-center">
              <div>
                <span className="block text-sm font-extrabold text-stone-900">{professional.experienceYears || '5'}+ Yrs</span>
                <span className="text-[9px] text-stone-500 uppercase font-bold tracking-wider">Experience</span>
              </div>
              <div className="border-x border-stone-200">
                <span className="block text-sm font-extrabold text-stone-900">⭐ {professional.rating?.toFixed(1) || '4.8'}</span>
                <span className="text-[9px] text-stone-500 uppercase font-bold tracking-wider">Avg Rating</span>
              </div>
              <div>
                <span className="block text-sm font-extrabold text-stone-900 truncate">📍 {professional.city || 'Verified'}</span>
                <span className="text-[9px] text-stone-500 uppercase font-bold tracking-wider">Region</span>
              </div>
            </div>

            {/* About / Bio */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">About Professional</h4>
              <p className="text-xs text-stone-600 font-medium leading-relaxed">
                {professional.description || 'Verified coordination partner offering expert construction, architectural review, and site execution services.'}
              </p>
            </div>

            {/* Top Skills */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Specializations & Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {(professional.skills || ['Civil Engineering', 'Design coordination', 'Layout Planning', 'On-site Inspection']).map((skill: string) => (
                  <span
                    key={skill}
                    className="text-[9px] font-bold bg-stone-100 text-stone-700 border border-stone-200 px-2.5 py-1 rounded-lg"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Portfolio Previews */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400">Recent Works Gallery</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80',
                  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80',
                ].map((src, i) => (
                  <div key={i} className="h-28 rounded-xl overflow-hidden border border-stone-200 shadow-2xs">
                    <img src={src} alt="Portfolio preview" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="space-y-2.5 pt-4 border-t border-stone-100">
            <div className="flex items-center gap-2">
              <FavoriteButton id={professional.id} type="professional" />
              <button
                onClick={onBook}
                className="flex-1 h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Start Project Request</span>
                <span>→</span>
              </button>
            </div>
            <p className="text-[9px] text-stone-400 font-medium text-center">
              Direct connection with verified professionals • Zero hidden commissions
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
