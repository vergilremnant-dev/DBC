import { mobileProfileService } from '../../services/mobileProfileService.js';
import type { MobileUserProfile, MobileProfileUpdate } from '../../types/mobileProfileTypes.js';

export interface EditProfileScreenProps {
  onBack?: () => void;
  onSaveSuccess?: () => void;
}

export class EditProfileScreenController {
  private props: EditProfileScreenProps;
  private state: {
    profile: MobileUserProfile | null;
    formData: MobileProfileUpdate;
    isLoading: boolean;
    isSaving: boolean;
    isDirty: boolean;
    showDiscardModal: boolean;
    error: string | null;
    statusMessage: string | null;
  };

  constructor(props: EditProfileScreenProps) {
    this.props = props;
    this.state = {
      profile: null,
      formData: {},
      isLoading: true,
      isSaving: false,
      isDirty: false,
      showDiscardModal: false,
      error: null,
      statusMessage: null,
    };
  }

  async init(): Promise<void> {
    await this.loadProfile();
  }

  async loadProfile(): Promise<void> {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const p = await mobileProfileService.getCurrentProfile();
      this.state.profile = p;
      this.state.formData = {
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        phone: p.phone || '',
        city: p.city || '',
        address: p.address || '',
        businessName: p.businessName || '',
        category: p.category || '',
        bio: p.bio || '',
        avatarUrl: p.avatarUrl || '',
      };
      this.state.isDirty = false;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Unable to load profile';
    } finally {
      this.state.isLoading = false;
    }
  }

  updateFormField<K extends keyof MobileProfileUpdate>(key: K, value: MobileProfileUpdate[K]): void {
    this.state.formData[key] = value;
    this.state.isDirty = true;
  }

  async saveProfile(): Promise<void> {
    if (this.state.isSaving || !this.state.profile) return;

    this.state.isSaving = true;
    this.state.error = null;
    try {
      const updated = await mobileProfileService.updateProfile(this.state.formData);
      this.state.profile = updated;
      this.state.isDirty = false;
      this.state.statusMessage = 'Profile information saved successfully.';
      if (this.props.onSaveSuccess) {
        this.props.onSaveSuccess();
      }
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Failed to save profile changes';
    } finally {
      this.state.isSaving = false;
    }
  }

  handleBackAttempt(): boolean {
    if (this.state.isDirty) {
      this.state.showDiscardModal = true;
      return false; // Navigation blocked until confirmed
    }
    if (this.props.onBack) {
      this.props.onBack();
    }
    return true;
  }

  closeDiscardModal(): void {
    this.state.showDiscardModal = false;
  }

  confirmDiscard(): void {
    this.state.showDiscardModal = false;
    this.state.isDirty = false;
    if (this.props.onBack) {
      this.props.onBack();
    }
  }

  async handleImagePick(base64Data: string): Promise<void> {
    try {
      const { url } = await mobileProfileService.uploadProfileImage(base64Data);
      this.updateFormField('avatarUrl', url);
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Failed to upload profile picture';
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderEditProfileScreen(
  controller: EditProfileScreenController,
  onBack?: () => void
): string {
  const { profile, formData, isLoading, isSaving, isDirty, showDiscardModal, error, statusMessage } = controller.getState();

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Profile Details...</p>
      </div>
    `;
  }

  if (!profile) {
    return `
      <div class="mobile-container p-6 text-center space-y-4">
        <h2 class="text-base font-bold text-stone-800">Profile Not Found</h2>
        ${
          onBack
            ? `<button onclick="onBack()" class="min-h-[44px] px-4 py-2 bg-stone-900 text-white font-bold rounded-xl text-xs">Return to Profile</button>`
            : ''
        }
      </div>
    `;
  }

  return `
    <div class="mobile-container p-4 space-y-4 select-none pb-24">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <button
          onclick="controller.handleBackAttempt()"
          class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold"
        >
          ←
        </button>
        <div>
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Account Settings</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Edit Profile</h1>
        </div>
      </div>

      ${
        error
          ? `
        <div class="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800">
          ${error}
        </div>
      `
          : ''
      }

      ${
        statusMessage
          ? `
        <div class="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
          ${statusMessage}
        </div>
      `
          : ''
      }

      <!-- Profile Image Picker Section -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl flex items-center gap-4 shadow-sm">
        <div class="w-14 h-14 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xl uppercase overflow-hidden shrink-0 border border-stone-300">
          ${
            formData.avatarUrl
              ? `<img src="${formData.avatarUrl}" alt="${profile.name}" class="w-full h-full object-cover" />`
              : profile.name.slice(0, 2)
          }
        </div>

        <div class="flex-1 space-y-1">
          <h4 class="text-xs font-bold text-stone-900">Profile Photo</h4>
          <p class="text-[10px] text-stone-500 font-medium">JPEG or PNG under 5MB</p>
          <button
            onclick="controller.handleImagePick('mock_base64_avatar_string_123')"
            class="min-h-[44px] px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-lg text-xs transition border border-stone-200 mt-1"
          >
            Change Photo
          </button>
        </div>
      </div>

      <!-- Editable Form Fields -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3.5 shadow-sm">
        <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider">Personal Information</h3>

        <!-- First Name -->
        <div class="space-y-1">
          <label class="text-[10px] uppercase font-bold text-stone-500 block">First Name</label>
          <input
            type="text"
            value="${formData.firstName || ''}"
            onchange="controller.updateFormField('firstName', this.value)"
            class="w-full min-h-[44px] px-3.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
          />
        </div>

        <!-- Last Name -->
        <div class="space-y-1">
          <label class="text-[10px] uppercase font-bold text-stone-500 block">Last Name</label>
          <input
            type="text"
            value="${formData.lastName || ''}"
            onchange="controller.updateFormField('lastName', this.value)"
            class="w-full min-h-[44px] px-3.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
          />
        </div>

        <!-- Phone Number -->
        <div class="space-y-1">
          <label class="text-[10px] uppercase font-bold text-stone-500 block">Phone Number</label>
          <input
            type="text"
            value="${formData.phone || ''}"
            onchange="controller.updateFormField('phone', this.value)"
            class="w-full min-h-[44px] px-3.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
          />
        </div>

        <!-- Location / City -->
        <div class="space-y-1">
          <label class="text-[10px] uppercase font-bold text-stone-500 block">City / Location</label>
          <input
            type="text"
            value="${formData.city || ''}"
            onchange="controller.updateFormField('city', this.value)"
            class="w-full min-h-[44px] px-3.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
          />
        </div>

        ${
          profile.role === 'contractor'
            ? `
          <!-- Business Name (Trade Partner) -->
          <div class="space-y-1">
            <label class="text-[10px] uppercase font-bold text-stone-500 block">Trade Business Name</label>
            <input
              type="text"
              value="${formData.businessName || ''}"
              onchange="controller.updateFormField('businessName', this.value)"
              class="w-full min-h-[44px] px-3.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
            />
          </div>
        `
            : ''
        }

        <!-- Bio / Info -->
        <div class="space-y-1">
          <label class="text-[10px] uppercase font-bold text-stone-500 block">About / Bio</label>
          <textarea
            rows="3"
            onchange="controller.updateFormField('bio', this.value)"
            class="w-full p-3 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none resize-none min-h-[44px]"
          >${formData.bio || ''}</textarea>
        </div>
      </div>

      <!-- Read-Only Account Fields -->
      <div class="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2.5">
        <h3 class="text-xs font-black uppercase text-stone-700 tracking-wider">Account Security Constraints</h3>

        <div class="flex items-center justify-between text-xs py-1 border-b border-stone-200">
          <span class="text-stone-500 font-medium">Email Address</span>
          <span class="font-bold text-stone-800">${profile.email}</span>
        </div>

        <p class="text-[10px] text-stone-500 font-medium">
          🔒 Email address change requires dedicated verification and OTP confirmation.
        </p>
      </div>

      <!-- Save Button -->
      <div class="pt-2">
        <button
          onclick="controller.saveProfile()"
          ${isSaving || !isDirty ? 'disabled' : ''}
          class="w-full min-h-[44px] py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-2xl text-xs transition disabled:opacity-50 shadow-sm"
        >
          ${isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
        </button>
      </div>

      <!-- Unsaved Changes Discard Modal -->
      ${
        showDiscardModal
          ? `
        <div class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div class="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h3 class="text-sm font-black text-stone-900">Discard Unsaved Changes?</h3>
            <p class="text-xs text-stone-600">
              You have unsaved changes to your profile. Leaving this page will discard your updates.
            </p>

            <div class="flex items-center gap-2 pt-2">
              <button
                onclick="controller.closeDiscardModal()"
                class="flex-1 min-h-[44px] py-2 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs"
              >
                Keep Editing
              </button>
              <button
                onclick="controller.confirmDiscard()"
                class="flex-1 min-h-[44px] py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;
}
