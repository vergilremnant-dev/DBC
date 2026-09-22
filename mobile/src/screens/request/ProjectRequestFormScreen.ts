/**
 * Mobile Project Request Form Screen Component & Controller for DBC Mobile Application.
 * One-column mobile layout: Service, Contractor, Scope/Notes, Date/Time, Budget, Address,
 * Review Step before submission, touch target height >= 44px, and duplicate submission prevention.
 */

import { mobileRequestService } from '../../services/mobileRequestService';
import { mobileTheme } from '../../theme/themeTokens';
import { MobileProjectRequestDetails, MobileProjectRequestForm } from '../../types/requestMobileTypes';

export interface ProjectRequestFormState extends MobileProjectRequestForm {
  isSubmitting: boolean;
  isReviewStep: boolean;
  errorMessage: string | null;
  fieldErrors: Record<string, string>;
  createdDetails: MobileProjectRequestDetails | null;
}

export class ProjectRequestFormController {
  private state: ProjectRequestFormState;

  constructor(initialData?: Partial<MobileProjectRequestForm>) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    const dateStr = tomorrow.toISOString().split('T')[0];

    this.state = {
      providerId: initialData?.providerId || '',
      providerName: initialData?.providerName || 'Selected Contractor Partner',
      categoryId: initialData?.categoryId || 1,
      categoryName: initialData?.categoryName || 'General Construction',
      preferredDate: initialData?.preferredDate || dateStr,
      preferredTime: initialData?.preferredTime || '10:00',
      customerAddress: initialData?.customerAddress || '',
      city: initialData?.city || 'Hyderabad',
      state: initialData?.state || 'Telangana',
      notes: initialData?.notes || '',
      estimatedBudget: initialData?.estimatedBudget || undefined,
      isSubmitting: false,
      isReviewStep: false,
      errorMessage: null,
      fieldErrors: {},
      createdDetails: null,
    };
  }

  getState(): ProjectRequestFormState {
    return { ...this.state };
  }

  setField<K extends keyof MobileProjectRequestForm>(field: K, value: MobileProjectRequestForm[K]) {
    this.state[field] = value;
    if (this.state.fieldErrors[field]) {
      delete this.state.fieldErrors[field];
    }
  }

  setReviewStep(isReview: boolean) {
    if (isReview && !this.validate()) {
      return;
    }
    this.state.isReviewStep = isReview;
  }

  validate(): boolean {
    const errors: Record<string, string> = {};
    if (!this.state.providerId) {
      errors.providerId = 'Target contractor is required';
    }
    if (!this.state.categoryId) {
      errors.categoryId = 'Service category is required';
    }
    if (!this.state.preferredDate) {
      errors.preferredDate = 'Requested start date is required';
    }
    if (!this.state.customerAddress || !this.state.customerAddress.trim()) {
      errors.customerAddress = 'Project location address is required';
    }
    if (!this.state.city || !this.state.city.trim()) {
      errors.city = 'City is required';
    }
    this.state.fieldErrors = errors;
    return Object.keys(errors).length === 0;
  }

  async submitRequest(): Promise<MobileProjectRequestDetails | null> {
    this.state.errorMessage = null;
    if (!this.validate()) {
      return null;
    }

    if (this.state.isSubmitting) {
      return null; // Prevent duplicate submissions
    }

    this.state.isSubmitting = true;

    try {
      const details = await mobileRequestService.createProjectRequest({
        providerId: this.state.providerId,
        providerName: this.state.providerName,
        categoryId: this.state.categoryId,
        categoryName: this.state.categoryName,
        preferredDate: this.state.preferredDate,
        preferredTime: this.state.preferredTime,
        customerAddress: this.state.customerAddress,
        city: this.state.city,
        state: this.state.state,
        notes: this.state.notes,
        estimatedBudget: this.state.estimatedBudget,
      });

      this.state.createdDetails = details;
      return details;
    } catch (err: unknown) {
      this.state.errorMessage = err instanceof Error ? err.message : 'Failed to submit project request';
      return null;
    } finally {
      this.state.isSubmitting = false;
    }
  }
}

