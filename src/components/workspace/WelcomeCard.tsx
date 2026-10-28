interface WelcomeCardProps {
  name: string;
  completionPercentage: number;
  onCompleteProfile: () => void;
}

export function WelcomeCard({ name, completionPercentage, onCompleteProfile }: WelcomeCardProps) {
  const isComplete = completionPercentage >= 100;

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 text-left transition duration-200">
      
      {/* Greeting info */}
      <div className="space-y-1.5 flex-1">
        <h2 className="text-xl font-bold text-stone-900 font-display leading-tight">
          Welcome back, {name || 'Client'}
        </h2>
        <p className="text-xs text-stone-500 font-medium leading-relaxed max-w-xl">
          Here's what's happening with your project requests and active projects.
        </p>
      </div>

      {/* Profile Completion Indicator */}
      <div className="flex items-center gap-4 bg-stone-50 border border-stone-150 rounded-xl p-3.5 flex-shrink-0">
        
        {/* Radial Circular Progress */}
        <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="#e7e5e4"
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="#047857"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - completionPercentage / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-2xs font-black text-stone-900">
            {completionPercentage}%
          </span>
        </div>

        {/* Text and Action */}
        <div className="space-y-0.5">
          <span className="block text-3xs uppercase font-black text-stone-400 tracking-wider">Profile Setup</span>
          <span className="block text-xs font-bold text-stone-700">
            {isComplete ? 'Verification Completed' : 'Profile Incomplete'}
          </span>
          {!isComplete && (
            <button
              onClick={onCompleteProfile}
              className="text-2xs font-black text-emerald-700 hover:text-emerald-800 hover:underline transition uppercase tracking-wider block focus:outline-none"
            >
              Complete Profile →
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
