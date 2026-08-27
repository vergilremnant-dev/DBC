import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import { useAuthDispatch } from '../../hooks/auth/useAuthStore';
import { logoutThunk } from '../../store/auth/authSlice';
import { BRAND } from '../../config/branding';
import { ProfileHeader } from '../../components/workspace/settings/ProfileHeader';
import { ProfileCompletionCard } from '../../components/workspace/settings/ProfileCompletionCard';
import { ProfileForm } from '../../components/workspace/settings/ProfileForm';
import type { PersonalInfoData } from '../../components/workspace/settings/ProfileForm';
import { ContactCard } from '../../components/workspace/settings/ContactCard';
import type { ContactInfoData } from '../../components/workspace/settings/ContactCard';
import { AddressCard } from '../../components/workspace/settings/AddressCard';
import type { UserAddress } from '../../components/workspace/settings/AddressCard';
import { PreferenceCard } from '../../components/workspace/settings/PreferenceCard';
import type { UserPreferences } from '../../components/workspace/settings/PreferenceCard';
import { SecurityCard } from '../../components/workspace/settings/SecurityCard';
import { AccountInfoCard } from '../../components/workspace/settings/AccountInfoCard';

const DEFAULT_ADDRESSES: UserAddress[] = [
  {
    id: 'addr-1',
    name: 'Gachibowli Plot',
    addressLine: 'Plot 102, Gachibowli Layout Phase 2',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500032',
    isDefault: true,
    tag: 'Site'
  },
  {
    id: 'addr-2',
    name: 'Home Apartment',
    addressLine: 'Apt 4B, Emerald Residency, Madhapur',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500081',
    isDefault: false,
    tag: 'Home'
  }
];

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'Light',
  language: 'English',
  timeZone: 'IST',
  dateFormat: 'DD/MM/YYYY',
  notifyOnBids: true,
  notifyOnBookings: true,
  notifyOnMessages: true,
  notifyOnPromotions: false,
  marketingEmails: true
};

