import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// ==========================================
// Types & Interfaces
// ==========================================
interface ActivityItem {
  date: string;
  action: string;
  user: string;
}

interface SimilarLead {
  id: string;
  title: string;
  budget: string;
  location: string;
}

export default function RequirementWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // States
  const [isSaved, setIsSaved] = useState(false);
  const [interestSubmitted, setInterestSubmitted] = useState(false);

  // Mock Requirement detail data
  const reqData = {
    id: id || 'REQ-201',
    title: 'Structural blueprint load-bearing review for Duplex',
    category: 'Architecture',
    status: 'Open',
    postedDate: '2 hours ago',
    location: 'Gachibowli, Hyderabad',
    propertyType: 'Residential Villa (G+2)',
    priority: 'High',
    shortDesc: 'Verify column layout alignment and beam reinforcement coordinates before excavation.',
    fullDesc: 'We are planning to construct a modern 4BHK duplex villa. The plot area is 3000 sqft. Architectural floor plan drawings have been drafted, and soil bearing capacity test reports are available. We need a licensed structural engineer/architect to audit the blueprint columns orientation, cross-check beam loads limits, and verify entrance directions according to standard Vastu guidelines before concrete casting begins.',
    scope: [
      'Audit architectural AutoCAD blueprints coordinate alignment.',
      'Perform civil load calculations verification for concrete beams.',
      'Draft soil bearing raft foundation adjustment report.',
      'Verify Vastu orientation for entrance doorway & kitchen hearth.'
    ],
    deliverables: [
      'Certified Structural load checklist report',
      'Foundation layout draft amendments recommendations',
      'Stairwell steel bar spacing guidelines statement'
    ],
    startDate: '2026-08-15',
    timeline: '3 Weeks',
    budgetRange: '₹45,000 - ₹55,000',
    budgetFlexible: 'Fixed Budget',
    customer: {
      name: 'Ramesh Kumar',
      verified: true,
      memberSince: '2024',
      completedProjects: 3
    },
    specs: {
      size: '3000 sqft',
      stage: 'Planning & Layout Approval',
      materials: 'Fe 550 Steel, Standard M25 Concrete mix design',
      style: 'Modern Minimalist Elevation'
    },
    images: [
      { name: 'Site_Soil_Inspection.jpg', url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80' },
      { name: 'Elevation_Reference.jpg', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80' }
    ],
    documents: [
      { name: 'Soil_Bearing_Test_Report.pdf', size: '1.8 MB' },
      { name: 'Architectural_Draft_Blueprint.dwg', size: '14.5 MB' }
    ]
  };

  const activityTrail: ActivityItem[] = [
    { date: '01-Aug-2026', action: 'Requirement Created & Details Posted', user: 'Client Ramesh' },
    { date: '01-Aug-2026', action: 'Soil test report document uploaded', user: 'Client Ramesh' },
    { date: '01-Aug-2026', action: 'Blueprint drawings CAD file uploaded', user: 'Client Ramesh' }
  ];

  const similarRequirements: SimilarLead[] = [
    { id: 'REQ-203', title: 'L-Shaped Modular Kitchen space optimizations', budget: '₹25,000', location: 'Kondapur, Hyd' },
    { id: 'REQ-204', title: 'RCC beams lintel concrete calculations', budget: '₹1,35,000', location: 'Jubilee Hills, Hyd' }
  ];

  // Startup loader
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const handleExpressInterest = () => {
    if (interestSubmitted) return;
    const confirm = window.confirm('Are you sure you want to submit interest? Your contact coordinates will be shared with the client.');
    if (confirm) {
      setInterestSubmitted(true);
      alert('Interest logged. Client Ramesh Kumar has been notified.');
    }
  };

  if (isLoading) {
    return <SkeletonRequirementWorkspace />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 text-left animate-gentle-fade select-none">
      
      {/* Back button */}
      <button
        onClick={() => navigate('/workspace/leads')}
        className="text-xs font-bold text-stone-500 hover:text-stone-900 transition flex items-center gap-1 cursor-pointer"
      >
        ← Back to Requirement Marketplace
      </button>

      {/* 1. Header */}
      <header className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-stone-100 border border-light-border text-stone-700 text-[8.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              ID: {reqData.id}
            </span>
            <span className="bg-emerald-50 text-emerald-800 text-[8.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {interestSubmitted ? 'Interest Submitted' : reqData.status}
            </span>
            <span className="bg-amber-50 text-amber-800 text-[8.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {reqData.priority} Priority
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight font-serif">{reqData.title}</h1>
          <p className="text-xs text-stone-500 font-medium">{reqData.category} &bull; {reqData.location} &bull; Posted {reqData.postedDate}</p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs shrink-0">
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={`dbc-btn dbc-btn-md dbc-btn-secondary ${
              isSaved ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            {isSaved ? '★ Saved' : '☆ Save Requirement'}
          </button>
          
          <button
            onClick={handleExpressInterest}
            disabled={interestSubmitted}
            className={`dbc-btn dbc-btn-md ${
              interestSubmitted ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed' : 'dbc-btn-primary'
            }`}
          >
            {interestSubmitted ? '✓ Interest Logged' : 'Express Interest'}
          </button>
        </div>
      </header>

      {/* Two Column Layout details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Specs, descriptions, scope, documents (Col span 8) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Overview & Scope */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-stone-900 border-b border-light-border/40 pb-2">Requirement Overview</h3>
            <p className="text-xs text-stone-600 font-bold leading-relaxed italic">"{reqData.shortDesc}"</p>
            <p className="text-xs text-stone-600 font-semibold leading-relaxed">{reqData.fullDesc}</p>

            <div className="space-y-2.5 pt-3 border-t border-light-border/40">
              <span className="block text-[8px] font-black uppercase text-stone-450 tracking-wider">Project Scope</span>
              <ul className="space-y-1.5 text-xs text-stone-600 font-semibold">
                {reqData.scope.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-brand-emerald">✔</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2.5 pt-3 border-t border-light-border/40">
              <span className="block text-[8px] font-black uppercase text-stone-450 tracking-wider">Expected Deliverables</span>
              <ul className="space-y-1.5 text-xs text-stone-600 font-semibold">
                {reqData.deliverables.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-brand-emerald">✦</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Project Details specs cards */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-stone-900 border-b border-light-border/40 pb-2">Technical Specifications</h3>
            
            <div className="grid gap-4 sm:grid-cols-2 text-xs font-semibold text-stone-600">
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                <span className="block text-[8px] font-black text-stone-400 uppercase mb-0.5">Construction Stage</span>
                <span className="text-stone-900 font-bold">{reqData.specs.stage}</span>
              </div>
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                <span className="block text-[8px] font-black text-stone-400 uppercase mb-0.5">Area / Size</span>
                <span className="text-stone-900 font-bold">{reqData.specs.size}</span>
              </div>
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                <span className="block text-[8px] font-black text-stone-400 uppercase mb-0.5">Preferred Materials</span>
                <span className="text-stone-900 font-bold">{reqData.specs.materials}</span>
              </div>
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                <span className="block text-[8px] font-black text-stone-400 uppercase mb-0.5">Style Preferences</span>
                <span className="text-stone-900 font-bold">{reqData.specs.style}</span>
              </div>
            </div>
          </section>

          {/* Image gallery & Document lists */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-6">
            <h3 className="text-xs font-black uppercase text-stone-900 border-b border-light-border/40 pb-2">Reference Drawings & Attachments</h3>
            
            <div className="space-y-3">
              <span className="block text-[8.5px] font-black uppercase text-stone-450 tracking-wider">Site & Elevation Photos</span>
              <div className="grid gap-4 grid-cols-2">
                {reqData.images.map((img, idx) => (
                  <div key={idx} className="group relative rounded-2xl overflow-hidden border border-stone-200 h-32 bg-stone-50">
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <button onClick={() => alert(`Opening photo: ${img.name}`)} className="bg-white text-stone-900 px-3 py-1 text-[9px] font-black uppercase rounded-lg">
                        Zoom View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-light-border/40">
              <span className="block text-[8.5px] font-black uppercase text-stone-450 tracking-wider">Blueprint & Soil Documents (PDF/DWG)</span>
              <div className="space-y-2">
                {reqData.documents.map((doc, idx) => (
                  <div key={idx} className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-stone-850 block">{doc.name}</strong>
                      <span className="text-[8.5px] text-stone-400 font-bold uppercase mt-0.5">{doc.size}</span>
                    </div>
                    <button
                      onClick={() => alert(`Downloading attachment: ${doc.name}`)}
                      className="text-brand-emerald text-[9px] font-black uppercase hover:underline"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>

        {/* Right Column: Customer summary, timeline, similar requirements (Col span 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Customer Summary privacy control card */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-stone-900">Client Profile Info</h3>
            
            <div className="space-y-3 font-semibold text-xs text-stone-600">
              <div className="flex justify-between border-b border-light-border/40 pb-1.5">
                <span>Client Name:</span> <strong className="text-stone-900">{reqData.customer.name}</strong>
              </div>
              <div className="flex justify-between border-b border-light-border/40 pb-1.5">
                <span>Verification:</span> <strong className="text-brand-emerald">✓ Verified Account</strong>
              </div>
              <div className="flex justify-between border-b border-light-border/40 pb-1.5">
                <span>Member Since:</span> <strong className="text-stone-900">{reqData.customer.memberSince}</strong>
              </div>
              <div className="flex justify-between">
                <span>Projects completed:</span> <strong className="text-stone-900">{reqData.customer.completedProjects} projects</strong>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-[9px] font-medium text-amber-850 leading-relaxed">
              🔒 Privacy Policy rules mask phone coordinates, email logs, and exact site layout address coordinates until contract offer or consult approval confirmation is submitted.
            </div>
          </section>

          {/* Budget & Timeline card */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-stone-900">Budget & Timeline</h3>
            
            <div className="space-y-3 font-semibold text-xs text-stone-600">
              <div className="flex justify-between border-b border-light-border/40 pb-1.5">
                <span>Estimate Budget:</span> <strong className="text-stone-900">{reqData.budgetRange}</strong>
              </div>
              <div className="flex justify-between border-b border-light-border/40 pb-1.5">
                <span>Budget Flex:</span> <strong className="text-stone-900">{reqData.budgetFlexible}</strong>
              </div>
              <div className="flex justify-between border-b border-light-border/40 pb-1.5">
                <span>Preferred Start:</span> <strong className="text-stone-900">{reqData.startDate}</strong>
              </div>
              <div className="flex justify-between">
                <span>Duration limits:</span> <strong className="text-stone-900">{reqData.timeline}</strong>
              </div>
            </div>
          </section>

          {/* Activity audit trail chronological timeline */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div>
              <h2 className="text-sm font-black text-stone-900 font-serif">Requirement Activity Logs</h2>
              <p className="text-[11px] text-stone-450 font-medium">Audit logs of requirement updates</p>
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

          {/* Similar requirements list section */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-stone-900">Similar Requirements Match</h3>
            <div className="space-y-3">
              {similarRequirements.map(item => (
                <div key={item.id} className="p-3 bg-stone-50 border border-stone-100 rounded-xl space-y-1 text-xs">
                  <strong className="text-stone-900 block truncate">{item.title}</strong>
                  <div className="flex justify-between text-[10px] text-stone-450 font-bold uppercase">
                    <span>Budget: {item.budget}</span>
                    <span>{item.location}</span>
                  </div>
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
function SkeletonRequirementWorkspace() {
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
