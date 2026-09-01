import { useState } from 'react';

interface ResetPasswordFormProps {
  onResetComplete: () => void;
  onBackToLogin: () => void;
}

export function ResetPasswordForm({ onResetComplete, onBackToLogin }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    setSuccess(true);
  };

  return (
    <div className="space-y-4 text-left">
      
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-stone-900 font-serif">Reset Password</h2>
        <p className="text-xs text-stone-500">Enter your new secure password credentials.</p>
      </div>

      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div>
            <label htmlFor="reset-pass" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1">
              New Password
            </label>
            <input
              id="reset-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="dbc-input text-xs placeholder:text-stone-400"
            />
          </div>

          <div>
            <label htmlFor="reset-confirm" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1">
              Confirm New Password
            </label>
            <input
              id="reset-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="dbc-input text-xs placeholder:text-stone-400"
            />
          </div>

          <button
            type="submit"
            className="w-full dbc-btn dbc-btn-xl dbc-btn-primary"
          >
            Update Password
          </button>
        </form>
      ) : (
        <div className="space-y-3 py-4 text-center">
          <div className="flex justify-center">
            <span className="w-10 h-10 flex items-center justify-center bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-lg">
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
            className="dbc-btn dbc-btn-lg dbc-btn-primary px-6"
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

