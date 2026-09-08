import { useState } from 'react';

interface WelcomeScreenProps {
  user: {
    firstName?: string;
    email: string;
    role: string;
  } | null;
  onCompleteOnboarding: () => void;
}

export function WelcomeScreen({ user, onCompleteOnboarding }: WelcomeScreenProps) {
  const [selectedIntent, setSelectedIntent] = useState<string>('architecture');
  const [locationCity, setLocationCity] = useState<string>('');
  const [timeline, setTimeline] = useState<string>('immediate');
  const [progress, setProgress] = useState(40);
  const [completedSteps, setCompletedSteps] = useState<string[]>(['profile_created']);

  const isCustomer = !user?.role || user.role.toUpperCase().includes('CUSTOMER');

  const PROJECT_INTENTS = [
    { id: 'architecture', label: 'Architecture & Design', icon: '📐', desc: 'Floor plans, 3D layouts, elevations' },
    { id: 'construction', label: 'New Construction', icon: '🏗️', desc: 'Full turnkey home or commercial build' },
    { id: 'renovation', label: 'Renovation & Remodel', icon: '🔨', desc: 'Structural updates, additions, remodels' },
    { id: 'interior', label: 'Interior Design', icon: '🎨', desc: 'Furnishing, cabinetry, lighting plans' },
    { id: 'civil', label: 'Civil & Structural', icon: '🧱', desc: 'Foundation, beam design, structural audit' },
    { id: 'mep', label: 'Electrical & Plumbing', icon: '⚡', desc: 'Wiring, piping, HVAC layouts' },
  ];

  const getRoleConfig = () => {
    if (!user) return { title: 'User', actions: [] };
    const norm = user.role.toUpperCase();
    if (norm.includes('PROVIDER')) {
      return {
        title: 'Trade Partner / Consultant',
        actions: [
          { id: 'profile_created', label: 'Verify Credentials & Account Setup', done: true },
          { id: 'portfolio', label: 'Upload past layout drawing portfolios', done: false },
          { id: 'availability', label: 'Set weekly consultation schedules', done: false },
          { id: 'rates', label: 'Configure consultation session rates', done: false },
        ]
      };
    }
    if (norm.includes('ADMIN')) {
      return {
        title: 'System Administrator',
        actions: [
          { id: 'profile_created', label: 'Admin credentials active', done: true },
          { id: 'overview', label: 'Complete dashboard overview audit', done: false },
          { id: 'onboard_logs', label: 'Check pending provider registration lists', done: false },
        ]
      };
    }
    return {
      title: 'Project Client',
      actions: [
        { id: 'profile_created', label: 'Account created', done: true },
        { id: 'intent_selected', label: 'Select project intent & scope', done: false },
        { id: 'first_req', label: 'Post your first requirement or request quote', done: false },
      ]
    };
  };

  const { title, actions } = getRoleConfig();

  const handleToggleStep = (stepId: string) => {
    if (stepId === 'profile_created') return;
    let nextSteps;
    if (completedSteps.includes(stepId)) {
      nextSteps = completedSteps.filter((s) => s !== stepId);
    } else {
      nextSteps = [...completedSteps, stepId];
    }
    setCompletedSteps(nextSteps);
    const pct = Math.round((nextSteps.length / actions.length) * 100);
    setProgress(pct);
  };

  const handleSaveAndContinue = () => {
    if (isCustomer) {
      localStorage.setItem('dbc_customer_intent', JSON.stringify({
        intent: selectedIntent,
        location: locationCity,
        timeline,
        updatedAt: new Date().toISOString(),
      }));
    }
    onCompleteOnboarding();
  };

  return (
    <div className="space-y-6 text-left animate-gentle-fade bg-arch-grid p-6 border border-light-border bg-white rounded-3xl shadow-apple-sm">
      
      {/* Welcome Greeting */}
      <div className="space-y-2 border-b border-light-border pb-4">
        <span className="dbc-badge dbc-badge-verified">Welcome to DBC</span>
        <h3 className="text-sm font-black uppercase tracking-wider text-stone-black leading-tight">
          Hello, {user?.firstName || user?.email || 'Partner'}!
        </h3>
        <span className="block text-[8px] font-black uppercase bg-light-stone text-stone-gray px-2 py-0.5 rounded border border-light-border max-w-max">
          Active Role: {title}
        </span>
      </div>

      {isCustomer ? (
        /* CUSTOMER ONBOARDING: PROJECT INTENT & SCOPE SELECTION */
        <div className="space-y-5">
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-stone-black">What is your primary project focus?</h4>
            <p className="text-[10px] text-stone-gray font-medium">Select your current project type to personalize your workspace discovery experience.</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {PROJECT_INTENTS.map((item) => {
              const isSelected = selectedIntent === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedIntent(item.id)}
                  className={`p-3 rounded-xl border flex flex-col justify-between transition cursor-pointer select-none
                    ${isSelected
                      ? 'bg-emerald-50/50 border-brand-emerald ring-1 ring-brand-emerald shadow-apple-sm'
                      : 'bg-white border-light-border hover:border-stone-400'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.icon}</span>
                    <span className={`text-[11px] font-bold ${isSelected ? 'text-emerald-900' : 'text-stone-black'}`}>
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[8.5px] text-stone-gray mt-1 font-medium leading-tight">{item.desc}</span>
                </div>
              );
            })}
          </div>

          {/* Lightweight Optional Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-light-border/40">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-stone-gray block">Project Location (City / Region)</label>
              <input
                type="text"
                placeholder="e.g. Hyderabad, Bengaluru, Mumbai"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-light-border rounded-lg focus:outline-none focus:border-brand-emerald"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase tracking-wider text-stone-gray block">Estimated Start Timeline</label>
              <select
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-light-border rounded-lg focus:outline-none focus:border-brand-emerald bg-white"
              >
                <option value="immediate">Immediate (Within 1 Month)</option>
                <option value="1_3_months">1 - 3 Months</option>
                <option value="planning">Planning Phase (3+ Months)</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        /* PROVIDER / ADMIN SETUP CHECKLIST */
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-stone-gray">
              <span>Onboarding Setup Progress</span>
              <span>{progress}% Complete</span>
            </div>
            <div className="dbc-progress-bar">
              <div className="dbc-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="space-y-2">
            {actions.map((act) => {
              const isDone = completedSteps.includes(act.id);
              return (
                <div
                  key={act.id}
                  onClick={() => handleToggleStep(act.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer select-none
                    ${isDone 
                      ? 'bg-light-stone/30 border-light-border opacity-70' 
                      : 'bg-white border-light-border hover:border-brand-emerald hover:shadow-apple-sm'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-black
                      ${isDone 
                        ? 'border-brand-emerald bg-brand-emerald/10 text-brand-emerald' 
                        : 'border-light-border text-transparent'
                      }
                    `}>
                      ✓
                    </span>
                    <span className={`text-[11px] font-semibold ${isDone ? 'line-through text-stone-gray' : 'text-stone-black'}`}>
                      {act.label}
                    </span>
                  </div>
                  <span className="text-[8px] text-stone-gray font-black uppercase tracking-wider">
                    {isDone ? 'DONE' : 'TODO'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Finalize onboarding with Non-Coercive Skip / Continue Actions */}
      <div className="pt-4 border-t border-light-border/40 flex justify-between items-center gap-3">
        <button
          type="button"
          onClick={onCompleteOnboarding}
          className="text-stone-500 hover:text-stone-900 text-xs font-semibold hover:underline cursor-pointer focus:outline-none"
        >
          Skip for now
        </button>
        <button
          type="button"
          onClick={handleSaveAndContinue}
          className="dbc-btn dbc-btn-primary py-2.5 px-5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
        >
          Enter Workspace →
        </button>
      </div>

    </div>
  );
}
