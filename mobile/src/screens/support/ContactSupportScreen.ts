import { mobileSupportService } from '../../services/mobileSupportService.js';
import type { MobileSupportRequest, MobileSupportIssueType, MobileSupportIssue } from '../../types/mobileSupportTypes.js';

export interface ContactSupportScreenProps {
  userEmail?: string;
  userRole?: 'customer' | 'contractor' | 'admin';
  initialProjectId?: string;
  initialRequestId?: string;
  initialQuotationId?: number | string;
  onSuccess?: (issue: MobileSupportIssue) => void;
  onBack?: () => void;
}

export class ContactSupportScreenController {
  private props: ContactSupportScreenProps;
  private state: {
    issueType: MobileSupportIssueType;
    subject: string;
    description: string;
    relatedProjectId: string;
    relatedRequestId: string;
    attachmentUrl: string;
    isSubmitting: boolean;
    error: string | null;
    createdIssue: MobileSupportIssue | null;
  };

  constructor(props: ContactSupportScreenProps) {
    this.props = props;
    this.state = {
      issueType: 'project',
      subject: '',
      description: '',
      relatedProjectId: props.initialProjectId || '',
      relatedRequestId: props.initialRequestId || '',
      attachmentUrl: '',
      isSubmitting: false,
      error: null,
      createdIssue: null,
    };
  }

  async init(): Promise<void> {}

  updateField(field: string, value: any): void {
    if (field === 'subject') this.state.subject = value;
    else if (field === 'description') this.state.description = value;
    else if (field === 'issueType') this.state.issueType = value;
    else if (field === 'relatedProjectId') this.state.relatedProjectId = value;
    else if (field === 'relatedRequestId') this.state.relatedRequestId = value;
  }

  setIssueType(type: MobileSupportIssueType): void {
    this.state.issueType = type;
  }

  setSubject(subject: string): void {
    this.state.subject = subject;
  }

  setDescription(desc: string): void {
    this.state.description = desc;
  }

  setRelatedProjectId(id: string): void {
    this.state.relatedProjectId = id;
  }

  async handleAttachmentUpload(base64Data: string): Promise<void> {
    try {
      const res = await mobileSupportService.uploadSupportAttachment(base64Data);
      this.state.attachmentUrl = res.url || res;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Failed to attach image';
    }
  }

  async submitSupportRequest(): Promise<MobileSupportIssue | undefined> {
    if (!this.state.subject || !this.state.description) {
      this.state.error = 'Please provide both a subject and a description of your issue.';
      return;
    }

    this.state.isSubmitting = true;
    this.state.error = null;
    try {
      const issue = await mobileSupportService.createSupportTicket({
        category: this.state.issueType,
        subject: this.state.subject,
        description: this.state.description,
        relatedProjectId: this.state.relatedProjectId || undefined,
        relatedRequestId: this.state.relatedRequestId || undefined,
        relatedQuotationId: this.props.initialQuotationId,
        attachmentUrl: this.state.attachmentUrl || undefined,
        userEmail: this.props.userEmail || 'customer@example.com',
        userRole: this.props.userRole || 'customer',
      });

      this.state.createdIssue = issue;
      if (this.props.onSuccess) {
        this.props.onSuccess(issue);
      }
      return issue;
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Failed to submit support request';
    } finally {
      this.state.isSubmitting = false;
    }
  }

  async submit(): Promise<MobileSupportIssue | undefined> {
    return this.submitSupportRequest();
  }

  getState() {
    return {
      ...this.state,
      submittedIssue: this.state.createdIssue,
    };
  }
}

