import { useState } from 'react';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSuccess(true);
    }
  };

  return (
    <div className="space-y-4 text-left">
      
      <div className="space-y-1">
        <h3 className="text-xl font-bold font-serif text-stone-900">Recover Password</h3>
        <p className="text-xs text-stone-500">Enter your registered email address to receive recovery instructions.</p>
      </div>

      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div>
            <label htmlFor="recover-email" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1">
              Email Address
            </label>
            <input
              id="recover-email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="dbc-input text-xs placeholder:text-stone-400"
              placeholder="name@example.com"
            />
          </div>

          <button
            type="submit"
            className="w-full dbc-btn dbc-btn-xl dbc-btn-primary"
          >
            Send Recovery Link
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
            A password recovery link has been dispatched to <strong className="text-stone-900">{email}</strong>. Check your inbox to proceed.
          </p>
        </div>
      )}

      <div className="pt-2 text-center border-t border-stone-100">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-xs font-bold text-stone-500 hover:text-stone-900 transition cursor-pointer"
        >
          ← Back to Login
        </button>
      </div>

    </div>
  );
}

