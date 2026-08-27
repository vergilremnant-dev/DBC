import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectCard } from '../../../components/workspace/projects/ProjectCard';
import type { ProjectData } from '../../../components/workspace/projects/ProjectCard';
import { ProjectDetails } from '../../../components/workspace/projects/ProjectDetails';
import { ProjectSummaryCard } from '../../../components/workspace/projects/ProjectSummaryCard';

const SEED_PROJECTS: ProjectData[] = [
  {
    id: 'pr-101',
    name: 'Modular Villa Structural Milestones',
    customerName: 'Alice Architect',
    category: 'Architect',
    location: 'Gachibowli, Hyderabad',
    startDate: '05-Jun-2026',
    completionDate: '25-Aug-2026',
    status: 'In Progress',
    progress: 50,
    nextMilestone: 'Midway concrete wall inspection',
    priority: 'High',
    description: 'Provide complete layout coordinates blueprint calculations and coordinate columns layout checks.',
    milestones: [
      { id: 'm1', title: 'Project Assigned', dueDate: '10-Jun-2026', completed: true },
      { id: 'm2', title: 'Initial Discussion', dueDate: '15-Jun-2026', completed: true },
      { id: 'm3', title: 'Work Started', dueDate: '25-Jun-2026', completed: true },
      { id: 'm4', title: 'Midway Progress', dueDate: '10-Jul-2026', completed: false },
      { id: 'm5', title: 'Final Inspection', dueDate: '15-Aug-2026', completed: false },
      { id: 'm6', title: 'Completed', dueDate: '25-Aug-2026', completed: false }
    ]
  },
];

interface ConsultationSession {
  id: string;
  clientName: string;
  topic: string;
  date: string;
  timeSlot: string;
  status: 'Draft' | 'Published' | 'Completed';
  notes: string;
  recommendations: string[];
  reportTemplate: string;
  reportVersion: string;
}

const INITIAL_CONSULTATIONS: ConsultationSession[] = [
  {
    id: 'con-1',
    clientName: 'Alice Architect',
    topic: 'Villa Vastu & Spatial Orientation',
    date: '02 Aug 2026',
    timeSlot: '10:00 AM - 11:00 AM',
    status: 'Published',
    notes: 'Discussed bedroom window placement and balcony draft orientations.',
    recommendations: [
      'Shift master bedroom entrance by 3 feet to the east quadrant.',
      'Ensure kitchen hob faces exact southeast corner to maintain Vastu criteria.',
    ],
    reportTemplate: 'Vastu Calculation Plan Template',
    reportVersion: 'v1.1',
  },
  {
    id: 'con-2',
    clientName: 'Bob Builder',
    topic: 'Solar Roof Grid structural check',
    date: '05 Aug 2026',
    timeSlot: '02:30 PM - 03:30 PM',
    status: 'Draft',
    notes: 'Drafting roof loading structural tolerance bounds check report.',
    recommendations: [
      'Increase support struts count from 4 to 8 to distribute load weights.',
    ],
    reportTemplate: 'Structural Survey Report Template',
    reportVersion: 'v1.0',
  },
];

