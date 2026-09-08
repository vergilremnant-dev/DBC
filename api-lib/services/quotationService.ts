import { db } from '../utils/db.js';
import { QuotationStatus, PricingModel, RequirementStatus } from '@prisma/client';
import { validateTransition } from './quotationWorkflow.js';
import { calculateAndValidatePricing } from './pricingEngine.js';

export interface CreateQuotationInput {
  requirementId: number;
  priceModel: PricingModel;
  totalAmount: number;
  estimatedDurationDays: number;
  warrantyMonths?: number;
  proposal: {
    title: string;
    summary: string;
    scope: string;
    deliverables: string;
    assumptions?: string;
    exclusions?: string;
    notes?: string;
  };
  milestones?: {
    name: string;
    description?: string;
    cost: number;
    durationDays?: number;
    dueAt?: Date;
  }[];
  attachments?: {
    fileName: string;
    fileUrl: string;
    fileType: string;
  }[];
}

export interface UpdateQuotationInput {
  priceModel?: PricingModel;
  totalAmount?: number;
  estimatedDurationDays?: number;
  warrantyMonths?: number;
  proposal?: Partial<CreateQuotationInput['proposal']>;
}

export async function createQuotation(providerId: string, userId: string, input: CreateQuotationInput) {
  // Validate pricing input
  calculateAndValidatePricing({
    priceModel: input.priceModel,
    totalAmount: input.totalAmount,
    milestones: input.milestones,
  });

  const requirement = await db.requirement.findUnique({
    where: { id: input.requirementId },
  });

  if (!requirement) {
    throw new Error('Requirement not found');
  }

  // Prevent multiple active quotes from same provider on same requirement
  const existingQuote = await db.quotation.findFirst({
    where: {
      requirementId: input.requirementId,
      providerId,
      status: {
        notIn: [QuotationStatus.WITHDRAWN, QuotationStatus.REJECTED, QuotationStatus.ARCHIVED],
      },
    },
  });

  if (existingQuote) {
    throw new Error('You have already submitted an active quotation for this requirement');
  }

  // Create Quotation transaction
  const quotation = await db.$transaction(async (tx) => {
    const q = await tx.quotation.create({
      data: {
        requirementId: input.requirementId,
        providerId,
        priceModel: input.priceModel,
        totalAmount: input.totalAmount,
        estimatedDurationDays: input.estimatedDurationDays,
        warrantyMonths: input.warrantyMonths || null,
        status: QuotationStatus.DRAFT,
      },
    });

    await tx.proposal.create({
      data: {
        quotationId: q.id,
        title: input.proposal.title,
        summary: input.proposal.summary,
        scope: input.proposal.scope,
        deliverables: input.proposal.deliverables,
        assumptions: input.proposal.assumptions || null,
        exclusions: input.proposal.exclusions || null,
        notes: input.proposal.notes || null,
      },
    });

    if (input.milestones && input.milestones.length > 0) {
      const ms = input.milestones.map((m) => ({
        quotationId: q.id,
        name: m.name,
        description: m.description || null,
        cost: m.cost,
        durationDays: m.durationDays || null,
        dueAt: m.dueAt || null,
      }));
      await tx.quotationMilestone.createMany({ data: ms });
    }

    if (input.attachments && input.attachments.length > 0) {
      const atts = input.attachments.map((a) => ({
        quotationId: q.id,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        fileType: a.fileType,
      }));
      await tx.quotationAttachment.createMany({ data: atts });
    }

    // Version history
    await tx.quotationHistory.create({
      data: {
        quotationId: q.id,
        version: 1,
        fromStatus: null,
        toStatus: QuotationStatus.DRAFT,
        changedById: userId,
        changeReason: 'Draft quotation created',
        newValues: JSON.stringify({
          totalAmount: q.totalAmount,
          priceModel: q.priceModel,
          estimatedDurationDays: q.estimatedDurationDays,
        }),
      },
    });

    return q;
  });

  return quotation;
}

