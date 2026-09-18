import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/auth/useAuth';
import { BRAND } from '../config/branding';
import { useAuthDispatch } from '../hooks/auth/useAuthStore';
import { logoutThunk } from '../store/auth/authSlice';
import { BrandLogo } from '../components/common/BrandLogo';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';

interface SidebarItem {
  name: string;
  path: string;
  icon: string;
}

const CUSTOMER_SIDEBAR_ITEMS: SidebarItem[] = [
  { name: 'Dashboard', path: '/workspace/overview', icon: '📊' },
  { name: 'Project Requests', path: '/workspace/bookings', icon: '📋' },
  { name: 'Inbox', path: '/workspace/inbox', icon: '💬' },
  { name: 'Profile & Settings', path: '/workspace/settings', icon: '⚙️' },
  { name: 'About DBC', path: '/know-more', icon: 'ℹ️' },
];

const PROVIDER_SIDEBAR_ITEMS: SidebarItem[] = [
  { name: 'Dashboard', path: '/workspace/dashboard', icon: '📊' },
  { name: 'Project Requests', path: '/workspace/bookings', icon: '📩' },
  { name: 'Leads', path: '/workspace/leads', icon: '⚡' },
  { name: 'Projects', path: '/workspace/projects', icon: '🏗️' },
  { name: 'Quotations', path: '/workspace/quotations', icon: '📝' },
  { name: 'Inbox', path: '/workspace/inbox', icon: '💬' },
  { name: 'Finance & Earnings', path: '/workspace/finance', icon: '💳' },
  { name: 'Profile & Settings', path: '/workspace/profile', icon: '⚙️' },
];

