import React, { useState, useEffect, startTransition } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// ==========================================
// Types & Interfaces
// ==========================================
interface ReportSection {
  id: string;
  title: string;
  content: string;
}

interface DesignRec {
  id: string;
  category: string;
  text: string;
}

interface MaterialRec {
  id: string;
  name: string;
  tier: 'Premium' | 'Balanced' | 'Budget' | 'Eco-Friendly';
  description: string;
}

interface RiskItem {
  id: string;
  risk: string;
  severity: 'High' | 'Medium' | 'Low';
  mitigation: string;
}

interface AlternativeOption {
  id: string;
  name: string;
  description: string;
  advantages: string;
  cost: string;
  timeline: string;
}

interface VersionLog {
  version: string;
  editor: string;
  date: string;
  changes: string;
}

export default function ConsultationReportPage() {
  const { id = 'RP-501' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'Draft' | 'In Review' | 'Published' | 'Archived'>('Draft');
  
  // Autosave simulator
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState('Just now');

  // Report text sections
  const [sections, setSections] = useState<ReportSection[]>([
    { id: 'sec-1', title: 'Project Overview', content: 'Evaluation of the proposed 4BHK Gachibowli villa layout files. Ground floor plan checks under structural guidelines.' },
    { id: 'sec-2', title: 'Current Observations', content: 'Identified minor structural column misalignment near the main staircase node. Vastu doorway calculations match standards.' },
    { id: 'sec-3', title: 'Challenges Identified', content: 'Black cotton soil excavation requirements. Standard raft footing requires thick base overlays.' }
  ]);

  // Design Suggestions list
  const [designRecs, setDesignRecs] = useState<DesignRec[]>([
    { id: 'ds-1', category: 'Space Optimization', text: 'Merge utility kitchen wall into dining corridor to increase floor space index by 15%.' },
    { id: 'ds-2', category: 'Layout Suggestions', text: 'Rotate master bedroom entryway clockwise to satisfy Vastu boundary rules.' }
  ]);
  const [newDesignText, setNewDesignText] = useState('');
  const [newDesignCat, setNewDesignCat] = useState('Space Optimization');

  // Material Suggestions list
  const [materials, setMaterials] = useState<MaterialRec[]>([
    { id: 'mat-1', name: 'Fly Ash Brickwork Partitioning', tier: 'Eco-Friendly', description: 'Excellent load reduction for second tier walls compared to red clay bricks.' },
    { id: 'mat-2', name: 'Premium ACC Concrete Block base', tier: 'Premium', description: 'High curing speed and high shear compression ratings.' }
  ]);
  const [newMatName, setNewMatName] = useState('');
  const [newMatTier, setNewMatTier] = useState<'Premium' | 'Balanced' | 'Budget' | 'Eco-Friendly'>('Balanced');
  const [newMatDesc, setNewMatDesc] = useState('');

  // Budget summaries
  const [estBudget, setEstBudget] = useState('₹45,00,000');
  const [suggestedSavings, setSuggestedSavings] = useState('₹3,50,000');
  const [costBreakdown, setCostBreakdown] = useState('Foundation Slab: 30%, Bricks & Plastering: 25%, Steel Framing: 25%, Finishes: 20%');

  // Risks state
  const [risks, setRisks] = useState<RiskItem[]>([
    { id: 'r-1', risk: 'Monsoon basement soil softening', severity: 'High', mitigation: 'Inject micro-fine concrete grout slurry to anchor core footings.' },
    { id: 'r-2', risk: 'Column load displacement', severity: 'Medium', mitigation: 'Align staircase layout beams parallel to main load pillars.' }
  ]);
  const [newRiskText, setNewRiskText] = useState('');
  const [newRiskSev, setNewRiskSev] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newRiskMit, setNewRiskMit] = useState('');

  // Options state
  const options: AlternativeOption[] = [
    { id: 'opt-1', name: 'Option A: Premium Concrete Pile Base', description: 'Reinforced cement concrete structural frame with pile layout.', advantages: 'Zero moisture risk, matches high earthquakes guidelines.', cost: '₹12,00,000', timeline: '4 Weeks' },
    { id: 'opt-2', name: 'Option B: Balanced Raft Footing Overlay', description: 'Standard base foundation with micro-grouted sub-base alignment.', advantages: 'Highly cost effective, minimal material transport required.', cost: '₹8,50,000', timeline: '3 Weeks' }
  ];

  // Version History log
  const [versions, setVersions] = useState<VersionLog[]>([
    { version: 'v1.1', editor: 'John Anderson', date: '01-Aug-2026', changes: 'Added foundation soil mitigation strategies.' },
    { version: 'v1.0', editor: 'John Anderson', date: '30-Jul-2026', changes: 'Initial report draft layout initialized.' }
  ]);

  // Attachments
  const [attachments, setAttachments] = useState([
    { name: 'Villa_Blueprints_Marked.pdf', size: '3.4 MB', date: '01-Aug-2026' }
  ]);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  // Autosave simulator
  useEffect(() => {
    if (isLoading) return;
    startTransition(() => {
      setIsSaving(true);
    });
    const saveTimer = setTimeout(() => {
      startTransition(() => {
        setIsSaving(false);
        const time = new Date().toLocaleTimeString();
        setLastSaved(`Saved at ${time}`);
      });
    }, 850);
    return () => clearTimeout(saveTimer);
  }, [sections, designRecs, materials, risks, estBudget, suggestedSavings, costBreakdown, isLoading]);

  const handleUpdateSection = (id: string, newContent: string) => {
    setSections(prev => prev.map(sec => sec.id === id ? { ...sec, content: newContent } : sec));
  };

  const handleAddDesignRec = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesignText.trim()) return;
    setDesignRecs(prev => [...prev, { id: `ds-${Date.now()}`, category: newDesignCat, text: newDesignText.trim() }]);
    setNewDesignText('');
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim()) return;
    setMaterials(prev => [...prev, { id: `mat-${Date.now()}`, name: newMatName.trim(), tier: newMatTier, description: newMatDesc.trim() }]);
    setNewMatName('');
    setNewMatDesc('');
  };

  const handleAddRisk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRiskText.trim()) return;
    setRisks(prev => [...prev, { id: `r-${Date.now()}`, risk: newRiskText.trim(), severity: newRiskSev, mitigation: newRiskMit.trim() }]);
    setNewRiskText('');
    setNewRiskMit('');
  };

  const handlePublish = () => {
    setStatus('Published');
    setVersions(prev => [
      { version: `v1.${prev.length}`, editor: 'John Anderson', date: new Date().toLocaleDateString('en-IN'), changes: 'Published official report version.' },
      ...prev
    ]);
    alert('Report published successfully! Access link shared with the customer.');
  };

  if (isLoading) {
    return <SkeletonReport />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 text-left animate-gentle-fade select-none">
      
      {/* 1. Report Header */}
      <header className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm relative space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-stone-100 text-stone-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                ID: {id}
              </span>
              <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                status === 'Published' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
              }`}>
                {status}
              </span>
              {isSaving ? (
                <span className="text-[9px] text-emerald-600 font-bold animate-pulse">Autosaving changes...</span>
              ) : (
                <span className="text-[9px] text-stone-400 font-bold">{lastSaved}</span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 font-serif leading-tight">
              Villa Spatial Orientation & Design Report
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              Client: <strong>Ramesh Kumar</strong> &bull; Project: Gachibowli Modern Villa Construction Brief
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                alert('Draft report changes saved.');
              }}
              className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
            >
              Save Draft
            </button>
            <button
              onClick={handlePublish}
              disabled={status === 'Published'}
              className="dbc-btn dbc-btn-md dbc-btn-primary"
            >
              Publish Report
            </button>
            <button
              onClick={() => alert('PDF generation scheduled. Report layout catalog download placeholder.')}
              className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
            >
              Download PDF
            </button>
            <button
              onClick={() => navigate(-1)}
              className="dbc-btn dbc-btn-md dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
            >
              Exit Editor
            </button>
          </div>
        </div>
      </header>

      {/* Two Column Document Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Structured editor fields */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Report Sections Editor */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 border-b border-light-border/40 pb-2">Structured Report Sections</h3>
            
            <div className="space-y-4">
              {sections.map(sec => (
                <div key={sec.id} className="space-y-2">
                  <label className="block text-[10px] font-black text-stone-450 uppercase tracking-wider">{sec.title}</label>
                  <textarea
                    value={sec.content}
                    onChange={e => handleUpdateSection(sec.id, e.target.value)}
                    className="dbc-input h-28 resize-none"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Design Recommendations List */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 border-b border-light-border/40 pb-2">Design & Architecture Recommendations</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {designRecs.map(rec => (
                <div key={rec.id} className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-1">
                  <span className="text-[8.5px] font-black text-brand-emerald uppercase tracking-wider">{rec.category}</span>
                  <p className="text-xs text-stone-700 font-semibold">{rec.text}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddDesignRec} className="space-y-3 pt-4 border-t border-light-border/40">
              <h4 className="text-[10px] font-black uppercase text-stone-850">Add Design Recommendation</h4>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={newDesignCat}
                  onChange={e => setNewDesignCat(e.target.value)}
                  className="dbc-input bg-white py-1.5 px-3"
                >
                  <option value="Space Optimization">Space Optimization</option>
                  <option value="Layout Suggestions">Layout Suggestions</option>
                  <option value="Color Themes">Color Themes</option>
                  <option value="Material Selection">Material Selection</option>
                </select>
                <input
                  type="text"
                  placeholder="e.g. Expand laundry corridor offsets..."
                  value={newDesignText}
                  onChange={e => setNewDesignText(e.target.value)}
                  className="col-span-2 dbc-input"
                  required
                />
              </div>
              <button type="submit" className="dbc-btn dbc-btn-md dbc-btn-primary">
                Add Design Recommendation
              </button>
            </form>
          </section>

          {/* Material Recommendations */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 border-b border-light-border/40 pb-2">Material Specifications</h3>
            
            <div className="space-y-3">
              {materials.map(mat => (
                <div key={mat.id} className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-stone-900">{mat.name}</h4>
                    <p className="text-[11px] text-stone-600 font-semibold">{mat.description}</p>
                  </div>
                  <span className="bg-emerald-50 border border-emerald-100 text-[8.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider text-emerald-800">
                    {mat.tier}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddMaterial} className="space-y-3 pt-4 border-t border-light-border/40">
              <h4 className="text-[10px] font-black uppercase text-stone-850">Add Material Spec</h4>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Material name..."
                  value={newMatName}
                  onChange={e => setNewMatName(e.target.value)}
                  className="dbc-input"
                  required
                />
                <select
                  value={newMatTier}
                  onChange={e => setNewMatTier(e.target.value as 'Premium' | 'Balanced' | 'Budget' | 'Eco-Friendly')}
                  className="dbc-input bg-white py-1.5 px-3"
                >
                  <option value="Premium">Premium</option>
                  <option value="Balanced">Balanced</option>
                  <option value="Budget">Budget</option>
                  <option value="Eco-Friendly">Eco-Friendly</option>
                </select>
                <input
                  type="text"
                  placeholder="Usage description..."
                  value={newMatDesc}
                  onChange={e => setNewMatDesc(e.target.value)}
                  className="dbc-input"
                  required
                />
              </div>
              <button type="submit" className="dbc-btn dbc-btn-md dbc-btn-primary">
                Add Material
              </button>
            </form>
          </section>

          {/* Alternative Options Table */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-900">Alternative Cost Scenarios</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-light-border text-[9px] font-black uppercase text-stone-400">
                    <th className="py-2.5">Solution Option</th>
                    <th className="py-2.5">Advantages</th>
                    <th className="py-2.5">Cost Estimate</th>
                    <th className="py-2.5">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border/40 text-stone-750 font-semibold">
                  {options.map(opt => (
                    <tr key={opt.id}>
                      <td className="py-3">
                        <strong className="block text-stone-900">{opt.name}</strong>
                        <span className="text-[10px] text-stone-450">{opt.description}</span>
                      </td>
                      <td className="py-3">{opt.advantages}</td>
                      <td className="py-3 font-bold text-stone-900">{opt.cost}</td>
                      <td className="py-3">{opt.timeline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

        </div>

        {/* Right Column: Budgets, Risks, Versions & Actions */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Smart Assistant Placeholder */}
          <section className="bg-gradient-to-br from-stone-950 to-stone-900 border border-stone-850 p-6 rounded-3xl shadow-apple-sm text-white space-y-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <div className="space-y-0.5">
              <span className="text-[8.5px] font-black uppercase text-emerald-400 tracking-wider">Report Smart Assistant</span>
              <h3 className="text-xs font-black">AI Documentation Suggestions</h3>
            </div>
            <ul className="space-y-2 text-[10px] text-stone-300 font-medium">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✦</span>
                <span>Evaluate cost breakdown breakdown.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✦</span>
                <span>Verify Fly Ash Brick Eco ratings metadata.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✦</span>
                <span>Include contingency funds buffer inside budget.</span>
              </li>
            </ul>
          </section>

          {/* Budget Analysis Card */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm">
            <div>
              <h2 className="text-sm font-black text-stone-900">Budget Analysis</h2>
              <p className="text-[11px] text-stone-450 font-medium">Estimate review parameters</p>
            </div>
            <div className="space-y-3.5 text-xs font-bold text-stone-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[8px] font-black text-stone-450 uppercase tracking-wider">Est. Budget</span>
                  <input
                    type="text"
                    value={estBudget}
                    onChange={e => setEstBudget(e.target.value)}
                    className="dbc-input font-black"
                  />
                </div>
                <div>
                  <span className="block text-[8px] font-black text-stone-450 uppercase tracking-wider">Suggested Savings</span>
                  <input
                    type="text"
                    value={suggestedSavings}
                    onChange={e => setSuggestedSavings(e.target.value)}
                    className="dbc-input font-black text-brand-emerald"
                  />
                </div>
              </div>
              <div>
                <span className="block text-[8px] font-black text-stone-450 uppercase tracking-wider">Cost Breakdown Description</span>
                <input
                  type="text"
                  value={costBreakdown}
                  onChange={e => setCostBreakdown(e.target.value)}
                  className="dbc-input font-semibold"
                />
              </div>
            </div>
          </section>

          {/* Risk Mitigation */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div>
              <h2 className="text-sm font-black text-stone-900">Risk Assessment</h2>
              <p className="text-[11px] text-stone-450 font-medium">Severity mitigation register</p>
            </div>

            <div className="space-y-2.5">
              {risks.map(r => (
                <div key={r.id} className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5 text-xs text-left">
                  <div className="flex justify-between items-center">
                    <strong className="text-stone-900 font-black">{r.risk}</strong>
                    <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-full ${
                      r.severity === 'High' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {r.severity} Risk
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-600 leading-normal font-semibold">
                    <strong>Mitigation:</strong> {r.mitigation}
                  </p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddRisk} className="space-y-3 pt-3 border-t border-light-border/40">
              <input
                type="text"
                placeholder="Register new risk..."
                value={newRiskText}
                onChange={e => setNewRiskText(e.target.value)}
                className="dbc-input"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newRiskSev}
                  onChange={e => setNewRiskSev(e.target.value as 'High' | 'Medium' | 'Low')}
                  className="dbc-input bg-white py-1.5 px-3"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <input
                  type="text"
                  placeholder="Mitigation strategy..."
                  value={newRiskMit}
                  onChange={e => setNewRiskMit(e.target.value)}
                  className="dbc-input"
                  required
                />
              </div>
              <button type="submit" className="w-full dbc-btn dbc-btn-md dbc-btn-primary">
                Add Risk mitigation
              </button>
            </form>
          </section>

          {/* Attachments List */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-black text-stone-900">Attachments</h2>
              <button
                onClick={() => {
                  setAttachments(prev => [...prev, { name: 'Soil_Hydrology_Report.pdf', size: '1.8 MB', date: new Date().toLocaleDateString('en-IN') }]);
                  alert('Soil Hydrology report attached.');
                }}
                className="text-[10px] font-black text-brand-emerald hover:underline"
              >
                Attach File
              </button>
            </div>

            <div className="space-y-2">
              {attachments.map((file, idx) => (
                <div key={idx} className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-stone-850 block truncate max-w-[150px]">{file.name}</span>
                    <span className="block text-[8px] text-stone-400 font-bold uppercase mt-0.5">{file.size} &bull; {file.date}</span>
                  </div>
                  <button
                    onClick={() => alert(`Downloading attachment: ${file.name}`)}
                    className="text-brand-emerald text-[9px] font-bold uppercase tracking-wider hover:underline"
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Document Version history */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <h2 className="text-sm font-black text-stone-900">Version Ledger</h2>
            <div className="space-y-3">
              {versions.map((ver, idx) => (
                <div key={idx} className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs space-y-1 text-left">
                  <div className="flex justify-between items-center text-[10px] font-black text-stone-400 uppercase">
                    <span>Version: {ver.version}</span>
                    <span>{ver.date}</span>
                  </div>
                  <p className="font-semibold text-stone-850">{ver.changes}</p>
                  <span className="block text-[9px] text-stone-450">Author: {ver.editor}</span>
                </div>
              ))}
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
function SkeletonReport() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left animate-pulse">
      <div className="h-40 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="h-96 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
        </div>
        <div className="lg:col-span-4 space-y-4">
          <div className="h-64 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
          <div className="h-64 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
        </div>
      </div>
    </div>
  );
}
