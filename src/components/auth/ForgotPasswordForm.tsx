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
        <h2 className="text-2xl font-bold text-stone-900 font-serif tracking-tight">Recover Password</h2>
        <p className="text-xs text-stone-500">Enter your registered email address to receive recovery instructions.</p>
      </div>

      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
          <div>
            <label htmlFor="recover-email" className="block text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1.5">
              Email Address
            </label>
            <input
              id="recover-email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-stone-50/50 focus:bg-white border border-stone-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 py-2.5 px-3.5 transition-all outline-none"
              placeholder="name@example.com"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs transition-all duration-200 cursor-pointer"
          >
            Send Recovery Link
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
            A password recovery link has been dispatched to <strong className="text-stone-900">{email}</strong>. Check your inbox to proceed.
          </p>
        </div>
      )}

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

    </div>
  );
}