export async function getQuotationById(id: number) {
  return await db.quotation.findUnique({
    where: { id },
    include: {
      provider: true,
      requirement: {
        include: { customer: true },
      },
      proposal: true,
      milestones: true,
      attachments: true,
      negotiations: {
        orderBy: { createdAt: 'asc' },
      },
      history: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function updateQuotationDraft(id: number, userId: string, input: UpdateQuotationInput) {
  const existing = await db.quotation.findUnique({
    where: { id },
    include: { provider: true },
  });

  if (!existing) {
    throw new Error('Quotation not found');
  }

  if (existing.provider.userId !== userId) {
    throw new Error('Unauthorized edit access');
  }

  if (existing.status !== QuotationStatus.DRAFT) {
    throw new Error('Only draft quotations can be modified directly');
  }

  return await db.$transaction(async (tx) => {
    const updated = await tx.quotation.update({
      where: { id },
      data: {
        priceModel: input.priceModel,
        totalAmount: input.totalAmount,
        estimatedDurationDays: input.estimatedDurationDays,
        warrantyMonths: input.warrantyMonths,
      },
    });

    if (input.proposal) {
      await tx.proposal.update({
        where: { quotationId: id },
        data: {
          title: input.proposal.title,
          summary: input.proposal.summary,
          scope: input.proposal.scope,
          deliverables: input.proposal.deliverables,
          assumptions: input.proposal.assumptions,
          exclusions: input.proposal.exclusions,
          notes: input.proposal.notes,
        },
      });
    }

    return updated;
  });
}

export async function transitionQuotationStatus(
  id: number,
  userId: string,
  newStatus: QuotationStatus,
  reason?: string
) {
  const existing = await db.quotation.findUnique({
    where: { id },
    include: {
      provider: true,
      requirement: {
        include: { customer: true },
      },
    },
  });

  if (!existing) {
    throw new Error('Quotation not found');
  }

  // Validate state transitions
  validateTransition(existing.status, newStatus);

  // Validate authorization role triggers
  const changer = await db.user.findUnique({ where: { id: userId } });
  const isAdmin = changer?.role === 'ADMIN';
  const isProvider = existing.provider.userId === userId;
  const isCustomer = existing.requirement.customer.userId === userId;

  if (!isAdmin) {
    if (newStatus === QuotationStatus.SUBMITTED || newStatus === QuotationStatus.WITHDRAWN) {
      if (!isProvider) throw new Error('Only the provider can submit or withdraw quotations');
    } else if (newStatus === QuotationStatus.ACCEPTED || newStatus === QuotationStatus.REJECTED) {
      if (!isCustomer) throw new Error('Only the customer can accept or reject quotations');
    }
  }

  const result = await db.$transaction(async (tx) => {
    const updated = await tx.quotation.update({
      where: { id },
      data: { status: newStatus },
    });

    // Get current version count to increment in history log
    const lastHistory = await tx.quotationHistory.findFirst({
      where: { quotationId: id },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (lastHistory?.version || 1) + 1;

    await tx.quotationHistory.create({
      data: {
        quotationId: id,
        version: nextVersion,
        fromStatus: existing.status,
        toStatus: newStatus,
        changedById: userId,
        changeReason: reason || `Transitioned to ${newStatus}`,
      },
    });

    // Handle acceptance side-effects
    if (newStatus === QuotationStatus.ACCEPTED) {
      // 1. Lock the Requirement
      await tx.requirement.update({
        where: { id: existing.requirementId },
        data: { status: RequirementStatus.QUOTATION_ACCEPTED },
      });

      // 2. Reject/Close all other pending quotations for this requirement
      await tx.quotation.updateMany({
        where: {
          requirementId: existing.requirementId,
          id: { not: id },
          status: {
            notIn: [QuotationStatus.ACCEPTED, QuotationStatus.REJECTED, QuotationStatus.WITHDRAWN],
          },
        },
        data: { status: QuotationStatus.REJECTED },
      });

      // 3. Create the Project record if not already created (duplicate protection)
      const existingProject = await tx.project.findFirst({
        where: { quotationId: id },
      });

      if (!existingProject) {
        await tx.project.create({
          data: {
            requirementId: existing.requirementId,
            customerId: existing.requirement.customerId,
            providerId: existing.providerId,
            quotationId: id,
            status: 'ASSIGNED',
          },
        });
      }
    }

    return updated;
  });

  return result;
}

export async function addNegotiationMessage(
  quotationId: number,
  userId: string,
  comment: string,
  counterAmount?: number
) {
  const q = await db.quotation.findUnique({
    where: { id: quotationId },
    include: {
      provider: true,
      requirement: {
        include: { customer: true },
      },
    },
  });

  if (!q) {
    throw new Error('Quotation not found');
  }

  const isProvider = q.provider.userId === userId;
  const isCustomer = q.requirement.customer.userId === userId;

  if (!isProvider && !isCustomer) {
    throw new Error('Unauthorized comment permission');
  }

  return await db.$transaction(async (tx) => {
    const msg = await tx.quotationNegotiation.create({
      data: {
        quotationId,
        senderId: userId,
        counterAmount: counterAmount || null,
        comment,
      },
    });

    // Auto-transition to NEGOTIATION if not already there
    if (q.status !== QuotationStatus.NEGOTIATION) {
      await tx.quotation.update({
        where: { id: quotationId },
        data: { status: QuotationStatus.NEGOTIATION },
      });
    }

    return msg;
  });
}

export async function submitQuotationRevision(
  id: number,
  userId: string,
  input: Omit<CreateQuotationInput, 'requirementId'>
) {
  const existing = await db.quotation.findUnique({
    where: { id },
    include: { provider: true },
  });

  if (!existing) {
    throw new Error('Quotation not found');
  }

  if (existing.provider.userId !== userId) {
    throw new Error('Unauthorized edit access');
  }

  // Validate pricing input
  calculateAndValidatePricing({
    priceModel: input.priceModel,
    totalAmount: input.totalAmount,
    milestones: input.milestones,
  });

  return await db.$transaction(async (tx) => {
    // 1. Get current version count to increment
    const lastHistory = await tx.quotationHistory.findFirst({
      where: { quotationId: id },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (lastHistory?.version || 1) + 1;

    // 2. Log previous values to history
    await tx.quotationHistory.create({
      data: {
        quotationId: id,
        version: nextVersion,
        fromStatus: existing.status,
        toStatus: QuotationStatus.REVISED,
        changedById: userId,
        changeReason: 'Revision submitted by provider',
        previousValues: JSON.stringify({
          totalAmount: existing.totalAmount,
          priceModel: existing.priceModel,
          estimatedDurationDays: existing.estimatedDurationDays,
        }),
        newValues: JSON.stringify({
          totalAmount: input.totalAmount,
          priceModel: input.priceModel,
          estimatedDurationDays: input.estimatedDurationDays,
        }),
      },
    });

    // 3. Clear old milestones
    await tx.quotationMilestone.deleteMany({ where: { quotationId: id } });

    // 4. Update core quotation values
    const updated = await tx.quotation.update({
      where: { id },
      data: {
        priceModel: input.priceModel,
        totalAmount: input.totalAmount,
        estimatedDurationDays: input.estimatedDurationDays,
        warrantyMonths: input.warrantyMonths || null,
        status: QuotationStatus.REVISED,
      },
    });

    // 5. Update proposal values
    await tx.proposal.update({
      where: { quotationId: id },
      data: {
        title: input.proposal.title,
        summary: input.proposal.summary,
        scope: input.proposal.scope,
        deliverables: input.proposal.deliverables,
        assumptions: input.proposal.assumptions || null,
        exclusions: input.proposal.exclusions || null,
        notes: input.proposal.notes || null,
      },
    });

    // 6. Insert new milestones
    if (input.milestones && input.milestones.length > 0) {
      const ms = input.milestones.map((m) => ({
        quotationId: id,
        name: m.name,
        description: m.description || null,
        cost: m.cost,
        durationDays: m.durationDays || null,
        dueAt: m.dueAt || null,
      }));
      await tx.quotationMilestone.createMany({ data: ms });
    }

    return updated;
  });
}

export async function deleteQuotationDraft(id: number, userId: string) {
  const existing = await db.quotation.findUnique({
    where: { id },
    include: { provider: true },
  });

  if (!existing) {
    throw new Error('Quotation not found');
  }

  if (existing.provider.userId !== userId) {
    throw new Error('Unauthorized deletion access');
  }

  if (existing.status !== QuotationStatus.DRAFT) {
    throw new Error('Only draft quotations can be deleted');
  }

  return await db.quotation.delete({ where: { id } });
}
