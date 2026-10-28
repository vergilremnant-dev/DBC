import React, { useState } from 'react';
import { LogoutButton } from '../../components/auth/LogoutButton';
import { BrandLogo } from '../../components/common/BrandLogo';

type MobileTab = 'ops' | 'camera' | 'offline' | 'ai';

interface SyncQueueItem {
  id: string;
  type: 'Site Photo' | 'Daily Log' | 'Check-in';
  details: string;
  status: 'Pending Sync' | 'Uploaded';
}

const INITIAL_QUEUE: SyncQueueItem[] = [
  { id: 'q-101', type: 'Site Photo', details: 'Beam reinforcement curing progress', status: 'Pending Sync' },
  { id: 'q-102', type: 'Daily Log', details: 'July 31 rain delays log entry', status: 'Pending Sync' },
];

export function MobilePwaPage() {
  const [activeTab, setActiveTab] = useState<MobileTab>('ops');

  // Network State
  const [isOnline, setIsOnline] = useState(true);

  // Field Operations States
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockLog, setClockLog] = useState<string[]>([]);
  const [dailyLogText, setDailyLogText] = useState('');
  const [safetyCleared, setSafetyCleared] = useState(true);

  // Camera workflows
  const [photosCaptured, setPhotosCaptured] = useState<string[]>([]);
  const [photoCaption, setPhotoCaption] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  // Sync Queue
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(INITIAL_QUEUE);

  // Offline checklist downloads
  const [cachedItems, setCachedItems] = useState<string[]>(['Ground-Excavation-Blueprint.pdf']);

  // Mobile AI Bottom Sheet
  const [aiText, setAiText] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  // Role Session Checks
  const token = localStorage.getItem('token') || globalThis.__accessToken;
  let currentUserRole = 'CUSTOMER';
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserRole = payload.role === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER';
    } catch (e) {
      console.error(e);
    }
  }

  // Toggle Clock-in Clock-out GPS logs
  const handleToggleClock = () => {
    const now = new Date().toLocaleTimeString();
    const lat = (17.3850 + (Math.random() - 0.5) * 0.01).toFixed(4);
    const lng = (78.4867 + (Math.random() - 0.5) * 0.01).toFixed(4);

    if (isClockedIn) {
      setClockLog(prev => [`[Out] ${now} at GPS Lat ${lat}, Lng ${lng}`, ...prev]);
      setIsClockedIn(false);
      
      const newSync: SyncQueueItem = {
        id: `q-${Date.now()}`,
        type: 'Check-in',
        details: `Clocked Out at GPS Lat ${lat}, Lng ${lng}`,
        status: isOnline ? 'Uploaded' : 'Pending Sync',
      };
      setSyncQueue([newSync, ...syncQueue]);
    } else {
      setClockLog(prev => [`[In] ${now} at GPS Lat ${lat}, Lng ${lng}`, ...prev]);
      setIsClockedIn(true);
      
      const newSync: SyncQueueItem = {
        id: `q-${Date.now()}`,
        type: 'Check-in',
        details: `Clocked In at GPS Lat ${lat}, Lng ${lng}`,
        status: isOnline ? 'Uploaded' : 'Pending Sync',
      };
      setSyncQueue([newSync, ...syncQueue]);
    }
  };

  // Submit daily log
  const handleSaveDailyLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyLogText.trim()) return;

    const newSync: SyncQueueItem = {
      id: `q-${Date.now()}`,
      type: 'Daily Log',
      details: dailyLogText.trim() + (safetyCleared ? ' (Safety checklist cleared)' : ''),
      status: isOnline ? 'Uploaded' : 'Pending Sync',
    };

    setSyncQueue([newSync, ...syncQueue]);
    setDailyLogText('');
    alert(isOnline ? 'Daily log uploaded successfully.' : 'Log queued locally for offline sync.');
  };

  // Capture simulated photos
  const handleCaptureSimulated = () => {
    setIsCapturing(true);
    setTimeout(() => {
      const mockPhoto = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80';
      setPhotosCaptured([mockPhoto, ...photosCaptured]);
      
      const newSync: SyncQueueItem = {
        id: `q-${Date.now()}`,
        type: 'Site Photo',
        details: photoCaption.trim() || 'Simulated site snapshot progress',
        status: isOnline ? 'Uploaded' : 'Pending Sync',
      };
      setSyncQueue([newSync, ...syncQueue]);
      setPhotoCaption('');
      setIsCapturing(false);
      alert('Photo captured & processed under compressed size (~240KB).');
    }, 1000);
  };

  // Download for offline caching
  const handleToggleCache = (name: string) => {
    if (cachedItems.includes(name)) {
      setCachedItems(cachedItems.filter(x => x !== name));
      alert(`Removed ${name} from local offline cache storage.`);
    } else {
      setCachedItems([...cachedItems, name]);
      alert(`Cached ${name} locally for offline reading.`);
    }
  };

  // Trigger sync queue execution
  const handleSyncAll = () => {
    if (!isOnline) {
      alert('No network detected. Reconnect to sync outstanding logs.');
      return;
    }
    setSyncQueue(prev => prev.map(item => ({ ...item, status: 'Uploaded' })));
    alert('Synchronized all pending daily logs and captured photos with DBC data warehouse.');
  };

  // Mobile AI query
  const handleAiQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiText.trim()) return;

    setAiResponse('AI Assistant is processing suggestions...');
    setTimeout(() => {
      const textLower = aiText.toLowerCase();
      if (textLower.includes('delay') || textLower.includes('risk')) {
        setAiResponse('[AI Recommendation]: Reorder electrical conduits layout to proceed concurrently with masonry beam framing to save 4 days.');
      } else {
        setAiResponse('[AI Assistant]: Scope looks healthy. Ensure safety checklist is clocked-in before uploading cement deliveries logs.');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-warm-cream text-stone-900 font-sans flex flex-col pb-16 relative">
      
      {/* 1. Header with Offline status indicator */}
      <header className="sticky top-0 z-30 border-b border-light-border bg-white shadow-xs">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <BrandLogo variant="header" />
            <span className="rounded bg-emerald-700 px-2 py-0.5 text-3xs font-black text-white uppercase tracking-wider">
              PWA Mode
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Online/Offline simulator switch */}
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`text-3xs font-black uppercase px-2 py-1 rounded-xl border transition cursor-pointer select-none ${
                isOnline ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'
              }`}
            >
              {isOnline ? '🟢 Online' : '🔴 Offline'}
            </button>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* 2. Sync queue indicators banner */}
      {syncQueue.some(q => q.status === 'Pending Sync') && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex justify-between items-center text-2xs text-amber-800 font-bold max-w-md mx-auto w-full">
          <span>⚡ {syncQueue.filter(q => q.status === 'Pending Sync').length} items awaiting sync queue</span>
          <button
            onClick={handleSyncAll}
            className="underline uppercase tracking-wider text-3xs font-black focus:outline-none"
          >
            Sync Now
          </button>
        </div>
      )}

      {/* 3. Main Operational Content (Phone view constraints: Max width md) */}
      <main className="max-w-md w-full mx-auto px-4 py-6 space-y-6 flex-1 text-left">
        
        {/* Navigation tabs */}
        <section className="flex border border-light-border p-1 bg-white rounded-2xl shadow-xs">
          {([
            { id: 'ops', label: 'Field Ops', icon: '👷' },
            { id: 'camera', label: 'Site Photo', icon: '📷' },
            { id: 'offline', label: 'Offline Files', icon: '📁' },
            { id: 'ai', label: 'Smart AI', icon: '🤖' },
          ] as const).map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 text-center py-2.5 rounded-xl text-3xs font-black uppercase tracking-wider transition cursor-pointer select-none
                  ${isActive ? 'bg-light-stone text-stone-black shadow-xs font-extrabold' : 'text-stone-gray'}
                `}
              >
                <span>{t.icon}</span>
                <span className="block mt-0.5">{t.label}</span>
              </button>
            );
          })}
        </section>

        {/* FIELD OPERATIONS */}
        {activeTab === 'ops' && (
          <div className="space-y-6">
            
            {/* Clock-in Clock-out */}
            <div className="dbc-card space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">GPS Site Check-In</h3>
                <span className={`dbc-badge text-3xs py-0.5 ${isClockedIn ? 'dbc-badge-completed' : 'dbc-badge-planning'}`}>
                  {isClockedIn ? 'Active Onsite' : 'Clocked Out'}
                </span>
              </div>

              <p className="text-2xs text-stone-gray font-semibold leading-relaxed">
                Check in to verify location geofences and log work hour records on project contracts.
              </p>

              <button
                onClick={handleToggleClock}
                className={`w-full dbc-btn py-3 text-xs font-bold uppercase tracking-wider cursor-pointer ${
                  isClockedIn ? 'dbc-btn-danger' : 'dbc-btn-primary'
                }`}
              >
                {isClockedIn ? 'Clock Out of Site' : 'Clock In to Site'}
              </button>

              {/* Logs */}
              {clockLog.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-light-border/40 text-3xs font-mono text-stone-gray">
                  {clockLog.slice(0, 3).map((log, i) => (
                    <p key={i}>{log}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Daily log composer */}
            {currentUserRole === 'PROVIDER' && (
              <form onSubmit={handleSaveDailyLog} className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Record Daily Log</h3>
                
                <textarea
                  placeholder="Type workers present, materials delivered, progress notes..."
                  value={dailyLogText}
                  onChange={(e) => setDailyLogText(e.target.value)}
                  className="dbc-input h-20 resize-none text-xs"
                  required
                />

                <label className="flex items-center gap-2 text-xs font-semibold text-stone-gray cursor-pointer">
                  <input
                    type="checkbox"
                    checked={safetyCleared}
                    onChange={() => setSafetyCleared(!safetyCleared)}
                    className="w-4 h-4 rounded text-brand-emerald focus:ring-brand-emerald"
                  />
                  <span>Clear safety inspection checklists</span>
                </label>

                <button type="submit" className="w-full dbc-btn dbc-btn-primary py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer">
                  Save Log Entry
                </button>
              </form>
            )}

            {/* Sync status stream */}
            <div className="dbc-card space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Synchronization Queue</h3>
              <div className="divide-y divide-light-border/40">
                {syncQueue.map((item) => (
                  <div key={item.id} className="py-2.5 flex justify-between items-center text-2xs text-stone-gray font-semibold">
                    <div>
                      <strong className="text-stone-black">{item.type}</strong>: {item.details}
                    </div>
                    <span className={`dbc-badge text-3xs py-0.5 uppercase ${
                      item.status === 'Uploaded' ? 'dbc-badge-completed' : 'dbc-badge-priority'
                    }`}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* CAMERA WORKFLOWS */}
        {activeTab === 'camera' && (
          <div className="dbc-card space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Site Photo Capture</h3>
            
            {/* Simulated camera view */}
            <div className="w-full bg-stone-900 aspect-video rounded-2xl flex flex-col justify-center items-center text-white relative overflow-hidden">
              {isCapturing ? (
                <div className="text-xs font-black animate-ping text-brand-emerald">COMPRESSING IMAGE FILE...</div>
              ) : (
                <>
                  <span className="text-3xl">📷</span>
                  <span className="text-3xs font-black uppercase tracking-widest text-stone-300 mt-2">Simulated camera viewport active</span>
                </>
              )}
            </div>

            <input
              type="text"
              placeholder="Caption (e.g. beam moisture levels check)"
              value={photoCaption}
              onChange={(e) => setPhotoCaption(e.target.value)}
              className="dbc-input text-xs"
            />

            <button
              onClick={handleCaptureSimulated}
              className="w-full dbc-btn dbc-btn-primary py-3 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Trigger Camera Capture
            </button>

            {/* Captured Photos Grid */}
            {photosCaptured.length > 0 && (
              <div className="pt-4 border-t border-light-border/40 space-y-3">
                <span className="block text-3xs font-black uppercase tracking-widest text-stone-gray">Captured Site Files</span>
                <div className="grid grid-cols-3 gap-2">
                  {photosCaptured.map((ph, idx) => (
                    <img
                      key={idx}
                      src={ph}
                      alt="Capture preview"
                      className="w-full h-16 object-cover rounded-lg border border-light-border"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* OFFLINE FILES CHECKLIST */}
        {activeTab === 'offline' && (
          <div className="dbc-card space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Offline Document Storage</h3>
            <p className="text-2xs text-stone-gray font-semibold leading-relaxed">
              Mark critical contracts and blueprint CAD plans to store them in your local browser Cache API for offline reading on construction sites.
            </p>

            <div className="space-y-3 pt-2">
              {['Ground-Excavation-Blueprint.pdf', 'Plumbing-Conduits-Layout.dwg', 'Mediation-Escrow-Agreement.pdf'].map((doc) => {
                const isCached = cachedItems.includes(doc);
                return (
                  <div key={doc} className="p-3 bg-light-stone/20 border border-light-border rounded-xl flex justify-between items-center text-xs">
                    <span className="font-bold text-stone-black truncate pr-3">📄 {doc}</span>
                    <button
                      onClick={() => handleToggleCache(doc)}
                      className={`text-3xs font-black uppercase focus:outline-none ${
                        isCached ? 'text-rose-600' : 'text-brand-emerald'
                      }`}
                    >
                      {isCached ? 'Remove' : 'Download Cache'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SMART AI MOBILE SHEET */}
        {activeTab === 'ai' && (
          <div className="dbc-card space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Mobile AI Assistant</h3>
            
            <div className="p-4 bg-light-stone/20 border border-light-border rounded-2xl min-h-24 text-xs font-semibold text-stone-gray leading-relaxed">
              {aiResponse || 'DBC Mobile AI is active. Enter prompts below to optimize structural timelines or check safety codes.'}
            </div>

            <form onSubmit={handleAiQuery} className="flex gap-2">
              <input
                type="text"
                placeholder="Ask about project risks..."
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                className="flex-1 bg-light-stone/40 border border-light-border rounded-xl px-3 py-2 text-xs text-stone-black focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald"
              />
              <button type="submit" className="dbc-btn dbc-btn-primary px-4 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                Ask
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}
export default MobilePwaPage;
