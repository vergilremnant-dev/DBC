import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoutButton } from '../../components/auth/LogoutButton';
import { BrandLogo } from '../../components/common/BrandLogo';

type AiTab = 'assistant' | 'requirement' | 'planning' | 'document' | 'risk';

interface MatchResult {
  providerName: string;
  category: string;
  matchScore: number;
  reasons: string[];
}

interface RiskItem {
  id: string;
  category: 'Budget' | 'Schedule' | 'Approval' | 'Resource';
  description: string;
  probability: 'Low' | 'Medium' | 'High';
  impact: 'Medium' | 'Critical';
  mitigation: string;
}

const MOCK_MATCHES: MatchResult[] = [
  { providerName: 'Bob Builder', category: 'General Contractor', matchScore: 96, reasons: ['98% similarity on concrete foundation projects', 'Proximity within 2.5 km', 'Consistent 4.9 rating on structural safety compliance'] },
  { providerName: 'Dave Decorator', category: 'Interior Designer', matchScore: 89, reasons: ['Specializes in luxury interior spaces', 'Budget match accuracy within 5%', 'High availability for site visits this quarter'] },
];

const MOCK_RISKS: RiskItem[] = [
  { id: 'risk-1', category: 'Schedule', description: 'Monsoon delay on external structural framing concrete cure', probability: 'High', impact: 'Critical', mitigation: 'Reorder interior plumbing pipelines installation to cure slabs concurrently.' },
  { id: 'risk-2', category: 'Budget', description: 'Raw steel market price index variance exceed estimate range', probability: 'Medium', impact: 'Medium', mitigation: 'Leverage pre-negotiated wholesale bulk orders with suppliers.' },
];

