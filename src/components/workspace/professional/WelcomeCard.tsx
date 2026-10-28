import { BRAND } from '../../../config/branding';

interface WelcomeCardProps {
  name: string;
  businessStatus: string;
  verificationStatus: 'Verified' | 'Pending' | 'Rejected';
  memberSince: string;
  profileCompletion: number;
  onCompleteProfile: () => void;
}

export function WelcomeCard({
  name,
  businessStatus,
  verificationStatus,
  memberSince,
  profileCompletion,
  onCompleteProfile,
}: WelcomeCardProps) {
  return (
    <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 text-left relative overflow-hidden">
      {/* Decorative ambient background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full filter blur-2xl pointer-events-none"></div>

      <div className="space-y-3">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-stone-900 font-display leading-none">
            Welcome back, {name} 👋
          </h1>
          <p className="text-xs text-stone-400 font-bold">
            Here's a snapshot of your {BRAND.name} business status today.
          </p>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap items-center gap-2 text-2xs font-black uppercase tracking-wider">
          <span className="bg-stone-50 border border-stone-200 text-stone-700 rounded-full px-3 py-1">
            Status: <strong className="text-stone-900 font-extrabold">{businessStatus}</strong>
          </span>
          
          <span className={`rounded-full px-3 py-1 border ${
            verificationStatus === 'Verified'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-150'
              : 'bg-amber-50 text-amber-800 border-amber-150'
          }`}>
            Verification: {verificationStatus}
          </span>

          <span className="text-stone-400 font-bold ml-1 hidden sm:inline">
            Member Since: <strong className="text-stone-700 font-extrabold">{memberSince}</strong>
          </span>
        </div>
      </div>

      {/* Profile strength checker section */}
      <div className="w-full md:w-64 space-y-2 border-t md:border-t-0 md:border-l border-stone-150 pt-4 md:pt-0 md:pl-6">
        <div className="flex justify-between items-center text-xs font-bold text-stone-600">
          <span>Profile Completion</span>
          <span className="font-display font-black text-stone-900">{profileCompletion}%</span>
        </div>

        {/* Progress indicator */}
        <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              profileCompletion < 80 ? 'bg-amber-500' : 'bg-emerald-600'
            }`}
            style={{ width: `${profileCompletion}%` }}
          ></div>
        </div>

        {profileCompletion < 100 && (
          <button
            onClick={onCompleteProfile}
            className="block text-2xs uppercase font-black text-emerald-700 hover:text-emerald-900 transition tracking-wider text-left cursor-pointer"
          >
            Complete profile to unlock direct customer bids &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
