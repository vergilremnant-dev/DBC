import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoutButton } from '../../components/auth/LogoutButton';
import { BrandLogo } from '../../components/common/BrandLogo';

import SettingsHeader from '../../components/admin/platform-settings/SettingsHeader';
import GeneralSettingsForm from '../../components/admin/platform-settings/GeneralSettingsForm';
import MarketplaceSettingsCard from '../../components/admin/platform-settings/MarketplaceSettingsCard';
import CategoriesManager, { type CategoryItem } from '../../components/admin/platform-settings/CategoriesManager';
import LocationsManager, { type LocationItem } from '../../components/admin/platform-settings/LocationsManager';
import NotificationTemplates, { type NotificationTemplate } from '../../components/admin/platform-settings/NotificationTemplates';
import BrandingPanel from '../../components/admin/platform-settings/BrandingPanel';
import SecuritySettings from '../../components/admin/platform-settings/SecuritySettings';
import SystemInformation from '../../components/admin/platform-settings/SystemInformation';
import SettingsQuickActions from '../../components/admin/platform-settings/SettingsQuickActions';
import SkeletonSettings from '../../components/admin/platform-settings/SkeletonSettings';

// ─── Default Data ──────────────────────────────────────────────────────────────

const DEFAULT_GENERAL = {
  platformName: 'Design Build Connect',
  platformDescription: "India's trusted marketplace for construction and design professionals.",
  supportEmail: 'support@designbuildconnect.com',
  supportPhone: '+91 99999 00000',
  defaultTimezone: 'Asia/Kolkata',
  defaultLanguage: 'English',
  defaultCurrency: 'INR — Indian Rupee',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12-Hour (AM/PM)',
};

const DEFAULT_MARKETPLACE = {
  marketplaceStatus: 'Active',
  defaultRequirementVisibility: 'Public',
  defaultProjectStatus: 'Planning',
  registrationApprovalMode: 'Manual Review',
  publicProfileVisibility: true,
};

const DEFAULT_BRANDING = {
  platformName: 'Design Build Connect',
  footerText: "India's trusted platform for construction and design coordination.",
  copyrightText: '© 2026 Design Build Connect. All rights reserved.',
  primaryContact: 'DBC Support Team',
  primaryEmail: 'hello@designbuildconnect.com',
};

const DEFAULT_SECURITY = {
  sessionTimeoutMinutes: '60',
  accountLockThreshold: '5',
  minPasswordLength: '8',
  requireUppercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
  twoFactorEnabled: false,
};

const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: 'cat-1', name: 'Electrician', type: 'Service', active: true },
  { id: 'cat-2', name: 'Plumbing', type: 'Service', active: true },
  { id: 'cat-3', name: 'Carpentry', type: 'Service', active: true },
  { id: 'cat-4', name: 'Interior Design', type: 'Service', active: true },
  { id: 'cat-5', name: 'Painting', type: 'Service', active: true },
  { id: 'cat-6', name: 'Waterproofing', type: 'Service', active: true },
  { id: 'cat-7', name: 'False Ceiling', type: 'Service', active: true },
  { id: 'cat-8', name: 'Civil Construction', type: 'Construction', active: true },
  { id: 'cat-9', name: 'Residential Villa', type: 'Project', active: true },
  { id: 'cat-10', name: 'Commercial Complex', type: 'Project', active: true },
  { id: 'cat-11', name: 'Apartment', type: 'Property', active: true },
  { id: 'cat-12', name: 'Independent House', type: 'Property', active: true },
];

