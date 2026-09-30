import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';

type NavIconKey = 'House' | 'Compass' | 'ClipboardCheck' | 'MessageCircle' | 'UserRound';

interface NavItem {
  label: string;
  path: string;
  icon: NavIconKey;
}

function NavIcon({ icon, isActive }: { icon: NavIconKey; isActive: boolean }) {
  const strokeWidth = isActive ? 2.4 : 2;
  const className = `w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-105' : ''}`;

  switch (icon) {
    case 'House':
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
          <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        </svg>
      );
    case 'Compass':
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case 'ClipboardCheck':
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="m9 14 2 2 4-4" />
        </svg>
      );
    case 'MessageCircle':
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
      );
    case 'UserRound':
    default:
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="5" />
          <path d="M20 21a8 8 0 0 0-16 0" />
        </svg>
      );
  }
}

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) return null;

  const role = user.role || 'ROLE_CUSTOMER';
  const normRole = role.toUpperCase();

  // Construct items list based on role
  const getNavItems = (): NavItem[] => {
    if (normRole.includes('ADMIN')) {
      return [
        { label: 'Home', path: '/', icon: 'House' },
        { label: 'Discover', path: '/admin/dashboard', icon: 'Compass' },
        { label: 'Active', path: '/workspace/bookings', icon: 'ClipboardCheck' },
        { label: 'Messages', path: '/chat', icon: 'MessageCircle' },
        { label: 'Profile', path: '/admin/settings', icon: 'UserRound' },
      ];
    }

    if (normRole.includes('PROVIDER')) {
      return [
        { label: 'Home', path: '/', icon: 'House' },
        { label: 'Discover', path: '/workspace/leads', icon: 'Compass' },
        { label: 'Active', path: '/workspace/dashboard', icon: 'ClipboardCheck' },
        { label: 'Messages', path: '/workspace/inbox', icon: 'MessageCircle' },
        { label: 'Profile', path: '/workspace/profile', icon: 'UserRound' },
      ];
    }

    // Default Customer role
    return [
      { label: 'Home', path: '/', icon: 'House' },
      { label: 'Discover', path: '/search', icon: 'Compass' },
      { label: 'Active', path: '/workspace/overview', icon: 'ClipboardCheck' },
      { label: 'Messages', path: '/workspace/inbox', icon: 'MessageCircle' },
      { label: 'Profile', path: '/workspace/settings', icon: 'UserRound' },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/80 shadow-lg px-1.5 py-1 flex justify-around items-center select-none pb-[calc(0.25rem+env(safe-area-inset-bottom,0px))]"
      aria-label="Mobile bottom navigation"
    >
      {navItems.map((item) => {
        const isActive =
          location.pathname === item.path ||
          (item.path !== '/' && item.path !== '/workspace/overview' && item.path !== '/workspace/dashboard' && location.pathname.startsWith(item.path)) ||
          (item.label === 'Active' && (location.pathname.startsWith('/workspace/project/') || location.pathname.startsWith('/projects/')));
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 min-h-[44px] min-w-[44px] rounded-xl transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-1 focus:outline-none ${
              isActive
                ? 'bg-emerald-50/90 text-emerald-700 font-extrabold shadow-2xs border border-emerald-200/60 scale-[1.02]'
                : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100/50 font-bold border border-transparent'
            }`}
          >
            {isActive && (
              <span className="absolute -top-1 w-3.5 h-0.5 rounded-full bg-emerald-700 transition-all" />
            )}
            <NavIcon icon={item.icon} isActive={isActive} />
            <span className="text-[9px] uppercase tracking-wider font-sans leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
