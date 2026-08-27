import { useState, useEffect, useMemo } from 'react';
import ConsultantProfilePage from '../consultant/ConsultantProfilePage';

// ==========================================
// Types & Interfaces
// ==========================================
interface PortfolioItem {
  id: string;
  name: string;
  category: string;
  location: string;
  year: string;
  description: string;
  imgUrl: string;
}

interface VerificationDoc {
  name: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

const COMPANY_INFO = {
  businessType: 'Partnership Firm',
  experienceYears: '8 Years',
  regNo: 'REG-10928374-B',
  gstNo: '36AAAAA1111A1Z1',
  licenseNo: 'LIC-ARCH-2024-88',
  companySize: '5-10 Employees'
};

export default function ProfessionalProfile() {
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

  const [isLoading, setIsLoading] = useState(true);

  // Profile General info state
  const [profileData, setProfileData] = useState({
    businessName: 'Apex Architecture & Build',
    ownerName: 'John Anderson',
    category: 'Structural Consultancy',
    description: 'Premier structural engineering audits and architectural spatial planners in Hyderabad.',
    phone: '+91 98765 43210',
    email: 'apexbuilds@example.com',
    website: 'https://apexbuilds.example.com',
    address: 'Banjara Hills, Plot 102, Hyderabad, TS, India'
  });

  // Company registration state (static constants to fix unused state warnings)
  const companyInfo = COMPANY_INFO;

  // Services offered state
  const services = {
    primary: 'Structural blueprint auditing',
    secondary: 'Spatial blueprint design, Load-bearing reinforcement calculations',
    pricingType: 'Project Based'
  };

  // Areas of expertise multiple selections state
  const specializations = ['Residential Duplexes', 'Commercial Complexes', 'Vastu Layout Plan adjustments'];

  // Service locations state
  const locations = ['Hyderabad', 'Secunderabad', 'Rangareddy'];

  // Portfolio items state
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([
    {
      id: 'p-1',
      name: 'Jubilee Hills Duplex foundation load checks',
      category: 'Civil Engineering',
      location: 'Hyderabad',
      year: '2026',
      description: 'Completed raft layout concrete slab calculation audits and steel reinforcement spacing review.',
      imgUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80'
    }
  ]);

  // Team members list
  const team = [
    { name: 'John Anderson', role: 'Principal Structural Engineer', email: 'john@example.com' },
    { name: 'Vikram Singh', role: 'Site Inspection Coordinator', email: 'vikram@example.com' }
  ];

  // Working Hours
  const workingDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const workingHours = '09:00 AM - 06:00 PM';
  const [vacationMode, setVacationMode] = useState(false);

  // Notification toggles
  const [notifications, setNotifications] = useState({
    alerts: true,
    updates: true,
    emails: true
  });

  // Verification Documents
  const [verificationDocs, setVerificationDocs] = useState<VerificationDoc[]>([
    { name: 'Professional_License_Certificate.pdf', status: 'Approved' },
    { name: 'GST_Registration_Certificate.pdf', status: 'Approved' },
    { name: 'Company_PAN_Card.pdf', status: 'Pending' }
  ]);

  // Simulated Startup loader
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Profile & Company details updated successfully.');
  };

  const handleUploadVerificationDoc = () => {
    const name = prompt('Enter document file name (e.g. License_Document.pdf):');
    if (name) {
      setVerificationDocs([...verificationDocs, { name, status: 'Pending' }]);
      alert('Verification document uploaded successfully. Awaiting admin review.');
    }
  };

  const handleAddPortfolioItem = () => {
    const name = prompt('Enter project name:');
    if (!name) return;
    const newItem: PortfolioItem = {
      id: `p-${Date.now()}`,
      name,
      category: 'Residential construction',
      location: 'Hyderabad',
      year: '2026',
      description: 'Completed inspection checklist verification.',
      imgUrl: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80'
    };
    setPortfolio([...portfolio, newItem]);
    alert('Portfolio item added.');
  };

  const handleDeletePortfolioItem = (id: string) => {
    const confirm = window.confirm('Are you sure you want to delete this portfolio project?');
    if (confirm) {
      setPortfolio(prev => prev.filter(item => item.id !== id));
      alert('Portfolio project deleted.');
    }
  };

  const profileCompletion = useMemo(() => {
    let completedFields = 0;
    if (profileData.businessName) completedFields++;
    if (profileData.phone) completedFields++;
    if (profileData.email) completedFields++;
    if (companyInfo.gstNo) completedFields++;
    if (portfolio.length > 0) completedFields++;
    return Math.round((completedFields / 5) * 100);
  }, [profileData, companyInfo, portfolio]);