const INITIAL_LOCATIONS: LocationItem[] = [
  { id: 'loc-1', name: 'India', type: 'Country', active: true },
  { id: 'loc-2', name: 'Telangana', type: 'State', parent: 'India', active: true },
  { id: 'loc-3', name: 'Andhra Pradesh', type: 'State', parent: 'India', active: true },
  { id: 'loc-4', name: 'Karnataka', type: 'State', parent: 'India', active: true },
  { id: 'loc-5', name: 'Hyderabad', type: 'City', parent: 'Telangana', active: true },
  { id: 'loc-6', name: 'Bangalore', type: 'City', parent: 'Karnataka', active: true },
  { id: 'loc-7', name: 'Chennai', type: 'City', parent: 'Tamil Nadu', active: true },
  { id: 'loc-8', name: 'Mumbai', type: 'City', parent: 'Maharashtra', active: true },
  { id: 'loc-9', name: 'Banjara Hills', type: 'Service Area', parent: 'Hyderabad', active: true },
  { id: 'loc-10', name: 'Jubilee Hills', type: 'Service Area', parent: 'Hyderabad', active: true },
];

const INITIAL_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'nt-1', key: 'registration',
    label: 'Registration Welcome',
    subject: 'Welcome to Design Build Connect, {{firstName}}!',
    body: 'Hello {{firstName}},\n\nWelcome to Design Build Connect! Your account has been created successfully.\n\nYou can now explore our marketplace and connect with professionals.\n\nBest regards,\nThe DBC Team',
    variables: ['firstName', 'email', 'role', 'platformName'],
  },
  {
    id: 'nt-2', key: 'verification_approved',
    label: 'Verification Approved',
    subject: 'Congratulations! Your professional profile has been verified.',
    body: 'Dear {{firstName}},\n\nYour verification request has been reviewed and approved.\n\nYou can now receive client requirements and showcase your profile on the marketplace.\n\nBest regards,\nThe DBC Team',
    variables: ['firstName', 'category', 'verificationDate'],
  },
  {
    id: 'nt-3', key: 'verification_rejected',
    label: 'Verification Rejected',
    subject: 'Verification Update — Action Required',
    body: 'Dear {{firstName}},\n\nAfter reviewing your submitted documents, we were unable to complete your verification at this time.\n\nReason: {{rejectionReason}}\n\nPlease contact our support team for assistance.\n\nBest regards,\nThe DBC Team',
    variables: ['firstName', 'rejectionReason', 'supportEmail'],
  },
  {
    id: 'nt-4', key: 'requirement_created',
    label: 'Requirement Created',
    subject: 'Your requirement "{{requirementTitle}}" has been posted.',
    body: 'Hello {{firstName}},\n\nYour requirement "{{requirementTitle}}" has been successfully posted to the marketplace.\n\nYou can expect to receive quotations from verified professionals within {{estimatedResponseTime}}.\n\nBest regards,\nThe DBC Team',
    variables: ['firstName', 'requirementTitle', 'estimatedResponseTime', 'requirementId'],
  },
  {
    id: 'nt-5', key: 'quotation_submitted',
    label: 'Quotation Submitted',
    subject: 'New quotation received for "{{requirementTitle}}"',
    body: 'Hello {{firstName}},\n\nA new quotation has been submitted by {{professionalName}} for your requirement "{{requirementTitle}}".\n\nQuotation Amount: {{quotationAmount}}\n\nLog in to review and respond.\n\nBest regards,\nThe DBC Team',
    variables: ['firstName', 'requirementTitle', 'professionalName', 'quotationAmount'],
  },
  {
    id: 'nt-6', key: 'project_assigned',
    label: 'Project Assigned',
    subject: 'Project assigned: "{{projectName}}"',
    body: 'Dear {{firstName}},\n\nA project has been assigned to you: "{{projectName}}".\n\nClient: {{customerName}}\nStart Date: {{startDate}}\n\nPlease log in to your workspace to view full project details.\n\nBest regards,\nThe DBC Team',
    variables: ['firstName', 'projectName', 'customerName', 'startDate'],
  },
];

// ─── Save Toast ────────────────────────────────────────────────────────────────

function SaveToast({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-apple-lg flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-4 duration-200"
      role="status"
      aria-live="polite"
    >
      <span className="text-brand-emerald text-sm" aria-hidden="true">✓</span>
      Platform settings saved successfully.
    </div>
  );
}

