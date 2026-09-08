import { useState } from 'react';

interface ResetPasswordFormProps {
  onResetComplete: () => void;
  onBackToLogin: () => void;
}

export function ResetPasswordForm({ onResetComplete, onBackToLogin }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSuccess(true);
  };

  return (
    <div className="space-y-4 text-left">
      
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-stone-900 font-serif tracking-tight">Reset Password</h2>
        <p className="text-xs text-stone-500">Enter your new secure password credentials.</p>
      </div>

      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div>
            <label htmlFor="reset-pass" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">
              New Password
            </label>
            <input
              id="reset-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-stone-50/50 focus:bg-white border border-stone-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 py-2.5 px-3.5 transition-all outline-none"
            />
          </div>

          <div>
            <label htmlFor="reset-confirm" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">
              Confirm New Password
            </label>
            <input
              id="reset-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-stone-50/50 focus:bg-white border border-stone-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 py-2.5 px-3.5 transition-all outline-none"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 leading-relaxed flex items-center gap-2" role="alert">
              <svg className="w-4 h-4 shrink-0 text-rose-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-all duration-200 cursor-pointer"
          >
            Update Password
          </button>
        </form>
      ) : (
        <div className="space-y-3 py-4 text-center">
          <div className="flex justify-center">
            <span className="w-10 h-10 flex items-center justify-center bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-lg shadow-xs">
              ✓
            </span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed max-w-[280px] mx-auto">
            Your password has been successfully updated. You can now log in using your new credentials.
          </p>
          <button
            onClick={() => {
              onResetComplete();
              onBackToLogin();
            }}
            className="py-2.5 px-6 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-all cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      )}

      {!success && (
        <div className="pt-2 text-center border-t border-stone-100">
          <p className="text-xs text-stone-500">
            <button
              type="button"
              onClick={onBackToLogin}
              className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
            >
              ← Back to Sign In
            </button>
          </p>
        </div>
      )}

    </div>
  );
}

