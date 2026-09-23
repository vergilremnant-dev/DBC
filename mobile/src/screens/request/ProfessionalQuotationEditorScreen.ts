import { mobileProfessionalQuotationService } from '../../services/mobileProfessionalQuotationService.js';
import type {
  MobileCreateQuotationForm,
  MobilePricingModel,
  MobileQuotationMilestone,
} from '../../types/professionalQuotationMobileTypes.js';

export interface ProfessionalQuotationEditorScreenProps {
  requirementId: number;
  quotationId?: number;
  onSuccess?: (quotationId: number) => void;
  onCancel?: () => void;
}

export class ProfessionalQuotationEditorScreenController {
  private props: ProfessionalQuotationEditorScreenProps;
  private state: {
    form: MobileCreateQuotationForm;
    isLoading: boolean;
    isSubmitting: boolean;
    isSavingDraft: boolean;
    error: string | null;
    validationErrors: Record<string, string>;
  };

  constructor(props: ProfessionalQuotationEditorScreenProps) {
    this.props = props;
    this.state = {
      form: {
        requirementId: props.requirementId,
        priceModel: 'MILESTONE_BASED',
        totalAmount: 100000,
        estimatedDurationDays: 30,
        warrantyMonths: 12,
        proposal: {
          title: 'Construction Scope Technical Proposal',
          summary: 'Detailed technical specification and execution breakdown.',
          scope: 'Site preparation, material procurement, structural execution and testing.',
          deliverables: 'Completed milestone stages with quality inspection clearance.',
          assumptions: 'Site water and power provided by customer.',
          exclusions: 'Municipal permits and design approvals.',
        },
        milestones: [
          { id: 1, name: 'Phase 1 Initial Setup & Excavation', cost: 40000, durationDays: 10 },
          { id: 2, name: 'Phase 2 Core Structure & Casting', cost: 60000, durationDays: 20 },
        ],
        step: 1,
      },
      isLoading: false,
      isSubmitting: false,
      isSavingDraft: false,
      error: null,
      validationErrors: {},
    };
  }

  async init(): Promise<void> {
    if (this.props.quotationId) {
      this.state.isLoading = true;
      try {
        const existing = await mobileProfessionalQuotationService.getQuotationDetails(this.props.quotationId);
        this.state.form = {
          requirementId: existing.requirementId,
          priceModel: existing.priceModel,
          totalAmount: existing.totalAmount,
          estimatedDurationDays: existing.estimatedDurationDays,
          warrantyMonths: existing.warrantyMonths,
          proposal: existing.proposal,
          milestones: existing.milestones,
          step: 1,
        };
      } catch (err) {
        this.state.error = err instanceof Error ? err.message : 'Unable to load quotation for editing';
      } finally {
        this.state.isLoading = false;
      }
    }
  }

  setStep(step: 1 | 2 | 3 | 4 | 5): void {
    if (this.validateCurrentStep()) {
      this.state.form.step = step;
    }
  }

  nextStep(): void {
    if (this.validateCurrentStep()) {
      if (this.state.form.step < 5) {
        this.state.form.step = (this.state.form.step + 1) as 1 | 2 | 3 | 4 | 5;
      }
    }
  }

  prevStep(): void {
    if (this.state.form.step > 1) {
      this.state.form.step = (this.state.form.step - 1) as 1 | 2 | 3 | 4 | 5;
    }
  }

  updateProposalField(field: keyof typeof this.state.form.proposal, value: string): void {
    this.state.form.proposal[field] = value;
  }

  updateForm(field: keyof MobileCreateQuotationForm, value: any): void {
    (this.state.form as any)[field] = value;
  }

  addMilestone(): void {
    const nextId = Date.now();
    this.state.form.milestones.push({
      id: nextId,
      name: `Milestone ${this.state.form.milestones.length + 1}`,
      cost: 10000,
      durationDays: 7,
    });
  }

  updateMilestone(index: number, field: keyof MobileQuotationMilestone, value: any): void {
    if (this.state.form.milestones[index]) {
      (this.state.form.milestones[index] as any)[field] = value;
    }
  }

  removeMilestone(index: number): void {
    this.state.form.milestones.splice(index, 1);
  }

