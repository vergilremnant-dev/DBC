import React, { useState, useEffect, useMemo, startTransition } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// ==========================================
// Types & Interfaces
// ==========================================
type WorkspaceTab = 'overview' | 'notes' | 'recommendations' | 'documents' | 'activity' | 'private' | 'checklist';

interface DocumentFile {
  id: string;
  name: string;
  category: string;
  size: string;
  uploadDate: string;
}

interface ActivityEvent {
  id: string;
  description: string;
  timestamp: string;
  icon: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export default function ConsultationWorkspace() {
  const { id = 'CS-401' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  
  // Status management
  const [status, setStatus] = useState<'Pending' | 'Scheduled' | 'In Progress' | 'Awaiting Customer' | 'Completed' | 'Cancelled'>('Scheduled');
  
  // Autosave simulator states
  const [notes, setNotes] = useState('## Villa Orientation Structural Consultation Notes\n\n- Verified that the client requires 3BHK spatial planning review.\n- Checked kitchen offset boundaries.\n- Identified Vastu doorway adjustments for the North-East corner.');
  const [notesSearch, setNotesSearch] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [lastSavedNotes, setLastSavedNotes] = useState<string>('Just now');

  const [privateNotes, setPrivateNotes] = useState('Client seemed concerned about pile foundation costs.');
  const [isSavingPrivate, setIsSavingPrivate] = useState(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState([
    { category: 'Design Suggestion', text: 'Relocate balcony entry to optimize North-East natural daylight coordinates.' },
    { category: 'Material Suggestion', text: 'Recommend using AAC blocks for interior partitions to minimize concrete structural dead load.' }
  ]);
  const [newRecommendation, setNewRecommendation] = useState('');
  const [newRecCategory, setNewRecCategory] = useState('Design Suggestion');

  // Documents state
  const [documents, setDocuments] = useState<DocumentFile[]>([
    { id: 'doc-1', name: 'Structural_Blueprint_Draft.pdf', category: 'Blueprint', size: '4.8 MB', uploadDate: '01-Aug-2026' },
    { id: 'doc-2', name: 'Soil_Test_Report.pdf', category: 'Geotechnical', size: '2.3 MB', uploadDate: '01-Aug-2026' }
  ]);

  // Activity list
  const [activities, setActivities] = useState<ActivityEvent[]>([
    { id: 'act-1', description: 'Requirement updated by Ramesh Kumar', timestamp: '2 hours ago', icon: '📝' },
    { id: 'act-2', description: 'Document uploaded: Soil_Test_Report.pdf', timestamp: '4 hours ago', icon: '📁' },
    { id: 'act-3', description: 'Consultation accepted by John Anderson', timestamp: '1 day ago', icon: '✅' },
  ]);

  // Checklist state
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 'chk-1', label: 'Requirement Details Reviewed', completed: true },
    { id: 'chk-2', label: 'Uploaded Documents Verified', completed: true },
    { id: 'chk-3', label: 'Consultation Call Conducted', completed: false },
    { id: 'chk-4', label: 'Recommendations Formulated', completed: false },
    { id: 'chk-5', label: 'Follow-up Session Scheduled', completed: false },
    { id: 'chk-6', label: 'Final Completion Confirmed', completed: false },
  ]);