  if (workspaceView === 'CONSULTANT') {
    return <ConsultantProfilePage />;
  }

  if (isLoading) {
    return <SkeletonProfile />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 text-left animate-gentle-fade select-none">
      
      {/* 1. Header */}
      <header className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="text-3xl p-3 bg-stone-50 border border-stone-200 rounded-2xl w-fit">🏢</span>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight font-serif">{profileData.businessName}</h1>
              <span className="bg-emerald-50 text-emerald-800 text-[8px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                ✓ Verified Business
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">Category: {profileData.category} &bull; Profile completion: {profileCompletion}%</p>
          </div>
        </div>

        <div className="flex gap-2 text-xs">
          <button
            onClick={() => alert('Public view modal coming soon!')}
            className="dbc-btn dbc-btn-md dbc-btn-outline bg-white border border-stone-200 hover:bg-stone-50"
          >
            Preview Public Profile
          </button>
        </div>
      </header>

      {/* Two Column Layout details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form settings and portfolios (Col span 8) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Profile Overview form */}
          <form onSubmit={handleSaveProfile} className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-5 text-xs">
            <h3 className="text-sm font-black uppercase text-stone-900 border-b border-light-border/40 pb-2">Business Identity Profile</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Business / Company Name</label>
                <input
                  type="text"
                  value={profileData.businessName}
                  onChange={e => setProfileData({ ...profileData, businessName: e.target.value })}
                  className="dbc-input"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Contact person Name</label>
                <input
                  type="text"
                  value={profileData.ownerName}
                  onChange={e => setProfileData({ ...profileData, ownerName: e.target.value })}
                  className="dbc-input"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Phone number</label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={e => setProfileData({ ...profileData, phone: e.target.value })}
                  className="dbc-input"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Email address</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                  className="dbc-input"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">About business summary</label>
              <textarea
                value={profileData.description}
                onChange={e => setProfileData({ ...profileData, description: e.target.value })}
                className="dbc-input h-24 resize-none"
                required
              />
            </div>

            <button type="submit" className="dbc-btn dbc-btn-md dbc-btn-primary">
              Save Identity Settings
            </button>
          </form>

          {/* Company Information details */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4 text-xs font-semibold text-stone-600">
            <h3 className="text-xs font-black uppercase text-stone-900 border-b border-light-border/40 pb-2">Business Registrations</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="block text-[8px] font-black text-stone-400 uppercase">GST registration ID</span>
                <strong className="text-stone-900 block mt-0.5">{companyInfo.gstNo}</strong>
              </div>
              <div>
                <span className="block text-[8px] font-black text-stone-400 uppercase">License registration number</span>
                <strong className="text-stone-900 block mt-0.5">{companyInfo.licenseNo}</strong>
              </div>
              <div>
                <span className="block text-[8px] font-black text-stone-400 uppercase">Business structure</span>
                <strong className="text-stone-900 block mt-0.5">{companyInfo.businessType}</strong>
              </div>
              <div>
                <span className="block text-[8px] font-black text-stone-400 uppercase">Years of market experience</span>
                <strong className="text-stone-900 block mt-0.5">{companyInfo.experienceYears}</strong>
              </div>
            </div>
          </section>

          {/* Services & Expertise */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4 text-xs font-semibold text-stone-600">
            <h3 className="text-xs font-black uppercase text-stone-900 border-b border-light-border/40 pb-2">Services & Specialties</h3>
            
            <div className="space-y-3">
              <div>
                <span className="block text-[8px] font-black text-stone-450 uppercase mb-0.5">Primary trade category</span>
                <span className="text-stone-900 font-bold">{services.primary}</span>
              </div>
              <div>
                <span className="block text-[8px] font-black text-stone-450 uppercase mb-0.5">Specialized scopes</span>
                <span className="text-stone-900 font-bold">{services.secondary}</span>
              </div>
              <div>
                <span className="block text-[8px] font-black text-stone-450 uppercase mb-0.5">Areas of Specialization Expertise</span>
                <div className="flex gap-1.5 flex-wrap mt-1">
                  {specializations.map((spec, i) => (
                    <span key={i} className="bg-stone-50 border border-stone-200 px-2.5 py-0.5 rounded text-[10px] text-stone-600">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-light-border/40">
                <span className="block text-[8px] font-black text-stone-450 uppercase mb-0.5">Service Locations Served</span>
                <div className="flex gap-1.5 flex-wrap mt-1">
                  {locations.map((loc, i) => (
                    <span key={i} className="bg-stone-50 border border-stone-200 px-2.5 py-0.5 rounded text-[10px] text-stone-600">
                      {loc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Portfolio Manager */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-light-border/40">
              <h3 className="text-xs font-black uppercase text-stone-900">Portfolio Showcase</h3>
              <button
                onClick={handleAddPortfolioItem}
                className="text-[9px] font-black uppercase text-brand-emerald hover:underline"
              >
                + Add Project
              </button>
            </div>

            {portfolio.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-xs">
                No portfolio items listed.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {portfolio.map(proj => (
                  <div key={proj.id} className="border border-stone-200 rounded-2xl overflow-hidden text-xs flex flex-col justify-between">
                    <img src={proj.imgUrl} alt={proj.name} className="w-full h-32 object-cover bg-stone-100" />
                    <div className="p-4 space-y-2">
                      <strong className="text-stone-900 block truncate">{proj.name}</strong>
                      <p className="text-[10px] text-stone-500 leading-relaxed font-semibold">{proj.description}</p>
                      
                      <div className="flex justify-between items-center pt-2 border-t border-light-border/40 text-[9px] text-stone-400 font-bold uppercase">
                        <span>{proj.location} &bull; {proj.year}</span>
                        <button onClick={() => handleDeletePortfolioItem(proj.id)} className="text-rose-600 hover:underline">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Right Column: Availability, Team, settings (Col span 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Verification documents status */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div className="flex justify-between items-center border-b border-light-border/40 pb-2">
              <h3 className="text-xs font-black uppercase text-stone-900">Verification Center</h3>
              <button onClick={handleUploadVerificationDoc} className="text-[8.5px] font-black uppercase text-brand-emerald hover:underline">
                Upload doc
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-semibold text-stone-600">
              {verificationDocs.map((doc, idx) => (
                <div key={idx} className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl flex justify-between items-center">
                  <span className="truncate max-w-[130px] block">{doc.name}</span>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                    doc.status === 'Approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Working hours availability */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4 text-xs font-semibold text-stone-600">
            <h3 className="text-xs font-black uppercase text-stone-900 border-b border-light-border/40 pb-2">Availability Rules</h3>
            <div className="space-y-3">
              <div>
                <span className="block text-[8px] font-black text-stone-400 uppercase">Working Days</span>
                <strong className="text-stone-900 block mt-0.5">{workingDays.join(', ')}</strong>
              </div>
              <div>
                <span className="block text-[8px] font-black text-stone-400 uppercase">Operational Hours</span>
                <strong className="text-stone-900 block mt-0.5">{workingHours}</strong>
              </div>
              <div className="pt-2 flex justify-between items-center border-t border-light-border/40">
                <div>
                  <strong className="text-stone-850 block">Vacation Mode</strong>
                   <span className="text-[10px] text-stone-400 font-bold block">Pause inbound project requests</span>
                </div>
                <input
                  type="checkbox"
                  checked={vacationMode}
                  onChange={e => setVacationMode(e.target.checked)}
                  className="dbc-checkbox"
                />
              </div>
            </div>
          </section>

          {/* Informal Team Members list */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-stone-900 border-b border-light-border/40 pb-2">Business Team List</h3>
            <div className="space-y-2.5">
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

          {/* Notification settings */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4 text-xs font-semibold text-stone-600">
            <h3 className="text-xs font-black uppercase text-stone-900 border-b border-light-border/40 pb-2">Notification preferences</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Leads Alert Dispatch</span>
                <input
                  type="checkbox"
                  checked={notifications.alerts}
                  onChange={e => setNotifications({ ...notifications, alerts: e.target.checked })}
                  className="dbc-checkbox"
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Milestone updates</span>
                <input
                  type="checkbox"
                  checked={notifications.updates}
                  onChange={e => setNotifications({ ...notifications, updates: e.target.checked })}
                  className="dbc-checkbox"
                />
              </div>
            </div>
          </section>

          {/* Security details Change password form */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4 text-xs">
            <h3 className="text-xs font-black uppercase text-stone-900 border-b border-light-border/40 pb-2">Security settings</h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  const p = prompt('Enter new password:');
                  if (p) alert('Password updated.');
                }}
                className="w-full dbc-btn dbc-btn-sm dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
              >
                Change password
              </button>
              <button
                onClick={() => alert('Two-factor authentication placeholder configured.')}
                className="w-full dbc-btn dbc-btn-sm dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
              >
                Enable Two-Factor auth
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
function SkeletonProfile() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left animate-pulse">
      <div className="h-28 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 h-96 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
        <div className="lg:col-span-4 h-96 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
      </div>
    </div>
  );
}
