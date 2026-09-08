import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectService } from '../../services/contractor/ProjectService.js';
import type { Project } from '../../types/contractor/ProjectTypes.js';

type PlmsTab = 'overview' | 'tasks' | 'changes' | 'logs' | 'gallery' | 'handover';

interface MilestoneItem {
  id: string;
  name: string;
  dueDate: string;
  progress: number;
  status: 'Draft' | 'In Progress' | 'Completed' | 'Approved';
  notes: string;
}

interface KanbanTask {
  id: string;
  title: string;
  assignee: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'todo' | 'progress' | 'review' | 'done';
}

interface ChangeRequest {
  id: string;
  title: string;
  costImpact: number;
  scheduleImpactDays: number;
  reason: string;
  status: 'Pending Client Approval' | 'Approved' | 'Declined';
}

interface RiskItem {
  id: string;
  risk: string;
  probability: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'Critical';
  mitigation: string;
  status: 'Monitored' | 'Mitigated';
}

interface DailyLog {
  id: string;
  date: string;
  weather: string;
  workersCount: number;
  completedWork: string;
  materialsDelivered: string;
  safetyNotes: string;
}

interface ProjectPhoto {
  id: string;
  category: 'Before' | 'Progress' | 'Completed' | 'Inspection';
  url: string;
  caption: string;
}

const INITIAL_MILESTONES: MilestoneItem[] = [
  { id: 'm-1', name: 'Foundation Masonry and Concrete Pouring', dueDate: '12 Aug 2026', progress: 100, status: 'Approved', notes: 'Core pillar support curing completed.' },
  { id: 'm-2', name: 'Structural Framing and Beam Grid Setup', dueDate: '28 Aug 2026', progress: 40, status: 'In Progress', notes: 'Structural columns aligned. Beam grid installation in progress.' },
  { id: 'm-3', name: 'MEP Conduiting and Sanitary Layout', dueDate: '15 Sep 2026', progress: 0, status: 'Draft', notes: 'Waiting for structural clearance.' },
];

const INITIAL_KANBAN: KanbanTask[] = [
  { id: 'k-1', title: 'Verify cement curing moisture levels', assignee: 'Bob Builder', priority: 'Medium', status: 'done' },
  { id: 'k-2', title: 'Install structural frame beams', assignee: 'Dave Framing Specialist', priority: 'High', status: 'progress' },
  { id: 'k-3', title: 'Draft electrical circuit diagrams', assignee: 'Alice Architect', priority: 'Low', status: 'todo' },
];

const INITIAL_CHANGES: ChangeRequest[] = [
  { id: 'cr-101', title: 'Upgrade to premium Italian marble flooring', costImpact: 120000, scheduleImpactDays: 4, reason: 'Client requested visual upgrade for living room quadrant.', status: 'Pending Client Approval' },
];

const INITIAL_RISKS: RiskItem[] = [
  { id: 'r-1', risk: 'Monsoon delays for external painting', probability: 'High', impact: 'Medium', mitigation: 'Schedule external coating post-monsoon weeks.', status: 'Monitored' },
];

const INITIAL_LOGS: DailyLog[] = [
  { id: 'log-1', date: '30 Jul 2026', weather: 'Cloudy, minor rain', workersCount: 18, completedWork: 'Curing foundation pillars & ground leveling checks', materialsDelivered: '200 bags ACC Cement, 4 tons Sand', safetyNotes: 'Pillar scaffolding checked. Scaffolding harness secure.' },
];

