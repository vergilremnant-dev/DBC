import { useState, useEffect } from 'react';

// ==========================================
// Types & Interfaces
// ==========================================
interface ExperienceItem {
  id: string;
  org: string;
  role: string;
  duration: string;
  desc: string;
}

interface Certification {
  id: string;
  name: string;
  org: string;
  date: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  desc: string;
  year: string;
}

export default function ConsultantProfilePage() {
  const [isLoading, setIsLoading] = useState(true);

  // Profile Overview form fields
  const [fullName, setFullName] = useState('John Anderson');
  const [bio, setBio] = useState('Senior Architectural consultant specializing in modern villa Vastu alignments and pile foundation load auditing. Helping builders establish structurally compliant blueprints.');
  const [email, setEmail] = useState('john.anderson@example.com');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [location, setLocation] = useState('Hyderabad, Telangana');

  // Professional Information
  const [licenseNumber, setLicenseNumber] = useState('LIC-ARCH-2024-88');
  const [experienceYears, setExperienceYears] = useState('12 Years');

  // Expertise & specializations
  const [skills, setSkills] = useState(['Vastu Shastra', 'Foundation Audits', 'Load-Bearing Analysis', 'Villa Layout Drafting']);
  const [newSkill, setNewSkill] = useState('');

  // Experience history list
  const [experiences, setExperiences] = useState<ExperienceItem[]>([
    { id: 'exp-1', org: 'Deccan structural architects', role: 'Lead Consultant', duration: '2022 - Present', desc: 'Conducted over 120 residential structural audits.' },
    { id: 'exp-2', org: 'Hyderabad Municipal Designs', role: 'Plan auditor', duration: '2016 - 2022', desc: 'Reviewed layout plan compliance for municipal permits.' }
  ]);
  const [newOrg, setNewOrg] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newDuration, setNewDuration] = useState('');

  // Certifications list
  const [certifications, setCertifications] = useState<Certification[]>([
    { id: 'cert-1', name: 'Certified Residential Architect', org: 'National Building Council', date: '2021' }
  ]);
  const [newCertName, setNewCertName] = useState('');
  const [newCertOrg, setNewCertOrg] = useState('');

  // Languages Spoken list
  const languages = [
    { name: 'English', proficiency: 'Fluent' },
    { name: 'Hindi', proficiency: 'Conversational' },
    { name: 'Telugu', proficiency: 'Native' }
  ];

  // Consultation Details settings
  const [consultationFee, setConsultationFee] = useState('₹45,000');
  const [preferredDuration, setPreferredDuration] = useState('60 mins');
  const [modes, setModes] = useState({ online: true, siteVisit: true, inPerson: false });

  // Availability Settings
  const [workingHours, setWorkingHours] = useState('09:00 AM - 06:00 PM');
  const [vacationMode, setVacationMode] = useState(false);

  // Portfolio items
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([
    { id: 'p-1', title: 'Gachibowli 4BHK Villa Project', desc: 'Raft foundation layout check and Vastu alignments compilation.', year: '2026' }
  ]);
  const [newPortTitle, setNewPortTitle] = useState('');
  const [newPortDesc, setNewPortDesc] = useState('');

  // Security password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Save confirmation trigger
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim() || skills.includes(newSkill.trim())) return;
    setSkills([...skills, newSkill.trim()]);
    setNewSkill('');
  };

  const handleAddExp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrg.trim()) return;
    setExperiences([...experiences, { id: `exp-${Date.now()}`, org: newOrg, role: newRole, duration: newDuration, desc: '' }]);
    setNewOrg('');
    setNewRole('');
    setNewDuration('');
  };

  const handleAddCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCertName.trim()) return;
    setCertifications([...certifications, { id: `cert-${Date.now()}`, name: newCertName, org: newCertOrg, date: '2026' }]);
    setNewCertName('');
    setNewCertOrg('');
  };

  const handleAddPortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortTitle.trim()) return;
    setPortfolio([...portfolio, { id: `p-${Date.now()}`, title: newPortTitle, desc: newPortDesc, year: '2026' }]);
    setNewPortTitle('');
    setNewPortDesc('');
  };

  if (isLoading) {
    return <SkeletonProfile />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 text-left animate-gentle-fade select-none">
      
      {/* 1. Header Profile details */}
      <header className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-full bg-brand-emerald text-white font-black flex items-center justify-center text-2xl uppercase">
            JA
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 leading-tight">{fullName}</h1>
              <span className="bg-emerald-50 text-emerald-800 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                ✓ Certified Consultant
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">Senior Architectural Design Consultant &bull; Hyderabad</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0 md:text-right">
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Profile Completion</span>
          <div className="flex items-center gap-2">
            <div className="w-32 bg-stone-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-brand-emerald h-full w-[85%]"></div>
            </div>
            <span className="text-xs font-black text-stone-900">85%</span>
          </div>
        </div>
      </header>

      {/* Two Column Form Layout */}
      <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form Editors (Col span 8) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Profile Overview Card */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 border-b border-light-border/40 pb-2">Profile Details Overview</h3>
            
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="dbc-input"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="dbc-input"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Phone Coordinates</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="dbc-input"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Location City</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="dbc-input"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Professional Biography Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="dbc-input h-28 resize-none"
                required
              />
            </div>
          </section>

          {/* Professional Credentials & Experience */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 border-b border-light-border/40 pb-2">Professional Qualifications</h3>
            
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">License Number</label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={e => setLicenseNumber(e.target.value)}
                  className="dbc-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Years Experience</label>
                <input
                  type="text"
                  value={experienceYears}
                  onChange={e => setExperienceYears(e.target.value)}
                  className="dbc-input"
                />
              </div>
            </div>

            {/* Experience list */}
            <div className="space-y-3 pt-4 border-t border-light-border/40">
              <span className="block text-[8px] font-black uppercase text-stone-450 tracking-wider">Experience History</span>
              {experiences.map(exp => (
                <div key={exp.id} className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <h5 className="font-bold text-stone-900">{exp.role} &bull; <span className="text-stone-450">{exp.org}</span></h5>
                    <span className="text-[8px] text-stone-400 font-bold uppercase block mt-1">{exp.duration}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Experience form */}
            <div className="space-y-2 pt-3 border-t border-light-border/40 text-xs">
              <span className="block text-[8.5px] font-black uppercase text-stone-850">Add Experience Position</span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Organization..."
                  value={newOrg}
                  onChange={e => setNewOrg(e.target.value)}
                  className="dbc-input"
                />
                <input
                  type="text"
                  placeholder="Role/Title..."
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="dbc-input"
                />
                <input
                  type="text"
                  placeholder="Duration (e.g. 2021)..."
                  value={newDuration}
                  onChange={e => setNewDuration(e.target.value)}
                  className="dbc-input"
                />
              </div>
              <button
                type="button"
                onClick={handleAddExp}
                className="dbc-btn dbc-btn-sm dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
              >
                Add Position
              </button>
            </div>
          </section>

          {/* Certifications & Languages */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 border-b border-light-border/40 pb-2">Certifications & Languages Spoken</h3>
            
            <div className="space-y-4">
              <span className="block text-[8px] font-black uppercase text-stone-450 tracking-wider">Active Certifications</span>
              {certifications.map(cert => (
                <div key={cert.id} className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs flex justify-between items-center">
                  <div>
                    <h5 className="font-bold text-stone-900">{cert.name}</h5>
                    <span className="block text-[8px] text-stone-400 font-bold uppercase mt-0.5">{cert.org} &bull; {cert.date}</span>
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Certification Name..."
                  value={newCertName}
                  onChange={e => setNewCertName(e.target.value)}
                  className="dbc-input"
                />
                <input
                  type="text"
                  placeholder="Issuing Org..."
                  value={newCertOrg}
                  onChange={e => setNewCertOrg(e.target.value)}
                  className="dbc-input"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCert}
                className="dbc-btn dbc-btn-sm dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
              >
                Add Certification
              </button>
            </div>

            <div className="pt-4 border-t border-light-border/40 space-y-3 text-xs">
              <span className="block text-[8px] font-black uppercase text-stone-450 tracking-wider">Languages proficiency</span>
              <div className="flex flex-wrap gap-2">
                {languages.map((lang, idx) => (
                  <span key={idx} className="bg-stone-100 text-stone-750 text-[9.5px] font-bold px-2.5 py-1 rounded border border-light-border uppercase">
                    {lang.name} ({lang.proficiency})
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Consultation Fees & Duration settings */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 border-b border-light-border/40 pb-2">Consultation Settings</h3>
            
            <div className="grid gap-4 sm:grid-cols-3 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Consultation Fee</label>
                <input
                  type="text"
                  value={consultationFee}
                  onChange={e => setConsultationFee(e.target.value)}
                  className="dbc-input text-xs font-black"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Duration limits</label>
                <select
                  value={preferredDuration}
                  onChange={e => setPreferredDuration(e.target.value)}
                  className="dbc-input bg-white text-xs py-1.5 px-3"
                >
                  <option value="30 mins">30 mins</option>
                  <option value="60 mins">60 mins</option>
                  <option value="90 mins">90 mins</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Working Hours</label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={e => setWorkingHours(e.target.value)}
                  className="dbc-input text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-3 border-t border-light-border/45 text-xs font-bold text-stone-600">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modes.online}
                  onChange={e => setModes({ ...modes, online: e.target.checked })}
                  className="dbc-checkbox"
                />
                Online consultations
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modes.siteVisit}
                  onChange={e => setModes({ ...modes, siteVisit: e.target.checked })}
                  className="dbc-checkbox"
                />
                Site Visits
              </label>
            </div>
          </section>

          {/* Portfolio highlights */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 border-b border-light-border/40 pb-2">Portfolio Project Highlights</h3>
            
            <div className="space-y-3">
              {portfolio.map(proj => (
                <div key={proj.id} className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <strong className="text-stone-900">{proj.title}</strong>
                    <span className="text-[8px] text-stone-400 font-bold uppercase">{proj.year}</span>
                  </div>
                  <p className="text-stone-600 font-semibold">{proj.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-light-border/40 text-xs">
              <input
                type="text"
                placeholder="Project Title..."
                value={newPortTitle}
                onChange={e => setNewPortTitle(e.target.value)}
                className="dbc-input"
              />
              <input
                type="text"
                placeholder="Short Description..."
                value={newPortDesc}
                onChange={e => setNewPortDesc(e.target.value)}
                className="dbc-input"
              />
            </div>
            <button
              type="button"
              onClick={handleAddPortfolio}
              className="dbc-btn dbc-btn-sm dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
            >
              Add Project
            </button>
          </section>

        </div>

        {/* Right Column: Expertise, Security & Preferences (Col span 4) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Action Trigger Card */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-3">
            <button
              type="submit"
              className="w-full dbc-btn dbc-btn-md dbc-btn-primary"
            >
              Save Profile Changes
            </button>
            {saveSuccess && (
              <p className="text-[10px] text-brand-emerald font-black text-center animate-pulse">✓ Profile saved successfully!</p>
            )}
          </section>

          {/* Area of Expertise Selector */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div>
              <h2 className="text-sm font-black text-stone-900 font-serif">Specialization Skills</h2>
              <p className="text-[11px] text-stone-450 font-medium">Areas displayed on search suggestions</p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, idx) => (
                <span key={idx} className="bg-stone-50 border border-stone-200 text-stone-750 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex gap-2 pt-3 border-t border-light-border/40 text-xs">
              <input
                type="text"
                placeholder="Add specialization..."
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                className="dbc-input"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="text-[9.5px] font-black text-brand-emerald hover:underline"
              >
                Add
              </button>
            </div>
          </section>

          {/* Availability Settings Vacation Mode */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div>
              <h2 className="text-sm font-black text-stone-900 font-serif">Availability Settings</h2>
              <p className="text-[11px] text-stone-450 font-medium">Direct slots control toggle</p>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-xl">
              <div>
                <span className="block text-xs font-bold text-stone-900">Vacation Mode</span>
                <span className="text-[9px] text-stone-400">Block all incoming requests</span>
              </div>
              <input
                type="checkbox"
                checked={vacationMode}
                onChange={e => setVacationMode(e.target.checked)}
                className="dbc-checkbox"
              />
            </div>
          </section>

          {/* Security Password changes panel */}
          <section className="bg-white border border-light-border p-6 rounded-3xl shadow-apple-sm space-y-4">
            <div>
              <h2 className="text-sm font-black text-stone-900 font-serif">Security Settings</h2>
              <p className="text-[11px] text-stone-450 font-medium">Configure credentials checks</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="dbc-input"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[8px] font-black uppercase tracking-widest text-stone-gray">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="dbc-input"
                />
              </div>
              
              <button
                type="button"
                onClick={() => {
                  if (newPassword.trim()) {
                    alert('Password successfully updated.');
                    setCurrentPassword('');
                    setNewPassword('');
                  }
                }}
                className="dbc-btn dbc-btn-sm dbc-btn-secondary bg-white border border-stone-200 hover:bg-stone-50"
              >
                Change Password
              </button>
            </div>

            <div className="pt-3 border-t border-light-border/40 text-[9.5px] font-bold text-stone-400 uppercase space-y-1">
              <p>🔒 2-Factor Authentication: Disabled (Placeholder)</p>
              <p>🖥️ Logout from Other Devices (Placeholder)</p>
            </div>
          </section>

        </div>

      </form>

    </div>
  );
}

// ==========================================
// Loading Skeletons
// ==========================================
function SkeletonProfile() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 text-left animate-pulse">
      <div className="h-28 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm flex items-center justify-between">
        <div className="flex gap-4 items-center">
          <div className="w-16 h-16 rounded-full bg-stone-250 bg-stone-200"></div>
          <div className="space-y-2">
            <div className="h-4 bg-stone-250 bg-stone-200 rounded w-48"></div>
            <div className="h-3 bg-stone-250 bg-stone-200 rounded w-32"></div>
          </div>
        </div>
        <div className="h-8 bg-stone-250 bg-stone-200 rounded w-28"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="h-64 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
          <div className="h-64 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
        </div>
        <div className="lg:col-span-4 h-96 bg-white border border-light-border rounded-3xl p-6 shadow-apple-sm"></div>
      </div>
    </div>
  );
}
