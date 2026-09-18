import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) return null;

  const role = user.role || 'ROLE_CUSTOMER';
  const normRole = role.toUpperCase();

  // Construct items list based on role
  const getNavItems = () => {
    if (normRole.includes('ADMIN')) {
      return [
        { label: 'Home', path: '/', icon: '🏠' },
        { label: 'Discover', path: '/admin/dashboard', icon: '🔍' },
        { label: 'Active', path: '/workspace/bookings', icon: '📋' },
        { label: 'Messages', path: '/chat', icon: '💬' },
        { label: 'Profile', path: '/admin/settings', icon: '👤' },
      ];
    }

    if (normRole.includes('PROVIDER')) {
      return [
        { label: 'Home', path: '/', icon: '🏠' },
        { label: 'Discover', path: '/workspace/leads', icon: '🔍' },
        { label: 'Active', path: '/workspace/dashboard', icon: '📋' },
        { label: 'Messages', path: '/workspace/inbox', icon: '💬' },
        { label: 'Profile', path: '/workspace/profile', icon: '👤' },
      ];
    }

    // Default Customer role
    return [
      { label: 'Home', path: '/', icon: '🏠' },
      { label: 'Discover', path: '/search', icon: '🔍' },
      { label: 'Active', path: '/workspace/overview', icon: '📋' },
      { label: 'Messages', path: '/workspace/inbox', icon: '💬' },
      { label: 'Profile', path: '/workspace/settings', icon: '👤' },
    ];
  };

  const navItems = getNavItems();

  return (
    <nav 
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-stone-200/80 shadow-lg px-2 py-1.5 flex justify-around items-center select-none"
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
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 min-h-[44px] min-w-[44px] rounded-xl transition duration-200 cursor-pointer focus:outline-none ${
              isActive 
                ? 'text-emerald-700 font-extrabold scale-105' 
                : 'text-stone-400 hover:text-stone-700 font-bold'
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-[9px] uppercase tracking-wider font-sans">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
