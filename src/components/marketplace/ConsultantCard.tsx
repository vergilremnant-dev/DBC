import { FavoriteButton } from './FavoriteButton';

export interface ConsultantData {
  id: string;
  fullName: string;
  title: string;
  experienceYears: number;
  city: string;
  rating: number;
  languages: string[];
  sessionDuration: string;
  fee: number | string;
  specialization: string;
  coverImage?: string;
}

interface ConsultantCardProps {
  consultant: ConsultantData;
  onBook: (consultant: ConsultantData) => void;
  onViewProfile: (id: string) => void;
}

export function ConsultantCard({ consultant, onBook, onViewProfile }: ConsultantCardProps) {
  const getInitials = () => {
    return consultant.fullName.slice(0, 2).toUpperCase();
  };

  const coverUrl =
    consultant.coverImage ||
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80';

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg hover:border-emerald-600/40 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between relative text-left group">
      
      {/* 1. TOP ARCHITECTURAL BANNER SECTION (COMPACT) */}
      <div className="relative h-32 sm:h-36 overflow-hidden bg-stone-900">
        <img
          src={coverUrl}
          alt={consultant.fullName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out opacity-90 group-hover:opacity-100"
          loading="lazy"
        />
        
        {/* Subtle Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-stone-950/30" />

        {/* Top Left: Consultation Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-950/80 backdrop-blur-md border border-amber-400/40 text-amber-300 text-3xs font-bold tracking-wide shadow-md">
            <span>✨ Certified</span>
          </span>
        </div>

        {/* Top Right: Favorite Action */}
        <div className="absolute top-2.5 right-2.5 z-10 backdrop-blur-md bg-stone-950/60 rounded-full border border-white/20 scale-90">
          <FavoriteButton id={consultant.id} type="consultant" />
        </div>

        {/* Bottom Right: Session Fee Pill */}
        <div className="absolute bottom-2.5 right-2.5 z-10">
          <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 backdrop-blur-md border border-emerald-400/30 text-emerald-300 text-2xs font-bold tracking-wide">
            ₹{consultant.fee} / session
          </span>
        </div>

        {/* Overlapping Avatar */}
        <div className="absolute -bottom-4 left-3.5 z-10">
          <div className="relative">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-900 via-stone-900 to-stone-950 text-white font-bold flex items-center justify-center text-xs uppercase border-2 border-white shadow-sm">
              {getInitials()}
            </div>
            <span
              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-1.5 border-white rounded-full"
              title="Available"
            />
          </div>
        </div>
      </div>

      {/* 2. CARD CONTENT BODY (COMPACT) */}
      <div className="p-4 sm:p-4.5 pt-5 space-y-3 flex-1 flex flex-col justify-between">
        
        <div className="space-y-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-stone-900 font-display leading-snug group-hover:text-emerald-800 transition truncate">
              {consultant.fullName}
            </h3>
            <p className="text-2xs font-bold uppercase tracking-wider text-emerald-800 mt-0.5 truncate">
              {consultant.title}
            </p>
          </div>

          {/* Metrics strip */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-stone-600">
            <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-900 border border-amber-200/90 px-1.5 py-0.2 rounded font-bold text-2xs">
              <span>⭐</span> {consultant.rating.toFixed(1)}
            </span>
            <span className="text-stone-300 text-2xs">•</span>
            <span className="text-stone-600 font-medium text-2xs">
              ⏳ {consultant.experienceYears}+ Yrs
            </span>
            <span className="text-stone-300 text-2xs">•</span>
            <span className="text-stone-600 font-medium text-2xs">
              📍 {consultant.city}
            </span>
          </div>

          <p className="text-xs text-stone-600 font-normal leading-relaxed line-clamp-2">
            <span className="font-bold text-stone-900">Focus:</span> {consultant.specialization}
          </p>

          <div className="flex items-center gap-2 text-2xs text-stone-500 font-medium pt-0.5">
            <span>⏱️ {consultant.sessionDuration}</span>
            <span>•</span>
            <span className="truncate max-w-[150px]">🗣️ {consultant.languages.join(', ')}</span>
          </div>
        </div>

        {/* 3. DUAL ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-stone-100 mt-1">
          <button
            onClick={() => onViewProfile(consultant.id)}
            className="h-8.5 px-2 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-2xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center justify-center"
          >
            View Profile
          </button>
          <button
            onClick={() => onBook(consultant)}
            className="h-8.5 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-2xs font-bold uppercase tracking-wider transition shadow-2xs cursor-pointer flex items-center justify-center gap-1"
          >
            <span>Request Consultation</span>
            <span>→</span>
          </button>
        </div>

      </div>

    </div>
  );
}