export default function WorkspaceSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useAuthDispatch();

  const handleLogoutClick = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      void dispatch(logoutThunk());
      navigate('/');
    }
  };

  // Active sub tab
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'ADDRESSES' | 'PREFERENCES' | 'SECURITY' | 'SYSTEM'>('PROFILE');

  // Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Profile data states
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoData>(() => {
    const raw = localStorage.getItem('dbc_customer_personal');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (err) {
        console.warn('Failed to parse customer personal info', err);
      }
    }
    return {
      firstName: user?.firstName || 'John',
      lastName: user?.lastName || 'Customer',
      displayName: `${user?.firstName || 'John'} C`,
      gender: 'Male',
      dob: '1990-01-01',
      bio: `Construction coordinate lead customer at ${BRAND.name}.`
    };
  });

  const [contactInfo, setContactInfo] = useState<ContactInfoData>(() => {
    const raw = localStorage.getItem('dbc_customer_contact');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (err) {
        console.warn('Failed to parse customer contact info', err);
      }
    }
    return {
      email: user?.email || `customer@${BRAND.name.toLowerCase()}.com`,
      phone: '9876543210',
      altPhone: '',
      preferredMethod: 'WhatsApp',
      emailVerified: true,
      phoneVerified: true
    };
  });

  const [addresses, setAddresses] = useState<UserAddress[]>(() => {
    const raw = localStorage.getItem('dbc_customer_addresses');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (err) {
        console.warn('Failed to parse customer addresses', err);
      }
    }
    return DEFAULT_ADDRESSES;
  });

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const raw = localStorage.getItem('dbc_customer_preferences');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (err) {
        console.warn('Failed to parse customer preferences', err);
      }
    }
    return DEFAULT_PREFERENCES;
  });

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(() => {
    return localStorage.getItem('dbc_customer_avatar') || undefined;
  });

  // Persists
  useEffect(() => {
    localStorage.setItem('dbc_customer_personal', JSON.stringify(personalInfo));
  }, [personalInfo]);

  useEffect(() => {
    localStorage.setItem('dbc_customer_contact', JSON.stringify(contactInfo));
  }, [contactInfo]);

  useEffect(() => {
    localStorage.setItem('dbc_customer_addresses', JSON.stringify(addresses));
  }, [addresses]);

  useEffect(() => {
    localStorage.setItem('dbc_customer_preferences', JSON.stringify(preferences));
  }, [preferences]);

  // Compute profile completion percentage & remaining tasks
  const completionData = useMemo(() => {
    let score = 0;
    const tasks: { id: string; label: string; action: () => void }[] = [];

    // Avatar
    if (avatarUrl) {
      score += 25;
    } else {
      tasks.push({
        id: 'avatar',
        label: 'Add a profile photo',
        action: () => {
          setActiveTab('PROFILE');
          const mockFileUrl = prompt('Enter placeholder image URL (or leave blank to clear):', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80');
          if (mockFileUrl) {
            setAvatarUrl(mockFileUrl);
            localStorage.setItem('dbc_customer_avatar', mockFileUrl);
          }
        }
      });
    }

    // Phone verified
    if (contactInfo.phone && contactInfo.phoneVerified) {
      score += 25;
    } else {
      tasks.push({
        id: 'phone',
        label: 'Verify primary phone number',
        action: () => {
          setActiveTab('PROFILE');
          const newPhone = prompt('Enter 10-digit number to verify:', contactInfo.phone);
          if (newPhone) {
            setContactInfo(prev => ({ ...prev, phone: newPhone, phoneVerified: true }));
          }
        }
      });
    }

    // Addresses
    const hasDefaultAddress = addresses.some(a => a.isDefault);
    if (addresses.length > 0 && hasDefaultAddress) {
      score += 25;
    } else {
      tasks.push({
        id: 'address',
        label: 'Add a saved address location',
        action: () => setActiveTab('ADDRESSES')
      });
    }

    // Bio
    if (personalInfo.bio && personalInfo.bio.trim().length > 10) {
      score += 25;
    } else {
      tasks.push({
        id: 'bio',
        label: 'Write details in biography (min 10 chars)',
        action: () => {
          setActiveTab('PROFILE');
          setIsEditingProfile(true);
        }
      });
    }

    return { percentage: score, tasks };
  }, [avatarUrl, contactInfo, addresses, personalInfo]);

  // Handlers
  const handleProfileSubmit = (values: PersonalInfoData) => {
    setSavingProfile(true);
    setTimeout(() => {
      setPersonalInfo(values);
      setSavingProfile(false);
      setIsEditingProfile(false);
    }, 800);
  };

  const handleContactSubmit = (values: ContactInfoData) => {
    setContactInfo(values);
  };

  const handleAddAddress = (newAddr: Omit<UserAddress, 'id'>) => {
    const id = `addr-${Date.now()}`;
    const newAddress: UserAddress = { ...newAddr, id };
    
    if (newAddress.isDefault) {
      setAddresses(prev => prev.map(a => ({ ...a, isDefault: false })).concat(newAddress));
    } else {
      setAddresses(prev => [...prev, newAddress]);
    }
  };

  const handleEditAddress = (id: string, updatedFields: Partial<UserAddress>) => {
    setAddresses(prev => {
      let nextList = prev.map(a => a.id === id ? { ...a, ...updatedFields } : a);
      if (updatedFields.isDefault) {
        nextList = nextList.map(a => a.id === id ? a : { ...a, isDefault: false });
      }
      return nextList;
    });
  };

  const handleDeleteAddress = (id: string) => {
    if (window.confirm('Delete this address from your saved coordinates list?')) {
      setAddresses(prev => {
        const remaining = prev.filter(a => a.id !== id);
        // If we deleted default, set another default if list is not empty
        if (prev.find(a => a.id === id)?.isDefault && remaining.length > 0) {
          remaining[0].isDefault = true;
        }
        return remaining;
      });
    }
  };

  const handleSetDefaultAddress = (id: string) => {
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
  };

  const handleSavePreferences = (values: UserPreferences) => {
    setPreferences(values);
  };

  const handleChangePassword = async (oldPw: string, newPw: string): Promise<boolean> => {
    // Password change routed to backend in Phase 2; mock delay for UI feedback
    void oldPw; void newPw;
    return new Promise(resolve => setTimeout(() => resolve(true), 1000));
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      personalInfo,
      contactInfo,
      addresses,
      preferences
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${BRAND.name.toLowerCase()}_profile_${user?.firstName || 'customer'}_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  const handleDeleteAccount = () => {
    if (window.confirm('WARNING: Deleting your account will permanently wipe all service requests, booking records, messages, and coordinates. This action CANNOT be undone. Proceed?')) {
      alert('Delete request submitted. Our system support desks will inspect and complete verification.');
    }
  };

  const handleAvatarChange = () => {
    const mockFileUrl = prompt('Enter placeholder image URL (or leave blank to clear):', avatarUrl);
    if (mockFileUrl !== null) {
      setAvatarUrl(mockFileUrl || undefined);
      if (mockFileUrl) {
        localStorage.setItem('dbc_customer_avatar', mockFileUrl);
      } else {
        localStorage.removeItem('dbc_customer_avatar');
      }
    }
  };

  const tabs = [
    { id: 'PROFILE', label: '👤 Profile Info' },
    { id: 'ADDRESSES', label: '📍 Saved Sites' },
    { id: 'PREFERENCES', label: '⚙️ Preferences' },
    { id: 'SECURITY', label: '🔒 Security & Privacy' },
    { id: 'SYSTEM', label: '📊 System Info' },
  ] as const;

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left relative">
      
      {/* Profile Header Widget */}
      <ProfileHeader
        avatarUrl={avatarUrl}
        fullName={`${personalInfo.firstName} ${personalInfo.lastName}`}
        customerId="CUST-HYD-9988-A2"
        memberSince="June 2026"
        status="Verified Account"
        isEditing={isEditingProfile}
        onToggleEdit={() => setIsEditingProfile(!isEditingProfile)}
        onAvatarChange={handleAvatarChange}
      />

      {/* Tabs Menu navigation row */}
      <section className="flex gap-2 border-b border-stone-200 overflow-x-auto pb-1 text-xs no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 border-b-2 font-bold uppercase tracking-wider transition cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-850'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {/* Tab viewport panel grids */}
      <div className="space-y-6">
        
        {/* TABS 1: Profile & Contact */}
        {activeTab === 'PROFILE' && (
          <div className="grid gap-6 lg:grid-cols-12 items-start">
            
            {/* Left: Forms */}
            <div className="space-y-6 lg:col-span-8">
              
              <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                {isEditingProfile ? (
                  <ProfileForm
                    initialValues={personalInfo}
                    saving={savingProfile}
                    onSubmit={handleProfileSubmit}
                    onCancel={() => setIsEditingProfile(false)}
                  />
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-stone-900 font-serif border-b border-stone-100 pb-2">
                      Personal Details
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 text-xs font-semibold text-stone-600">
                      <div className="space-y-0.5 bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                        <span className="block text-[9px] uppercase font-bold text-stone-400">Display / User Name</span>
                        <span className="text-stone-900">{personalInfo.displayName || 'Not Set'}</span>
                      </div>
                      <div className="space-y-0.5 bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                        <span className="block text-[9px] uppercase font-bold text-stone-400">Gender</span>
                        <span className="text-stone-900">{personalInfo.gender || 'Not Specified'}</span>
                      </div>
                      <div className="space-y-0.5 bg-stone-50/50 p-3 rounded-xl border border-stone-100">
                        <span className="block text-[9px] uppercase font-bold text-stone-400">Date of Birth</span>
                        <span className="text-stone-900">{personalInfo.dob || 'Not Specified'}</span>
                      </div>
                      <div className="space-y-0.5 bg-stone-50/50 p-3 rounded-xl border border-stone-100 sm:col-span-2">
                        <span className="block text-[9px] uppercase font-bold text-stone-400">Biography</span>
                        <p className="text-stone-600 leading-relaxed mt-0.5">{personalInfo.bio || 'No biography written yet.'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Card */}
              <ContactCard
                initialValues={contactInfo}
                onSubmit={handleContactSubmit}
              />
            </div>

            {/* Right: Strength metrics card */}
            <div className="lg:col-span-4 h-full">
              <ProfileCompletionCard
                percentage={completionData.percentage}
                incompleteItems={completionData.tasks}
              />
            </div>

          </div>
        )}

        {/* TABS 2: Addresses */}
        {activeTab === 'ADDRESSES' && (
          <AddressCard
            addresses={addresses}
            onAddAddress={handleAddAddress}
            onEditAddress={handleEditAddress}
            onDeleteAddress={handleDeleteAddress}
            onSetDefaultAddress={handleSetDefaultAddress}
          />
        )}

        {/* TABS 3: Preferences */}
        {activeTab === 'PREFERENCES' && (
          <PreferenceCard
            initialValues={preferences}
            onSave={handleSavePreferences}
          />
        )}

        {/* TABS 4: Security & Privacy */}
        {activeTab === 'SECURITY' && (
          <SecurityCard
            onChangePassword={handleChangePassword}
            onExportData={handleExportData}
            onDeleteAccount={handleDeleteAccount}
          />
        )}

        {/* TABS 5: Technical System info */}
        {activeTab === 'SYSTEM' && (
          <div className="space-y-4">
            <AccountInfoCard
              accountType="Customer Account (SaaS Client)"
              role="ROLE_CUSTOMER"
              memberSince="05-Jun-2026 14:10"
              lastLogin={new Date().toLocaleString()}
              status="ACTIVE"
              appVersion="v2.2.0-Production-Beta"
            />
            <div className="flex justify-end pt-2">
              <button
                onClick={handleLogoutClick}
                className="dbc-btn dbc-btn-md dbc-btn-danger"
              >
                Log Out Account
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