  // Simulate startup load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 750);
    return () => clearTimeout(timer);
  }, []);

  // Autosave simulator hooks
  useEffect(() => {
    if (isLoading) return;
    startTransition(() => {
      setIsSavingNotes(true);
    });
    const saveTimer = setTimeout(() => {
      startTransition(() => {
        setIsSavingNotes(false);
        const time = new Date().toLocaleTimeString();
        setLastSavedNotes(`Saved at ${time}`);
      });
    }, 600);
    return () => clearTimeout(saveTimer);
  }, [notes, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    startTransition(() => {
      setIsSavingPrivate(true);
    });
    const saveTimer = setTimeout(() => {
      startTransition(() => {
        setIsSavingPrivate(false);
      });
    }, 500);
    return () => clearTimeout(saveTimer);
  }, [privateNotes, isLoading]);

  // Checklist progression percentage
  const checklistProgress = useMemo(() => {
    const completed = checklist.filter(c => c.completed).length;
    return Math.round((completed / checklist.length) * 100);
  }, [checklist]);

  const toggleChecklist = (itemId: string) => {
    setChecklist(prev => prev.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item));
  };

  const handleAddRecommendation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecommendation.trim()) return;
    setRecommendations(prev => [...prev, { category: newRecCategory, text: newRecommendation.trim() }]);
    setNewRecommendation('');
    
    // Log Activity
    setActivities(prev => [
      { id: `act-${Date.now()}`, description: `New Recommendation added: ${newRecommendation.trim().substring(0, 30)}...`, timestamp: 'Just now', icon: '💡' },
      ...prev
    ]);
  };

  const handleFileUpload = () => {
    const newDoc: DocumentFile = {
      id: `doc-${Date.now()}`,
      name: 'Client_Notes_Addendum.pdf',
      category: 'Addendum',
      size: '1.2 MB',
      uploadDate: new Date().toLocaleDateString('en-IN')
    };
    setDocuments(prev => [...prev, newDoc]);
    setActivities(prev => [
      { id: `act-${Date.now()}`, description: `Document uploaded: ${newDoc.name}`, timestamp: 'Just now', icon: '📁' },
      ...prev
    ]);
    alert('Mock document uploaded successfully.');
  };

  if (isLoading) {
    return <SkeletonWorkspace />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 text-left animate-gentle-fade select-none">
      
      {/* 1. Header Section */}
      <header className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm relative space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-stone-100 text-stone-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                ID: {id}
              </span>
              <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                status === 'Completed' ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-800'
              }`}>
                {status}
              </span>
              <span className="bg-rose-50 border border-rose-200 text-[8px] font-black px-2 py-0.5 rounded-full uppercase text-rose-700">
                ⚠️ High Priority
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 font-serif leading-tight">
              Villa Spatial Orientation & Design Consultation
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              Client: <strong>Ramesh Kumar</strong> &bull; Category: Architecture &bull; Location: Hyderabad
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatus('In Progress')}
              disabled={status === 'In Progress' || status === 'Completed'}
              className="dbc-btn dbc-btn-md dbc-btn-primary"
            >
              Start Consultation
            </button>
            <button
              onClick={() => setStatus('Completed')}
              disabled={status === 'Completed'}
              className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
            >
              Complete Consultation
            </button>
            <button
              onClick={() => navigate('/workspace/leads')}
              className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
            >
              Exit Workspace
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-light-border/40 text-[10px] font-bold text-stone-450 uppercase tracking-wider">
          <div>
            <span className="block text-stone-400 text-[8px]">Budget Estimate</span>
            <span className="text-stone-900 font-black text-xs">₹45,000</span>
          </div>
          <div>
            <span className="block text-stone-400 text-[8px]">Scheduled Time</span>
            <span className="text-stone-900 font-black text-xs">03-Aug &bull; 10:00 AM</span>
          </div>
          <div>
            <span className="block text-stone-400 text-[8px]">Consultation Mode</span>
            <span className="text-stone-900 font-black text-xs">🖥️ Video Call</span>
          </div>
          <div>
            <span className="block text-stone-400 text-[8px]">Completion Checklist</span>
            <span className="text-brand-emerald font-black text-xs">{checklistProgress}% ({checklist.filter(c => c.completed).length}/6)</span>
          </div>
        </div>
      </header>

      {/* Two-Column Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Core Brief Summaries & Tabs */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Customer & Requirement Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Customer Summary */}
            <div className="bg-white border border-light-border p-5 rounded-3xl shadow-apple-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-emerald text-white font-black flex items-center justify-center text-sm uppercase">
                  RK
                </div>
                <div>
                  <h4 className="text-xs font-black text-stone-900">Ramesh Kumar</h4>
                  <span className="text-[9px] text-stone-450 font-bold uppercase">Member since June 2026</span>
                </div>
              </div>
              <div className="space-y-1.5 text-[10.5px] text-stone-600 font-medium">
                <p>📞 <strong>Phone:</strong> +91 98765 43210</p>
                <p>✉️ <strong>Email:</strong> ramesh.kumar@example.com</p>
                <p>📍 <strong>Project Location:</strong> Gachibowli, Hyderabad</p>
                <p>⭐ <strong>Rating:</strong> 4.85 / 5 (3 previous bookings)</p>
              </div>
            </div>

            {/* Requirement Summary */}
            <div className="bg-white border border-light-border p-5 rounded-3xl shadow-apple-sm space-y-3">
              <div>
                <span className="text-[8px] font-black uppercase text-stone-450 tracking-wider">Project Specification</span>
                <h4 className="text-xs font-black text-stone-900">Modern Villa Vastu Alignment</h4>
              </div>
              <p className="text-[10.5px] text-stone-600 font-medium leading-relaxed">
                Evaluating load-bearing capacity of design layouts and Vastu placement compliance for a modern 4BHK villa blueprints.
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-stone-450 font-bold uppercase tracking-wider pt-2 border-t border-light-border/40">
                <span>Timeline: 2 Weeks</span>
                <span>Docs: {documents.length} Files</span>
              </div>
            </div>

          </div>

          {/* Project Timeline Milestones visualizer */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-900">Consultation Milestones Progress</h3>
            <div className="flex flex-wrap items-center gap-3 text-[9px] font-black uppercase tracking-wider">
              {[
                { name: 'Submitted', done: true },
                { name: 'Accepted', done: true },
                { name: 'Scheduled', done: true },
                { name: 'Started', done: status === 'In Progress' || status === 'Completed' },
                { name: 'Completed', done: status === 'Completed' },
              ].map((stage, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded border transition ${
                    stage.done 
                      ? 'bg-brand-emerald border-brand-emerald text-white' 
                      : 'bg-stone-50 border-stone-200 text-stone-400'
                  }`}>
                    {stage.name}
                  </span>
                  {idx < 4 && <span className="text-stone-300">&rarr;</span>}
                </div>
              ))}
            </div>
          </section>

          {/* Interactive Workspace Tabs Panel */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-6">
            <div className="flex gap-2 border-b border-stone-200 overflow-x-auto pb-1.5 text-[9.5px] font-black uppercase tracking-wider no-scrollbar">
              {([
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'notes', label: 'Consultation Notes', icon: '📝' },
                { id: 'recommendations', label: 'Recommendations', icon: '💡' },
                { id: 'documents', label: 'Documents', icon: '📁' },
                { id: 'activity', label: 'Activity Timeline', icon: '⏳' },
                { id: 'private', label: 'Private Notes', icon: '🔒' },
                { id: 'checklist', label: 'Checklist', icon: '✅' },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 border-b-2 font-bold transition whitespace-nowrap cursor-pointer select-none ${
                    activeTab === tab.id
                      ? 'border-emerald-600 text-emerald-800 font-extrabold'
                      : 'border-transparent text-stone-500 hover:text-stone-900'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="ml-1.5">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4 text-stone-700 text-xs font-medium leading-relaxed">
                <div>
                  <h4 className="font-black text-stone-900 uppercase text-[10px]">Project Overview</h4>
                  <p>Evaluating design layout drafts for structural safety constraints prior to filing municipal applications.</p>
                </div>
                <div>
                  <h4 className="font-black text-stone-900 uppercase text-[10px]">Consultation Goals</h4>
                  <ul className="list-disc pl-4 space-y-1 mt-1">
                    <li>Confirm load-bearing limits for ground foundation slab.</li>
                    <li>Audit Vastu corners alignment for kitchen location.</li>
                    <li>Recommend concrete structural grade requirements.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-black text-stone-900 uppercase text-[10px]">Key Challenges</h4>
                  <p className="italic text-stone-500">Soil type is black cotton clay, which might require raft layout stabilization check overlays.</p>
                </div>
              </div>
            )}

            {/* TAB 2: CONSULTATION NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] text-stone-400 font-semibold">
                  <span>Last autosaved: {lastSavedNotes}</span>
                  {isSavingNotes && <span className="text-brand-emerald animate-pulse">Saving...</span>}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search within notes..."
                    value={notesSearch}
                    onChange={e => setNotesSearch(e.target.value)}
                    className="dbc-input text-xs"
                  />
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Draft structured advice here..."
                  className="dbc-input font-mono h-48 resize-none"
                />
              </div>
            )}

            {/* TAB 3: RECOMMENDATIONS */}
            {activeTab === 'recommendations' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                      <span className="text-[8px] font-black text-brand-emerald uppercase tracking-wider">{rec.category}</span>
                      <p className="text-xs text-stone-700 font-medium">{rec.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddRecommendation} className="space-y-3 pt-4 border-t border-light-border/40">
                  <h4 className="text-[10px] font-black uppercase text-stone-850">Add Recommendation Advice</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={newRecCategory}
                      onChange={e => setNewRecCategory(e.target.value)}
                      className="dbc-input bg-white py-1.5 px-3"
                    >
                      <option value="Design Suggestion">Design Suggestion</option>
                      <option value="Material Suggestion">Material Suggestion</option>
                      <option value="Cost Optimization">Cost Optimization</option>
                    </select>
                    <input
                      type="text"
                      placeholder="e.g. Relocate kitchen entryway..."
                      value={newRecommendation}
                      onChange={e => setNewRecommendation(e.target.value)}
                      className="col-span-2 dbc-input"
                      required
                    />
                  </div>
                  <button type="submit" className="dbc-btn dbc-btn-md dbc-btn-primary">
                    Add Advice
                  </button>
                </form>
              </div>
            )}

            {/* TAB 4: DOCUMENTS */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-stone-400 font-bold uppercase">{documents.length} Attachments</span>
                  <button
                    onClick={handleFileUpload}
                    className="dbc-btn dbc-btn-sm dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
                  >
                    Upload Document
                  </button>
                </div>
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div key={doc.id} className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <h5 className="font-bold text-stone-900">{doc.name}</h5>
                        <span className="block text-[8px] text-stone-400 font-bold uppercase mt-1">
                          {doc.category} &bull; {doc.size} &bull; Uploaded: {doc.uploadDate}
                        </span>
                      </div>
                      <button
                        onClick={() => alert(`Downloading file: ${doc.name}`)}
                        className="text-brand-emerald font-black uppercase text-[10px] hover:underline"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: ACTIVITY TIMELINE */}
            {activeTab === 'activity' && (
              <div className="space-y-4 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-px before:bg-light-border">
                {activities.map(act => (
                  <div key={act.id} className="flex gap-4 items-start relative">
                    <span className="w-10 h-10 rounded-full border border-light-border bg-stone-50 flex items-center justify-center text-sm shrink-0 z-10">{act.icon}</span>
                    <div className="space-y-0.5 pt-1">
                      <p className="text-[11px] text-stone-850 font-semibold">{act.description}</p>
                      <span className="block text-[9px] text-stone-400 font-bold uppercase tracking-wider">{act.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 6: PRIVATE NOTES */}
            {activeTab === 'private' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] text-stone-400 font-semibold">
                  <span>🔒 Only visible to you. Never shared with client.</span>
                  {isSavingPrivate && <span className="text-brand-emerald animate-pulse">Saving...</span>}
                </div>
                <textarea
                  value={privateNotes}
                  onChange={e => setPrivateNotes(e.target.value)}
                  placeholder="Write internal review thoughts..."
                  className="dbc-input h-32 resize-none"
                />
              </div>
            )}

            {/* TAB 7: CHECKLIST */}
            {activeTab === 'checklist' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] text-stone-400 font-bold uppercase">
                  <span>Task Checklist Completion</span>
                  <span>{checklistProgress}%</span>
                </div>
                <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-brand-emerald h-full transition-all duration-300" style={{ width: `${checklistProgress}%` }}></div>
                </div>
                <div className="space-y-2 mt-4">
                  {checklist.map(item => (
                    <label key={item.id} className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-100 transition text-xs font-semibold text-stone-800">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleChecklist(item.id)}
                        className="dbc-checkbox"
                      />
                      <span className={item.completed ? 'line-through text-stone-400' : ''}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </section>

        </div>

        {/* Right Column: Sidebar Actions & Smart Assistant */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Smart Assistant Placeholder */}
          <section className="bg-gradient-to-br from-stone-950 to-stone-900 border border-stone-850 p-6 rounded-3xl shadow-apple-sm text-white space-y-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <div className="space-y-0.5">
              <span className="text-[8.5px] font-black uppercase text-emerald-400 tracking-wider">DBC Smart Assistant</span>
              <h3 className="text-xs font-black">Workspace Suggestions</h3>
            </div>
            <ul className="space-y-2 text-[10px] text-stone-300 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✦</span>
                <span>Review uploaded foundation blueprints.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✦</span>
                <span>Prepare structural load limits cost recommendations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✦</span>
                <span>Confirm scheduled Video meeting with customer.</span>
              </li>
            </ul>
          </section>

          {/* Quick Actions Panel */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div>
              <h2 className="text-sm font-black text-stone-900">Workspace Actions</h2>
              <p className="text-[11px] text-stone-450 font-medium">Direct workspace functions</p>
            </div>
            <div className="space-y-2 text-[11px] font-bold uppercase tracking-wider text-stone-700">
              <button
                onClick={() => navigate('/workspace/report/RP-501')}
                className="w-full p-3 bg-brand-emerald text-white hover:bg-emerald-850 hover:bg-emerald-800 rounded-xl transition text-left cursor-pointer flex items-center gap-2.5 focus:outline-none"
              >
                <span>📄</span> Open Report Editor &rarr;
              </button>
              <button
                onClick={handleFileUpload}
                className="w-full p-3 bg-stone-50 hover:bg-warm-cream border border-stone-200 hover:border-stone-300 rounded-xl transition text-left cursor-pointer flex items-center gap-2.5 focus:outline-none"
              >
                <span>📁</span> Upload Document
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className="w-full p-3 bg-stone-50 hover:bg-warm-cream border border-stone-200 hover:border-stone-300 rounded-xl transition text-left cursor-pointer flex items-center gap-2.5 focus:outline-none"
              >
                <span>📝</span> Add Consultation Note
              </button>
              <button
                onClick={() => setActiveTab('recommendations')}
                className="w-full p-3 bg-stone-50 hover:bg-warm-cream border border-stone-200 hover:border-stone-300 rounded-xl transition text-left cursor-pointer flex items-center gap-2.5 focus:outline-none"
              >
                <span>💡</span> Add Recommendation
              </button>
            </div>
          </section>

        </div>

      </div>

    </div>
  );
}

// ==========================================
// Loading Skeletons
// ==========================================
function SkeletonWorkspace() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left animate-pulse">
      <div className="h-40 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-40 bg-white border border-light-border rounded-3xl p-5 shadow-apple-sm"></div>
        <div className="h-40 bg-white border border-light-border rounded-3xl p-5 shadow-apple-sm"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="h-64 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
        </div>
        <div className="lg:col-span-4 space-y-4">
          <div className="h-64 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
        </div>
      </div>
    </div>
  );
}