  validateCurrentStep(): boolean {
    const { step, proposal, totalAmount, estimatedDurationDays, milestones } = this.state.form;
    this.state.validationErrors = {};

    if (step === 1) {
      if (!proposal.title.trim()) this.state.validationErrors.title = 'Proposal title is required';
      if (!proposal.summary.trim()) this.state.validationErrors.summary = 'Summary is required';
      if (!proposal.scope.trim()) this.state.validationErrors.scope = 'Scope of work is required';
      if (!proposal.deliverables.trim()) this.state.validationErrors.deliverables = 'Deliverables are required';
    } else if (step === 2) {
      if (!estimatedDurationDays || estimatedDurationDays <= 0) {
        this.state.validationErrors.estimatedDurationDays = 'Valid duration in days is required';
      }
    } else if (step === 3) {
      if (!totalAmount || totalAmount <= 0) {
        this.state.validationErrors.totalAmount = 'Valid total amount is required';
      }
    } else if (step === 4) {
      const allocatedSum = milestones.reduce((sum, m) => sum + (m.cost || 0), 0);
      if (milestones.length === 0) {
        this.state.validationErrors.milestones = 'At least one milestone is required';
      } else if (allocatedSum !== totalAmount) {
        this.state.validationErrors.milestones = `Milestone total (₹${allocatedSum.toLocaleString('en-IN')}) must match contract total (₹${totalAmount.toLocaleString('en-IN')})`;
      }
    }

    return Object.keys(this.state.validationErrors).length === 0;
  }

  async saveDraft(): Promise<void> {
    if (this.state.isSavingDraft) return;
    this.state.isSavingDraft = true;
    this.state.error = null;
    try {
      const res = await mobileProfessionalQuotationService.createQuotationDraft(this.state.form);
      if (this.props.onSuccess) this.props.onSuccess(res.id);
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Failed to save draft';
    } finally {
      this.state.isSavingDraft = false;
    }
  }

  async submitQuotation(): Promise<void> {
    if (this.state.isSubmitting) return;
    if (!this.validateCurrentStep()) return;

    this.state.isSubmitting = true;
    this.state.error = null;
    try {
      const qId = this.props.quotationId || 0;
      const res = await mobileProfessionalQuotationService.submitQuotation(qId, this.state.form);
      if (this.props.onSuccess) this.props.onSuccess(res.id);
    } catch (err) {
      this.state.error = err instanceof Error ? err.message : 'Failed to submit quotation';
    } finally {
      this.state.isSubmitting = false;
    }
  }

  getState() {
    return { ...this.state };
  }
}