export const renderProjectRequestFormDescriptor = (state: ProjectRequestFormState) => {
  if (state.createdDetails) {
    return {
      type: 'Screen',
      name: 'ProjectRequestSuccessScreen',
      styles: {
        backgroundColor: mobileTheme.colors.background,
        padding: mobileTheme.spacing.lg,
      },
      confirmation: {
        title: 'Project Request Submitted!',
        subtitle: `Request #${state.createdDetails.bookingNumber} has been sent to ${state.createdDetails.providerName}`,
        statusBadge: state.createdDetails.statusLabel,
        notice: 'The contractor will review your project scope and submit a detailed quotation proposal.',
        ctaButtonLabel: 'View Request Details',
        minHeight: mobileTheme.touchTargets.buttonHeight,
      },
    };
  }

  if (state.isReviewStep) {
    return {
      type: 'Screen',
      name: 'ProjectRequestReviewScreen',
      styles: {
        backgroundColor: mobileTheme.colors.background,
        padding: mobileTheme.spacing.lg,
      },
      header: {
        title: 'Review Project Request',
        subtitle: 'Confirm details before sending to contractor',
      },
      reviewItems: [
        { label: 'Selected Contractor', value: state.providerName },
        { label: 'Service Category', value: state.categoryName },
        { label: 'Target Start Date & Time', value: `${state.preferredDate} at ${state.preferredTime}` },
        { label: 'Project Location', value: `${state.customerAddress}, ${state.city}, ${state.state}` },
        { label: 'Estimated Budget', value: state.estimatedBudget ? `₹${state.estimatedBudget.toLocaleString()}` : 'Custom Quotation' },
        { label: 'Scope Notes', value: state.notes || 'None specified' },
      ],
      actions: {
        editButton: {
          label: 'Edit Details',
          minHeight: mobileTheme.touchTargets.minTouchArea,
        },
        submitButton: {
          label: state.isSubmitting ? 'Submitting Request...' : 'Confirm & Submit Request',
          disabled: state.isSubmitting,
          minHeight: mobileTheme.touchTargets.buttonHeight,
          backgroundColor: mobileTheme.colors.primary,
        },
      },
      errorBanner: state.errorMessage,
    };
  }

  return {
    type: 'Screen',
    name: 'ProjectRequestFormScreen',
    styles: {
      backgroundColor: mobileTheme.colors.background,
      padding: mobileTheme.spacing.lg,
    },
    header: {
      title: 'Start Project Request',
      subtitle: `Request proposal from ${state.providerName}`,
    },
    sections: [
      {
        title: 'Service & Contractor',
        fields: [
          { label: 'Contractor', value: state.providerName, readonly: true },
          { label: 'Category', value: state.categoryName, readonly: true },
        ],
      },
      {
        title: 'Timeline & Schedule',
        fields: [
          {
            label: 'Preferred Start Date',
            value: state.preferredDate,
            placeholder: 'YYYY-MM-DD',
            minHeight: mobileTheme.touchTargets.inputHeight,
            error: state.fieldErrors.preferredDate,
          },
          {
            label: 'Preferred Start Time',
            value: state.preferredTime,
            placeholder: '10:00',
            minHeight: mobileTheme.touchTargets.inputHeight,
          },
        ],
      },
      {
        title: 'Project Location',
        fields: [
          {
            label: 'Street Address',
            value: state.customerAddress,
            placeholder: 'Plot / House No, Street, Landmark',
            minHeight: mobileTheme.touchTargets.inputHeight,
            error: state.fieldErrors.customerAddress,
          },
          {
            label: 'City',
            value: state.city,
            minHeight: mobileTheme.touchTargets.inputHeight,
            error: state.fieldErrors.city,
          },
        ],
      },
      {
        title: 'Scope & Budget (Optional)',
        fields: [
          {
            label: 'Estimated Budget (₹)',
            value: state.estimatedBudget ? String(state.estimatedBudget) : '',
            placeholder: 'e.g. 500000',
            minHeight: mobileTheme.touchTargets.inputHeight,
          },
          {
            label: 'Project Notes & Requirements',
            value: state.notes,
            placeholder: 'Describe your construction or renovation scope...',
            multiline: true,
            minHeight: 100,
          },
        ],
      },
    ],
    button: {
      label: 'Proceed to Review',
      minHeight: mobileTheme.touchTargets.buttonHeight,
      backgroundColor: mobileTheme.colors.primary,
    },
    errorBanner: state.errorMessage,
  };
};
