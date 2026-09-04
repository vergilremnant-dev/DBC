import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { LoginRequest } from '../../types/auth/authTypes';

interface LoginFormProps {
  values: LoginRequest;
  loading: boolean;
  error: string | null;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onForgotPassword?: () => void;
  onSignUpClick?: () => void;
}

export function LoginForm({
  values,
  loading,
  error,
  onChange,
  onSubmit,
  onForgotPassword,
  onSignUpClick,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="space-y-4 text-left">
      
      {/* LoginForm Core */}
      <form onSubmit={onSubmit} className="space-y-3.5">
        
        {/* Email or Phone Field */}
        <div>
          <label htmlFor="login-email" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">
            Email Address or Phone Number
          </label>
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
            </svg>
            <input
              id="login-email"
              type="text"
              name="email"
              placeholder="Enter your email or 10-digit phone number"
              value={values.email}
              onChange={onChange}
              required
              autoComplete="username"
              className="w-full bg-stone-50/50 focus:bg-white border border-stone-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 py-2.5 pl-10 pr-3.5 transition-all outline-none"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="login-password" className="text-[10px] font-black uppercase tracking-wider text-stone-500">
              Password
            </label>
            {onForgotPassword && (
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer focus:outline-none"
              >
                Forgot Password?
              </button>
            )}
          </div>
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Enter your password"
              value={values.password}
              onChange={onChange}
              required
              autoComplete="current-password"
              className="w-full bg-stone-50/50 focus:bg-white border border-stone-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 py-2.5 pl-10 pr-11 transition-all outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-1 cursor-pointer focus:outline-none transition"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.03 10.03 0 013.682-.763c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-4.092-4.092a3 3 0 11-4.243-4.243M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Remember Me Device Flag */}
        <div className="flex items-center pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-700 border-stone-300 focus:ring-emerald-600 accent-emerald-700 cursor-pointer"
            />
            <span className="text-xs font-medium text-stone-600">Remember this device</span>
          </label>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 leading-relaxed flex items-center gap-2" role="alert">
            <svg className="w-4 h-4 shrink-0 text-rose-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Submit Action */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Signing in...</span>
            </>
          ) : (
            'Sign In to Account'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-4">
        <div className="w-full border-t border-stone-200"></div>
        <span className="relative bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">
          Or continue with
        </span>
      </div>

      {/* Social Auth Providers with Clean Aligned Icons */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Google */}
        <button
          type="button"
          onClick={() => alert('Google authentication initialized.')}
          className="w-full py-2.5 px-3 bg-white border border-stone-200 hover:border-stone-300 hover:bg-stone-50/80 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span className="text-xs font-semibold text-stone-700">Google</span>
        </button>

        {/* Microsoft */}
        <button
          type="button"
          onClick={() => alert('Microsoft authentication initialized.')}
          className="w-full py-2.5 px-3 bg-white border border-stone-200 hover:border-stone-300 hover:bg-stone-50/80 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21">
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          <span className="text-xs font-semibold text-stone-700">Microsoft</span>
        </button>

        {/* Apple */}
        <button
          type="button"
          onClick={() => alert('Apple authentication initialized.')}
          className="w-full py-2.5 px-3 bg-white border border-stone-200 hover:border-stone-300 hover:bg-stone-50/80 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0 fill-current text-stone-900" viewBox="0 0 170 170">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.88-11.93-14.52-6.55-10.13-11.45-21.65-14.7-34.56-3.25-12.92-4.88-25.17-4.88-36.75 0-16.14 4.1-29.47 12.3-40 8.2-10.53 18.66-15.86 31.39-16 4.91 0 10.42 1.34 16.52 4.02 6.1 2.68 10.02 4.07 11.76 4.19 1.48-.12 5.56-1.57 12.24-4.35 6.68-2.78 12.18-4 16.5-3.67 12.24 1.01 22.04 6.01 29.41 15-10.74 6.5-16.01 15.54-15.81 27.12.2 9.07 3.58 16.63 10.15 22.68 6.57 6.05 14.39 9.5 23.46 10.35-2.23 6.78-4.94 13.62-8.13 20.52zm-32.61-98.87c0-7.3 2.64-14.07 7.92-20.3 5.28-6.23 11.83-10.25 19.65-12.08.67 1.56 1.01 3.21 1.01 4.95 0 7.33-2.73 14.28-8.19 20.85-5.46 6.57-12.26 10.43-20.39 11.58z"/>
          </svg>
          <span className="text-xs font-semibold text-stone-700">Apple</span>
        </button>
      </div>

      {/* Sign Up Redirect */}
      {onSignUpClick && (
        <div className="pt-2 text-center border-t border-stone-100">
          <p className="text-xs text-stone-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSignUpClick}
              className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
            >
              Register
            </button>
          </p>
        </div>
      )}

    </div>
  );
}

