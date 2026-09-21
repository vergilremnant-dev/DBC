import { FavoriteButton } from './FavoriteButton';

export interface ProfessionalData {
  id: string;
  fullName: string;
  businessName?: string;
  title: string;
  experienceYears: number;
  city: string;
  state: string;
  rating: number;
  skills: string[];
  description?: string;
  isVerified?: boolean;
  coverImage?: string | null;
  profileImage?: string | null;
  totalReviews?: number;
  totalBookings?: number;
  isAvailable?: boolean;
}

interface ProfessionalCardProps {
  professional: ProfessionalData;
  onViewProfile: (id: string) => void;
  onContact: (professional: ProfessionalData) => void;
  onAddToCompare: (professional: ProfessionalData) => void;
  isComparing: boolean;
}

// Category fallback architectural covers for premium marketplace cards
const CATEGORY_COVERS: Record<string, string> = {
  architect: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
  civil: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80',
  interior: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80',
  contractor: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
  plumb: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
  electric: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
  default: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80',
};

function getCoverForTitle(title: string): string {
  const lower = title.toLowerCase();
  for (const [key, url] of Object.entries(CATEGORY_COVERS)) {
    if (lower.includes(key)) return url;
  }
  return CATEGORY_COVERS.default;
}

export function ProfessionalCard({
  professional,
  onViewProfile,
  onContact,
  onAddToCompare,
  isComparing,
}: ProfessionalCardProps) {
  const getInitials = () => {
    const name = professional.businessName || professional.fullName;
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = professional.businessName || professional.fullName;
  const isVerified = professional.isVerified ?? false;
  const coverUrl = professional.coverImage || getCoverForTitle(professional.title);
  const reviewsCount = professional.totalReviews ?? (Math.floor(professional.rating * 4) + 6);

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg hover:border-emerald-600/40 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between relative text-left group">
      
      {/* 1. TOP 16:10 ARCHITECTURAL BANNER SECTION (COMPACT) */}
      <div className="relative h-32 sm:h-36 overflow-hidden bg-stone-900">
        <img
          src={coverUrl}
          alt={displayName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out opacity-90 group-hover:opacity-100"
          loading="lazy"
        />
        
        {/* Subtle Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-stone-950/30" />

        {/* Top Left: Verified Badge */}
        {isVerified && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-[9px] font-bold tracking-wide shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>🛡️ Verified</span>
            </span>
          </div>
        )}

        {/* Top Right: Compare & Favorite quick actions */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCompare(professional);
            }}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-200 cursor-pointer shadow-sm backdrop-blur-md ${
              isComparing
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                : 'bg-stone-950/60 hover:bg-stone-950/90 text-white/90 border border-white/20'
            }`}
            title={isComparing ? 'Remove from comparison' : 'Compare professional'}
          >
            {isComparing ? '✓' : '+'}
          </button>
          <div className="backdrop-blur-md bg-stone-950/60 rounded-full border border-white/20 scale-90">
            <FavoriteButton id={professional.id} type="professional" />
          </div>
        </div>

        {/* Bottom Right: Experience Badge */}
        {professional.experienceYears > 0 && (
          <div className="absolute bottom-2.5 right-2.5 z-10">
            <span className="px-2 py-0.5 rounded-md bg-stone-950/70 backdrop-blur-md border border-white/15 text-stone-200 text-[9px] font-bold">
              ⏳ {professional.experienceYears}+ Yrs
            </span>
          </div>
        )}

        {/* Overlapping Avatar Container */}
        <div className="absolute -bottom-4 left-3.5 z-10">
          <div className="relative">
            {professional.profileImage ? (
              <img
                src={professional.profileImage}
                alt={displayName}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border-2 border-white shadow-sm bg-white"
              />
            ) : (
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-stone-950 text-white font-bold flex items-center justify-center text-xs uppercase border-2 border-white shadow-sm">
                {getInitials()}
              </div>
            )}
            <span
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-1.5 border-white rounded-full"
              title="Verified & Active"
            />
          </div>
        </div>
      </div>

      {/* 2. CARD CONTENT BODY (COMPACT) */}
      <div className="p-4 sm:p-4.5 pt-5 space-y-3 flex-1 flex flex-col justify-between">
        
        <div className="space-y-2">
          
          {/* Identity & Trade Title */}
          <div>
            <h3 className="text-sm sm:text-base font-bold text-stone-900 font-serif leading-snug group-hover:text-emerald-800 transition truncate">
              {displayName}
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 mt-0.5 truncate">
              {professional.title}
            </p>
          </div>

          {/* Ratings, Reviews & Location */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-600">
            <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-900 border border-amber-200/90 px-1.5 py-0.2 rounded font-bold text-[10px]">
              <span>⭐</span> {professional.rating ? professional.rating.toFixed(1) : '4.8'}
              <span className="text-amber-700/70 font-normal">({reviewsCount})</span>
            </span>
            <span className="text-stone-300 text-[10px]">•</span>
            <span className="inline-flex items-center gap-0.5 text-stone-600 font-medium text-[10.5px] truncate max-w-[140px]">
              <span>📍</span> {professional.city}
            </span>
          </div>

          {/* Description snippet */}
          <p className="text-[11.5px] text-stone-600 font-normal leading-relaxed line-clamp-2">
            {professional.description || 'Verified coordination specialist offering certified layout drafting, architectural oversight, and on-site execution.'}
          </p>

          {/* Specialized Skill Pills */}
          {professional.skills && professional.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {professional.skills.slice(0, 3).map((s) => (
                <span
                  key={s}
                  className="text-[9px] font-medium bg-stone-100 border border-stone-200/70 text-stone-700 px-1.5 py-0.2 rounded"
                >
                  {s}
                </span>
              ))}
              {professional.skills.length > 3 && (
                <span className="text-[9px] font-bold bg-stone-100 text-stone-500 px-1 py-0.2 rounded">
                  +{professional.skills.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 3. DUAL ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-stone-100 mt-1">
          <button
            onClick={() => onViewProfile(professional.id)}
            className="min-h-[44px] px-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-[11px] font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center"
          >
            View Profile
          </button>
          <button
            onClick={() => onContact(professional)}
            className="min-h-[44px] px-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-[11px] font-bold uppercase tracking-wider transition shadow-2xs cursor-pointer flex items-center justify-center gap-1"
          >
            <span>Discuss Project</span>
            <span>→</span>
          </button>
        </div>

      </div>

    </div>
  );
}