export default function ProfessionalProjects() {
  const navigate = useNavigate();
  const [workspaceView, setWorkspaceView] = useState<'PRO' | 'CONSULTANT'>(() => {
    return (localStorage.getItem('dbc_provider_view') as 'PRO' | 'CONSULTANT') || 'PRO';
  });

  useEffect(() => {
    const handleStorage = () => {
      setWorkspaceView((localStorage.getItem('dbc_provider_view') as 'PRO' | 'CONSULTANT') || 'PRO');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Pro Trade states
  const [projects] = useState<ProjectData[]>(() => {
    const raw = localStorage.getItem('dbc_professional_projects');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (err) {
        console.warn('Failed to parse professional projects', err);
      }
    }
    return SEED_PROJECTS;
  });
  const [activeTab, setActiveTab] = useState('ALL'); 

  // Consultant states
  const [consults, setConsults] = useState<ConsultationSession[]>(INITIAL_CONSULTATIONS);
  const [selectedConsultId, setSelectedConsultId] = useState<string>('con-1');
  const [recInput, setRecInput] = useState('');

  // Compute stats
  const stats = useMemo(() => {
    return {
      active: projects.filter(p => p.status === 'In Progress' || p.status === 'Planning').length,
      completed: projects.filter(p => p.status === 'Completed').length,
      onHold: projects.filter(p => p.status === 'On Hold').length,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let result = [...projects];
    if (activeTab === 'IN_PROGRESS') result = result.filter(p => p.status === 'In Progress' || p.status === 'Planning');
    return result;
  }, [projects, activeTab]);

  const selectedProject = null;

  // Consultant functions
  const activeConsult = consults.find(c => c.id === selectedConsultId) || null;

  const handleAddRec = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recInput.trim() || !activeConsult) return;

    setConsults(prev =>
      prev.map(c =>
        c.id === activeConsult.id
          ? { ...c, recommendations: [...c.recommendations, recInput.trim()] }
          : c
      )
    );
    setRecInput('');
    alert('Recommendation added to advice board!');
  };

  const handlePublishReport = (id: string) => {
    setConsults(prev => prev.map(c => c.id === id ? { ...c, status: 'Published' } : c));
    alert('Technical report generated and published to customer inbox.');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-left relative pb-10 animate-gentle-fade">
      
      {workspaceView === 'CONSULTANT' ? (
        // CONSULTANT VIEW: MY CONSULTATIONS
        <div className="space-y-6">
          <div className="border-b border-light-border pb-5 space-y-1">
            <h1 className="text-xl font-bold text-stone-900 font-serif">My Consultations</h1>
            <p className="text-xs text-stone-500 font-medium font-semibold">
              Track your advisory sessions, write recommendations, and publish structural reports.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Sessions List */}
            <div className="lg:col-span-6 space-y-3">
              {consults.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedConsultId(c.id)}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition
                    ${c.id === selectedConsultId 
                      ? 'bg-brand-emerald/5 border-brand-emerald/30 shadow-xs' 
                      : 'bg-white border-light-border hover:bg-light-stone/30'
                    }
                  `}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-stone-black">{c.topic}</h4>
                    <span className={`dbc-badge text-[7.5px] py-0.5 ${
                      c.status === 'Published' ? 'dbc-badge-completed' : 'dbc-badge-progress'
                    }`}>{c.status}</span>
                  </div>
                  <p className="text-[10px] text-stone-gray font-semibold mt-1">Client: {c.clientName}</p>
                  <span className="block text-[8px] text-stone-gray mt-2 pt-2 border-t border-light-border/40">🗓️ {c.date} • {c.timeSlot}</span>
                </div>
              ))}
            </div>

            {/* Right Column: Advisory Details & Report Generator */}
            {activeConsult && (
              <div className="lg:col-span-6 space-y-6">
                
                {/* Session Details */}
                <div className="dbc-card space-y-4">
                  <div className="border-b border-light-border pb-3 flex justify-between items-start">
                    <div>
                      <h3 className="text-xs font-black text-stone-black">{activeConsult.topic}</h3>
                      <span className="block text-[8.5px] text-stone-gray font-bold mt-0.5">Client: {activeConsult.clientName}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-stone-gray font-semibold space-y-2">
                    <p>🗓️ <strong>Scheduled Slot:</strong> {activeConsult.date} • {activeConsult.timeSlot}</p>
                    <p>📝 <strong>Meeting Notes:</strong> "{activeConsult.notes}"</p>
                  </div>
                </div>

                {/* Recommendations Editor */}
                <div className="dbc-card space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Expert Recommendations</h3>
                  
                  <div className="space-y-2">
                    {activeConsult.recommendations.map((rec, i) => (
                      <div key={i} className="p-3 bg-light-stone/30 border border-light-border rounded-xl text-[10px] text-stone-gray font-semibold leading-relaxed">
                        👉 {rec}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddRec} className="flex gap-2 pt-2 border-t border-light-border/40">
                    <input
                      type="text"
                      placeholder="Add recommendation (e.g. increase structural column width)..."
                      value={recInput}
                      onChange={(e) => setRecInput(e.target.value)}
                      className="flex-1 dbc-input text-xs"
                    />
                    <button type="submit" className="dbc-btn dbc-btn-primary py-1 px-3 text-[9px] font-bold uppercase tracking-wider cursor-pointer">
                      Add
                    </button>
                  </form>
                </div>

                {/* Technical Report Generator */}
                <div className="dbc-card space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Technical Report Builder</h3>
                  <div className="text-[10px] text-stone-gray font-semibold space-y-2 leading-relaxed">
                    <p>📊 <strong>Selected Template:</strong> {activeConsult.reportTemplate}</p>
                    <p>🔢 <strong>Version Code:</strong> {activeConsult.reportVersion}</p>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-light-border/40">
                    {activeConsult.status === 'Draft' ? (
                      <button
                        onClick={() => handlePublishReport(activeConsult.id)}
                        className="dbc-btn dbc-btn-primary py-2 px-4 text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Publish & Submit Report
                      </button>
                    ) : (
                      <button
                        onClick={() => alert('Downloading technical compliance report PDF...')}
                        className="dbc-btn dbc-btn-outline py-2 px-4 text-[9px] font-bold uppercase tracking-wider bg-white cursor-pointer"
                      >
                        Download PDF Report
                      </button>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      ) : (
        // TRADE PRO VIEW: PROJECTS
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-200 pb-5 gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-stone-900 font-serif">My Projects</h1>
              <p className="text-xs text-stone-500 font-medium font-semibold">
                Manage your ongoing and completed customer project coordinates.
              </p>
            </div>
            <button
              onClick={() => alert('Project Calendar coming soon!')}
              className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
            >
              📅 Project Calendar
            </button>
          </div>

          <ProjectSummaryCard
            activeCount={stats.active}
            completedCount={stats.completed}
            onHoldCount={stats.onHold}
            overdueCount={0}
            activeFilter={activeTab}
            onFilterSelect={setActiveTab}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className={`space-y-3 ${selectedProject ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
              {filteredProjects.map((proj) => (
                <ProjectCard
                  key={proj.id}
                  project={proj}
                  isSelected={false}
                  onSelect={() => navigate(`/workspace/project/${proj.id}`)}
                />
              ))}
            </div>

            {selectedProject && (
              <div className="lg:col-span-5">
                <ProjectDetails
                  project={selectedProject}
                  onToggleMilestone={(mId) => {
                    alert(`Toggled milestone ${mId}`);
                  }}
                  onStatusChange={(status) => alert(`Status shifted to ${status}`)}
                />
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