export default function WorkspaceLayout() {
  const { user } = useAuth();
  const dispatch = useAuthDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sidebarItems = user?.role === 'ROLE_PROVIDER' ? PROVIDER_SIDEBAR_ITEMS : CUSTOMER_SIDEBAR_ITEMS;

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll & listen for Escape key when mobile drawer is open
  useEffect(() => {
    if (!isMobileOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileOpen]);

  const getInitials = () => {
    if (!user) return 'U';
    const name = user.firstName || user.email;
    return name.slice(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    void dispatch(logoutThunk());
    navigate('/');
  };

  const getBreadcrumbLabel = () => {
    const current = sidebarItems.find(
      (item) => location.pathname === item.path || (item.path !== '/workspace/overview' && item.path !== '/workspace/dashboard' && location.pathname.startsWith(item.path))
    );
    if (current) return current.name;
    if (location.pathname.startsWith('/workspace/project/') || location.pathname.startsWith('/projects/')) return 'Project Workspace';
    return 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-warm-cream flex flex-col font-sans text-stone-900 selection:bg-emerald-50 selection:text-emerald-800">
      
      {/* Top Header */}
      <header className="h-16 bg-white/90 backdrop-blur-md border-b border-light-border sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 shadow-xs">
        
        {/* Left side: Hamburger (mobile) + Brand logo & Breadcrumbs */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-1.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100 transition lg:hidden focus-visible:ring-2 focus-visible:ring-emerald-600 focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo link back to marketplace */}
          <NavLink
            to="/"
            className="flex items-center hover:opacity-90 transition focus-visible:ring-2 focus-visible:ring-brand-emerald focus:outline-none rounded-lg"
          >
            <BrandLogo variant="header" />
          </NavLink>

          <div className="hidden sm:flex items-center gap-2 text-stone-300 text-sm">
            <span>/</span>
            <span className="font-semibold text-xs text-stone-500 uppercase tracking-wider">{getBreadcrumbLabel()}</span>
          </div>
        </div>

        {/* Right side: Actions & User avatar profile dropdown info */}
        <div className="flex items-center gap-3">
          {/* Back to Marketplace */}
          <NavLink
            to="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-light-border hover:border-stone-300 rounded-lg text-xs font-bold text-stone-600 hover:text-stone-900 transition hover:bg-warm-cream focus-visible:ring-2 focus-visible:ring-brand-emerald focus:outline-none"
          >
            <span>🏠</span>
            <span>Marketplace</span>
          </NavLink>

          <div className="w-px h-6 bg-light-border hidden sm:block"></div>

          {/* User profile identifier */}
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden md:block">
              <span className="block text-xs font-bold text-stone-900 leading-none">{user?.firstName} {user?.lastName || ''}</span>
              <span className="block text-[8px] font-black uppercase text-stone-500 tracking-wider mt-0.5">
                {user?.role === 'ROLE_PROVIDER' ? 'Professional Workspace' : 'Customer Account'}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-brand-emerald text-white font-black flex items-center justify-center text-xs uppercase shadow-sm select-none">
              {getInitials()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Body Layout wrapper */}
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* LEFT SIDEBAR (Desktop permanent / Mobile drawer overlay / Tablet collapsible) */}
        
        {/* Mobile Backdrop */}
        {isMobileOpen && (
          <div
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs z-40 lg:hidden transition-all duration-300 animate-in fade-in"
          />
        )}

        {/* Sidebar Container */}
        <aside
          className={`
            fixed top-16 bottom-0 left-0 bg-stone-black border-r border-stone-800 z-40 flex flex-col justify-between transition-all duration-300 ease-in-out
            lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)]
            ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:translate-x-0'}
            ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          `}
        >
          {/* Navigation Items list */}
          <div className="p-4 space-y-1 flex-1 overflow-y-auto no-scrollbar">
            {sidebarItems.map((item) => {
              const isItemActive =
                location.pathname === item.path ||
                (item.path !== '/workspace/overview' && item.path !== '/workspace/dashboard' && location.pathname.startsWith(item.path)) ||
                (item.path === '/workspace/projects' && (location.pathname.startsWith('/workspace/project/') || location.pathname.startsWith('/projects/')));
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-r-xl rounded-l-none text-xs font-bold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-brand-emerald focus:outline-none
                    ${isItemActive 
                      ? 'bg-white text-stone-black font-extrabold shadow-sm border-l-4 border-brand-emerald' 
                      : 'text-stone-400 hover:text-stone-black hover:bg-warm-cream'
                    }
                  `}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span className={`transition-opacity duration-200 ${isCollapsed ? 'lg:opacity-0 lg:w-0 overflow-hidden' : 'opacity-100'}`}>
                    {item.name}
                  </span>
                </NavLink>
              );
            })}
          </div>

          {/* Sidebar Footer: Toggle & Sign Out actions */}
          <div className="p-4 border-t border-stone-800 space-y-2">
            {/* Collapse toggle (Desktop/Tablet only) */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex items-center gap-3 w-full px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold text-stone-400 hover:text-white hover:bg-stone-800 transition focus:outline-none"
            >
              <span>{isCollapsed ? '▶' : '◀'}</span>
              <span className={`transition-opacity ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                Collapse menu
              </span>
            </button>

            {/* Logout Trigger */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 min-h-[44px] rounded-xl text-xs font-black text-rose-400 hover:bg-rose-950/40 transition cursor-pointer text-left focus-visible:ring-2 focus-visible:ring-rose-500 focus:outline-none"
            >
              <span>🚪</span>
              <span className={`transition-opacity ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                Sign Out
              </span>
            </button>
          </div>
        </aside>

        {/* MAIN VIEWPORT */}
        <main className="flex-1 bg-warm-cream p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 overflow-y-auto h-[calc(100vh-4rem)] flex flex-col justify-between">
          <div className="flex-1">
            <Outlet />
          </div>

          {/* Optional Status Area Footer */}
          <footer className="mt-8 border-t border-light-border pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-stone-400 font-bold uppercase tracking-wider gap-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse"></span>
              <span>Workspace Active • Secure Shell</span>
            </div>
            <span>{BRAND.name} Operational Console</span>
          </footer>
        </main>

      </div>
      <MobileBottomNav />
    </div>
  );
}