export function renderContactSupportScreen(
  controller: ContactSupportScreenController,
  onSuccess?: (issue: MobileSupportIssue) => void,
  onBack?: () => void
): string {
  const { issueType, subject, description, relatedProjectId, attachmentUrl, isSubmitting, error, createdIssue } =
    controller.getState();

  if (createdIssue) {
    return `
      <div class="mobile-container p-6 text-center space-y-4 select-none pb-24">
        <span class="text-4xl">✅</span>
        <h2 class="text-base font-bold text-stone-900 font-serif">Support Request Logged</h2>
        <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
          <p class="font-bold">Ticket ID: ${createdIssue.id}</p>
          <p class="text-[11px]">${createdIssue.responseNote}</p>
        </div>
        ${
          onBack
            ? `<button onclick="onBack()" class="min-h-[44px] w-full px-4 py-3 bg-stone-900 text-white font-bold rounded-xl text-xs">Return to Help Center</button>`
            : ''
        }
      </div>
    `;
  }

  return `
    <div class="mobile-container p-4 space-y-4 select-none pb-24">
      <!-- Header -->
      <div class="flex items-center gap-3">
        ${
          onBack
            ? `<button onclick="onBack()" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold">←</button>`
            : ''
        }
        <div>
          <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Direct Assistance</span>
          <h1 class="text-base font-bold text-stone-900 font-serif">Contact Platform Support</h1>
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

      <!-- Contact Support Form Card -->
      <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3.5 shadow-sm">
        <h3 class="text-xs font-black uppercase text-stone-900 tracking-wider">Describe Your Issue</h3>

        <!-- Issue Category Selector -->
        <div class="space-y-1">
          <label class="text-[10px] uppercase font-bold text-stone-500 block">Issue Category</label>
          <div class="flex gap-1.5 overflow-x-auto pb-1">
            ${['project', 'quotation', 'payment', 'account', 'technical', 'communication', 'other']
              .map(
                (t) => `
              <button
                onclick="controller.setIssueType('${t}')"
                class="min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition shrink-0 ${
                  issueType === t
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }"
              >
                ${t}
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Subject Line -->
        <div class="space-y-1">
          <label class="text-[10px] uppercase font-bold text-stone-500 block">Subject Line</label>
          <input
            type="text"
            value="${subject}"
            onchange="controller.setSubject(this.value)"
            placeholder="Brief summary of your inquiry or site issue..."
            class="w-full min-h-[44px] px-3.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
          />
        </div>

        <!-- Related Project ID (Optional) -->
        <div class="space-y-1">
          <label class="text-[10px] uppercase font-bold text-stone-500 block">Related Project ID (Optional)</label>
          <input
            type="text"
            value="${relatedProjectId}"
            onchange="controller.setRelatedProjectId(this.value)"
            placeholder="e.g. proj-101 or REQ-505..."
            class="w-full min-h-[44px] px-3.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
          />
        </div>

        <!-- Description Textarea -->
        <div class="space-y-1">
          <label class="text-[10px] uppercase font-bold text-stone-500 block">Detailed Description</label>
          <textarea
            rows="4"
            onchange="controller.setDescription(this.value)"
            placeholder="Provide relevant details about your requirement, quotation, or payment..."
            class="w-full p-3 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none resize-none min-h-[44px]"
          >${description}</textarea>
        </div>

        <!-- Attachment Trigger -->
        <div class="space-y-1 pt-1 border-t border-stone-100">
          <div class="flex items-center justify-between">
            <span class="text-[10.5px] text-stone-600 font-bold">Screenshot / Photo Attachment</span>
            ${attachmentUrl ? `<span class="text-[10px] font-bold text-emerald-700">Attached ✓</span>` : ''}
          </div>
          <button
            onclick="controller.handleAttachmentUpload('mock_support_screenshot_base64')"
            class="min-h-[44px] w-full px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition border border-stone-200"
          >
            ${attachmentUrl ? 'Change Attachment' : 'Attach Photo or Document'}
          </button>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="pt-2">
        <button
          onclick="controller.submitSupportRequest()"
          ${isSubmitting ? 'disabled' : ''}
          class="w-full min-h-[44px] py-3 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-2xl text-xs transition disabled:opacity-50 shadow-sm"
        >
          ${isSubmitting ? 'Submitting Request...' : 'Submit Support Request'}
        </button>
      </div>
    </div>
  `;
}
