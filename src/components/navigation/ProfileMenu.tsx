import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProfileMenuProps {
  user: {
    firstName?: string;
    lastName?: string;
    email: string;
    role: string;
  };
  onLogout: () => void;
  onNavigateWorkspace: (tab: string | null) => void;
  onNavigateHelp: () => void;
}

export function ProfileMenu({ user, onLogout, onNavigateWorkspace, onNavigateHelp }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = () => {
    const name = user.firstName || user.email;
    return name.slice(0, 2).toUpperCase();
  };

  const getDisplayRoleName = (roleStr: string) => {
    const norm = roleStr.toUpperCase();
    if (norm.includes('ADMIN')) return 'Admin';
    if (norm.includes('PROVIDER')) return 'Partner';
    return 'Customer';
  };

  const getVerificationBadge = (roleStr: string) => {
    const norm = roleStr.toUpperCase();
    if (norm.includes('ADMIN')) return '🛡️ System Admin';
    if (norm.includes('PROVIDER')) return '🛡️ Verified Partner';
    return 'Verified Account';
  };

  const isProvider = user.role.toUpperCase().includes('PROVIDER');
  const isAdmin = user.role.toUpperCase().includes('ADMIN');

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 p-1 rounded-full border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${isOpen ? 'border-emerald-600 shadow-xs' : ''}`}
        aria-label="Account options"
      >
        <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-extrabold flex items-center justify-center text-xs uppercase shadow-xs">
          {getInitials()}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-72 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-lg z-50 space-y-2.5 text-left animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Profile Header */}
          <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
            <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-extrabold flex items-center justify-center text-xs uppercase shadow-xs flex-shrink-0">
              {getInitials()}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-stone-900 truncate leading-snug">
                {user.firstName} {user.lastName || ''}
              </h4>
              <p className="text-2xs text-stone-500 truncate">{user.email}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-3xs font-black uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded border border-stone-200">
                  {getDisplayRoleName(user.role)}
                </span>
                <span className="text-3xs text-emerald-800 font-bold">
                  {getVerificationBadge(user.role)}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-0.5 pt-0.5 text-xs">
            <button
              onClick={() => {
                setIsOpen(false);
                onNavigateWorkspace(null);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900 focus:outline-none transition cursor-pointer text-left"
            >
              <span className="text-sm">📊</span>
              <span>{isAdmin ? 'Admin Console' : isProvider ? 'Partner Dashboard' : 'My Dashboard'}</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onNavigateWorkspace('settings');
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900 focus:outline-none transition cursor-pointer text-left"
            >
              <span className="text-sm">⚙️</span>
              <span>Profile & Settings</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                navigate(user?.role === 'ROLE_PROVIDER' ? '/workspace/dashboard' : '/workspace/bookings');
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900 focus:outline-none transition cursor-pointer text-left"
            >
              <span className="text-sm">📅</span>
              <span>{user?.role === 'ROLE_PROVIDER' ? 'Dashboard' : 'Project Requests'}</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/workspace/inbox');
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900 focus:outline-none transition cursor-pointer text-left"
            >
              <span className="text-sm">💬</span>
              <span>Messages</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onNavigateHelp();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900 focus:outline-none transition cursor-pointer text-left"
            >
              <span className="text-sm">❓</span>
              <span>Help & Support</span>
            </button>
          </div>

          {/* Sign Out */}
          <div className="border-t border-stone-100 pt-1.5">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 focus:outline-none transition cursor-pointer text-left"
            >
              <span className="text-sm">🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