export function SmartIntelligencePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AiTab>('assistant');

  // Input states
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('DBC Smart AI is initialized. Ask me anything about project tasks, budgets, or blueprint summaries.');
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);

  // Requirement analyzer variables
  const [reqText, setReqText] = useState('');
  const [reqScore, setReqScore] = useState<number | null>(null);
  const [reqSuggestions, setReqSuggestions] = useState<string[]>([]);
  const [isAnalyzingReq, setIsAnalyzingReq] = useState(false);

  // Planning generator states
  const [planTitle, setPlanTitle] = useState('');
  const [generatedMilestones, setGeneratedMilestones] = useState<{ name: string; duration: string; costShare: number }[]>([]);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // Document intelligence states
  const [docSummary, setDocSummary] = useState('');
  const [docActions, setDocActions] = useState<string[]>([]);
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);

  // Risk items
  const [projectRisks] = useState<RiskItem[]>(MOCK_RISKS);

  // Context role
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

  // AI Prompt Dispatcher
  const handleQueryAssistant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantPrompt.trim()) return;

    setIsLoadingPrompt(true);
    setAssistantResponse('Analyzing contextual database and billing indexes...');

    setTimeout(() => {
      const promptLower = assistantPrompt.toLowerCase();
      const response = promptLower.includes('invoice') || promptLower.includes('billing')
        ? `[AI Analysis - Confidence 94%]: Found 2 invoices for Alice Architect. INV-2026-89 is outstanding (Due in 15 days). Recommendation: Send automated payment reminder to client to preempt cash flow gaps.`
        : promptLower.includes('professional') || promptLower.includes('match')
        ? `[AI Recommendation - Confidence 96%]: Recommended provider matches: Bob Builder (96% compatibility based on previous concrete layout profiles) and Dave Decorator (89% compatibility for interior details).`
        : promptLower.includes('safety') || promptLower.includes('rule')
        ? `[AI Standards Check - Confidence 91%]: Living room ceiling heights must confirm to local building regulations Section 12-A (minimum 2.75 meters clearance).`
        : `[AI Assistant - Confidence 88%]: Synced active project parameters. The current stage is "Execution". Next recommended workflow actions: Upload foundation moisture certificate to unlock Milestone 2 payments.`;

      setAssistantResponse(response);
      setAssistantPrompt('');
      setIsLoadingPrompt(false);
    }, 1200);
  };

  // Analyze requirement input
  const handleAnalyzeRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqText.trim()) return;

    setIsAnalyzingReq(true);
    setReqScore(null);

    setTimeout(() => {
      const textLen = reqText.trim().length;
      if (textLen < 30) {
        setReqScore(45);
        setReqSuggestions([
          'Add architectural category preferences.',
          'Specify raw material grade choices (e.g. ACC cement, grade-A steel).',
          'Clarify target milestone completion dates.',
        ]);
      } else {
        setReqScore(88);
        setReqSuggestions([
          'Scope details look healthy. Estimated budget threshold: ₹20-25 Lakhs.',
          'Suggested Timeline duration: 120 days.',
          'Category automatically classified: Structural Residential Renovation.',
        ]);
      }
      setIsAnalyzingReq(false);
    }, 1500);
  };

  // Generate suggested phases
  const handleGeneratePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle.trim()) return;

    setIsGeneratingPlan(true);
    setGeneratedMilestones([]);

    setTimeout(() => {
      setGeneratedMilestones([
        { name: 'Ground Excavation & Curing', duration: '15 Days', costShare: 35 },
        { name: 'Structural Beam Framing', duration: '20 Days', costShare: 45 },
        { name: 'MEP Sanitary Conduits Installation', duration: '12 Days', costShare: 20 },
      ]);
      setIsGeneratingPlan(false);
    }, 1800);
  };

  // Summarize mockup documents
  const handleAnalyzeDocument = (type: 'contract' | 'blueprint') => {
    setIsAnalyzingDoc(true);
    setDocSummary('');
    setDocActions([]);

    setTimeout(() => {
      if (type === 'contract') {
        setDocSummary('Standard DBC Execution Agreement. Validates structural concrete milestones and billing timelines.');
        setDocActions([
          'Verify penalty terms for milestone delivery delay exceed 15 days.',
          'Verify raw material cost adjustments clauses in case price index varies by >10%.',
        ]);
      } else {
        setDocSummary('Structural floor blueprint plan layout. Details masonry dimensions and conduit quadrants.');
        setDocActions([
          'Coordinate plumbing conduits with structural columns clearances on Section C.',
          'Ensure living room clearance height is set to 2.8 meters.',
        ]);
      }
      setIsAnalyzingDoc(false);
    }, 1500);
  };

  // Accept/feedback loops
  const handleAcceptAIAction = (msg: string) => {
    alert(`Suggestion accepted: "${msg}". Initializing workflow transitions.`);
  };

  return (
    <div className="min-h-screen bg-warm-cream text-stone-900 font-sans flex flex-col pb-10">
      
      {/* 1. Header Shell */}
      <header className="sticky top-0 z-30 border-b border-light-border bg-white shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo variant="header" />
            <span className="rounded bg-stone-900 px-2.5 py-0.5 text-3xs font-black text-white uppercase tracking-wider">
              Smart Assistant
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-xs font-bold text-stone-600 hover:text-stone-900 transition bg-light-stone/30 px-3 py-1.5 rounded-xl border border-light-border"
            >
              Exit Workspace
            </button>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* 2. Sub-Tab Switcher Row */}
      <main className="mx-auto max-w-6xl w-full px-4 py-8 sm:px-6 space-y-6 flex-1 text-left">
        
        <section className="flex gap-2 border-b border-stone-200 overflow-x-auto pb-1 text-3xs font-black uppercase tracking-wider no-scrollbar">
          {([
            { id: 'assistant', label: 'Global AI Assistant', icon: '🤖' },
            { id: 'requirement', label: 'Smart Requirements', icon: '📝' },
            { id: 'planning', label: 'Planning & Budgets', icon: '📊' },
            { id: 'document', label: 'Document Intel', icon: '📄' },
            { id: 'risk', label: 'Risk & Timeline Optimizer', icon: '⚡' },
          ] as const).map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2.5 border-b-2 font-bold transition whitespace-nowrap cursor-pointer select-none
                  ${isActive 
                    ? 'border-emerald-600 text-emerald-800 font-extrabold' 
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                  }
                `}
              >
                <span>{t.icon}</span>
                <span className="ml-1.5">{t.label}</span>
              </button>
            );
          })}
        </section>

        {/* Responsible AI Disclaimer Alert banner */}
        <div className="rounded-2xl bg-stone-100 border border-light-border p-4 text-2xs font-semibold text-stone-gray leading-relaxed flex items-start gap-2.5">
          <span className="text-sm">🛡️</span>
          <div>
            <strong>Responsible AI Disclosure:</strong> Suggestions are generated by machine learning models to assist project planning. All estimations, budget forecasts, and code suggestions require independent validation and manual sign-off before contract execution.
          </div>
        </div>

        {/* 3. Tab Contents Layout */}

        {/* GLOBAL AI ASSISTANT */}
        {activeTab === 'assistant' && (
          <div className="grid gap-6 sm:grid-cols-3">
            
            {/* Assistant prompt side box */}
            <div className="sm:col-span-2 space-y-4">
              <div className="dbc-card space-y-4">
                <div className="flex justify-between items-center border-b border-light-border/40 pb-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">AI Dialogue Workspace</h3>
                  <span className="dbc-badge text-3xs py-0.5">Role Mode: {currentUserRole}</span>
                </div>

                <div className="p-4 bg-light-stone/20 border border-light-border rounded-2xl min-h-36 text-xs text-stone-gray font-semibold leading-relaxed whitespace-pre-wrap">
                  {isLoadingPrompt ? (
                    <div className="animate-pulse text-stone-400 font-black">Analyzing contextual parameters & planning indexes...</div>
                  ) : (
                    assistantResponse
                  )}
                </div>

                {/* Form prompt */}
                <form onSubmit={handleQueryAssistant} className="flex gap-2.5 pt-2 border-t border-light-border/40">
                  <input
                    type="text"
                    placeholder="Ask about project risks, match suggestions, building codes..."
                    value={assistantPrompt}
                    onChange={(e) => setAssistantPrompt(e.target.value)}
                    className="flex-1 bg-light-stone/40 border border-light-border rounded-xl px-4 py-2 text-xs text-stone-black focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald"
                  />
                  <button type="submit" className="dbc-btn dbc-btn-primary px-5 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                    Ask AI
                  </button>
                </form>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="dbc-card space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Suggested Prompts</h3>
              <div className="space-y-2 text-2xs font-black uppercase tracking-wider">
                <button
                  onClick={() => {
                    setAssistantPrompt('Are there any outstanding billing invoices?');
                    setTimeout(() => document.getElementById('ask-btn')?.click(), 50);
                  }}
                  className="w-full p-3 bg-white hover:bg-light-stone/30 rounded-xl text-stone-black text-left border border-light-border transition"
                >
                  🔍 Scan outstanding invoices
                </button>
                <button
                  onClick={() => {
                    setAssistantPrompt('What are the safety building codes for living room heights?');
                    setTimeout(() => document.getElementById('ask-btn')?.click(), 50);
                  }}
                  className="w-full p-3 bg-white hover:bg-light-stone/30 rounded-xl text-stone-black text-left border border-light-border transition"
                >
                  📖 Check ceiling code restrictions
                </button>
              </div>
            </div>

          </div>
        )}

        {/* SMART REQUIREMENTS */}
        {activeTab === 'requirement' && (
          <div className="grid gap-6 sm:grid-cols-2">
            
            {/* Input Requirement */}
            <form onSubmit={handleAnalyzeRequirement} className="dbc-card space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Requirement Scope Writer</h3>
              <p className="text-2xs text-stone-gray font-semibold leading-relaxed">
                Describe your project renovation details in plain English. The AI will categorize, evaluate scope gaps, and output quality score matrices.
              </p>
              
              <textarea
                placeholder="Describe project details (e.g. Renovation of 3-bedroom structural living spaces with plumbing conduits)..."
                value={reqText}
                onChange={(e) => setReqText(e.target.value)}
                className="dbc-input h-28 resize-none"
                required
              />

              <button type="submit" className="w-full dbc-btn dbc-btn-primary py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer">
                Evaluate Scope Quality
              </button>
            </form>

            {/* Suggestions report */}
            <div className="dbc-card space-y-4 text-left">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">AI Quality Matrix</h3>
              
              {isAnalyzingReq ? (
                <div className="text-xs text-stone-400 font-semibold animate-pulse py-6">Checking code references and structural details...</div>
              ) : reqScore === null ? (
                <div className="text-center py-10 text-stone-400 text-xs">Enter scope text on the left to initialize analysis.</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-light-border/40 pb-2">
                    <span className="text-xs font-bold text-stone-black">Requirement Quality Score:</span>
                    <strong className={`text-base font-extrabold ${reqScore >= 80 ? 'text-brand-emerald' : 'text-amber-600'}`}>{reqScore}/100</strong>
                  </div>
                  
                  <div className="space-y-2">
                    <span className="block text-3xs font-black uppercase tracking-widest text-stone-gray">AI Structural Gaps Recommendations</span>
                    <ul className="list-disc pl-4 text-xs font-semibold text-stone-gray space-y-1.5 leading-relaxed">
                      {reqSuggestions.map((sug, idx) => (
                        <li key={idx}>{sug}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* PLANNING & BUDGETS */}
        {activeTab === 'planning' && (
          <div className="grid gap-6 sm:grid-cols-2">
            
            {/* Planner prompt */}
            <form onSubmit={handleGeneratePlan} className="dbc-card space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Project Milestone Planner</h3>
              <p className="text-2xs text-stone-gray font-semibold leading-relaxed">
                Provide project scope titles to auto-generate recommended structural phases, resource schedules, and cost distributions.
              </p>
              
              <input
                type="text"
                placeholder="e.g. 3-Storey Residential Concrete Frame"
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                className="dbc-input"
                required
              />

              <button type="submit" className="w-full dbc-btn dbc-btn-primary py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer">
                Suggest Timeline & Milestones
              </button>
            </form>

            {/* Generated results */}
            <div className="dbc-card space-y-4 text-left">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Generated Execution Path</h3>
              
              {isGeneratingPlan ? (
                <div className="text-xs text-stone-400 font-semibold animate-pulse py-6">Structuring timeline dependencies...</div>
              ) : generatedMilestones.length === 0 ? (
                <div className="text-center py-10 text-stone-400 text-xs">Submit project timeline queries to view options.</div>
              ) : (
                <div className="space-y-3">
                  {generatedMilestones.map((m, idx) => (
                    <div key={idx} className="p-3 bg-light-stone/20 border border-light-border rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <h4 className="font-black text-stone-black">{m.name}</h4>
                        <span className="block text-3xs text-stone-gray font-bold mt-1">Duration: {m.duration} &bull; Allocation: {m.costShare}% of budget</span>
                      </div>
                      <button
                        onClick={() => handleAcceptAIAction(`Import milestone: ${m.name}`)}
                        className="text-3xs font-black text-brand-emerald hover:underline focus:outline-none"
                      >
                        Accept
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* DOCUMENT INTEL */}
        {activeTab === 'document' && (
          <div className="grid gap-6 sm:grid-cols-3 text-left">
            
            {/* Actions triggers */}
            <div className="dbc-card space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Extract Document Context</h3>
              <p className="text-2xs text-stone-gray font-semibold leading-relaxed">
                Choose mock files below to test contract highlights extraction and blueprint summaries.
              </p>
              
              <div className="space-y-2 text-3xs font-black uppercase tracking-wider">
                <button
                  onClick={() => handleAnalyzeDocument('contract')}
                  className="w-full p-2.5 bg-light-stone hover:bg-light-stone/85 rounded-xl border border-light-border text-stone-black text-left"
                >
                  📄 Summarize Execution Contract
                </button>
                <button
                  onClick={() => handleAnalyzeDocument('blueprint')}
                  className="w-full p-2.5 bg-light-stone hover:bg-light-stone/85 rounded-xl border border-light-border text-stone-black text-left"
                >
                  📐 Summarize Masonry Blueprints
                </button>
              </div>
            </div>

            {/* Summarizer outputs */}
            <div className="dbc-card sm:col-span-2 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Summary Insights</h3>
              
              {isAnalyzingDoc ? (
                <div className="text-xs text-stone-400 font-semibold animate-pulse py-6">Parsing layout files and clauses...</div>
              ) : !docSummary ? (
                <div className="text-center py-10 text-stone-400 text-xs">Choose document files on the left to extract.</div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-light-stone/10 border border-light-border rounded-xl">
                    <h4 className="text-xs font-bold text-stone-black mb-1">Document Synopsis</h4>
                    <p className="text-xs text-stone-gray leading-relaxed font-semibold">{docSummary}</p>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-3xs font-black uppercase tracking-widest text-stone-gray">Key Action Items</span>
                    <ul className="list-disc pl-4 text-xs font-semibold text-stone-gray space-y-1.5 leading-relaxed">
                      {docActions.map((act, idx) => (
                        <li key={idx}>{act}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* RISK & TIMELINE OPTIMIZER */}
        {activeTab === 'risk' && (
          <div className="grid gap-6 sm:grid-cols-3 text-left">
            
            {/* Match recommendations */}
            <div className="dbc-card space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Intelligent Provider Matches</h3>
              <div className="space-y-3">
                {MOCK_MATCHES.map((m, idx) => (
                  <div key={idx} className="p-3 bg-light-stone/20 border border-light-border rounded-2xl space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-stone-black">{m.providerName}</h4>
                      <span className="text-2xs font-black text-brand-emerald">{m.matchScore}% Match</span>
                    </div>
                    <ul className="text-3xs text-stone-gray font-semibold space-y-1 list-disc pl-3 leading-relaxed">
                      {m.reasons.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk indicators list */}
            <div className="sm:col-span-2 space-y-4">
              <div className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Mitigation Risk Register</h3>
                
                <div className="space-y-4">
                  {projectRisks.map((r) => (
                    <div key={r.id} className="p-4 bg-light-stone/10 border border-light-border rounded-2xl space-y-2.5">
                      <div className="flex justify-between items-center border-b border-light-border/40 pb-1.5">
                        <span className="text-xs font-black text-stone-black">Category: {r.category}</span>
                        <span className="dbc-badge dbc-badge-priority text-3xs py-0.5">Prob: {r.probability} &bull; Imp: {r.impact}</span>
                      </div>
                      <p className="text-xs text-stone-gray font-semibold leading-relaxed">
                        <strong>Observed risk:</strong> "{r.description}"<br />
                        <strong>Suggested action:</strong> "{r.mitigation}"
                      </p>
                      
                      <div className="pt-2 border-t border-light-border/40 flex justify-end">
                        <button
                          onClick={() => handleAcceptAIAction(`Mitigate risk: ${r.description}`)}
                          className="dbc-btn dbc-btn-primary py-1 px-4 text-3xs font-bold uppercase cursor-pointer"
                        >
                          Trigger Mitigation Path
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
export default SmartIntelligencePage;
