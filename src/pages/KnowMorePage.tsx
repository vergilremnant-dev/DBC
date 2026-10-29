import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BRAND } from '../config/branding';
import { useAuth } from '../hooks/auth/useAuth';

export function KnowMorePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [activeMIndex, setActiveMIndex] = useState(0);
  const [activeEcosystemTab, setActiveEcosystemTab] = useState<'customer' | 'professional' | 'consultant' | 'admin'>('customer');
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const fiveMPillars = [
    {
      id: 'man',
      title: 'Manpower',
      subtitle: 'People & Expertise',
      icon: '👥',
      tag: 'HUMAN CAPITAL',
      desc: 'Access to vetted architects, licensed structural engineers, verified contractors, and skilled trade professionals.',
      challenge: 'Unvetted contractors and lack of verified credentials lead to site delays and substandard execution.',
      solution: 'DBC verifies licenses, background credentials, and client track records before listing any professional.',
    },
    {
      id: 'money',
      title: 'Money',
      subtitle: 'Finance & Pricing',
      icon: '💰',
      tag: 'COST TRANSPARENCY',
      desc: 'Transparent line-item bidding, standardized price comparisons, and milestone-linked payment schedules.',
      challenge: 'Opaque lump-sum estimates hide cost markups, leading to budget inflation midway through construction.',
      solution: 'Direct contractor proposals with line-item transparency ensure zero middleman commissions.',
    },
    {
      id: 'material',
      title: 'Material',
      subtitle: 'Supplies & Quality',
      icon: '🧱',
      tag: 'SPECIFICATION CONTROL',
      desc: 'High-grade materials sourced reliably, verified against structural blueprints and quality specifications.',
      challenge: 'Substandard material substitutions and unverified sourcing compromise structural integrity.',
      solution: 'Digital milestone records verify brand specifications and grade checks prior to stage sign-off.',
    },
    {
      id: 'machine',
      title: 'Machine',
      subtitle: 'Equipment & Logistics',
      icon: '🏗️',
      tag: 'RESOURCE ALLOCATION',
      desc: 'Access to modern machinery, scaffolding, excavation tools, and precision measurement equipment.',
      challenge: 'Idle equipment, logistical delays, and lack of specialized machinery stall critical path progress.',
      solution: 'Integrated schedule coordination ensures equipment arrives synchronized with site readiness.',
    },
    {
      id: 'method',
      title: 'Method',
      subtitle: 'Process & Standards',
      icon: '📐',
      tag: 'ENGINEERING WORKFLOW',
      desc: 'Standardized milestone sign-offs, CAD/blueprint version control, and clear phase-wise inspection checkpoints.',
      challenge: 'Informal verbal agreements and unrecorded change requests cause coordination chaos and rework.',
      solution: 'Structured digital project workflows track design modifications, site logs, and milestone approvals.',
    },
  ];

  const ecosystemTabs = [
    {
      id: 'customer',
      label: 'For Landowners & Clients',
      title: 'Build With Confidence',
      badge: 'CLIENT WORKSPACE',
      desc: 'Whether building a luxury villa or remodeling an interior space, access verified experts with complete pricing transparency.',
      points: [
        'Post project specifications & upload CAD layout blueprints',
        'Receive itemized quotations from pre-screened contractors',
        'Direct consultation booking with licensed architects',
        'Stage-by-stage digital milestone verification & progress logs',
      ],
      ctaText: 'Post a Requirement',
      ctaAction: () => navigate(isAuthenticated ? '/workspace/requirements' : '/login'),
      img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'professional',
      label: 'For Contractors & Trades',
      title: 'Grow Your Contracting Firm',
      badge: 'PARTNER WORKSPACE',
      desc: 'Connect with verified clients, bid on structured requirements in your region, and build your digital reputation.',
      points: [
        'Receive qualified, high-intent local project leads',
        'Submit competitive line-item bids directly to clients',
        'Showcase photo portfolios and completed project credentials',
        'Centralize project milestones, change logs, and invoices',
      ],
      ctaText: 'Join as Professional',
      ctaAction: () => navigate('/login'),
      img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'consultant',
      label: 'For Architects & Engineers',
      title: 'Advisory & Design Workspace',
      badge: 'CONSULTANT WORKSPACE',
      desc: 'Provide expert design reviews, 3D elevations, structural blueprints, and feasibility guidance.',
      points: [
        'Publish consultation slots and schedule paid design reviews',
        'Exchange structural blueprints and CAD drawings securely',
        'Deliver milestone inspection reports and site assessments',
        'Build long-term advisory relationships with clients and builders',
      ],
      ctaText: 'Explore Consultations',
      ctaAction: () => navigate('/search'),
      img: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'admin',
      label: 'Platform Governance',
      title: 'Integrity & Verification',
      badge: 'SYSTEM ASSURANCE',
      desc: 'Every partner undergoes license validation, business registration verification, and transparent performance reviews.',
      points: [
        'Rigorous partner screening and identity verification',
        'Fair quotation standards and transparent bidding governance',
        'Dedicated customer support and dispute resolution',
        'Secure communication audit trails and data protection',
      ],
      ctaText: 'Learn About Verification',
      ctaAction: () => scrollToSection('why-dbc'),
      img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Find',
      subtitle: 'Discover verified talent',
      desc: 'Browse verified architects, civil engineers, interior designers, and trade specialists matched to your location.',
      icon: (
        <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      num: '02',
      title: 'Connect',
      subtitle: 'Share your requirements',
      desc: 'Post your project scope, site dimensions, and timeline. Receive itemized proposals from qualified contractors.',
      icon: (
        <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      num: '03',
      title: 'Book',
      subtitle: 'Schedule & contract',
      desc: 'Compare line-item quotes, verify portfolio credentials, schedule consultations, and confirm your booking.',
      icon: (
        <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      num: '04',
      title: 'Track & Complete',
      subtitle: 'Coordinated execution',
      desc: 'Follow real-time site logs, approve milestone stages, and inspect finished quality before final wrap-up.',
      icon: (
        <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  const whyDbcCards = [
    {
      icon: '🎯',
      title: 'Focus on What Matters',
      desc: 'We handle coordination complexity, contractor vetting, and milestone logistics so you can focus on your vision.',
    },
    {
      icon: '🛡️',
      title: 'Reduce Risks',
      desc: 'Verified licenses, background checks, line-item quotations, and structured milestone sign-offs protect your investment.',
    },
    {
      icon: '⏱️',
      title: 'Save Time',
      desc: 'Instant access to verified local talent, side-by-side quote comparisons, and unified digital communication.',
    },
    {
      icon: '📈',
      title: 'Increase Efficiency',
      desc: 'Direct contractor collaboration without middlemen markups, lost chat messages, or scattered file attachments.',
    },
    {
      icon: '⭐',
      title: 'Deliver Excellence',
      desc: 'Disciplined engineering workflows and milestone compliance ensure lasting structural quality and peace of mind.',
    },
  ];

  return (
    <div className="bg-warm-cream text-stone-900 font-sans min-h-screen selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* ========================================================================= */}
      {/* SECTION 1: HERO */}
      {/* ========================================================================= */}
      <section className="relative pt-6 pb-12 sm:pt-10 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 font-display tracking-tight leading-[1.15]">
              Building Better Spaces. <br />
              Building Better Businesses. <br />
              <span className="text-emerald-700">Together.</span>
            </h1>

            <p className="text-sm sm:text-base text-stone-600 font-medium leading-relaxed max-w-xl">
              {BRAND.fullName} is a unified platform connecting you with verified professionals to design, build, and manage spaces — with transparency, quality, and trust at every step.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={() => navigate('/search')}
                className="h-12 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm hover:shadow-md cursor-pointer flex items-center gap-2"
              >
                <span>Explore Marketplace</span>
                <span>→</span>
              </button>

              <button
                onClick={() => scrollToSection('how-it-works')}
                className="h-12 px-6 rounded-xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 text-xs font-bold uppercase tracking-wider transition shadow-2xs cursor-pointer flex items-center gap-2"
              >
                <span>How It Works</span>
                <span className="text-2xs text-emerald-700">▷</span>
              </button>
            </div>
          </div>

          {/* Hero Right Visual (Architectural Villa with Blueprint Grid) */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden border border-stone-200 bg-white p-2.5 sm:p-3 shadow-lg bg-blueprint-grid">
              
              {/* Architectural Rendering Image */}
              <div className="relative h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden group">
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
                  alt="DBC Modern Architectural Villa Blueprint"
                  className="w-full h-full object-cover transform group-hover:scale-103 transition duration-700"
                />
                
                {/* Architectural Blueprint Vector Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent flex flex-col justify-end p-5 sm:p-6 text-white text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-emerald-700/90 text-white text-3xs font-black uppercase tracking-wider">
                      Verified Layout
                    </span>
                    <span className="text-2xs text-stone-300 font-mono">CAD • DWG-V3.2</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold font-display leading-tight">
                    End-to-End Architectural Coordination
                  </h3>
                  <p className="text-2xs text-stone-300 font-medium mt-0.5">
                    From spatial blueprints to on-site concrete execution.
                  </p>
                </div>
              </div>

              {/* Decorative Corner Grid Accents */}
              <div className="absolute top-4 right-4 pointer-events-none opacity-40">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M0 20H40M20 0V40" stroke="#047857" strokeWidth="1" strokeDasharray="2 2" />
                </svg>
              </div>
            </div>
          </div>

        </div>

        {/* 4 Feature Badges Under Hero */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 sm:mt-12">
          {[
            {
              icon: (
                <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              title: 'Verified Professionals',
              desc: 'Experienced and trusted industry experts.',
            },
            {
              icon: (
                <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              ),
              title: 'Quality Assurance',
              desc: 'Quality-first approach at every stage.',
            },
            {
              icon: (
                <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ),
              title: 'Transparent Process',
              desc: 'Track progress and stay informed always.',
            },
            {
              icon: (
                <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ),
              title: 'End-to-End Support',
              desc: "We're with you from idea to completion.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs hover:shadow-xs hover:border-emerald-500/40 transition duration-200 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                {item.icon}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-stone-900 leading-tight">
                  {item.title}
                </h4>
                <p className="text-2xs text-stone-500 font-medium mt-1 leading-normal">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2 & 3: THE 5M CONCEPT & OUR PURPOSE */}
      {/* ========================================================================= */}
      <section id="five-ms" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-stone-200/80">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Text Explanation */}
          <div className="lg:col-span-5 space-y-5 text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 font-display tracking-tight leading-tight">
              Solving What Most Projects Lack – The 5M's
            </h2>

            <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
              Every successful construction and design project depends on the right coordination of five fundamental pillars. {BRAND.name} is built to bridge the operational gaps teams face across these critical areas.
            </p>

            {/* Selected 5M Detail Box */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{fiveMPillars[activeMIndex].icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 font-display">
                      {fiveMPillars[activeMIndex].title} — {fiveMPillars[activeMIndex].subtitle}
                    </h3>
                    <span className="text-3xs font-black text-emerald-700 uppercase tracking-widest">
                      {fiveMPillars[activeMIndex].tag}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                {fiveMPillars[activeMIndex].desc}
              </p>

              <div className="pt-2 border-t border-stone-100 space-y-1.5 text-2xs">
                <div className="text-rose-700 font-semibold flex items-start gap-1.5">
                  <span className="font-bold">Challenge:</span> {fiveMPillars[activeMIndex].challenge}
                </div>
                <div className="text-emerald-800 font-semibold flex items-start gap-1.5">
                  <span className="font-bold">DBC Solution:</span> {fiveMPillars[activeMIndex].solution}
                </div>
              </div>
            </div>

            <button
              onClick={() => scrollToSection('ecosystem')}
              className="h-11 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold uppercase tracking-wider transition shadow-xs cursor-pointer inline-flex items-center gap-2"
            >
              <span>Discover How DBC Solves the 5M's</span>
              <span>→</span>
            </button>
          </div>

          {/* Right: The 5M's Interactive Architectural Diagram */}
          <div className="lg:col-span-7 relative flex items-center justify-center p-4 sm:p-8">
            <div className="relative w-full max-w-[460px] aspect-square flex items-center justify-center">
              
              {/* Outer Dashed Orbit Rings */}
              <div className="absolute inset-0 rounded-full border border-dashed border-emerald-300/80 animate-spin" style={{ animationDuration: '60s' }}></div>
              <div className="absolute inset-8 rounded-full border border-stone-200"></div>

              {/* Center Hub: The 5M's */}
              <div className="relative z-10 w-36 h-36 rounded-full bg-white border-2 border-emerald-600 shadow-md flex flex-col items-center justify-center text-center p-3 select-none">
                <span className="text-2xs uppercase font-bold text-stone-500 tracking-wider">The</span>
                <span className="text-2xl font-black text-stone-900 font-display leading-none mt-0.5">5M's</span>
                <span className="text-3xs font-black text-emerald-800 uppercase tracking-widest mt-1">DBC's Core Focus</span>
              </div>

              {/* Node 1: MANPOWER (Top) */}
              <div
                onClick={() => setActiveMIndex(0)}
                className={`absolute top-0 transform -translate-y-2 cursor-pointer transition duration-200 flex flex-col items-center ${activeMIndex === 0 ? 'scale-105' : 'hover:scale-102 opacity-90'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-sm border ${activeMIndex === 0 ? 'bg-emerald-700 text-white border-emerald-600 ring-4 ring-emerald-100' : 'bg-emerald-100 text-emerald-900 border-emerald-300'}`}>
                  👥
                </div>
                <div className="bg-white px-2 py-0.5 rounded-md border border-stone-200 text-2xs font-bold text-stone-800 shadow-2xs mt-1">
                  Manpower
                </div>
              </div>

              {/* Node 2: MATERIAL (Top Right) */}
              <div
                onClick={() => setActiveMIndex(2)}
                className={`absolute top-16 right-0 sm:right-2 cursor-pointer transition duration-200 flex flex-col items-center ${activeMIndex === 2 ? 'scale-105' : 'hover:scale-102 opacity-90'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-sm border ${activeMIndex === 2 ? 'bg-emerald-700 text-white border-emerald-600 ring-4 ring-emerald-100' : 'bg-emerald-100 text-emerald-900 border-emerald-300'}`}>
                  🧱
                </div>
                <div className="bg-white px-2 py-0.5 rounded-md border border-stone-200 text-2xs font-bold text-stone-800 shadow-2xs mt-1">
                  Material
                </div>
              </div>

              {/* Node 3: MANAGEMENT / MACHINE (Bottom Right) */}
              <div
                onClick={() => setActiveMIndex(3)}
                className={`absolute bottom-4 right-6 sm:right-10 cursor-pointer transition duration-200 flex flex-col items-center ${activeMIndex === 3 ? 'scale-105' : 'hover:scale-102 opacity-90'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-sm border ${activeMIndex === 3 ? 'bg-emerald-700 text-white border-emerald-600 ring-4 ring-emerald-100' : 'bg-emerald-100 text-emerald-900 border-emerald-300'}`}>
                  🏗️
                </div>
                <div className="bg-white px-2 py-0.5 rounded-md border border-stone-200 text-2xs font-bold text-stone-800 shadow-2xs mt-1">
                  Machine
                </div>
              </div>

              {/* Node 4: METHOD (Bottom Left) */}
              <div
                onClick={() => setActiveMIndex(4)}
                className={`absolute bottom-4 left-6 sm:left-10 cursor-pointer transition duration-200 flex flex-col items-center ${activeMIndex === 4 ? 'scale-105' : 'hover:scale-102 opacity-90'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-sm border ${activeMIndex === 4 ? 'bg-emerald-700 text-white border-emerald-600 ring-4 ring-emerald-100' : 'bg-emerald-100 text-emerald-900 border-emerald-300'}`}>
                  📐
                </div>
                <div className="bg-white px-2 py-0.5 rounded-md border border-stone-200 text-2xs font-bold text-stone-800 shadow-2xs mt-1">
                  Method
                </div>
              </div>

              {/* Node 5: MONEY (Mid Left) */}
              <div
                onClick={() => setActiveMIndex(1)}
                className={`absolute top-16 left-0 sm:left-2 cursor-pointer transition duration-200 flex flex-col items-center ${activeMIndex === 1 ? 'scale-105' : 'hover:scale-102 opacity-90'}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg shadow-sm border ${activeMIndex === 1 ? 'bg-emerald-700 text-white border-emerald-600 ring-4 ring-emerald-100' : 'bg-amber-100 text-amber-900 border-amber-300'}`}>
                  💰
                </div>
                <div className="bg-white px-2 py-0.5 rounded-md border border-stone-200 text-2xs font-bold text-stone-800 shadow-2xs mt-1">
                  Money
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: WHY DBC? (5 Core Cards) */}
      {/* ========================================================================= */}
      <section id="why-dbc" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-stone-200/80">
        <div className="text-center space-y-2 mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display text-stone-900 tracking-tight">
            Why DBC?
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium max-w-xl mx-auto">
            Engineered to eliminate friction, prevent cost overruns, and deliver predictable architectural quality.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {whyDbcCards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-stone-200 p-5 sm:p-6 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-emerald-500/40 hover:-translate-y-1 transition duration-200 text-left space-y-4 group"
            >
              <div className="space-y-3">
                <span className="text-2xl block">{card.icon}</span>
                <h3 className="text-sm font-bold text-stone-900 font-display leading-snug group-hover:text-emerald-800 transition">
                  {card.title}
                </h3>
                <p className="text-2xs text-stone-500 font-normal leading-relaxed">
                  {card.desc}
                </p>
              </div>

              <button
                onClick={() => scrollToSection('ecosystem')}
                className="text-2xs font-extrabold text-emerald-700 hover:text-emerald-900 uppercase tracking-wider flex items-center gap-1 transition pt-2 border-t border-stone-100 cursor-pointer"
              >
                <span>Learn more</span>
                <span>→</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: HOW DBC WORKS (4-Step Guided Linear Journey) */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-stone-200/80">
        <div className="text-center space-y-2 mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display text-stone-900 tracking-tight">
            How DBC Works
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium max-w-xl mx-auto">
            From discovering specialists to milestone-verified completion in four structured stages.
          </p>
        </div>

        {/* 4 Connected Step Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {steps.map((step, idx) => (
            <div
              key={idx}
              onClick={() => setActiveStepIndex(idx)}
              className={`bg-white rounded-2xl border p-5 sm:p-6 text-left shadow-2xs hover:shadow-xs transition duration-200 cursor-pointer flex flex-col justify-between space-y-4 ${activeStepIndex === idx ? 'border-emerald-600 ring-2 ring-emerald-100 shadow-sm' : 'border-stone-200'}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="text-2xs font-black text-stone-500 uppercase tracking-widest">
                    STEP {step.num}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-stone-900 font-display leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-2xs font-semibold text-emerald-800 uppercase tracking-wider mt-0.5">
                    {step.subtitle}
                  </p>
                </div>

                <p className="text-2xs text-stone-500 leading-relaxed font-normal">
                  {step.desc}
                </p>
              </div>

              <div className="text-2xs font-bold text-stone-500 pt-2 border-t border-stone-100 flex items-center justify-between">
                <span>Phase {idx + 1} of 4</span>
                <span className="text-emerald-700">✓</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: THE DBC ECOSYSTEM (User Types & Workspaces) */}
      {/* ========================================================================= */}
      <section id="ecosystem" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-stone-200/80">
        <div className="text-center space-y-2 mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display text-stone-900 tracking-tight">
            The DBC Connected Ecosystem
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-medium max-w-xl mx-auto">
            Tailored digital environments designed for clients, contractors, consulting engineers, and platform governance.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
          {ecosystemTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveEcosystemTab(tab.id as 'customer' | 'professional' | 'consultant' | 'admin')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer whitespace-nowrap ${activeEcosystemTab === tab.id ? 'bg-emerald-700 text-white shadow-sm font-extrabold' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Selected Tab Detailed Card */}
        {(() => {
          const current = ecosystemTabs.find((t) => t.id === activeEcosystemTab) || ecosystemTabs[0];
          return (
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left">
              <div className="lg:col-span-6 space-y-5">
                <span className="inline-block text-3xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {current.badge}
                </span>

                <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-stone-900 tracking-tight">
                  {current.title}
                </h3>

                <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
                  {current.desc}
                </p>

                <div className="space-y-2.5 pt-2">
                  {current.points.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-stone-700 font-medium">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-3xs flex-shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-3">
                  <button
                    onClick={current.ctaAction}
                    className="h-11 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider transition shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    <span>{current.ctaText}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="relative rounded-2xl overflow-hidden border border-stone-200 h-64 sm:h-80 shadow-md">
                  <img
                    src={current.img}
                    alt={current.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 to-transparent flex items-end p-5 text-white">
                    <span className="text-xs font-bold tracking-wider">{current.label} Workspace Environment</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7: FINAL CALL TO ACTION BANNER */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-emerald-900 border border-emerald-800 rounded-3xl p-8 sm:p-12 lg:p-14 text-white shadow-xl relative overflow-hidden bg-blueprint-grid">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 text-left">
            
            {/* Left CTA Info */}
            <div className="lg:col-span-7 space-y-5">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-display tracking-tight leading-tight">
                Let's Build Something Great Together
              </h2>

              <p className="text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed max-w-xl">
                Join thousands of landowners and verified professionals who trust {BRAND.fullName} to build and manage spaces with confidence.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  onClick={() => navigate('/search')}
                  className="h-11 px-6 rounded-xl bg-white hover:bg-stone-100 text-emerald-950 text-xs font-black uppercase tracking-wider transition shadow-sm cursor-pointer"
                >
                  Explore Marketplace
                </button>

                <button
                  onClick={() => navigate(isAuthenticated ? '/workspace/requirements' : '/login')}
                  className="h-11 px-6 rounded-xl bg-transparent hover:bg-emerald-800/60 border border-emerald-500 text-white text-xs font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Post a Requirement
                </button>
              </div>
            </div>

            {/* Right Metrics Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl p-6 text-stone-900 shadow-lg border border-emerald-200/40">
                <div className="grid grid-cols-2 gap-4 text-center divide-x-0">
                  <div className="p-2">
                    <span className="block text-2xl sm:text-3xl font-black font-display text-stone-900">10K+</span>
                    <span className="block text-2xs font-bold text-stone-500 uppercase tracking-wider mt-0.5">
                      Happy Customers
                    </span>
                  </div>
                  <div className="p-2">
                    <span className="block text-2xl sm:text-3xl font-black font-display text-stone-900">25K+</span>
                    <span className="block text-2xs font-bold text-stone-500 uppercase tracking-wider mt-0.5">
                      Projects Completed
                    </span>
                  </div>
                  <div className="p-2 border-t border-stone-100">
                    <span className="block text-2xl sm:text-3xl font-black font-display text-stone-900">5K+</span>
                    <span className="block text-2xs font-bold text-stone-500 uppercase tracking-wider mt-0.5">
                      Verified Pros
                    </span>
                  </div>
                  <div className="p-2 border-t border-stone-100">
                    <span className="block text-2xl sm:text-3xl font-black font-display text-stone-900">4.8/5</span>
                    <span className="block text-2xs font-bold text-stone-500 uppercase tracking-wider mt-0.5">
                      Customer Rating
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Background Decorative blueprint compass circle */}
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full border border-emerald-700/40 pointer-events-none"></div>
        </div>
      </section>

    </div>
  );
}


