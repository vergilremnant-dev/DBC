import { useState, useEffect, useRef, startTransition } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import { useAuthDispatch } from '../../hooks/auth/useAuthStore';
import { logoutThunk } from '../../store/auth/authSlice';
import { AuthChallengeModal } from '../auth/AuthChallengeModal';
import { BrandLogo } from '../common/BrandLogo';
import { useNavigation } from '../../context/NavigationContext';
import { chatApi } from '../../services/chat/chatService';
import type { Conversation } from '../../types/chat/chatTypes';

import { NavbarItem } from './NavbarItem';
import { NotificationButton } from './NotificationButton';
import { ProfileMenu } from './ProfileMenu';
import { MobileDrawer } from './MobileDrawer';
import { NavigationGroup } from './NavigationGroup';

const POPULAR_CITIES = ['Hyderabad', 'Chennai', 'Bangalore', 'Mumbai', 'Delhi'];

export function Navbar() {
  const { isAuthenticated, user } = useAuth();
  const dispatch = useAuthDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const { selectedCity, setSelectedCity, setActiveWorkspaceTab } = useNavigation();

  // Search and Scroll states
  const qParam = searchParams.get('q') || '';
  const [searchVal, setSearchVal] = useState(qParam);
  const [isScrolled, setIsScrolled] = useState(false);

  // Dropdown / Drawer visibility states
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Chats state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const inboxDropdownRef = useRef<HTMLDivElement>(null);

  // Auth Modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Scroll effect trigger
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch Conversations list for authenticated users
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    async function loadConversations() {
      try {
        const list = await chatApi.listConversations();
        setConversations(list || []);
      } catch (err) {
        console.error('Failed to load conversations in navbar', err);
      }
    }
    loadConversations();
  }, [isAuthenticated, user]);

  // Sync Search value
  useEffect(() => {
    startTransition(() => {
      setSearchVal(qParam);
    });
  }, [qParam]);

  // Click outside to close Inbox dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inboxDropdownRef.current && !inboxDropdownRef.current.contains(event.target as Node)) {
        setIsInboxOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search logic
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchVal.trim() !== qParam) {
        const newParams = new URLSearchParams(searchParams);
        if (searchVal.trim()) {
          newParams.set('q', searchVal.trim());
        } else {
          newParams.delete('q');
        }
        if (selectedCity) {
          newParams.set('city', selectedCity);
        } else {
          newParams.delete('city');
        }

        if (location.pathname !== '/search' && !location.pathname.startsWith('/category/')) {
          navigate(`/search?${newParams.toString()}`);
        } else {
          setSearchParams(newParams);
        }
      }
    }, 450);

    return () => clearTimeout(handler);
  }, [searchVal, qParam, searchParams, selectedCity, location.pathname, navigate, setSearchParams]);

  const handleLocationSelect = (city: string) => {
    setSelectedCity(city);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('city', city);
    setSearchParams(newParams, { replace: true });
  };

  const handleLogout = () => {
    void dispatch(logoutThunk());
    navigate('/');
  };

  const handleNavigateWorkspace = (tab: string | null) => {
    setActiveWorkspaceTab(tab);
    const norm = user?.role?.toUpperCase() || '';
    if (norm.includes('ADMIN')) {
      navigate('/admin/dashboard');
    } else if (tab === 'profile' || tab === 'settings') {
      navigate(norm.includes('PROVIDER') ? '/workspace/profile' : '/workspace/settings');
    } else if (norm.includes('PROVIDER')) {
      navigate('/workspace/dashboard');
    } else {
      navigate('/workspace/overview');
    }
  };

  // Context-aware navigation links
  const getNavLinks = () => {
    if (isAuthenticated && user) {
      const normRole = (user.role || '').toUpperCase();
      if (normRole.includes('PROVIDER')) {
        return [
          { label: 'Marketplace', to: '/' },
          { label: 'Dashboard', to: '/workspace/dashboard' },
          { label: 'Subscription', to: '/subscriptions' },
        ];
      }
      if (normRole.includes('ADMIN')) {
        return [
          { label: 'Marketplace', to: '/' },
          { label: 'Dashboard', to: '/admin/dashboard' },
          { label: 'Subscription', to: '/subscriptions' },
        ];
      }
      // Customer role (default for authenticated customer)
      return [
        { label: 'Marketplace', to: '/' },
        { label: 'Dashboard', to: '/workspace/overview' },
        { label: 'Subscription', to: '/subscriptions' },
      ];
    }
    // Public / Logged-out navigation
    return [
      { label: 'Find Services', to: '/' },
      { label: 'Browse Professionals', to: '/search' },
      { label: 'How It Works', to: '/know-more' },
      { label: 'Premium Plans', to: '/subscriptions' },
    ];
  };

  const activeLinks = getNavLinks();

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 backdrop-blur-md border-b flex items-center
        ${isScrolled 
          ? 'h-[72px] bg-white/90 border-light-border shadow-apple-sm' 
          : 'h-[78px] sm:h-[80px] bg-white/70 border-light-border/40 shadow-none'
        }
      `}
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 lg:px-8 lg:grid lg:grid-cols-12 flex justify-between items-center h-full">
        
        {/* Brand Zone (2 Columns) */}
        <div className="lg:col-span-2 flex items-center flex-shrink-0">
          <Link
            to="/"
            className="flex items-center hover:scale-[1.02] transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald rounded-lg"
          >
            <BrandLogo variant="primary" theme="light" />
          </Link>
        </div>

        {/* Navigation Zone (8 Columns) */}
        <div className="lg:col-span-8 hidden lg:flex justify-center items-center">
          <nav className="flex items-center gap-6 xl:gap-8" aria-label="Main Navigation">
            {activeLinks.map((link) => (
              <NavbarItem key={link.to} to={link.to} end={link.to === '/'}>
                {link.label}
              </NavbarItem>
            ))}
          </nav>
        </div>

        {/* Action Zone (2 Columns) */}
        <div className="lg:col-span-2 hidden lg:flex justify-end items-center flex-shrink-0">
          {isAuthenticated && user ? (
            <NavigationGroup className="gap-2.5">
              {/* Inbox Dropdown Button */}
              <div className="relative" ref={inboxDropdownRef}>
                <button
                  onClick={() => setIsInboxOpen(!isInboxOpen)}
                  className={`w-9 h-9 flex items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${isInboxOpen ? 'bg-stone-100 text-stone-900 border-emerald-600' : ''}`}
                  aria-label="View messages"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {conversations.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-700 text-white rounded-full flex items-center justify-center text-[8px] font-black border border-white shadow-xs">
                      {conversations.length}
                    </span>
                  )}
                </button>

                {isInboxOpen && (
                  <div className="absolute right-0 mt-2.5 w-76 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-lg z-50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-stone-500">Recent Chats</span>
                      <button
                        onClick={() => {
                          setIsInboxOpen(false);
                          navigate('/workspace/inbox');
                        }}
                        className="text-[9px] font-extrabold text-emerald-800 hover:underline cursor-pointer focus:outline-none"
                      >
                        View inbox
                      </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                      {conversations.length > 0 ? (
                        conversations.slice(0, 3).map((convo) => {
                          const otherName = user.role.includes('CUSTOMER') 
                              ? (convo.provider?.fullName || 'Partner') 
                              : (convo.customer?.fullName || 'Client');
                          return (
                            <div
                              key={convo.id}
                              onClick={() => {
                                setIsInboxOpen(false);
                                navigate('/workspace/inbox');
                              }}
                              className="p-2.5 rounded-xl border border-stone-200 hover:border-emerald-600 hover:bg-stone-50 transition cursor-pointer text-left"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-stone-900">{otherName}</span>
                                <span className="text-[8px] text-stone-400 font-extrabold">Active</span>
                              </div>
                              <p className="text-[10px] text-stone-500 truncate mt-0.5 font-medium">
                                {convo.lastMessage || 'Open chat thread records.'}
                              </p>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center text-xs text-stone-400 py-6">No active chat threads found.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Button */}
              <NotificationButton role={user.role} />
              
              {/* Profile Avatar / Dropdown */}
              <ProfileMenu
                user={user}
                onLogout={handleLogout}
                onNavigateWorkspace={handleNavigateWorkspace}
                onNavigateHelp={() => navigate('/know-more')}
              />
            </NavigationGroup>
          ) : (
            <NavigationGroup>
              <Link
                to="/login"
                className="dbc-btn dbc-btn-primary tracking-wider text-[10px] font-bold uppercase rounded-lg shadow-apple-sm px-4 py-2"
              >
                Become a Professional
              </Link>
            </NavigationGroup>
          )}
        </div>

        {/* Mobile controls (Hamburger menu trigger) */}
        <div className="lg:hidden flex items-center ml-auto">
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-2 rounded-full border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            aria-label="Open navigation menu"
          >
            <svg className="w-5.5 h-5.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

      </div>

      {/* Slide-over Mobile Drawer from Right Side */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        user={user}
        navLinks={activeLinks}
        onLogout={handleLogout}
        onNavigateWorkspace={handleNavigateWorkspace}
        selectedCity={selectedCity}
        onCitySelect={handleLocationSelect}
        popularCities={POPULAR_CITIES}
      />

      {/* Auth Modal challenge */}
      <AuthChallengeModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        message="Please sign in to proceed."
        onSuccess={() => {
          setIsAuthModalOpen(false);
        }}
      />
    </header>
  );
}

