interface ProfileCompletionStatusProps {
  percentage: number;
  missingFields: string[];
}

export function ProfileCompletionStatus({ percentage, missingFields }: ProfileCompletionStatusProps) {
  return (
    <section className="rounded-xl border border-stone-200 bg-stone-50/50 p-5 space-y-3">
      <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-stone-600">
        <h4 className="font-display text-stone-900 text-sm normal-case">Profile Completeness Status</h4>
        <span className="text-emerald-850 font-extrabold text-sm">{percentage}%</span>
      </div>
      
      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-emerald-700 h-full rounded-full transition-all duration-500" 
          style={{ width: `${percentage}%` }}
        />
      </div>

      {missingFields.length > 0 ? (
        <div className="text-2xs text-amber-800 font-semibold space-y-1 pt-1">
          <p className="font-bold uppercase tracking-wider text-3xs text-stone-500">Missing required profile inputs:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {missingFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-2xs text-emerald-800 font-bold">✓ Profile is fully complete and active!</p>
      )}
    </section>
  );
}
