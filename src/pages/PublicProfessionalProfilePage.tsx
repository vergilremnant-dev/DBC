import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { providerApi } from '../services/provider/providerService';
import { useAuth } from '../hooks/auth/useAuth';
import { AuthChallengeModal } from '../components/auth/AuthChallengeModal';
import { FavoriteButton } from '../components/marketplace/FavoriteButton';
import type { ProviderProfile } from '../types/provider/providerTypes';

export function PublicProfessionalProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Auth interceptor
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!id) {
      setErrorMsg('Professional ID is missing.');
      setLoading(false);
      return;
    }

    async function loadProviderDetails() {
      try {
        setLoading(true);
        setErrorMsg('');
        const data = await providerApi.getProvider(id!);
        setProvider(data);
      } catch (err: unknown) {
        console.error('Failed to load professional profile', err);
        setErrorMsg(err instanceof Error ? err.message : 'Unable to retrieve professional details.');
      } finally {
        setLoading(false);
      }
    }

    loadProviderDetails();
  }, [id]);

  const handleStartProjectRequest = () => {
    if (!provider) return;

    const action = () => {
      navigate(`/book-service?providerId=${provider.id}&categoryId=${provider.categoryId || ''}`);
    };

    if (!isAuthenticated) {
      setPendingAction(() => action);
      setAuthMessage('Please sign in or create an account to start a project request with this professional.');
      setIsAuthModalOpen(true);
      return;
    }

    if (user?.role !== 'ROLE_CUSTOMER') {
      setErrorMsg('Only registered customers can submit project requests.');
      return;
    }

    action();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'PRO';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 rounded-full border-4 border-stone-200 border-t-emerald-700 animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Loading Professional Profile...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !provider) {
    return (
      <div className="min-h-screen bg-stone-50 py-16 px-4">
        <div className="max-w-md mx-auto text-center bg-white border border-stone-200 rounded-3xl p-8 space-y-4 shadow-sm">
          <span className="text-3xl block">🔍</span>
          <h2 className="text-lg font-bold text-stone-900 font-serif">Professional Not Found</h2>
          <p className="text-xs text-stone-500 font-medium leading-relaxed">{errorMsg || 'We could not locate the requested professional profile.'}</p>
          <button
            onClick={() => navigate('/search')}
            className="dbc-btn dbc-btn-primary py-2.5 px-5 rounded-xl text-xs font-bold uppercase tracking-wider"
          >
            Browse Professionals
          </button>
        </div>
      </div>
    );
  }

  const displayName = provider.businessName || provider.fullName;
  const isVerified = provider.verificationStatus === 'VERIFIED';

  return (
    <div className="bg-stone-50 text-stone-900 font-sans min-h-screen pb-16">
      
      {/* Top Banner / Cover */}
      <div className="h-48 sm:h-64 bg-gradient-to-r from-stone-900 via-stone-850 to-emerald-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-arch-grid opacity-30" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 relative z-10">
          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-300 hover:text-white transition bg-stone-950/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10"
          >
            ← Back to Search Results
          </Link>
        </div>
      </div>

      {/* Main Profile Shell */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-20 z-20 space-y-8">
        
        {/* Header Profile Card */}
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              {provider.profileImage ? (
                <img
                  src={provider.profileImage}
                  alt={displayName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-md bg-stone-100"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-emerald-800 to-stone-950 text-white font-black flex items-center justify-center text-xl uppercase border-4 border-white shadow-md">
                  {getInitials(displayName)}
                </div>
              )}
              {isVerified && (
                <span className="absolute -bottom-1 -right-1 bg-emerald-700 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full border-2 border-white shadow-xs">
                  Verified
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 font-serif leading-tight">{displayName}</h1>
                <FavoriteButton id={provider.id} type="professional" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                {provider.category?.name || 'Construction & Design Partner'}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 font-medium pt-1">
                <span>📍 {provider.city}, {provider.state}</span>
                <span>•</span>
                <span>💼 {provider.experienceYears || 5}+ Years Experience</span>
                <span>•</span>
                <span className="text-amber-800 font-bold">⭐ {provider.averageRating || 4.8}</span>
              </div>
            </div>
          </div>

          {/* Primary Call to Action */}
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <button
              onClick={handleStartProjectRequest}
              className="dbc-btn dbc-btn-lg dbc-btn-primary shadow-apple-sm py-3 px-6 rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              Start Project Request →
            </button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
          
          {/* Left / Main Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Overview / Bio */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">About Professional</h3>
              <p className="text-xs sm:text-sm text-stone-700 font-medium leading-relaxed">
                {provider.description || 'Verified coordination specialist offering certified layout drafting, architectural oversight, and on-site construction execution.'}
              </p>
            </div>

            {/* Specializations & Skills */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">Services & Specializations</h3>
              <div className="flex flex-wrap gap-2">
                {(provider.serviceAreas ? provider.serviceAreas.split(',') : ['Civil Engineering', 'Design Coordination', 'Structural Audits', 'Site Inspection', 'Permit Assistance']).map((skill) => (
                  <span
                    key={skill}
                    className="text-xs font-semibold bg-stone-100 text-stone-800 border border-stone-200 px-3 py-1.5 rounded-xl"
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Portfolio Showcase */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">Featured Projects Gallery</h3>
                <span className="text-[10px] font-bold uppercase text-stone-400">Verified Work</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Villa Structural Layout & Foundation',
                    category: 'Residential Build',
                    img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
                  },
                  {
                    title: 'Modern Living Room Renovation',
                    category: 'Interior & Fitout',
                    img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80',
                  },
                ].map((proj, idx) => (
                  <div key={idx} className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs group">
                    <div className="h-36 overflow-hidden bg-stone-100">
                      <img src={proj.img} alt={proj.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    </div>
                    <div className="p-3.5 space-y-1 bg-white">
                      <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                        {proj.category}
                      </span>
                      <h4 className="text-xs font-bold text-stone-900 font-serif leading-snug">{proj.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Summary Card */}
            <div className="bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">Professional Summary</h3>
              
              <div className="space-y-3 text-xs font-semibold text-stone-700">
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-500 font-medium">Business Name</span>
                  <span className="text-stone-900 font-bold">{displayName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-500 font-medium">Service Area</span>
                  <span className="text-stone-900 font-bold">{provider.city}, {provider.state}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-stone-500 font-medium">Verification Status</span>
                  <span className={`font-bold ${isVerified ? 'text-emerald-800' : 'text-stone-600'}`}>
                    {isVerified ? '✓ Verified Partner' : 'Registered'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-stone-500 font-medium">Pricing Model</span>
                  <span className="text-stone-900 font-bold">Project Quote</span>
                </div>
              </div>

              <button
                onClick={handleStartProjectRequest}
                className="w-full dbc-btn dbc-btn-primary py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm mt-2"
              >
                Discuss Project / Request Quote
              </button>
            </div>

            {/* Trust Notice */}
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-3xl p-5 space-y-2 text-xs text-emerald-950">
              <span className="font-extrabold flex items-center gap-1.5">
                🛡️ Direct Verified Inquiry
              </span>
              <p className="text-[11px] text-emerald-900 font-medium leading-relaxed">
                Submitting a project request connects you directly with {displayName}. You can share your spatial parameters, layout preferences, and budget to receive a tailored quotation.
              </p>
            </div>

          </div>

        </div>

      </main>

      {/* Auth Modal Guard */}
      <AuthChallengeModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        message={authMessage}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }}
      />

    </div>
  );
}
