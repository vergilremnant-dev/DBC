import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthDispatch, useAuthSelector } from '../../hooks/auth/useAuthStore';
import { getDashboardPathForRole } from '../../services/auth/authRedirect';
import { loginThunk } from '../../store/auth/authSlice';
import type { LoginRequest } from '../../types/auth/authTypes';
import type { RegisterPayload } from '../../components/auth/RegisterWizard';

import { AuthLayout } from '../../components/auth/AuthLayout';

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
    <AuthLayout showBackToMarketplace={view !== 'welcome'}>
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
    </AuthLayout>
  );
}

