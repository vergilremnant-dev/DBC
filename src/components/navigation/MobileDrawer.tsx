import { Link } from 'react-router-dom';
import { QuickActionButton } from './QuickActionButton';
import { BrandLogo } from '../common/BrandLogo';

interface NavLinkConfig {
  label: string;
  to: string;
}

/** Minimal auth user shape passed to the mobile drawer. */
interface AuthUser {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  navLinks: NavLinkConfig[];
  onLogout: () => void;
  onNavigateWorkspace: (tab: string | null) => void;
  selectedCity: string;
  onCitySelect: (city: string) => void;
  popularCities: string[];
}

export function MobileDrawer({
  isOpen,
  onClose,
  user,
  navLinks,
  onLogout,
  onNavigateWorkspace,
  selectedCity,
  onCitySelect,
  popularCities,
}: MobileDrawerProps) {
  if (!isOpen) return null;

  const getInitials = () => {
    if (!user) return 'U';
    const name = user.firstName || user.email;
    return name ? name.slice(0, 2).toUpperCase() : 'U';
  };

  const getDisplayRoleName = (roleStr?: string) => {
    if (!roleStr) return 'Customer Account';
    const norm = roleStr.toUpperCase();
    if (norm.includes('ADMIN')) return 'Admin Account';
    if (norm.includes('PROVIDER')) return 'Partner Account';
    return 'Customer Account';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-stone-950/40 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Drawer panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-76 max-w-xs bg-white border-l border-stone-200 p-5 flex flex-col justify-between shadow-2xl transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
          
          <div className="space-y-5">
            {/* Header: Brand Logo + Close Button */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
              <BrandLogo variant="primary" theme="light" />
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition focus:outline-none"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Profile Brief (when logged in) */}
            {user && (
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-extrabold flex items-center justify-center text-xs uppercase shadow-xs flex-shrink-0">
                  {getInitials()}
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-stone-900 truncate leading-tight">
                    {user.firstName} {user.lastName || ''}
                  </span>
                  <span className="block text-[8px] font-black uppercase text-emerald-800 tracking-wider mt-0.5">
                    {getDisplayRoleName(user.role)}
                  </span>
                </div>
              </div>
            )}

            {/* Location Selector on Mobile */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
              <span className="block text-[8px] font-black uppercase text-stone-500 tracking-wider">Active Location</span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-900">📍 {selectedCity}</span>
                <select
                  value={selectedCity}
                  onChange={(e) => onCitySelect(e.target.value)}
                  className="text-[10px] font-bold text-stone-700 bg-white border border-stone-200 rounded-lg px-2 py-1 focus:outline-none"
                >
                  {popularCities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="flex flex-col gap-1" aria-label="Mobile main navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition-all text-left uppercase tracking-wider"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Bottom actions: Settings, Quick actions, Logout */}
          <div className="space-y-3 pt-4 border-t border-stone-100">
            <QuickActionButton
              role={user?.role}
              className="w-full text-center py-2.5"
              onClickCallback={onClose}
            />

            {user && (
              <div className="grid grid-cols-2 gap-2 text-center">
                {user.role !== 'ROLE_CUSTOMER' ? (
                  <>
                    <button
                      onClick={() => {
                        onNavigateWorkspace(null);
                        onClose();
                      }}
                      className="py-2 px-3 border border-stone-200 rounded-xl text-[10px] font-bold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        onNavigateWorkspace('settings');
                        onClose();
                      }}
                      className="py-2 px-3 border border-stone-200 rounded-xl text-[10px] font-bold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                    >
                      Settings
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      onNavigateWorkspace('settings');
                      onClose();
                    }}
                    className="col-span-2 py-2 px-3 border border-stone-200 rounded-xl text-[10px] font-bold text-stone-700 hover:bg-stone-50 transition cursor-pointer"
                  >
                    Settings
                  </button>
                )}
              </div>
            )}

            {user ? (
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full text-center py-2.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition hover:bg-rose-100 cursor-pointer"
              >
                Sign Out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-center">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="py-2.5 px-3 border border-stone-200 bg-white rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-50 transition uppercase tracking-wider"
                >
                  Sign In
                </Link>
                <Link
                  to="/login?view=register"
                  onClick={onClose}
                  className="py-2.5 px-3 bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition hover:bg-emerald-800 shadow-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

