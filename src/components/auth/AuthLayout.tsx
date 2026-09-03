import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../common/BrandLogo';

interface AuthLayoutProps {
  children: ReactNode;
  showBackToMarketplace?: boolean;
  onBackClick?: () => void;
}

export function AuthLayout({
  children,
  showBackToMarketplace = true,
  onBackClick,
}: AuthLayoutProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate('/');
    }
  };

  return (
    <main className="min-h-screen h-screen max-h-screen bg-[#F5F5F4] p-3 sm:p-6 lg:p-8 flex items-center justify-center overflow-hidden">
      <section className="mx-auto grid max-w-4xl w-full max-h-[94vh] rounded-3xl border border-stone-200 bg-white shadow-xl lg:grid-cols-[1.1fr_1fr] overflow-hidden">
        
        {/* Left Side: Identical Premium Architectural branding banner */}
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

          {/* Architectural grid overlay & radial subtle glow */}
          <div className="absolute inset-0 bg-arch-grid opacity-20 pointer-events-none"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0,transparent_100%)] pointer-events-none"></div>
        </div>

        {/* Right Side: Shared Authentication container with exact padding & alignment */}
        <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-white relative overflow-y-auto max-h-full">
          
          {/* Mobile Top Header (When left banner is hidden) */}
          <div className="lg:hidden flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
            <BrandLogo variant="compact" theme="light" />
            <button
              onClick={handleBack}
              className="text-xs font-medium text-stone-500 hover:text-stone-900 transition flex items-center gap-1 cursor-pointer"
            >
              ← Back to Marketplace
            </button>
          </div>

          {/* Desktop Back button */}
          {showBackToMarketplace && (
            <div className="hidden lg:flex items-center justify-between mb-3">
              <button
                onClick={handleBack}
                className="text-xs font-medium text-stone-400 hover:text-stone-700 transition flex items-center gap-1.5 cursor-pointer focus:outline-none"
              >
                ← Back to Marketplace
              </button>
            </div>
          )}

          {/* Form / Content View */}
          {children}

        </div>
      </section>
    </main>
  );
}
