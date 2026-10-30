import type { ReactNode } from 'react';

/**
 * One consistent 24px line-icon set for the service catalog, keyed by category slug.
 * Labels and order always come from the categories API — this only maps a slug to artwork.
 */
const ICONS: Record<string, ReactNode> = {
  // Design & Consultancy
  'vastu-consultant': <><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" /><circle cx="12" cy="12" r="2.5" /></>,
  architect: <><path d="M12 3 4 20h16L12 3Z" /><path d="M8.5 13h7M12 3v17" /></>,
  'interior-designer': <><path d="M4 18v-5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5" /><path d="M6 11V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3M3 18h18M5 18v2M19 18v2" /></>,
  'structural-engineer': <><path d="M3 21h18M5 21V9l7-5 7 5v12" /><path d="M9 21v-6h6v6M9 11h6" /></>,
  'project-management': <><rect x="4" y="4" width="16" height="17" rx="2" /><path d="M9 4V2.8h6V4M8 10l1.5 1.5L12 9M8 16l1.5 1.5L12 15M14 10.5h3M14 16.5h3" /></>,
  'quantity-surveyor': <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2M16 11v4" /></>,
  'quality-controller': <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5M8.5 11l1.8 1.8L14 9" /></>,
  'landscape-designer': <><path d="M12 21v-7M12 14c-3.5 0-6-2.5-6-6a6 6 0 0 1 12 0c0 3.5-2.5 6-6 6Z" /><path d="M4 21h16M9 10l3 3 3-3" /></>,
  geotechnical: <><path d="M3 8h18M3 13h18M3 18h18" /><path d="M12 3v10M9.5 10.5 12 13l2.5-2.5" /></>,
  // Construction Trades
  carpentry: <><path d="m14 4 6 6-9.5 9.5H4.5v-6L14 4Z" /><path d="m11.5 6.5 6 6M4.5 13.5l6 6" /></>,
  painting: <><rect x="4" y="3" width="14" height="6" rx="1.5" /><path d="M18 6h2v5h-8v3" /><rect x="10.5" y="14" width="3" height="7" rx="1" /></>,
  'false-ceiling': <><path d="M3 4h18M3 8h18" /><path d="M7 8v3M17 8v3M12 8v6" /><circle cx="12" cy="16" r="2" /><path d="M5 20h14" /></>,
  'granite-mason': <><path d="M4 14 9 5h6l5 9-4 6H8l-4-6Z" /><path d="M9 5l2 6-7 3M15 5l-4 6 9 3M11 11l1 9" /></>,
  waterproofing: <><path d="M12 3s5 6 5 9.5A5 5 0 0 1 7 12.5C7 9 12 3 12 3Z" /><path d="M4 20h16M6 17.5h12" /></>,
  'pest-control': <><ellipse cx="12" cy="13" rx="4" ry="5.5" /><path d="M12 7.5V5M10 5.5 8.5 3.5M14 5.5l1.5-2M8 11H4.5M8 15H4.5M16 11h3.5M16 15h3.5M12 13v5.5" /></>,
  'door-fitter': <><path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18" /><circle cx="15.5" cy="12.5" r="1" /></>,
  plumbing: <><path d="M4 9h7a3 3 0 0 1 3 3v2h3a3 3 0 0 1 3 3v1" /><path d="M4 6v6M20 21v-3M14 9V6h3" /></>,
  electrical: <path d="M13 2 5 13.5h6.5L10 22l8.5-12H12L13 2Z" />,
  tiles: <><rect x="4" y="4" width="16" height="16" rx="1.5" /><path d="M12 4v16M4 12h16" /></>,
  masonry: <><rect x="3" y="5" width="18" height="14" rx="1" /><path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19" /></>,
  'farm-work-centering': <><path d="M3 7h18M3 7v3h18V7" /><path d="M6 10v11M18 10v11M12 10v11M4 21h4M10 21h4M16 21h4M6 15l6-3 6 3" /></>,
  'glass-worker': <><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="m8 8 3-3M8 13l7-7M13 18l3-3" /></>,
  upvc: <><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M12 3v18M4 12h16" /><path d="M9.5 9v1.5M14.5 9v1.5" /></>,
};

const FALLBACK: ReactNode = <><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6Z" /></>;

export function ServiceIcon({ slug, className = 'h-6 w-6' }: { slug: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      {ICONS[slug] ?? FALLBACK}
    </svg>
  );
}
