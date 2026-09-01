import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthDispatch, useAuthSelector } from '../../hooks/auth/useAuthStore';
import { BrandLogo } from '../../components/common/BrandLogo';
import { getDashboardPathForRole } from '../../services/auth/authRedirect';
import { loginThunk } from '../../store/auth/authSlice';
import type { LoginRequest } from '../../types/auth/authTypes';
import type { RegisterPayload } from '../../components/auth/RegisterWizard';

// Reusable Auth Sub-components
import { LoginForm } from '../../components/auth/LoginForm';
import { RegisterWizard } from '../../components/auth/RegisterWizard';
import { ForgotPasswordForm } from '../../components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from '../../components/auth/ResetPasswordForm';
import { WelcomeScreen } from '../../components/auth/WelcomeScreen';

const initialValues: LoginRequest = {
  email: '',
  password: '',
};

type AuthViewType = 'login' | 'register' | 'forgot' | 'reset' | 'welcome';
type WelcomeUser = { firstName?: string; email: string; role: string };

export function LoginPage() {
  const dispatch = useAuthDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { loading, error, isAuthenticated, user } = useAuthSelector((state) => state.auth);
  
  const [values, setValues] = useState<LoginRequest>(initialValues);
  // Custom mock user for onboarding registration pathway
  const [registeredUser, setRegisteredUser] = useState<WelcomeUser | null>(null);

  const queryParams = new URLSearchParams(location.search);
  const redirectParam = queryParams.get('redirect');
  const viewParam = queryParams.get('view') || queryParams.get('mode');

  const [view, setView] = useState<AuthViewType>(() => {
    if (viewParam === 'register') return 'register';
    if (viewParam === 'forgot') return 'forgot';
    if (viewParam === 'reset') return 'reset';
    return 'login';
  });
  
  // Sync view when URL query parameters update
  useEffect(() => {
    if (viewParam === 'register' && view !== 'register') setView('register');
    if (viewParam === 'login' && view !== 'login') setView('login');
  }, [viewParam, view]);

  // Triggered on active login redirect rules
  useEffect(() => {
    if (isAuthenticated && view !== 'welcome') {
      const target = redirectParam ? decodeURIComponent(redirectParam) : getDashboardPathForRole(user?.role);
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, navigate, user?.role, redirectParam, view]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await dispatch(loginThunk(values));

    if (loginThunk.fulfilled.match(result)) {
      // Intercept successful login to display welcome experience & adaptive onboarding
      setRegisteredUser({
        firstName: result.payload.user.firstName,
        email: result.payload.user.email,
        role: result.payload.user.role,
      });
      setView('welcome');
    }
  }

  const handleCompleteOnboarding = () => {
    const activeRole = registeredUser?.role || user?.role || 'ROLE_CUSTOMER';
    const redirectTo = getRedirectTarget(activeRole);
    navigate(redirectTo, { replace: true });
  };

  const handleRegisterComplete = (payload: RegisterPayload) => {
    // Save details to display on welcome page
    setRegisteredUser({
      firstName: payload.firstName,
      email: payload.email,
      role: payload.role,
    });
  };

  function getRedirectTarget(role: string) {
    if (redirectParam) {
      return decodeURIComponent(redirectParam);
    }
    const from = location.state as { from?: { pathname?: string } } | null;

    if (from?.from?.pathname && from.from.pathname !== '/login') {
      return from.from.pathname;
    }

    return getDashboardPathForRole(role);
  }

  return (
    <main className="min-h-screen h-screen max-h-screen bg-[#F5F5F4] p-3 sm:p-6 lg:p-8 flex items-center justify-center overflow-hidden">
      <section className="mx-auto grid max-w-4xl w-full max-h-[94vh] rounded-3xl border border-stone-200 bg-white shadow-xl lg:grid-cols-[1.1fr_1fr] overflow-hidden">
        
        {/* Left Side: Premium Architectural branding banner (Desktop only for single-screen cleanliness) */}
        <div className="hidden lg:flex flex-col justify-center bg-stone-900 p-8 lg:p-10 text-white relative">
          <div className="relative z-10">
            <BrandLogo variant="primary" theme="dark" />
            <h1 className="mt-6 max-w-sm text-3xl font-extrabold font-serif leading-tight text-white">
              Design. Build. <span className="text-emerald-400">Connect.</span>
            </h1>
            <p className="mt-4 max-w-sm text-xs sm:text-sm text-stone-300 leading-relaxed font-normal">
              Access your verified workspace to coordinate project milestones, receive transparent quotations, and manage bookings.
            </p>
          </div>

          {/* Soft architectural grid (balanced with text & logo) & radial subtle glow */}
          <div className="absolute inset-0 bg-arch-grid opacity-20 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0,transparent_100%)] pointer-events-none"></div>
        </div>

        {/* Right Side: Authentication view machine container */}
        <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-white relative overflow-y-auto max-h-full">
          
          {/* Mobile Top Header (When left banner is hidden) */}
          <div className="lg:hidden flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
            <BrandLogo variant="compact" theme="light" />
            <button
              onClick={() => navigate('/')}
              className="text-[10px] font-bold uppercase tracking-wider text-stone-500 hover:text-stone-900 transition"
            >
              ← Marketplace
            </button>
          </div>

          {/* Desktop Back button */}
          {view !== 'welcome' && (
            <div className="hidden lg:flex items-center justify-between mb-3">
              <button
                onClick={() => navigate('/')}
                className="text-[10px] font-bold uppercase tracking-wider text-stone-400 hover:text-stone-700 transition flex items-center gap-1 cursor-pointer focus:outline-none"
              >
                ← Back to Marketplace
              </button>
            </div>
          )}

          {/* Render Active View State */}
          {view === 'login' && (
            <div className="space-y-3.5">
              <div className="text-left">
                <h2 className="text-2xl font-bold text-stone-900 font-serif">Sign In</h2>
              </div>
              <LoginForm
                values={values}
                loading={loading}
                error={error}
                onChange={handleChange}
                onSubmit={handleSubmit}
                onForgotPassword={() => setView('forgot')}
                onSignUpClick={() => setView('register')}
              />
            </div>
          )}

          {view === 'register' && (
            <RegisterWizard
              onRegisterComplete={handleRegisterComplete}
              onBackToLogin={() => setView('login')}
            />
          )}

          {view === 'forgot' && (
            <ForgotPasswordForm
              onBackToLogin={() => setView('login')}
            />
          )}

          {view === 'reset' && (
            <ResetPasswordForm
              onResetComplete={() => setView('login')}
              onBackToLogin={() => setView('login')}
            />
          )}

          {view === 'welcome' && (
            <WelcomeScreen
              user={registeredUser}
              onCompleteOnboarding={handleCompleteOnboarding}
            />
          )}

        </div>
      </section>
    </main>
  );
}

