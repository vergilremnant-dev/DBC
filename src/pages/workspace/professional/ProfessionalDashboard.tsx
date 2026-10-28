import { useState, useEffect } from 'react';
import ConsultantDashboard from '../consultant/ConsultantDashboard';
import TradeProfessionalDashboard from './TradeProfessionalDashboard';

export default function ProfessionalDashboard() {
  // Local storage mode switcher to sync views across pages
  const [workspaceView, setWorkspaceView] = useState<'PRO' | 'CONSULTANT'>(() => {
    return (localStorage.getItem('dbc_provider_view') as 'PRO' | 'CONSULTANT') || 'PRO';
  });

  useEffect(() => {
    localStorage.setItem('dbc_provider_view', workspaceView);
    // Dispatch storage event to notify other open workspace components
    window.dispatchEvent(new Event('storage'));
  }, [workspaceView]);

  if (workspaceView === 'CONSULTANT') {
    return (
      <div className="space-y-6 text-left">
        {/* Workspace view switcher header banner */}
        <div className="bg-white border border-light-border rounded-3xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-apple-sm">
          <div className="space-y-0.5">
            <span className="text-3xs font-black uppercase text-stone-gray tracking-wider">Workspace Operating Mode</span>
            <h3 className="text-xs font-black text-stone-black">
              Currently displaying Consultant Advisor Console
            </h3>
          </div>
          <div className="flex border border-light-border p-1 rounded-xl bg-light-stone/30">
            <button
              onClick={() => setWorkspaceView('PRO')}
              className="px-3 py-1.5 rounded-lg text-3xs font-black uppercase tracking-wider transition cursor-pointer text-stone-gray hover:text-stone-black"
            >
              Trade Pro
            </button>
            <button
              onClick={() => setWorkspaceView('CONSULTANT')}
              className="px-3 py-1.5 rounded-lg text-3xs font-black uppercase tracking-wider transition cursor-pointer bg-stone-black text-white shadow-xs"
            >
              Consultant
            </button>
          </div>
        </div>

        <ConsultantDashboard />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left relative pb-10 animate-gentle-fade">
      
      {/* Workspace view switcher header banner */}
      <div className="bg-white border border-light-border rounded-3xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-apple-sm">
        <div className="space-y-0.5">
          <span className="text-3xs font-black uppercase text-stone-gray tracking-wider">Workspace Operating Mode</span>
          <h3 className="text-xs font-black text-stone-black">
            Currently displaying Trade Partner Workspace
          </h3>
        </div>
        <div className="flex border border-light-border p-1 rounded-xl bg-light-stone/30">
          <button
            onClick={() => setWorkspaceView('PRO')}
            className="px-3 py-1.5 rounded-lg text-3xs font-black uppercase tracking-wider transition cursor-pointer bg-stone-black text-white shadow-xs"
          >
            Trade Pro
          </button>
          <button
            onClick={() => setWorkspaceView('CONSULTANT')}
            className="px-3 py-1.5 rounded-lg text-3xs font-black uppercase tracking-wider transition cursor-pointer text-stone-gray hover:text-stone-black"
          >
            Consultant
          </button>
        </div>
      </div>

      <TradeProfessionalDashboard />
    </div>
  );
}
