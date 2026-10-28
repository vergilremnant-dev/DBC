import { FavoriteButton } from './FavoriteButton';

export interface ProjectData {
  id: string;
  name: string;
  category: string;
  location: string;
  professionalName: string;
  completionDate: string;
  description: string;
  img: string;
}

interface ProjectCardProps {
  project: ProjectData;
  onViewDetails: (project: ProjectData) => void;
}

export function ProjectCard({ project, onViewDetails }: ProjectCardProps) {
  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg hover:border-emerald-600/40 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between relative text-left group">
      
      {/* 1. TOP PROJECT IMAGE (COMPACT) */}
      <div className="relative h-36 sm:h-40 overflow-hidden bg-stone-900">
        <img
          src={project.img}
          alt={project.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-stone-950/30" />

        {/* Top Left: Category badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-400/40 text-emerald-300 text-3xs font-bold tracking-wide shadow-md">
            <span>🏛️ {project.category}</span>
          </span>
        </div>

        {/* Top Right: Favorite Action */}
        <div className="absolute top-2.5 right-2.5 z-10 backdrop-blur-md bg-stone-950/60 rounded-full border border-white/20 scale-90">
          <FavoriteButton id={project.id} type="project" />
        </div>

        {/* Bottom Left: Location Pill */}
        <div className="absolute bottom-2.5 left-2.5 z-10">
          <span className="px-2 py-0.5 rounded-md bg-stone-950/70 backdrop-blur-md border border-white/15 text-stone-200 text-3xs font-bold">
            📍 {project.location}
          </span>
        </div>
      </div>

      {/* 2. CARD CONTENT (COMPACT) */}
      <div className="p-4 sm:p-4.5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <h3 className="text-sm sm:text-base font-bold text-stone-900 font-display leading-snug group-hover:text-emerald-800 transition line-clamp-1">
            {project.name}
          </h3>
          <p className="text-2xs text-stone-500 font-medium">
            Designed by <span className="text-stone-800 font-bold">{project.professionalName}</span> • {project.completionDate}
          </p>
          <p className="text-xs text-stone-600 font-normal leading-relaxed line-clamp-2 pt-0.5">
            {project.description}
          </p>
        </div>

        <div className="pt-3 border-t border-stone-100 mt-1">
          <button
            onClick={() => onViewDetails(project)}
            className="w-full h-8.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-2xs font-bold uppercase tracking-wider transition shadow-2xs cursor-pointer flex items-center justify-center gap-1"
          >
            <span>View Blueprint</span>
            <span>→</span>
          </button>
        </div>
      </div>

    </div>
  );
}
