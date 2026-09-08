import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectService } from '../../services/contractor/ProjectService.js';
import { axiosClient } from '../../services/auth/axiosClient.js';
import type { Project } from '../../types/contractor/ProjectTypes.js';

type PlmsTab = 'overview' | 'documents' | 'activity' | 'tasks' | 'changes' | 'logs' | 'gallery' | 'handover';



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
  const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>(INITIAL_KANBAN);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>(INITIAL_CHANGES);
  const [risks, setRisks] = useState<RiskItem[]>(INITIAL_RISKS);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(INITIAL_LOGS);
  const [photos] = useState<ProjectPhoto[]>(INITIAL_PHOTOS);

  // Milestone management state
  const [isAddMsModalOpen, setIsAddMsModalOpen] = useState(false);
  const [addMsName, setAddMsName] = useState('');
  const [addMsDesc, setAddMsDesc] = useState('');
  const [addMsBudget, setAddMsBudget] = useState('');
  const [addMsEnd, setAddMsEnd] = useState('');

  const [editingMilestone, setEditingMilestone] = useState<any | null>(null);
  const [editMsName, setEditMsName] = useState('');
  const [editMsDesc, setEditMsDesc] = useState('');
  const [editMsBudget, setEditMsBudget] = useState('');
  const [editMsEnd, setEditMsEnd] = useState('');
  const [editMsStatus, setEditMsStatus] = useState('PENDING');

  const [deletingMilestoneId, setDeletingMilestoneId] = useState<string | null>(null);

  // Document management state
  const [isUploadDocModalOpen, setIsUploadDocModalOpen] = useState(false);
  const [uploadDocName, setUploadDocName] = useState('');
  const [uploadDocUrl, setUploadDocUrl] = useState('');
  const [uploadDocType, setUploadDocType] = useState('Drawing');
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

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

  const reloadProject = async () => {
    if (id) {
      const data = await ProjectService.getProjectDetail(id);
      setProject(data);
    }
  };

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

  // Milestone actions
  const handleAddMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !addMsName.trim()) return;
    try {
      await ProjectService.createMilestone(project.id, {
        name: addMsName.trim(),
        description: addMsDesc.trim() || undefined,
        budgetAllocation: addMsBudget ? Number(addMsBudget) : 0,
        plannedEnd: addMsEnd || undefined,
      });
      await reloadProject();
      setIsAddMsModalOpen(false);
      setAddMsName('');
      setAddMsDesc('');
      setAddMsBudget('');
      setAddMsEnd('');
      showNotice('✓ New project milestone created successfully.');
    } catch (err: any) {
      showNotice(`⚠️ ${err.message || 'Failed to create milestone'}`);
    }
  };

  const handleOpenEditMilestone = (m: any) => {
    setEditingMilestone(m);
    setEditMsName(m.name || '');
    setEditMsDesc(m.description || '');
    setEditMsBudget(m.budgetAllocation ? String(m.budgetAllocation) : '');
    setEditMsEnd(m.plannedEnd ? new Date(m.plannedEnd).toISOString().split('T')[0] : '');
    setEditMsStatus(m.status || 'PENDING');
  };

  const handleUpdateMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !editingMilestone) return;
    try {
      await ProjectService.updateMilestone(project.id, {
        milestoneId: editingMilestone.id,
        name: editMsName.trim(),
        description: editMsDesc.trim() || undefined,
        budgetAllocation: editMsBudget ? Number(editMsBudget) : undefined,
        plannedEnd: editMsEnd || undefined,
        status: editMsStatus,
      });
      await reloadProject();
      setEditingMilestone(null);
      showNotice('✓ Project milestone updated successfully.');
    } catch (err: any) {
      showNotice(`⚠️ ${err.message || 'Failed to update milestone'}`);
    }
  };

  const handleMarkMilestoneComplete = async (milestoneId: string) => {
    if (!project) return;
    try {
      await ProjectService.updateMilestone(project.id, {
        milestoneId,
        status: 'COMPLETED',
      });
      await reloadProject();
      showNotice('✓ Milestone marked as COMPLETED.');
    } catch (err: any) {
      showNotice(`⚠️ ${err.message || 'Failed to complete milestone'}`);
    }
  };

  const handleDeleteMilestoneConfirm = async () => {
    if (!project || !deletingMilestoneId) return;
    try {
      await ProjectService.deleteMilestone(project.id, deletingMilestoneId);
      await reloadProject();
      setDeletingMilestoneId(null);
      showNotice('✓ Milestone removed from project plan.');
    } catch (err: any) {
      setDeletingMilestoneId(null);
      showNotice(`⚠️ ${err.message || 'Failed to delete milestone'}`);
    }
  };

  const handleUploadDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !uploadDocName.trim() || !uploadDocUrl.trim()) return;
    try {
      await ProjectService.uploadProjectDocument(project.id, {
        name: uploadDocName.trim(),
        fileUrl: uploadDocUrl.trim(),
        fileType: uploadDocType,
      });
      await reloadProject();
      setIsUploadDocModalOpen(false);
      setUploadDocName('');
      setUploadDocUrl('');
      setUploadDocType('Drawing');
      showNotice('✓ Project document uploaded successfully.');
    } catch (err: any) {
      showNotice(`⚠️ ${err.message || 'Failed to upload document'}`);
    }
  };

  const handleDeleteDocumentConfirm = async () => {
    if (!project || !deletingDocId) return;
    try {
      await ProjectService.deleteProjectDocument(project.id, deletingDocId);
      await reloadProject();
      setDeletingDocId(null);
      showNotice('✓ Document removed from project workspace.');
    } catch (err: any) {
      setDeletingDocId(null);
      showNotice(`⚠️ ${err.message || 'Failed to delete document'}`);
    }
  };

  const handleOpenMessaging = async () => {
    if (!project) return;
    try {
      const providerId = project.provider?.id || project.providerId;
      const response = await axiosClient.post('/api/conversations', {
        providerId,
        projectId: project.id,
        conversationType: 'DIRECT',
      });
      const convo = response.data?.data;
      if (convo?.id) {
        navigate(`/workspace/inbox?conversationId=${convo.id}`);
      } else {
        navigate('/workspace/inbox');
      }
    } catch (err: any) {
      console.error('Failed to open project conversation', err);
      navigate('/workspace/inbox');
    }
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
                onClick={handleOpenMessaging}
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
            { id: 'documents', label: 'Project Documents', icon: '📁' },
            { id: 'activity', label: 'Activity Timeline', icon: '⚡' },
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
        {activePlmsTab === 'overview' && (() => {
          const projectMilestones = project.milestones || [];
          const totalMilestonesCount = projectMilestones.length;
          const completedMilestonesCount = projectMilestones.filter(
            (m) => m.status === 'COMPLETED' || m.status === 'APPROVED'
          ).length;
          const calculatedProgress = totalMilestonesCount > 0
            ? Math.round((completedMilestonesCount / totalMilestonesCount) * 100)
            : 0;
          const activeMs = projectMilestones.find((m) => m.status === 'IN_PROGRESS') || projectMilestones.find((m) => m.status === 'PENDING');

          return (
            <div className="space-y-6">
              
              {/* Quick Metrics row */}
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="dbc-card p-5 text-left">
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-stone-gray">Approved Budget</span>
                  <h4 className="text-xl font-extrabold text-stone-black mt-1">
                    {project.quotation?.totalAmount ? `₹${project.quotation.totalAmount.toLocaleString()}` : '₹25,00,000'}
                  </h4>
                </div>
                <div className="dbc-card p-5 text-left">
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-stone-gray">Milestone Progress</span>
                  <h4 className="text-xl font-extrabold text-stone-black mt-1">{calculatedProgress}%</h4>
                  <span className="text-[9px] text-stone-500 font-semibold">{completedMilestonesCount} of {totalMilestonesCount} completed</span>
                </div>
                <div className="dbc-card p-5 text-left">
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-stone-gray">Active Stage</span>
                  <h4 className="text-sm font-extrabold text-brand-emerald mt-1 truncate">
                    {activeMs ? activeMs.name : (totalMilestonesCount === 0 ? 'No active milestone' : 'All milestones completed')}
                  </h4>
                </div>
                <div className="dbc-card p-5 text-left">
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-stone-gray">Overall Health</span>
                  <h4 className="text-xl font-extrabold text-brand-emerald mt-1">🟢 HEALTHY</h4>
                </div>
              </div>

              {/* Progress bar container */}
              <div className="dbc-card p-5 text-left space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-stone-800 uppercase tracking-wider text-[10px]">Overall Execution Progress</span>
                  <span className="text-emerald-700 font-black">{calculatedProgress}%</span>
                </div>
                <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, calculatedProgress))}%` }}
                  />
                </div>
              </div>

              {/* Stages overview */}
              <div className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black text-left">Project Lifecycle Stages</h3>
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

              {/* Milestones timeline list */}
              <div className="dbc-card space-y-4 text-left">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">
                    Project Timeline & Milestones ({totalMilestonesCount})
                  </h3>
                  {currentUserRole === 'PROVIDER' && (
                    <button
                      onClick={() => setIsAddMsModalOpen(true)}
                      className="dbc-btn dbc-btn-sm dbc-btn-primary"
                    >
                      + Add Milestone
                    </button>
                  )}
                </div>

                {totalMilestonesCount === 0 ? (
                  <div className="p-6 bg-stone-50 border border-dashed border-stone-300 rounded-2xl text-center space-y-2">
                    <span className="text-2xl">📌</span>
                    <p className="text-xs font-semibold text-stone-600">
                      {currentUserRole === 'PROVIDER'
                        ? 'No milestones created for this project yet. Click "+ Add Milestone" above to establish your project deliverable schedule.'
                        : 'No milestones have been added yet. Your professional will add project milestones as the project plan is established.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projectMilestones.map((m: any, index: number) => {
                      const isDone = m.status === 'COMPLETED' || m.status === 'APPROVED';
                      const isInProgress = m.status === 'IN_PROGRESS';
                      const targetDateStr = m.plannedEnd ? new Date(m.plannedEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
                      const completionDateStr = m.actualEnd ? new Date(m.actualEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

                      return (
                        <div
                          key={m.id || index}
                          className={`p-4 rounded-2xl border transition ${
                            isInProgress
                              ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-200'
                              : isDone
                              ? 'bg-stone-50 border-stone-200 opacity-90'
                              : 'bg-white border-stone-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-stone-400">#{index + 1}</span>
                                <h4 className="text-sm font-black text-stone-900">{m.name}</h4>
                                <span
                                  className={`dbc-badge text-[8px] py-0.5 uppercase font-extrabold ${
                                    isDone
                                      ? 'dbc-badge-completed'
                                      : isInProgress
                                      ? 'bg-emerald-600 text-white'
                                      : 'dbc-badge-planning'
                                  }`}
                                >
                                  {m.status}
                                </span>
                              </div>
                              {m.description && (
                                <p className="text-xs text-stone-600 leading-snug">{m.description}</p>
                              )}
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-stone-500 font-medium pt-1">
                                {m.budgetAllocation > 0 && (
                                  <span>Allocation: <strong>₹{m.budgetAllocation.toLocaleString()}</strong></span>
                                )}
                                {targetDateStr && (
                                  <span>Target Date: <strong>{targetDateStr}</strong></span>
                                )}
                                {completionDateStr && (
                                  <span className="text-emerald-700">Completed: <strong>{completionDateStr}</strong></span>
                                )}
                              </div>
                            </div>

                            {/* Actions for provider */}
                            {currentUserRole === 'PROVIDER' && (
                              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                                {!isDone && (
                                  <button
                                    onClick={() => handleMarkMilestoneComplete(m.id)}
                                    className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-800 transition"
                                  >
                                    ✓ Complete
                                  </button>
                                )}
                                <button
                                  onClick={() => handleOpenEditMilestone(m)}
                                  className="px-2.5 py-1 bg-stone-100 text-stone-700 rounded-lg text-[10px] font-bold hover:bg-stone-200 transition"
                                >
                                  ✏️ Edit
                                </button>
                                {!isDone && (
                                  <button
                                    onClick={() => setDeletingMilestoneId(m.id)}
                                    className="px-2.5 py-1 bg-red-50 text-red-700 rounded-lg text-[10px] font-bold hover:bg-red-100 transition"
                                  >
                                    🗑️ Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Progress bar inside milestone item */}
                          <div className="mt-3 w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isDone ? 'bg-emerald-600' : isInProgress ? 'bg-emerald-500' : 'bg-stone-300'}`}
                              style={{ width: `${m.completionPercentage || (isDone ? 100 : isInProgress ? 50 : 0)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Activity summary card */}
              <div className="dbc-card space-y-4 text-left">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">
                    Recent Project Activity
                  </h3>
                  <button
                    onClick={() => setActivePlmsTab('activity')}
                    className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
                  >
                    View All Activity &rarr;
                  </button>
                </div>

                {(!project.timeline || project.timeline.length === 0) ? (
                  <p className="text-xs text-stone-500 italic">No project activity recorded yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {project.timeline.slice(0, 3).map((event: any, idx: number) => {
                      const actorEmail = event.actor?.email || 'System';
                      const formattedTime = new Date(event.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return (
                        <div key={event.id || idx} className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex justify-between items-center text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-black uppercase tracking-wider bg-stone-200 px-1.5 py-0.5 rounded text-stone-700">
                              {event.eventType}
                            </span>
                            <p className="font-bold text-stone-900 text-xs mt-1">{event.description}</p>
                            <span className="text-[9px] text-stone-500">By {actorEmail}</span>
                          </div>
                          <span className="text-[9px] text-stone-400 font-semibold shrink-0 ml-3">{formattedTime}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          );
        })()}

        {/* PROJECT DOCUMENTS */}
        {activePlmsTab === 'documents' && (() => {
          const projectDocs = project.documents || [];
          const totalDocs = projectDocs.length;

          return (
            <div className="space-y-6 text-left">
              <div className="dbc-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">
                      Project Documents & Attachments ({totalDocs})
                    </h3>
                    <p className="text-[10px] text-stone-500 font-medium mt-0.5">
                      Secure, project-scoped repository for drawings, specifications, agreements, and site photos.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsUploadDocModalOpen(true)}
                    className="dbc-btn dbc-btn-sm dbc-btn-primary shrink-0 self-start sm:self-auto"
                  >
                    + Upload Document
                  </button>
                </div>

                {totalDocs === 0 ? (
                  <div className="p-8 bg-stone-50 border border-dashed border-stone-300 rounded-2xl text-center space-y-2">
                    <span className="text-3xl">📁</span>
                    <p className="text-xs font-semibold text-stone-700">No project documents yet.</p>
                    <p className="text-[11px] text-stone-500 max-w-md mx-auto">
                      Upload project documents to keep drawings, contracts, specifications, and site photos organized in one place.
                    </p>
                    <button
                      onClick={() => setIsUploadDocModalOpen(true)}
                      className="dbc-btn dbc-btn-sm dbc-btn-primary mt-2"
                    >
                      + Upload First Document
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {projectDocs.map((doc: any) => {
                      const uploaderName = doc.uploadedBy?.fullName || doc.uploadedBy?.email || 'User';
                      const uploaderRole = doc.uploadedBy?.role === 'PROVIDER' ? 'Professional' : 'Customer';
                      const formattedDate = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }) : 'Recent';

                      const fileIcon =
                        doc.fileType === 'Drawing' ? '📐' :
                        doc.fileType === 'Design' ? '🎨' :
                        doc.fileType === 'Contract' ? '📜' :
                        doc.fileType === 'Specification' ? '📋' :
                        doc.fileType === 'Site Photo' ? '📷' :
                        doc.fileType === 'Invoice' ? '🧾' : '📄';

                      return (
                        <div key={doc.id} className="p-4 bg-white border border-stone-200 rounded-2xl space-y-3 shadow-xs hover:border-emerald-300 transition flex flex-col justify-between">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl p-2 bg-stone-100 rounded-xl shrink-0">{fileIcon}</span>
                            <div className="space-y-1 overflow-hidden">
                              <h4 className="text-xs font-black text-stone-900 leading-snug truncate" title={doc.name}>
                                {doc.name}
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className="dbc-badge text-[7.5px] py-0.5 uppercase font-bold bg-stone-100 text-stone-700">
                                  {doc.fileType || 'Document'}
                                </span>
                                <span className="text-[9px] text-stone-400 font-semibold">{formattedDate}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-stone-100 text-[10px]">
                            <span className="text-stone-500 font-medium truncate max-w-[50%]">
                              Uploaded by <strong className="text-stone-800">{uploaderRole} ({uploaderName})</strong>
                            </span>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => window.open(doc.fileUrl, '_blank')}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 transition"
                              >
                                View / Download
                              </button>
                              <button
                                onClick={() => setDeletingDocId(doc.id)}
                                className="px-2 py-1 bg-red-50 text-red-700 font-bold rounded-lg border border-red-100 hover:bg-red-100 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ACTIVITY TIMELINE TAB */}
        {activePlmsTab === 'activity' && (() => {
          const projectTimeline = project.timeline || [];
          const totalEvents = projectTimeline.length;

          return (
            <div className="space-y-6 text-left">
              <div className="dbc-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">
                      Full Project Activity Timeline ({totalEvents})
                    </h3>
                    <p className="text-[10px] text-stone-500 font-medium mt-0.5">
                      Chronological history of milestone updates, document uploads, status changes, and approvals.
                    </p>
                  </div>
                </div>

                {totalEvents === 0 ? (
                  <div className="p-8 bg-stone-50 border border-dashed border-stone-300 rounded-2xl text-center space-y-2">
                    <span className="text-3xl">⚡</span>
                    <p className="text-xs font-semibold text-stone-700">No project activity yet.</p>
                    <p className="text-[11px] text-stone-500 max-w-md mx-auto">
                      Events will automatically appear here as status updates, milestones, and project documents are recorded.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-stone-200">
                    {projectTimeline.map((event: any) => {
                      const actorEmail = event.actor?.email || 'System';
                      const actorRole = event.actor?.role === 'PROVIDER' ? 'Professional' : event.actor?.role === 'CUSTOMER' ? 'Customer' : 'System';
                      const formattedTime = new Date(event.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      const badgeStyle =
                        event.type === 'STATUS_CHANGE' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        event.type === 'MILESTONE' || event.type === 'MILESTONE_UPDATE' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        event.type === 'DOCUMENT_UPLOAD' || event.type === 'DOCUMENT_DELETE' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                        event.type === 'APPROVAL' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        'bg-stone-100 text-stone-700 border-stone-200';

                      return (
                        <div key={event.id} className="relative pl-8 flex items-start justify-between p-3.5 bg-white border border-stone-200 rounded-xl">
                          <span className="absolute left-2 top-4.5 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white ring-2 ring-stone-100" />
                          <div className="space-y-1 overflow-hidden pr-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 border text-[9px] font-black uppercase rounded ${badgeStyle}`}>
                                {event.type.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] text-stone-500 font-semibold">
                                {actorRole} ({actorEmail})
                              </span>
                            </div>
                            <p className="font-bold text-stone-900 text-xs mt-1 leading-snug">{event.description}</p>
                          </div>
                          <span className="text-[9.5px] text-stone-400 font-semibold shrink-0 ml-3">{formattedTime}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

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
                  onClick={() => showNotice('✓ Handover certificate draft exported as PDF.')}
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
                  onClick={() => showNotice('✓ Warranty coverage catalog downloaded.')}
                  className="w-full dbc-btn dbc-btn-outline py-2 text-xs font-bold uppercase tracking-wider bg-white cursor-pointer"
                >
                  Download Warranty Policy
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ADD MILESTONE MODAL */}
      {isAddMsModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4 text-left">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-black text-stone-900">Add Project Milestone</h3>
              <button onClick={() => setIsAddMsModalOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>
            <form onSubmit={handleAddMilestoneSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Milestone Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Foundation Masonry and Concrete Pouring"
                  value={addMsName}
                  onChange={(e) => setAddMsName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Scope Description</label>
                <textarea
                  placeholder="Details of deliverables for this milestone..."
                  value={addMsDesc}
                  onChange={(e) => setAddMsDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium h-20 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Budget Allocation (INR)</label>
                  <input
                    type="number"
                    placeholder="e.g. 250000"
                    value={addMsBudget}
                    onChange={(e) => setAddMsBudget(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Planned Target Date</label>
                  <input
                    type="date"
                    value={addMsEnd}
                    onChange={(e) => setAddMsEnd(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddMsModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold rounded-xl hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MILESTONE MODAL */}
      {editingMilestone && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4 text-left">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-black text-stone-900">Edit Project Milestone</h3>
              <button onClick={() => setEditingMilestone(null)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>
            <form onSubmit={handleUpdateMilestoneSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Milestone Title *</label>
                <input
                  type="text"
                  required
                  value={editMsName}
                  onChange={(e) => setEditMsName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Scope Description</label>
                <textarea
                  value={editMsDesc}
                  onChange={(e) => setEditMsDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium h-20 resize-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Status</label>
                  <select
                    value={editMsStatus}
                    onChange={(e) => setEditMsStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-medium bg-white"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="APPROVED">APPROVED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Budget Allocation</label>
                  <input
                    type="number"
                    value={editMsBudget}
                    onChange={(e) => setEditMsBudget(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={editMsEnd}
                    onChange={(e) => setEditMsEnd(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingMilestone(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold rounded-xl hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800"
                >
                  Update Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingMilestoneId && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 space-y-4 text-center">
            <span className="text-3xl">⚠️</span>
            <h3 className="text-base font-black text-stone-900">Delete Milestone?</h3>
            <p className="text-xs text-stone-600">
              Are you sure you want to remove this milestone from the project plan? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingMilestoneId(null)}
                className="px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold rounded-xl hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMilestoneConfirm}
                className="px-4 py-2 bg-red-700 text-white text-xs font-bold rounded-xl hover:bg-red-800"
              >
                Delete Milestone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {isUploadDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4 text-left">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-black text-stone-900">Upload Project Document</h3>
              <button onClick={() => setIsUploadDocModalOpen(false)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>
            <form onSubmit={handleUploadDocumentSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Approved Floor Plan Drawing v2"
                  value={uploadDocName}
                  onChange={(e) => setUploadDocName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Document Category</label>
                  <select
                    value={uploadDocType}
                    onChange={(e) => setUploadDocType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-medium bg-white"
                  >
                    <option value="Drawing">Drawing / CAD</option>
                    <option value="Design">Design Mockup</option>
                    <option value="Specification">Technical Specification</option>
                    <option value="Contract">Agreement / Contract</option>
                    <option value="Site Photo">Site Photo</option>
                    <option value="Invoice">Invoice / Commercial</option>
                    <option value="Approval">Approval Clearance</option>
                    <option value="Other">Other Document</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">File URL / Storage Link *</label>
                  <input
                    type="text"
                    required
                    placeholder="https://..."
                    value={uploadDocUrl}
                    onChange={(e) => setUploadDocUrl(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                  />
                </div>
              </div>
              <p className="text-[10px] text-stone-500 italic">
                Note: Standard document types (.pdf, .png, .jpg, .docx, .dwg) are supported. Executable (.exe, .sh, .bat) files are strictly prohibited for security reasons.
              </p>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsUploadDocModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold rounded-xl hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl hover:bg-emerald-800"
                >
                  Upload Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE DOCUMENT CONFIRMATION MODAL */}
      {deletingDocId && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 space-y-4 text-center">
            <span className="text-3xl">⚠️</span>
            <h3 className="text-base font-black text-stone-900">Remove Document?</h3>
            <p className="text-xs text-stone-600">
              Are you sure you want to delete this document from the project workspace? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingDocId(null)}
                className="px-4 py-2 border border-stone-300 text-stone-700 text-xs font-bold rounded-xl hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDocumentConfirm}
                className="px-4 py-2 bg-red-700 text-white text-xs font-bold rounded-xl hover:bg-red-800"
              >
                Remove Document
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


