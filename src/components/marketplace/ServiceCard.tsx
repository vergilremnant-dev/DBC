import { FavoriteButton } from './FavoriteButton';

export interface ServiceData {
  id: string;
  name: string;
  providerName: string;
  providerId: string;
  category: string;
  priceRange: string;
  timeline: string;
  rating: number;
  coverImage?: string;
}

interface ServiceCardProps {
  service: ServiceData;
  onBook: (service: ServiceData) => void;
}

const SERVICE_COVERS = [
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
];

export function ServiceCard({ service, onBook }: ServiceCardProps) {
  const coverUrl =
    service.coverImage ||
    SERVICE_COVERS[Math.abs(service.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % SERVICE_COVERS.length];

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg hover:border-emerald-600/40 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between relative text-left group">
      
      {/* 1. TOP COVER BANNER (COMPACT) */}
      <div className="relative h-32 sm:h-36 overflow-hidden bg-stone-900">
        <img
          src={coverUrl}
          alt={service.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out opacity-90 group-hover:opacity-100"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-stone-950/30" />

        {/* Top Left: Category badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-3xs font-bold tracking-wide shadow-md">
            <span>📦 {service.category}</span>
          </span>
        </div>

        {/* Top Right: Favorite Action */}
        <div className="absolute top-2.5 right-2.5 z-10 backdrop-blur-md bg-stone-950/60 rounded-full border border-white/20 scale-90">
          <FavoriteButton id={service.id} type="service" />
        </div>

        {/* Bottom Right: Timeline badge */}
        <div className="absolute bottom-2.5 right-2.5 z-10">
          <span className="px-2 py-0.5 rounded-md bg-stone-950/70 backdrop-blur-md border border-white/15 text-stone-200 text-3xs font-bold">
            ⏱️ {service.timeline}
          </span>
        </div>
      </div>

      {/* 2. CARD BODY (COMPACT) */}
      <div className="p-4 sm:p-4.5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-stone-900 font-display leading-snug group-hover:text-emerald-800 transition line-clamp-1">
              {service.name}
            </h3>
            <p className="text-2xs text-stone-500 font-medium mt-0.5 truncate">
              by <span className="text-stone-800 font-bold">{service.providerName}</span>
            </p>
          </div>

          {/* Pricing & Rating strip */}
          <div className="p-2.5 rounded-xl border border-stone-200/80 bg-stone-50/60 flex items-center justify-between">
            <div>
              <span className="block text-3xs font-bold uppercase text-stone-500">Estimated Cost</span>
              <span className="text-xs font-bold text-stone-900">{service.priceRange}</span>
            </div>
            <div className="text-right">
              <span className="block text-3xs font-bold uppercase text-stone-500">Rating</span>
              <span className="text-xs font-bold text-amber-800">⭐ {service.rating.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-stone-100 mt-1">
          <button
            onClick={() => onBook(service)}
            className="w-full h-8.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-2xs font-bold uppercase tracking-wider transition shadow-2xs cursor-pointer flex items-center justify-center gap-1"
          >
            <span>Request Package</span>
            <span>→</span>
          </button>
        </div>
      </div>

    </div>
  );
}
