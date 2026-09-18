import React, { useState } from 'react';
import { useAuthDispatch, useAuthSelector } from '../../hooks/auth/useAuthStore';
import { loginThunk } from '../../store/auth/authSlice';
import { LoginForm } from './LoginForm';
import type { LoginRequest } from '../../types/auth/authTypes';
import { BRAND } from '../../config/branding';

interface AuthChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  message?: string;
}

const initialValues: LoginRequest = {
  email: '',
  password: '',
};

export function AuthChallengeModal({ isOpen, onClose, onSuccess, message }: AuthChallengeModalProps) {
  const dispatch = useAuthDispatch();
  const { loading, error } = useAuthSelector((state) => state.auth);
  
  const [values, setValues] = useState<LoginRequest>(initialValues);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    const result = await dispatch(loginThunk(values));

    if (loginThunk.fulfilled.match(result)) {
      onSuccess();
    } else {
      setLocalError((result.payload as string) || 'Authentication failed. Please check credentials.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 sm:p-8 relative shadow-2xl border border-stone-100 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-11 w-11 flex items-center justify-center rounded-full bg-stone-50 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer min-h-[44px] min-w-[44px]"
          aria-label="Close dialog"
        >
          ✕
        </button>

        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
          Account Access Required
        </span>

        <h2 className="mt-4 text-2xl font-bold text-stone-900 font-serif leading-tight">
          Sign In to Continue
        </h2>
        
        <p className="mt-2 text-xs text-stone-500 font-medium leading-relaxed">
          {message || 'You must be signed in to perform this action. Enter your registered credentials below.'}
        </p>

        <div className="mt-6 border-t border-stone-100 pt-6">
          <LoginForm
            values={values}
            loading={loading}
            error={localError || error}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
        </div>

        <div className="mt-4 text-center">
          <p className="text-[10px] text-stone-400 font-medium">
            New to {BRAND.name}? Join as a customer or partner from our registration menu.
          </p>
        </div>

      </div>
    </div>
  );
}
