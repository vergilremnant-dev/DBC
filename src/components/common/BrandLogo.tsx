interface BrandLogoProps {
  variant?: 'primary' | 'compact' | 'icon' | 'watermark' | 'stacked' | 'public' | 'workspace' | 'mobile' | 'login' | 'sidebar' | 'header';
  theme?: 'dark' | 'light' | 'monochrome';
  className?: string;
}

export function BrandLogo({
  variant = 'primary',
  theme = 'light',
  className = '',
}: BrandLogoProps) {
  // Resolve legacy variants to refined ones
  let resolvedVariant = variant;
  let resolvedTheme = theme;

  if (variant === 'header' || variant === 'workspace' || variant === 'mobile' || variant === 'sidebar') {
    resolvedVariant = 'compact';
  } else if (variant === 'login' || variant === 'public') {
    resolvedVariant = 'primary';
  }

  // Auto-detect dark background for legacy pages (login/sidebar)
  if (variant === 'login' || variant === 'sidebar') {
    resolvedTheme = 'dark';
  }

  // Height rules matching variant specifications
  const heightClasses = {
    primary: 'h-10 sm:h-11 md:h-12',
    compact: 'h-8 sm:h-9',
    icon: 'h-7 sm:h-8',
    stacked: 'h-20 sm:h-24 md:h-28',
    watermark: 'h-16 md:h-24 opacity-15 select-none pointer-events-none',
  };

  const selectedHeight = heightClasses[resolvedVariant] || heightClasses.primary;

  // Theme-aware coloring
  const isDark = resolvedTheme === 'dark';

  // 1. Icon Only View (DBC App Icon)
  if (resolvedVariant === 'icon') {
    return (
      <div className={`flex items-center select-none ${selectedHeight} ${className}`}>
        <img
          src={isDark ? '/brand/dbc-logo-icon-white.png' : '/brand/dbc-logo-icon.png'}
          alt="DBC App Icon"
          className="h-full w-auto object-contain select-none"
          loading="eager"
        />
      </div>
    );
  }

  // 2. Watermark View
  if (resolvedVariant === 'watermark') {
    return (
      <div className={`flex items-center select-none ${selectedHeight} ${className}`}>
        <img
          src={isDark ? '/brand/dbc-logo-icon-white.png' : '/brand/dbc-logo-icon.png'}
          alt="DBC Watermark"
          className="h-full w-auto object-contain opacity-15 select-none pointer-events-none"
          loading="lazy"
        />
      </div>
    );
  }

  // 3. Compact View (Used in Workspace headers, mobile drawer, navbar)
  if (resolvedVariant === 'compact') {
    return (
      <div className={`flex items-center select-none ${selectedHeight} ${className}`}>
        <img
          src={isDark ? '/brand/dbc-logo-full-white.png' : '/brand/dbc-logo-full.png'}
          alt="DBC - Design Build Connect"
          className="h-full w-auto object-contain select-none"
          loading="eager"
        />
      </div>
    );
  }

  // 4. Stacked View
  if (resolvedVariant === 'stacked') {
    return (
      <div className={`flex flex-col items-center select-none ${selectedHeight} ${className}`}>
        <img
          src={isDark ? '/brand/dbc-logo-full-white.png' : '/brand/dbc-logo-full.png'}
          alt="DBC - Design Build Connect"
          className="h-full w-auto object-contain select-none"
          loading="eager"
        />
      </div>
    );
  }

  // 5. Primary View (Default: Full DBC Design Build Connect brand logo)
  return (
    <div className={`flex items-center select-none ${selectedHeight} ${className}`}>
      <img
        src={isDark ? '/brand/dbc-logo-full-white.png' : '/brand/dbc-logo-full.png'}
        alt="DBC - Design Build Connect"
        className="h-full w-auto object-contain select-none"
        loading="eager"
      />
    </div>
  );
}

export default BrandLogo;