export function renderProfessionalQuotationEditorScreen(
  controller: ProfessionalQuotationEditorScreenController,
  onSuccess?: (quotationId: number) => void,
  onCancel?: () => void
): string {
  const { form, isLoading, isSubmitting, isSavingDraft, error, validationErrors } = controller.getState();
  const { step, proposal, milestones, totalAmount, estimatedDurationDays, warrantyMonths, priceModel } = form;

  if (isLoading) {
    return `
      <div class="mobile-container flex flex-col items-center justify-center p-6 space-y-4">
        <div class="spinner border-t-emerald-700 border-stone-200 border-4 w-8 h-8 rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-stone-600">Loading Proposal Editor...</p>
      </div>
    `;
  }

  const allocatedSum = milestones.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);
  const isAllocationMatching = allocatedSum === totalAmount;

  return `
    <div class="mobile-container p-4 space-y-5 select-none pb-24">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          ${
            onCancel
              ? `<button onclick="onCancel()" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-stone-700 font-bold">✕</button>`
              : ''
          }
          <div>
            <span class="text-[9px] font-black uppercase text-stone-400 tracking-wider">Step ${step} of 5</span>
            <h1 class="text-base font-bold text-stone-900 font-serif">Quotation Wizard</h1>
          </div>
        </div>
        <button
          onclick="controller.saveDraft()"
          ${isSavingDraft ? 'disabled' : ''}
          class="min-h-[44px] px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition disabled:opacity-50"
        >
          ${isSavingDraft ? 'Saving...' : 'Save Draft'}
        </button>
      </div>

      <!-- Step Indicator Bar -->
      <div class="flex items-center gap-1.5">
        ${[1, 2, 3, 4, 5]
          .map(
            (s) => `
          <div class="h-2 flex-1 rounded-full ${
            s === step ? 'bg-emerald-700' : s < step ? 'bg-emerald-300' : 'bg-stone-200'
          } transition-all"></div>
        `
          )
          .join('')}
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

      <!-- STEP 1: Scope & Details -->
      ${
        step === 1
          ? `
        <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
          <h2 class="text-xs font-black uppercase text-stone-900 tracking-wider">Step 1: Technical Scope & Proposal</h2>
          
          <div class="space-y-3">
            <div>
              <label class="text-[11px] font-bold text-stone-700 block mb-1">Proposal Title *</label>
              <input
                type="text"
                value="${proposal.title}"
                onchange="controller.updateProposalField('title', this.value)"
                placeholder="e.g. Civil Raft Foundation Construction Proposal"
                class="w-full min-h-[44px] px-3 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              />
              ${validationErrors.title ? `<span class="text-[10px] text-rose-600 font-semibold mt-1 block">${validationErrors.title}</span>` : ''}
            </div>

            <div>
              <label class="text-[11px] font-bold text-stone-700 block mb-1">Executive Summary *</label>
              <textarea
                onchange="controller.updateProposalField('summary', this.value)"
                placeholder="Brief summary of work to be performed..."
                class="w-full min-h-[70px] p-3 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              >${proposal.summary}</textarea>
              ${validationErrors.summary ? `<span class="text-[10px] text-rose-600 font-semibold mt-1 block">${validationErrors.summary}</span>` : ''}
            </div>

            <div>
              <label class="text-[11px] font-bold text-stone-700 block mb-1">Detailed Scope of Work *</label>
              <textarea
                onchange="controller.updateProposalField('scope', this.value)"
                placeholder="Exhaustive breakdown of materials, methods, and specifications..."
                class="w-full min-h-[90px] p-3 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              >${proposal.scope}</textarea>
              ${validationErrors.scope ? `<span class="text-[10px] text-rose-600 font-semibold mt-1 block">${validationErrors.scope}</span>` : ''}
            </div>

            <div>
              <label class="text-[11px] font-bold text-stone-700 block mb-1">Key Deliverables *</label>
              <textarea
                onchange="controller.updateProposalField('deliverables', this.value)"
                placeholder="Tangible handovers (e.g. Excavated site, poured raft slab, testing certificate)..."
                class="w-full min-h-[70px] p-3 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              >${proposal.deliverables}</textarea>
              ${validationErrors.deliverables ? `<span class="text-[10px] text-rose-600 font-semibold mt-1 block">${validationErrors.deliverables}</span>` : ''}
            </div>

            <div>
              <label class="text-[11px] font-bold text-stone-700 block mb-1">Exclusions & Limits (Optional)</label>
              <textarea
                onchange="controller.updateProposalField('exclusions', this.value)"
                placeholder="What is explicitly excluded from this quotation..."
                class="w-full min-h-[60px] p-3 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              >${proposal.exclusions || ''}</textarea>
            </div>
          </div>
        </div>
      `
          : ''
      }

      <!-- STEP 2: Timeline & Schedule -->
      ${
        step === 2
          ? `
        <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
          <h2 class="text-xs font-black uppercase text-stone-900 tracking-wider">Step 2: Timeline & Warranty</h2>

          <div class="space-y-3">
            <div>
              <label class="text-[11px] font-bold text-stone-700 block mb-1">Estimated Execution Duration (Days) *</label>
              <input
                type="number"
                value="${estimatedDurationDays}"
                onchange="controller.updateForm('estimatedDurationDays', parseInt(this.value, 10))"
                placeholder="e.g. 30"
                class="w-full min-h-[44px] px-3 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              />
              ${validationErrors.estimatedDurationDays ? `<span class="text-[10px] text-rose-600 font-semibold mt-1 block">${validationErrors.estimatedDurationDays}</span>` : ''}
            </div>

            <div>
              <label class="text-[11px] font-bold text-stone-700 block mb-1">Warranty Period (Months)</label>
              <input
                type="number"
                value="${warrantyMonths || ''}"
                onchange="controller.updateForm('warrantyMonths', parseInt(this.value, 10))"
                placeholder="e.g. 12"
                class="w-full min-h-[44px] px-3 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
              />
            </div>
          </div>
        </div>
      `
          : ''
      }

      <!-- STEP 3: Pricing Model & Budget -->
      ${
        step === 3
          ? `
        <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
          <h2 class="text-xs font-black uppercase text-stone-900 tracking-wider">Step 3: Pricing Model & Total Budget</h2>

          <div class="space-y-3">
            <div>
              <label class="text-[11px] font-bold text-stone-700 block mb-1">Pricing Model *</label>
              <select
                onchange="controller.updateForm('priceModel', this.value)"
                class="w-full min-h-[44px] px-3 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none font-bold"
              >
                <option value="MILESTONE_BASED" ${priceModel === 'MILESTONE_BASED' ? 'selected' : ''}>MILESTONE BASED</option>
                <option value="FIXED" ${priceModel === 'FIXED' ? 'selected' : ''}>FIXED TOTAL PRICE</option>
                <option value="HOURLY_ESTIMATE" ${priceModel === 'HOURLY_ESTIMATE' ? 'selected' : ''}>HOURLY ESTIMATE</option>
                <option value="UNIT_PRICE" ${priceModel === 'UNIT_PRICE' ? 'selected' : ''}>UNIT PRICE / SQ FT</option>
              </select>
            </div>

            <div>
              <label class="text-[11px] font-bold text-stone-700 block mb-1">Total Contract Amount (₹) *</label>
              <input
                type="number"
                value="${totalAmount}"
                onchange="controller.updateForm('totalAmount', parseFloat(this.value))"
                placeholder="e.g. 120000"
                class="w-full min-h-[44px] px-3 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none font-bold text-emerald-800"
              />
              ${validationErrors.totalAmount ? `<span class="text-[10px] text-rose-600 font-semibold mt-1 block">${validationErrors.totalAmount}</span>` : ''}
            </div>
          </div>
        </div>
      `
          : ''
      }

      <!-- STEP 4: Milestone Allocation -->
      ${
        step === 4
          ? `
        <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-xs font-black uppercase text-stone-900 tracking-wider">Step 4: Milestone Allocations</h2>
            <button
              onclick="controller.addMilestone()"
              class="min-h-[44px] px-3 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold"
            >
              + Add Stage
            </button>
          </div>

          <!-- Allocation Summary Pill -->
          <div class="p-3 ${isAllocationMatching ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'} border rounded-xl flex items-center justify-between text-xs font-bold">
            <span>Contract Total: ₹${totalAmount.toLocaleString('en-IN')}</span>
            <span>Allocated: ₹${allocatedSum.toLocaleString('en-IN')}</span>
          </div>
          ${validationErrors.milestones ? `<span class="text-[10px] text-rose-600 font-semibold block">${validationErrors.milestones}</span>` : ''}

          <div class="space-y-3">
            ${milestones
              .map(
                (m, idx) => `
              <div class="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-stone-800">Stage ${idx + 1}</span>
                  <button
                    onclick="controller.removeMilestone(${idx})"
                    class="min-h-[44px] min-w-[44px] text-rose-600 font-bold text-xs"
                  >
                    Delete
                  </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value="${m.name}"
                    onchange="controller.updateMilestone(${idx}, 'name', this.value)"
                    placeholder="Milestone Title"
                    class="min-h-[44px] px-3 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                  <input
                    type="number"
                    value="${m.cost}"
                    onchange="controller.updateMilestone(${idx}, 'cost', parseFloat(this.value))"
                    placeholder="Cost (₹)"
                    class="min-h-[44px] px-3 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 outline-none font-bold"
                  />
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }

      <!-- STEP 5: Review & Confirmation -->
      ${
        step === 5
          ? `
        <div class="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
          <h2 class="text-xs font-black uppercase text-stone-900 tracking-wider">Step 5: Review Proposal Summary</h2>

          <div class="p-4 bg-emerald-900 text-white rounded-xl space-y-2">
            <span class="text-[10px] text-emerald-300 uppercase font-bold">Total Contract Amount</span>
            <div class="text-2xl font-black">₹${totalAmount.toLocaleString('en-IN')}</div>
            <span class="text-xs text-emerald-200 font-semibold block">${estimatedDurationDays} Construction Days | ${priceModel.replace('_', ' ')}</span>
          </div>

          <div class="space-y-2 text-xs">
            <div>
              <span class="text-[10px] font-bold text-stone-400 uppercase block">Title</span>
              <p class="font-bold text-stone-800">${proposal.title}</p>
            </div>
            <div>
              <span class="text-[10px] font-bold text-stone-400 uppercase block">Summary</span>
              <p class="text-stone-600 font-medium">${proposal.summary}</p>
            </div>
            <div>
              <span class="text-[10px] font-bold text-stone-400 uppercase block">Milestones (${milestones.length})</span>
              <p class="text-stone-600 font-medium">Total Allocated: ₹${allocatedSum.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      `
          : ''
      }

      <!-- Sticky Footer Navigation Bar -->
      <div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-200 flex items-center gap-2 max-w-md mx-auto z-20">
        ${
          step > 1
            ? `<button
                onclick="controller.prevStep()"
                class="min-h-[44px] px-4 py-2.5 bg-stone-100 text-stone-700 font-bold rounded-xl text-xs"
              >
                Back
              </button>`
            : ''
        }

        ${
          step < 5
            ? `<button
                onclick="controller.nextStep()"
                class="flex-1 min-h-[44px] py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs transition"
              >
                Next Step →
              </button>`
            : `<button
                onclick="controller.submitQuotation()"
                ${isSubmitting || !isAllocationMatching ? 'disabled' : ''}
                class="flex-1 min-h-[44px] py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
              >
                ${isSubmitting ? 'Submitting...' : 'Submit Quotation Proposal'}
              </button>`
        }
      </div>
    </div>
  `;
}