const INITIAL_PHOTOS: ProjectPhoto[] = [
  { id: 'ph-1', category: 'Before', url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80', caption: 'Initial empty plot excavation start' },
  { id: 'ph-2', category: 'Progress', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80', caption: 'Foundation grid concrete pouring stage' },
];

export function ProjectWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // PLMS Tabs Switcher
  const [activePlmsTab, setActivePlmsTab] = useState<PlmsTab>('overview');

  // Interactive Lists
  const [milestones] = useState<MilestoneItem[]>(INITIAL_MILESTONES);
  const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>(INITIAL_KANBAN);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>(INITIAL_CHANGES);
  const [risks, setRisks] = useState<RiskItem[]>(INITIAL_RISKS);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(INITIAL_LOGS);
  const [photos] = useState<ProjectPhoto[]>(INITIAL_PHOTOS);

  // Form composer variables
  const [newLogText, setNewLogText] = useState('');
  const [newLogWeather, setNewLogWeather] = useState('Sunny');
  const [newLogWorkers, setNewLogWorkers] = useState('15');
  const [newLogMaterials, setNewLogMaterials] = useState('');
  const [newChangeTitle, setNewChangeTitle] = useState('');
  const [newChangeCost, setNewChangeCost] = useState('');
  const [newChangeReason, setNewChangeReason] = useState('');
  const [riskTitle, setRiskTitle] = useState('');
  const [riskProb, setRiskProb] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [riskImp, setRiskImp] = useState<'Low' | 'Medium' | 'Critical'>('Medium');

  // Current session mock profile context
  const token = localStorage.getItem('token') || globalThis.__accessToken;
  let currentUserRole = 'CUSTOMER';
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserRole = payload.role === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER';
    } catch (e) {
      console.error('Failed to parse token payload', e);
    }
  }

  useEffect(() => {
    async function loadProjectDetails() {
      try {
        setLoading(true);
        setError('');
        if (id) {
          const data = await ProjectService.getProjectDetail(id);
          setProject(data);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load project workspace details');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadProjectDetails();
    }
  }, [id]);

  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => setNoticeMessage(null), 4000);
  };

  // Handle change request resolutions
  const handleResolveChangeRequest = (id: string, approve: boolean) => {
    setChangeRequests(prev =>
      prev.map(cr => (cr.id === id ? { ...cr, status: approve ? 'Approved' : 'Declined' } : cr))
    );
    showNotice(`✓ Change request ${approve ? 'Approved' : 'Declined'}. Budget totals adjusted.`);
  };

  // Append change request
  const handleAddChangeRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChangeTitle.trim()) return;
    const newCr: ChangeRequest = {
      id: `cr-${Date.now()}`,
      title: newChangeTitle.trim(),
      costImpact: Number(newChangeCost) || 0,
      scheduleImpactDays: 3,
      reason: newChangeReason.trim(),
      status: 'Pending Client Approval',
    };
    setChangeRequests([...changeRequests, newCr]);
    setNewChangeTitle('');
    setNewChangeCost('');
    setNewChangeReason('');
    showNotice('✓ Change request submitted for client review.');
  };

  // Add daily log update
  const handleAddDailyLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogText.trim()) return;
    const newLog: DailyLog = {
      id: `log-${Date.now()}`,
      date: new Date().toLocaleDateString('en-IN'),
      weather: newLogWeather,
      workersCount: Number(newLogWorkers) || 0,
      completedWork: newLogText.trim(),
      materialsDelivered: newLogMaterials.trim() || 'None',
      safetyNotes: 'Harnesses secure. Standard operation checks.',
    };
    setDailyLogs([newLog, ...dailyLogs]);
    setNewLogText('');
    setNewLogMaterials('');
    showNotice('✓ Daily construction log saved.');
  };

  // Create Risk item
  const handleAddRisk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskTitle.trim()) return;
    const item: RiskItem = {
      id: `risk-${Date.now()}`,
      risk: riskTitle.trim(),
      probability: riskProb,
      impact: riskImp,
      mitigation: 'Monitor weekly indicators.',
      status: 'Monitored',
    };
    setRisks([...risks, item]);
    setRiskTitle('');
    showNotice('✓ Risk metric added to project ledger.');
  };

  // Kanban task status shifter
  const handleTaskStatusChange = (taskId: string, targetStatus: KanbanTask['status']) => {
    setKanbanTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 rounded-full border-4 border-stone-200 border-t-emerald-700 animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Loading Project Workspace...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-sm">
          {error || 'Project workspace not found'}
        </div>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm">
          Back
        </button>
      </div>
    );
  }

  const handleStartProject = async () => {
    if (!project) return;
    try {
      const updated = await ProjectService.updateProjectStatus(project.id, 'IN_PROGRESS', 'Professional started project execution');
      setProject(updated);
      showNotice('✓ Project execution started! Status updated to IN_PROGRESS.');
    } catch (err: any) {
      console.error('Failed to start project', err);
      showNotice(`⚠️ ${err.message || 'Failed to start project.'}`);
    }
  };

  return (
    <div className="min-h-screen bg-warm-cream text-stone-850 pb-16 flex flex-col font-sans relative">
      
      {/* Toast Notice Banner */}
      {noticeMessage && (
        <div className="fixed top-4 right-4 z-50 bg-stone-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-stone-700 animate-gentle-fade flex items-center gap-2">
          <span>{noticeMessage}</span>
          <button onClick={() => setNoticeMessage(null)} className="text-stone-400 hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border-b border-light-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-left">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-stone-100 text-stone-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Project Workspace
                </span>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {project.status === 'ASSIGNED' ? 'Project Assigned' : project.status}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-stone-900 font-serif leading-tight">
                {project.requirement?.title || 'Execution Work Agreement'}
              </h1>
              <p className="text-xs text-stone-500 font-medium">
                Client: {project.customer?.fullName} &bull; Lead Professional: {project.provider?.fullName}
              </p>
            </div>
            
            {/* Origin Lineage Card */}
            <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl text-xs text-left space-y-1 shrink-0">
              <span className="text-[9px] font-black uppercase text-stone-400 block tracking-wider">Origin Lineage</span>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-800">
                <span>Project Request</span>
                <span className="text-stone-400">➔</span>
                <span>Accepted Proposal</span>
                <span className="text-stone-400">➔</span>
                <span className="text-emerald-700">Project Created</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              {currentUserRole === 'PROVIDER' && ['ASSIGNED', 'PLANNING', 'CREATED'].includes(project.status) && (
                <button
                  onClick={handleStartProject}
                  className="dbc-btn dbc-btn-sm dbc-btn-primary"
                >
                  ⚡ Start Project
                </button>
              )}

              <button
                onClick={() => navigate('/workspace/inbox')}
                className="dbc-btn dbc-btn-sm border border-emerald-600 text-emerald-800 hover:bg-emerald-50 bg-white"
              >
                💬 {currentUserRole === 'PROVIDER' ? 'Contact Customer' : 'Message Professional'}
              </button>

              <button
                onClick={() => navigate('/')}
                className="px-3.5 py-2 border border-light-border text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-50 transition"
              >
                Exit Workspace
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 w-full">
        
        {/* Navigation tabs switcher */}
        <section className="flex gap-2 border-b border-stone-200 overflow-x-auto pb-1 text-[9.5px] font-black uppercase tracking-wider no-scrollbar mb-6">
          {([
            { id: 'overview', label: 'Dashboard & Milestones', icon: '📊' },
            { id: 'tasks', label: 'Kanban Tasks & Gantt', icon: '📋' },
            { id: 'changes', label: 'Change Requests & Risks', icon: '⚖️' },
            { id: 'logs', label: 'Daily Scaffolding Logs', icon: '📝' },
            { id: 'gallery', label: 'Progress Gallery', icon: '📷' },
            { id: 'handover', label: 'Handover & Warranty', icon: '🔑' },
          ] as const).map((tab) => {
            const isActive = activePlmsTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActivePlmsTab(tab.id)}
                className={`px-4 py-2.5 border-b-2 font-bold transition whitespace-nowrap cursor-pointer select-none
                  ${isActive 
                    ? 'border-emerald-600 text-emerald-800 font-extrabold' 
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span className="ml-1.5">{tab.label}</span>
              </button>
            );
          })}
        </section>

        {/* Tab content rendering */}

        {/* OVERVIEW & MILESTONES */}
        {activePlmsTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Quick Metrics row */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="dbc-card p-5">
                <span className="text-[8.5px] font-black uppercase tracking-wider text-stone-gray">Approved Budget</span>
                <h4 className="text-xl font-extrabold text-stone-black mt-1">₹25,00,000</h4>
              </div>
              <div className="dbc-card p-5">
                <span className="text-[8.5px] font-black uppercase tracking-wider text-stone-gray">Actual Spending</span>
                <h4 className="text-xl font-extrabold text-stone-black mt-1">₹18,20,000</h4>
              </div>
              <div className="dbc-card p-5">
                <span className="text-[8.5px] font-black uppercase tracking-wider text-stone-gray">Remaining Balance</span>
                <h4 className="text-xl font-extrabold text-brand-emerald mt-1">₹6,80,000</h4>
              </div>
              <div className="dbc-card p-5">
                <span className="text-[8.5px] font-black uppercase tracking-wider text-stone-gray">Overall Health</span>
                <h4 className="text-xl font-extrabold text-brand-emerald mt-1">🟢 HEALTHY</h4>
              </div>
            </div>

            {/* Stages overview */}
            <div className="dbc-card space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Project Lifecycle Stages</h3>
              <div className="flex flex-wrap items-center gap-3 text-[9px] font-black uppercase tracking-wider">
                {['Draft', 'Requirement Approved', 'Planning', 'Execution', 'Quality Review', 'Handover', 'Warranty'].map((stage, idx) => {
                  const isCurrent = stage === 'Execution';
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded border ${
                        isCurrent 
                          ? 'bg-brand-emerald border-brand-emerald text-white' 
                          : 'bg-light-stone/40 border-light-border text-stone-gray'
                      }`}>
                        {stage}
                      </span>
                      {idx < 6 && <span className="text-stone-400">&rarr;</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Milestones list */}
            <div className="dbc-card space-y-4 text-left">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Active Milestones</h3>
              <div className="space-y-3">
                {milestones.map((m) => (
                  <div key={m.id} className="p-4 bg-light-stone/10 border border-light-border rounded-2xl flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-stone-black">{m.name}</h4>
                      <span className="block text-[8px] text-stone-gray font-bold mt-1">Target Date: {m.dueDate} &bull; Notes: {m.notes}</span>
                    </div>
                    <span className={`dbc-badge text-[7.5px] py-0.5 uppercase font-bold ${
                      m.status === 'Approved' ? 'dbc-badge-completed' : 'dbc-badge-planning'
                    }`}>{m.status}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* KANBAN TASKS & GANTT */}
        {activePlmsTab === 'tasks' && (
          <div className="space-y-6">
            
            {/* Gantt Timeline visualizer */}
            <div className="dbc-card space-y-4 text-left">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Gantt Schedule Overview</h3>
              <div className="p-4 bg-light-stone/20 rounded-2xl border border-light-border space-y-3">
                
                {/* Gantt Row 1 */}
                <div className="flex items-center text-[10px] font-semibold text-stone-gray">
                  <span className="w-1/3 truncate text-stone-black">Laying Foundation Concrete</span>
                  <div className="w-2/3 bg-stone-150 h-5 rounded relative">
                    <div className="bg-brand-emerald h-full rounded w-full flex items-center px-2 text-[8px] font-black text-white">100% DONE</div>
                  </div>
                </div>

                {/* Gantt Row 2 */}
                <div className="flex items-center text-[10px] font-semibold text-stone-gray">
                  <span className="w-1/3 truncate text-stone-black">Structural Beams Alignment</span>
                  <div className="w-2/3 bg-stone-150 h-5 rounded relative">
                    <div className="bg-brand-emerald h-full rounded w-[40%] flex items-center px-2 text-[8px] font-black text-white">40% ACTIVE</div>
                  </div>
                </div>

                {/* Gantt Row 3 */}
                <div className="flex items-center text-[10px] font-semibold text-stone-gray">
                  <span className="w-1/3 truncate text-stone-black">Electrical Conduits Plumbing</span>
                  <div className="w-2/3 bg-stone-150 h-5 rounded relative">
                    <div className="bg-stone-300 h-full rounded w-[15%] flex items-center px-2 text-[8px] font-black text-stone-600">PLANNING</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Kanban Board */}
            <div className="grid gap-4 sm:grid-cols-4 text-left">
              
              {/* To Do */}
              <div className="dbc-card space-y-3 bg-stone-50/50">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-stone-gray">To Do</h4>
                {kanbanTasks.filter(t => t.status === 'todo').map(t => (
                  <div key={t.id} className="p-3 bg-white border border-light-border rounded-xl space-y-2">
                    <h5 className="text-xs font-black text-stone-black leading-snug">{t.title}</h5>
                    <div className="flex justify-between items-center text-[8px] font-black uppercase">
                      <span className="text-stone-gray">{t.assignee}</span>
                      <button onClick={() => handleTaskStatusChange(t.id, 'progress')} className="text-brand-emerald hover:underline">Start &rarr;</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* In Progress */}
              <div className="dbc-card space-y-3 bg-stone-50/50">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-stone-gray">In Progress</h4>
                {kanbanTasks.filter(t => t.status === 'progress').map(t => (
                  <div key={t.id} className="p-3 bg-white border border-light-border rounded-xl space-y-2">
                    <h5 className="text-xs font-black text-stone-black leading-snug">{t.title}</h5>
                    <div className="flex justify-between items-center text-[8px] font-black uppercase">
                      <span className="text-stone-gray">{t.assignee}</span>
                      <button onClick={() => handleTaskStatusChange(t.id, 'review')} className="text-brand-emerald hover:underline">Review &rarr;</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Review */}
              <div className="dbc-card space-y-3 bg-stone-50/50">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-stone-gray">Review</h4>
                {kanbanTasks.filter(t => t.status === 'review').map(t => (
                  <div key={t.id} className="p-3 bg-white border border-light-border rounded-xl space-y-2">
                    <h5 className="text-xs font-black text-stone-black leading-snug">{t.title}</h5>
                    <div className="flex justify-between items-center text-[8px] font-black uppercase">
                      <span className="text-stone-gray">{t.assignee}</span>
                      <button onClick={() => handleTaskStatusChange(t.id, 'done')} className="text-brand-emerald hover:underline">Approve &rarr;</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Done */}
              <div className="dbc-card space-y-3 bg-stone-50/50">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-stone-gray">Done</h4>
                {kanbanTasks.filter(t => t.status === 'done').map(t => (
                  <div key={t.id} className="p-3 bg-white border border-light-border rounded-xl space-y-2">
                    <h5 className="text-xs font-black text-stone-black leading-snug line-through text-stone-gray/60">{t.title}</h5>
                    <div className="text-[8px] font-black uppercase text-stone-gray">
                      {t.assignee}
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>
        )}

        {/* CHANGE REQUESTS & RISKS */}
        {activePlmsTab === 'changes' && (
          <div className="grid gap-6 sm:grid-cols-2 text-left">
            
            {/* Change requests log */}
            <div className="space-y-6">
              <div className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Formal Change Requests</h3>
                
                {changeRequests.map((cr) => (
                  <div key={cr.id} className="p-4 bg-light-stone/20 border border-light-border rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-black text-stone-black">{cr.title}</h4>
                      <span className="dbc-badge text-[7.5px] py-0.5">{cr.status}</span>
                    </div>
                    <p className="text-[10px] text-stone-gray font-semibold leading-relaxed">
                      <strong>Reason:</strong> "{cr.reason}"<br />
                      <strong>Financial Impact:</strong> +₹{cr.costImpact.toLocaleString()}<br />
                      <strong>Timeline Impact:</strong> +{cr.scheduleImpactDays} days
                    </p>

                    {currentUserRole === 'CUSTOMER' && cr.status === 'Pending Client Approval' && (
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleResolveChangeRequest(cr.id, true)}
                          className="dbc-btn dbc-btn-primary py-1 px-4 text-[9px] font-bold uppercase cursor-pointer"
                        >
                          Approve Sign-off
                        </button>
                        <button
                          onClick={() => handleResolveChangeRequest(cr.id, false)}
                          className="dbc-btn dbc-btn-danger py-1 px-4 text-[9px] font-bold uppercase cursor-pointer"
                        >
                          Decline Request
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Request form */}
              {currentUserRole === 'PROVIDER' && (
                <form onSubmit={handleAddChangeRequest} className="dbc-card space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Request Scope Amendment</h3>
                  <input
                    type="text"
                    placeholder="Change Title (e.g. Upgrade bathroom tiling)"
                    value={newChangeTitle}
                    onChange={(e) => setNewChangeTitle(e.target.value)}
                    className="dbc-input"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Financial Impact Cost (INR)"
                    value={newChangeCost}
                    onChange={(e) => setNewChangeCost(e.target.value)}
                    className="dbc-input"
                    required
                  />
                  <textarea
                    placeholder="Detailed justification..."
                    value={newChangeReason}
                    onChange={(e) => setNewChangeReason(e.target.value)}
                    className="dbc-input h-16 resize-none"
                    required
                  />
                  <button type="submit" className="w-full dbc-btn dbc-btn-primary py-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                    Submit Request
                  </button>
                </form>
              )}
            </div>

            {/* Risk management ledger */}
            <div className="space-y-6">
              <div className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Risk Register</h3>
                <div className="space-y-3">
                  {risks.map((r) => (
                    <div key={r.id} className="p-3 bg-light-stone/30 border border-light-border rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <h4 className="font-black text-stone-black">{r.risk}</h4>
                        <span className="block text-[8px] text-stone-gray font-bold mt-1">
                          Probability: {r.probability} &bull; Impact: {r.impact}
                        </span>
                      </div>
                      <span className="dbc-badge dbc-badge-priority text-[7.5px] py-0.5">{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add risk metric */}
              <form onSubmit={handleAddRisk} className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Add Mitigation Risk Metric</h3>
                <input
                  type="text"
                  placeholder="Identify Risk (e.g. steel cost spike)"
                  value={riskTitle}
                  onChange={(e) => setRiskTitle(e.target.value)}
                  className="dbc-input"
                  required
                />
                <div className="grid gap-4 grid-cols-2 text-xs font-semibold text-stone-gray">
                  <div>
                    <label className="block mb-1">Probability</label>
                    <select value={riskProb} onChange={(e) => setRiskProb(e.target.value as 'Low' | 'Medium' | 'High')} className="dbc-input bg-white">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1">Impact</label>
                    <select value={riskImp} onChange={(e) => setRiskImp(e.target.value as 'Low' | 'Medium' | 'Critical')} className="dbc-input bg-white">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full dbc-btn dbc-btn-primary py-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                  Register Risk
                </button>
              </form>
            </div>

          </div>
        )}

        {/* DAILY SCAFFOLDING LOGS */}
        {activePlmsTab === 'logs' && (
          <div className="grid gap-6 sm:grid-cols-2 text-left">
            
            {/* Logs List */}
            <div className="dbc-card space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Execution Daily Logs</h3>
              <div className="space-y-4">
                {dailyLogs.map((log) => (
                  <div key={log.id} className="p-4 bg-light-stone/20 border border-light-border rounded-2xl space-y-2">
                    <div className="flex justify-between items-center border-b border-light-border/40 pb-1.5">
                      <span className="text-xs font-black text-stone-black">Log Date: {log.date}</span>
                      <span className="bg-light-stone text-stone-gray text-[8px] font-black px-1.5 py-0.5 rounded border border-light-border uppercase">
                        ⛅ {log.weather}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-stone-gray font-semibold leading-relaxed">
                      <strong>Workers Scaffolding:</strong> {log.workersCount} active onsite<br />
                      <strong>Completed Operations:</strong> "{log.completedWork}"<br />
                      <strong>Materials Delivered:</strong> "{log.materialsDelivered}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily log input */}
            {currentUserRole === 'PROVIDER' && (
              <form onSubmit={handleAddDailyLog} className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Register Onsite Daily Log</h3>
                
                <div className="grid gap-4 grid-cols-2 text-xs font-semibold text-stone-gray">
                  <div>
                    <label className="block mb-1">Weather Condition</label>
                    <select value={newLogWeather} onChange={(e) => setNewLogWeather(e.target.value)} className="dbc-input bg-white">
                      <option value="Sunny">Sunny</option>
                      <option value="Cloudy">Cloudy</option>
                      <option value="Rainy">Rainy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1">Active Workers Count</label>
                    <input
                      type="number"
                      value={newLogWorkers}
                      onChange={(e) => setNewLogWorkers(e.target.value)}
                      className="dbc-input"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Materials Delivered</label>
                  <input
                    type="text"
                    placeholder="e.g. 50 bags sand, 20 steel rods"
                    value={newLogMaterials}
                    onChange={(e) => setNewLogMaterials(e.target.value)}
                    className="dbc-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Scaffolding Work Completed</label>
                  <textarea
                    placeholder="Detail today's accomplishments..."
                    value={newLogText}
                    onChange={(e) => setNewLogText(e.target.value)}
                    className="dbc-input h-16 resize-none"
                    required
                  />
                </div>

                <button type="submit" className="w-full dbc-btn dbc-btn-primary py-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                  Log Construction Update
                </button>
              </form>
            )}

          </div>
        )}

        {/* PROGRESS GALLERY */}
        {activePlmsTab === 'gallery' && (
          <div className="dbc-card space-y-4 text-left">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Project Progress Gallery</h3>
            
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              {photos.map((ph) => (
                <div key={ph.id} className="p-2.5 bg-light-stone/10 border border-light-border rounded-2xl space-y-2">
                  <img
                    src={ph.url}
                    alt={ph.caption}
                    className="w-full h-32 object-cover rounded-xl border border-light-border"
                  />
                  <div className="text-[10px] text-stone-gray font-semibold">
                    <span className="dbc-badge text-[7px] py-0.5 mb-1.5 uppercase font-bold bg-light-stone">{ph.category}</span>
                    <p className="truncate mt-1">{ph.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HANDOVER & WARRANTY */}
        {activePlmsTab === 'handover' && (
          <div className="grid gap-6 sm:grid-cols-2 text-left">
            
            {/* Handover milestones */}
            <div className="dbc-card space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Final Handover Certificate</h3>
              <p className="text-[11px] text-stone-gray font-semibold leading-relaxed">
                Project handover represents the final transfer of ownership back to the customer upon verification of safety certificates and structural clearances.
              </p>

              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-3">
                <span className="dbc-badge dbc-badge-completed text-[7.5px] py-0.5">Ready for Handover</span>
                <p className="text-xs text-stone-gray font-bold">
                  All 3 milestones signed. Final inspection safety clearances uploaded.
                </p>
                <button
                  onClick={() => alert('Handover certificate draft exported as PDF.')}
                  className="w-full dbc-btn dbc-btn-primary py-2 text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Generate Handover PDF
                </button>
              </div>
            </div>

            {/* Warranty claim tracker */}
            <div className="dbc-card space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Warranty Tracker Period</h3>
              
              <div className="p-4 bg-light-stone/20 border border-light-border rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-stone-black">Structural Warranty Period</span>
                  <span className="text-[9px] text-stone-gray font-bold">Expires: July 2029</span>
                </div>
                <p className="text-[10.5px] text-stone-gray font-semibold leading-relaxed">
                  Includes support covers on concrete frame pillars, foundation layout moisture levels, and primary beams load allocations.
                </p>
                <button
                  onClick={() => alert('Warranty coverage catalog downloaded.')}
                  className="w-full dbc-btn dbc-btn-outline py-2 text-xs font-bold uppercase tracking-wider bg-white cursor-pointer"
                >
                  Download Warranty Policy
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