// ─── Navigation Tabs ───────────────────────────────────────────────────────────

const ADMIN_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'users', label: 'Users' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'projects', label: 'Projects' },
  { id: 'verification', label: 'Verification' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
] as const;

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function AdminPlatformSettings() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // State
  const [general, setGeneral] = useState(DEFAULT_GENERAL);
  const [savedGeneral, setSavedGeneral] = useState(DEFAULT_GENERAL);

  const [marketplace, setMarketplace] = useState(DEFAULT_MARKETPLACE);
  const [savedMarketplace, setSavedMarketplace] = useState(DEFAULT_MARKETPLACE);

  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [savedCategories, setSavedCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);

  const [locations, setLocations] = useState<LocationItem[]>(INITIAL_LOCATIONS);
  const [savedLocations, setSavedLocations] = useState<LocationItem[]>(INITIAL_LOCATIONS);

  const [templates, setTemplates] = useState<NotificationTemplate[]>(INITIAL_TEMPLATES);
  const [savedTemplates, setSavedTemplates] = useState<NotificationTemplate[]>(INITIAL_TEMPLATES);

  const [branding, setBranding] = useState(DEFAULT_BRANDING);
  const [savedBranding, setSavedBranding] = useState(DEFAULT_BRANDING);

  const [security] = useState(DEFAULT_SECURITY);

  const hasUnsavedChanges = useMemo(() => {
    return (
      JSON.stringify(general) !== JSON.stringify(savedGeneral) ||
      JSON.stringify(marketplace) !== JSON.stringify(savedMarketplace) ||
      JSON.stringify(categories) !== JSON.stringify(savedCategories) ||
      JSON.stringify(locations) !== JSON.stringify(savedLocations) ||
      JSON.stringify(templates) !== JSON.stringify(savedTemplates) ||
      JSON.stringify(branding) !== JSON.stringify(savedBranding)
    );
  }, [general, marketplace, categories, locations, templates, branding, savedGeneral, savedMarketplace, savedCategories, savedLocations, savedTemplates, savedBranding]);

  // Simulate loading
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSavedGeneral(general);
    setSavedMarketplace(marketplace);
    setSavedCategories(categories);
    setSavedLocations(locations);
    setSavedTemplates(templates);
    setSavedBranding(branding);
    setIsSaving(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, [general, marketplace, categories, locations, templates, branding]);

  const handleReset = useCallback(() => {
    if (!hasUnsavedChanges) return;
    const confirmed = window.confirm('Reset all unsaved changes to the last saved state?');
    if (!confirmed) return;
    setGeneral(savedGeneral);
    setMarketplace(savedMarketplace);
    setCategories(savedCategories);
    setLocations(savedLocations);
    setTemplates(savedTemplates);
    setBranding(savedBranding);
  }, [hasUnsavedChanges, savedGeneral, savedMarketplace, savedCategories, savedLocations, savedTemplates, savedBranding]);

  const handleGeneralChange = (field: string, value: string) =>
    setGeneral(prev => ({ ...prev, [field]: value }));

  const handleMarketplaceChange = (field: string, value: string | boolean) =>
    setMarketplace(prev => ({ ...prev, [field]: value }));

  const handleBrandingChange = (field: string, value: string) =>
    setBranding(prev => ({ ...prev, [field]: value }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50">
        {/* Top bar placeholder */}
        <div className="h-[72px] bg-white border-b border-light-border" />
        <main className="mx-auto max-w-[1440px] px-4 md:px-6 lg:px-8 py-8">
          <SkeletonSettings />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Internal admin nav bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-light-border shadow-apple-sm">
        <div className="mx-auto max-w-[1440px] px-4 md:px-6 lg:px-8 h-[64px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <BrandLogo variant="compact" theme="light" />
            <div className="hidden md:flex items-center gap-1 min-w-0 overflow-x-auto no-scrollbar">
              {ADMIN_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => tab.id === 'settings' ? undefined : navigate('/admin/dashboard')}
                  className={`px-3 py-1.5 shrink-0 whitespace-nowrap rounded-lg text-2xs font-black uppercase tracking-wider transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald
                    ${tab.id === 'settings'
                      ? 'bg-brand-emerald text-white'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  aria-current={tab.id === 'settings' ? 'page' : undefined}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-2xs font-bold text-stone-500 hover:text-stone-900 transition cursor-pointer focus:outline-none hidden lg:block whitespace-nowrap"
            >
              ← Back to Dashboard
            </button>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-[1440px] px-4 md:px-6 lg:px-8 py-8">
        <div className="space-y-6">

          {/* Page Header */}
          <SettingsHeader
            onSave={handleSave}
            onReset={handleReset}
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
          />

          {/* Main two-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* ── Left Main Column ─────────────────────────────────────────── */}
            <div className="lg:col-span-8 space-y-6">

              <GeneralSettingsForm
                values={general}
                onChange={handleGeneralChange}
              />

              <MarketplaceSettingsCard
                values={marketplace}
                onChange={handleMarketplaceChange}
              />

              <CategoriesManager
                categories={categories}
                onChange={setCategories}
              />

              <LocationsManager
                locations={locations}
                onChange={setLocations}
              />

              <NotificationTemplates
                templates={templates}
                onChange={setTemplates}
              />

              <BrandingPanel
                values={branding}
                onChange={handleBrandingChange}
              />

              <SecuritySettings
                values={security}
                onChange={() => {}}
              />

              <SystemInformation />

            </div>

            {/* ── Right Sidebar ─────────────────────────────────────────────── */}
            <div className="lg:col-span-4 space-y-6">
              <SettingsQuickActions
                onSave={handleSave}
                onReset={handleReset}
                isSaving={isSaving}
              />

              {/* Summary info card */}
              <aside className="bg-white border border-light-border rounded-3xl shadow-apple-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-light-border">
                  <h2 className="text-sm font-black text-stone-900 font-display">Configuration Summary</h2>
                  <p className="text-2xs text-stone-500 font-medium mt-0.5">Current platform snapshot.</p>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { label: 'Platform Status', value: marketplace.marketplaceStatus, color: marketplace.marketplaceStatus === 'Active' ? 'text-emerald-700' : 'text-amber-700' },
                    { label: 'Categories', value: `${categories.filter(c => c.active).length} active`, color: 'text-stone-700' },
                    { label: 'Locations', value: `${locations.filter(l => l.active).length} active`, color: 'text-stone-700' },
                    { label: 'Notification Templates', value: `${templates.length} configured`, color: 'text-stone-700' },
                    { label: 'Registration Mode', value: marketplace.registrationApprovalMode, color: 'text-stone-700' },
                    { label: 'Visibility', value: marketplace.publicProfileVisibility ? 'Public' : 'Private', color: marketplace.publicProfileVisibility ? 'text-emerald-700' : 'text-stone-500' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between gap-2 py-2 border-b border-light-border/60 last:border-0">
                      <span className="text-2xs font-bold text-stone-500">{item.label}</span>
                      <span className={`text-2xs font-black ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </aside>

              {/* Phase note */}
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5">
                <div className="flex items-start gap-3">
                  <span className="text-lg shrink-0" aria-hidden="true">ℹ️</span>
                  <div className="space-y-1">
                    <p className="text-2xs font-black uppercase tracking-wider text-amber-700">Phase 1 MVP</p>
                    <p className="text-2xs text-amber-700 font-medium leading-relaxed">
                      Some settings require backend integration (security policies, file uploads, 2FA). These are marked <strong>Read-only</strong> and will be enabled in Phase 2.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Save confirmation toast */}
      <SaveToast visible={showToast} />
    </div>
  );
}

export default AdminPlatformSettings;
