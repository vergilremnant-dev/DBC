import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// ==========================================
// Types & Interfaces
// ==========================================
interface ProjectTask {
  id: string;
  name: string;
  assignedTo: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  status: 'Pending' | 'Completed';
}

interface Milestone {
  id: string;
  title: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  targetDate: string;
  completionPct: number;
}

interface ProjectDoc {
  name: string;
  type: string;
  date: string;
}

interface TeamMember {
  name: string;
  role: string;
  contact: string;
}

export default function ProjectWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // States
  const [progress, setProgress] = useState(65);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [tempProgress, setTempProgress] = useState(65);

  // Database lists
  const [tasks, setTasks] = useState<ProjectTask[]>([
    { id: 't-1', name: 'Verify site coordinate boundaries', assignedTo: 'John Anderson', priority: 'High', dueDate: '2026-08-05', status: 'Completed' },
    { id: 't-2', name: 'Draft steel reinforcement specifications', assignedTo: 'Vikram Singh', priority: 'High', dueDate: '2026-08-10', status: 'Pending' },
    { id: 't-3', name: 'Confirm raft slab concrete delivery schedule', assignedTo: 'Ramesh Kumar', priority: 'Medium', dueDate: '2026-08-12', status: 'Pending' }
  ]);

  const milestones: Milestone[] = [
    { id: 'm-1', title: 'Planning & Blueprint Approvals', status: 'Completed', targetDate: '2026-07-20', completionPct: 100 },
    { id: 'm-2', title: 'Design Vastu compliance check', status: 'Completed', targetDate: '2026-07-25', completionPct: 100 },
    { id: 'm-3', title: 'Materials Procurement (Steel/Cement)', status: 'In Progress', targetDate: '2026-08-05', completionPct: 70 },
    { id: 'm-4', title: 'Site excavation & Raft alignment', status: 'In Progress', targetDate: '2026-08-15', completionPct: 40 },
    { id: 'm-5', title: 'Masonry Lintel concrete casting', status: 'Pending', targetDate: '2026-09-10', completionPct: 0 }
  ];

  const [documents, setDocuments] = useState<ProjectDoc[]>([
    { name: 'Soil_Test_Technical_Report.pdf', type: 'Report', date: '2026-07-15' },
    { name: 'Villa_Blueprints_v1.0.dwg', type: 'Blueprint', date: '2026-07-18' }
  ]);

  const team: TeamMember[] = [
    { name: 'John Anderson', role: 'Structural Consultant (You)', contact: 'john@example.com' },
    { name: 'Vikram Singh', role: 'Site Engineer Coordinator', contact: 'vikram@example.com' }
  ];

  const activityTrail = [
    { date: '01-Aug-2026', action: 'Raft alignment progress updated to 40%', user: 'John Anderson' },
    { date: '30-Jul-2026', action: 'Task "Verify site boundaries" completed', user: 'John Anderson' },
    { date: '25-Jul-2026', action: 'Design Vastu check milestone completed', user: 'System' }
  ];

  // Task form state
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskAssigned, setNewTaskAssigned] = useState('John Anderson');

  // Startup loader
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    const task: ProjectTask = {
      id: `t-${Date.now()}`,
      name: newTaskName,
      assignedTo: newTaskAssigned,
      priority: 'Medium',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending'
    };
    setTasks([...tasks, task]);
    setNewTaskName('');
    alert('Task added.');
  };

  const handleToggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'Pending' ? 'Completed' : 'Pending' };
      }
      return t;
    }));
  };

  const handleDeleteTask = (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this task?');
    if (confirm) {
      setTasks(prev => prev.filter(t => t.id !== id));
      alert('Task deleted.');
    }
  };

  const handleUploadDoc = () => {
    const name = prompt('Enter document file name:');
    if (name) {
      setDocuments([...documents, { name, type: 'Reference Document', date: 'Just now' }]);
      alert('Document uploaded.');
    }
  };

  const handleSaveProgress = () => {
    setProgress(tempProgress);
    setShowProgressModal(false);
    alert('Project progress synced.');
  };

  if (isLoading) {
    return <SkeletonProjectWorkspace />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 text-left animate-gentle-fade select-none">
      
      {/* Back button */}
      <button
        onClick={() => navigate('/workspace/projects')}
        className="text-xs font-bold text-stone-500 hover:text-stone-900 transition flex items-center gap-1 cursor-pointer"
      >
        ← Back to Projects List
      </button>

      {/* 1. Header */}
      <header className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-stone-100 border border-light-border text-stone-700 text-[8.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              ID: {id || 'PRJ-201'}
            </span>
            <span className="bg-blue-50 text-blue-800 text-[8.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              In Progress
            </span>
            <span className="bg-emerald-50 text-emerald-800 text-[8.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {progress}% Progress
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight font-serif">Jubilee Hills Duplex Foundation</h1>
          <p className="text-xs text-stone-500 font-medium">Customer: Ramesh Kumar &bull; Civil/Architecture &bull; Start Date: 2026-07-10</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs shrink-0">
          <button
            onClick={() => setShowProgressModal(true)}
            className="dbc-btn dbc-btn-md dbc-btn-primary"
          >
            Update Progress
          </button>
          <button
            onClick={handleUploadDoc}
            className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 text-stone-750 hover:bg-stone-50"
          >
            Upload Document
          </button>
        </div>
      </header>

      {/* Two Column Layout details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Milestones, Tasks, Specs (Col span 8) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Milestones tracker */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-stone-900 border-b border-light-border/40 pb-2">Milestones Timeline</h3>
            
            <div className="space-y-3">
              {milestones.map(ms => (
                <div key={ms.id} className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-xs space-y-2">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <strong className="text-stone-900 block text-xs">{ms.title}</strong>
                      <span className="text-[10px] text-stone-450 font-semibold">Target date: {ms.targetDate}</span>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      ms.status === 'Completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}>
                      {ms.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-stone-200 h-1 rounded-full overflow-hidden">
                      <div className="bg-brand-emerald h-full" style={{ width: `${ms.completionPct}%` }}></div>
                    </div>
                    <span className="text-[10px] font-bold text-stone-500 shrink-0">{ms.completionPct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Task Management */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-light-border/40">
              <div>
                <h3 className="text-xs font-black uppercase text-stone-900 font-serif">Project Task List</h3>
                <p className="text-[10px] text-stone-450">Manage operational activities</p>
              </div>
            </div>

            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex justify-between items-center text-xs">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.status === 'Completed'}
                      onChange={() => handleToggleTaskStatus(task.id)}
                      className="w-4 h-4 text-brand-emerald rounded border-stone-300 focus:ring-brand-emerald cursor-pointer"
                    />
                    <div>
                      <strong className={`block text-stone-850 ${task.status === 'Completed' ? 'line-through text-stone-400' : ''}`}>
                        {task.name}
                      </strong>
                      <span className="block text-[8px] text-stone-400 font-bold uppercase mt-0.5">Assignee: {task.assignedTo} &bull; Due: {task.dueDate}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-[9px] font-black uppercase text-rose-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>

            {/* Add Task Form */}
            <form onSubmit={handleAddTask} className="space-y-2 pt-4 border-t border-light-border/40 text-xs">
              <span className="block text-[8.5px] font-black uppercase text-stone-850">Create New Project Task</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Task Name..."
                  value={newTaskName}
                  onChange={e => setNewTaskName(e.target.value)}
                  className="dbc-input"
                  required
                />
                <select
                  value={newTaskAssigned}
                  onChange={e => setNewTaskAssigned(e.target.value)}
                  className="dbc-input bg-white"
                >
                  <option value="John Anderson">John Anderson</option>
                  <option value="Vikram Singh">Vikram Singh</option>
                </select>
              </div>
              <button
                type="submit"
                className="dbc-btn dbc-btn-sm dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
              >
                Add Task
              </button>
            </form>
          </section>

          {/* Project Details Information */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-stone-900 border-b border-light-border/40 pb-2">Project Information</h3>
            <div className="space-y-3 font-semibold text-xs text-stone-600 leading-relaxed">
              <p><strong>Description:</strong> Soil bearing raft foundation alignment check and layout coordinate adjustments check.</p>
              <p><strong>Project Scope:</strong> Verify design blueprints, load computations, column positions, concrete mixing specs review.</p>
              <p><strong>Style Preference:</strong> Modern Minimalist Duplex.</p>
            </div>
          </section>

        </div>

        {/* Right Column: Customer details, team, timeline (Col span 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Customer summary card */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-stone-900">Client Summary</h3>
            <div className="space-y-3 font-semibold text-xs text-stone-600">
              <div className="flex justify-between border-b border-light-border/40 pb-1.5">
                <span>Client Name:</span> <strong className="text-stone-900">Ramesh Kumar</strong>
              </div>
              <div className="flex justify-between border-b border-light-border/40 pb-1.5">
                <span>Verification Status:</span> <strong className="text-brand-emerald">✓ Verified Account</strong>
              </div>
              <div className="flex justify-between border-b border-light-border/40 pb-1.5">
                <span>Project Type:</span> <strong className="text-stone-900">Civil Construction</strong>
              </div>
              <div className="flex justify-between">
                <span>Budget:</span> <strong className="text-stone-900">₹45,000</strong>
              </div>
            </div>
          </section>

          {/* Team Members */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-stone-900">Assigned Team</h3>
            <div className="space-y-3">
              {team.map((member, idx) => (
                <div key={idx} className="p-3 bg-stone-50 border border-stone-100 rounded-xl space-y-1 text-xs">
                  <strong className="text-stone-900 block">{member.name}</strong>
                  <div className="flex justify-between text-[10px] text-stone-450 font-bold uppercase">
                    <span>{member.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Project Attachments Documents */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-stone-900">Project Attachments</h3>
            <div className="space-y-2">
              {documents.map((doc, idx) => (
                <div key={idx} className="p-2.5 bg-stone-50 border border-stone-100 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-stone-850 block truncate max-w-[120px]">{doc.name}</span>
                    <span className="block text-[8px] text-stone-400 font-bold uppercase mt-0.5">{doc.type} &bull; {doc.date}</span>
                  </div>
                  <button
                    onClick={() => alert(`Downloading project file: ${doc.name}`)}
                    className="text-brand-emerald text-[8.5px] font-black uppercase hover:underline"
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Activity Timeline */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div>
              <h2 className="text-sm font-black text-stone-900 font-serif">Project Timeline Updates</h2>
              <p className="text-[11px] text-stone-450 font-medium">Audit logs of project updates</p>
            </div>

            <div className="space-y-4 relative border-l-2 border-stone-100 pl-4 ml-2">
              {activityTrail.map((item, idx) => (
                <div key={idx} className="relative space-y-0.5 text-xs font-semibold">
                  <span className="absolute -left-[23px] top-0 w-2 h-2 rounded-full bg-brand-emerald"></span>
                  <span className="block text-[8px] font-bold text-stone-400 uppercase tracking-widest">{item.date}</span>
                  <h4 className="font-bold text-stone-900 leading-tight">{item.action}</h4>
                  <p className="text-stone-500 text-[10px] leading-relaxed font-medium">By {item.user}</p>
                </div>
              ))}
            </div>
          </section>

        </div>

      </div>

      {/* Update Progress Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-light-border max-w-sm w-full p-6 rounded-3xl shadow-apple-lg space-y-4">
            <h3 className="text-sm font-black text-stone-900 font-serif">Update Project Completion %</h3>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-600">Drag to adjust progress value:</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={tempProgress}
                  onChange={e => setTempProgress(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-brand-emerald"
                />
                <span className="text-sm font-black text-stone-900">{tempProgress}%</span>
              </div>
            </div>
            <div className="flex gap-3 justify-end text-[10px] font-black uppercase tracking-wider pt-2">
              <button
                onClick={() => setShowProgressModal(false)}
                className="px-4 py-2 border border-stone-200 bg-white text-stone-750 hover:bg-stone-50 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProgress}
                className="px-4 py-2 bg-brand-emerald text-white rounded-xl"
              >
                Save Progress
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// Loading Skeletons
// ==========================================
function SkeletonProjectWorkspace() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left animate-pulse">
      <div className="h-10 w-48 bg-stone-250 bg-stone-200 rounded"></div>
      
      <div className="h-28 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 h-96 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
        <div className="lg:col-span-4 h-96 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
      </div>
    </div>
  );
}
