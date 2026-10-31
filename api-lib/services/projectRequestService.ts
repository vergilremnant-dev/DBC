/**
 * Project requests — the customer → professional → quotation → project journey,
 * built on the existing Requirement, Conversation, Quotation and Project models.
 *
 * - A project request is a Requirement (status PUBLISHED once submitted).
 * - Choosing a professional creates an invite Conversation (type PROJECT_REQUEST) with that
 *   professional; invited requests are private to the invited professional.
 * - Open requests (no professional chosen) are visible to professionals of the same service.
 * - Customer contact details are never exposed beyond the display name and city to
 *   professionals who have not engaged; engaged professionals also see the site location.
 */
import { RequirementStatus } from '@prisma/client';
import { db } from '../utils/db.js';
import { isEligibleProfile } from './providerEligibility.js';
import { createRequirement, transitionRequirementStatus } from './requirementService.js';
import { publicDisplayName } from '../utils/publicProvider.js';

export const INVITE_CONVERSATION_TYPE = 'PROJECT_REQUEST';
export const CONTACT_CONVERSATION_TYPE = 'REQUIREMENT';

/** Statuses in which professionals can still review and quote. */
export const QUOTABLE_STATUSES: RequirementStatus[] = [
  RequirementStatus.PUBLISHED,
  RequirementStatus.PROVIDER_REVIEW,
  RequirementStatus.QUOTATION_RECEIVED,
  RequirementStatus.CUSTOMER_REVIEW,
];

const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTACHMENTS = 5;
/**
 * Photos are stored inline as data URLs in production, and Vercel caps request and response bodies at
 * 4.5 MB, so the request's photos together must stay well below that.
 */
export const MAX_ATTACHMENT_TOTAL_CHARS = 3_000_000;
/** Accepted attachment URLs: inline images (production storage), uploaded files (dev storage) or https links. */
const ATTACHMENT_URL = /^(data:image\/(jpeg|png|webp);base64,|https:\/\/|\/uploads\/)/;

export class RequestError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface ProjectRequestInput {
  serviceCategoryId: number;
  providerId?: string | null;
  title: string;
  description: string;
  siteAddress: string;
  city: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  preferredStartDate?: string | null;
  /** Service-specific answers, e.g. { "Property type": "Apartment", "Area": "1200 sq ft" }. */
  details?: Record<string, string>;
  attachments?: Array<{ fileName: string; fileUrl: string; fileType: string }>;
}

const clean = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const cleanBlock = (v: unknown, max: number) => String(v ?? '').replace(/\r\n/g, '\n').trim().slice(0, max);

/** Human-readable request reference, e.g. DBC-REQ-000123. */
export const requestReference = (id: number) => `DBC-REQ-${String(id).padStart(6, '0')}`;

/** Combines the customer's description with the service-specific answers (stored in the existing description field). */
export function composeDescription(description: string, details?: Record<string, string>): string {
  const lines = Object.entries(details ?? {})
    .map(([k, v]) => [clean(k, 60), clean(v, 200)])
    .filter(([k, v]) => k && v)
    .slice(0, 12)
    .map(([k, v]) => `- ${k}: ${v}`);
  return lines.length ? `${description}\n\nProject details:\n${lines.join('\n')}` : description;
}

export function validateProjectRequest(input: ProjectRequestInput) {
  const title = clean(input.title, 120);
  const description = cleanBlock(input.description, 4000);
  const siteAddress = clean(input.siteAddress, 300);
  const city = clean(input.city, 80);
  const errors: Record<string, string> = {};
  if (!Number.isInteger(Number(input.serviceCategoryId)) || Number(input.serviceCategoryId) <= 0) errors.serviceCategoryId = 'Choose a service.';
  if (title.length < 5) errors.title = 'Add a short title (at least 5 characters).';
  if (description.length < 20) errors.description = 'Describe the work in at least 20 characters.';
  if (!siteAddress) errors.siteAddress = 'Add the site address or area.';
  if (!city) errors.city = 'Choose the city.';
  const min = input.budgetMin == null ? 0 : Number(input.budgetMin);
  const max = input.budgetMax == null ? 0 : Number(input.budgetMax);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) errors.budget = 'Budget range is not valid.';
  let start: Date | null = null;
  if (input.preferredStartDate) {
    start = new Date(input.preferredStartDate);
    if (Number.isNaN(start.getTime())) errors.preferredStartDate = 'Start date is not valid.';
  }
  const attachments = (input.attachments ?? []).slice(0, MAX_ATTACHMENTS + 1);
  if (attachments.length > MAX_ATTACHMENTS) errors.attachments = `Attach up to ${MAX_ATTACHMENTS} files.`;
  for (const a of attachments) {
    if (!a?.fileUrl || !a?.fileName || !/^image\/(jpeg|png|webp)$/.test(String(a.fileType))) {
      errors.attachments = 'Attachments must be JPEG, PNG or WEBP images.';
      break;
    }
  }
  if (!errors.attachments) {
    if (attachments.some((a) => !ATTACHMENT_URL.test(String(a.fileUrl)))) errors.attachments = 'Attachments must be JPEG, PNG or WEBP images.';
    else if (attachments.reduce((n, a) => n + String(a.fileUrl).length, 0) > MAX_ATTACHMENT_TOTAL_CHARS) {
      errors.attachments = 'The photos are too large together. Remove one or use smaller images.';
    }
  }
  if (Object.keys(errors).length) {
    const err = new RequestError(400, Object.values(errors)[0]);
    (err as RequestError & { fields?: Record<string, string> }).fields = errors;
    throw err;
  }
  return { title, description, siteAddress, city, min, max, start, attachments };
}

/** Customer submits a project request (optionally to one chosen professional). Idempotent for quick re-submits. */
export async function submitProjectRequest(userId: string, input: ProjectRequestInput) {
  const v = validateProjectRequest(input);
  const customer = await db.customerProfile.findUnique({ where: { userId } });
  if (!customer) throw new RequestError(400, 'Please complete your customer profile before submitting a request.');

  const category = await db.serviceCategory.findFirst({
    where: { id: Number(input.serviceCategoryId), isActive: true, deletedAt: null },
  });
  if (!category) throw new RequestError(400, 'This service is not available. Please choose another service.');

  let provider: { id: string; userId: string; fullName: string; businessName: string | null } | null = null;
  if (input.providerId) {
    provider = await db.providerProfile.findFirst({
      where: { id: String(input.providerId), verificationStatus: 'VERIFIED', categoryId: category.id },
      select: { id: true, userId: true, fullName: true, businessName: true },
    });
    if (!provider) throw new RequestError(400, 'The selected professional is not available for this service.');
  }

  // Duplicate protection: the same request submitted again within a few minutes returns the original.
  const recent = await db.requirement.findFirst({
    where: {
      customerId: customer.id,
      serviceCategoryId: category.id,
      title: v.title,
      createdAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
      status: { notIn: [RequirementStatus.CANCELLED, RequirementStatus.REJECTED] },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (recent) {
    const invite = provider
      ? await db.conversation.findFirst({ where: { requirementId: recent.id, providerId: provider.id }, select: { id: true } })
      : null;
    return { requirement: recent, reference: requestReference(recent.id), conversationId: invite?.id ?? null, duplicate: true };
  }

  const requirement = await createRequirement(customer.id, userId, {
    title: v.title,
    description: composeDescription(v.description, input.details),
    serviceCategory: category.name,
    serviceCategoryId: category.id,
    location: `${v.siteAddress}, ${v.city}`,
    budgetMin: v.min,
    budgetMax: v.max,
    preferredStartDate: v.start,
    status: RequirementStatus.PUBLISHED,
    attachments: v.attachments,
  });

  let conversationId: string | null = null;
  if (provider) {
    const conversation = await db.conversation.create({
      data: { customerId: customer.id, providerId: provider.id, conversationType: INVITE_CONVERSATION_TYPE, requirementId: requirement.id },
    });
    conversationId = conversation.id;
    await db.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        messageType: 'TEXT',
        content: `New project request ${requestReference(requirement.id)}: ${v.title}`,
      },
    });
    await db.conversation.update({
      where: { id: conversation.id },
      data: { lastMessage: `New project request: ${v.title}`, lastMessageAt: new Date() },
    });
    await notify(provider.userId, 'New project request', `${publicDisplayName(customer.fullName)} sent you a ${category.name} request: ${v.title}`);
  }

  return { requirement, reference: requestReference(requirement.id), conversationId, duplicate: false };
}

/** Best-effort in-app notification (never blocks the workflow). */
export async function notify(userId: string | null | undefined, title: string, content: string) {
  if (!userId) return;
  try {
    await db.notification.create({ data: { userId, title, content } });
  } catch {
    /* notifications are best-effort */
  }
}

export interface ProviderAccess {
  allowed: boolean;
  invited: boolean;
  engaged: boolean;
}

/** Whether a professional may see a request, and how much of it. */
export async function getProviderAccess(providerProfileId: string, requirementId: number): Promise<ProviderAccess> {
  const [requirement, provider, conversations, quotation] = await Promise.all([
    db.requirement.findUnique({ where: { id: requirementId }, select: { status: true, serviceCategoryId: true } }),
    db.providerProfile.findUnique({ where: { id: providerProfileId }, select: { id: true, userId: true, categoryId: true, verificationStatus: true, user: { select: { status: true } } } }),
    db.conversation.findMany({ where: { requirementId }, select: { providerId: true, conversationType: true } }),
    db.quotation.findFirst({ where: { requirementId, providerId: providerProfileId }, select: { id: true } }),
  ]);
  if (!requirement || !provider) return { allowed: false, invited: false, engaged: false };
  // Only ACTIVE, DBC-verified professionals may see or act on requests (even ones they were invited to).
  if (!isEligibleProfile(provider)) return { allowed: false, invited: false, engaged: false };
  const invited = conversations.some((c) => c.providerId === providerProfileId && c.conversationType === INVITE_CONVERSATION_TYPE);
  const engaged = invited || !!quotation || conversations.some((c) => c.providerId === providerProfileId);
  if (engaged) return { allowed: true, invited, engaged };
  const invitedElsewhere = conversations.some((c) => c.conversationType === INVITE_CONVERSATION_TYPE);
  const sameService = requirement.serviceCategoryId == null || requirement.serviceCategoryId === provider.categoryId;
  const open = QUOTABLE_STATUSES.includes(requirement.status) && !invitedElsewhere && sameService;
  return { allowed: open, invited: false, engaged: false };
}

/** Prisma filter: open requests a professional may browse (same service, not invited to someone else). */
export function openRequestsFilter(categoryId: number) {
  return {
    status: { in: QUOTABLE_STATUSES },
    serviceCategoryId: categoryId,
    conversations: { none: { conversationType: INVITE_CONVERSATION_TYPE } },
  };
}

/** Prisma filter: requests a professional is invited to or engaged with. */
export function engagedRequestsFilter(providerProfileId: string) {
  return {
    OR: [{ conversations: { some: { providerId: providerProfileId } } }, { quotations: { some: { providerId: providerProfileId } } }],
  };
}

/** Shape of a requirement record as loaded with customer/attachments (fields used by the views). */
export interface RequirementRecord {
  id: number;
  title: string;
  description: string;
  serviceCategory: string;
  serviceCategoryId: number | null;
  status: RequirementStatus;
  budgetMin: number;
  budgetMax: number;
  preferredStartDate: Date | string | null;
  createdAt: Date | string;
  location: string | null;
  customer?: { fullName?: string | null } | null;
  attachments?: Array<{ id: number; fileName: string; fileUrl: string; fileType: string }>;
}

const cityOf = (location: string) => location.split(',').map((s) => s.trim()).filter(Boolean).pop() ?? '';

/** Request as shown to a professional. */
export function toProviderView(r: RequirementRecord, access: Pick<ProviderAccess, 'invited' | 'engaged'>) {
  return {
    id: r.id,
    reference: requestReference(r.id),
    title: r.title,
    description: r.description,
    serviceCategory: r.serviceCategory,
    serviceCategoryId: r.serviceCategoryId,
    status: r.status,
    budgetMin: r.budgetMin,
    budgetMax: r.budgetMax,
    preferredStartDate: r.preferredStartDate,
    createdAt: r.createdAt,
    city: cityOf(r.location ?? ''),
    location: access.engaged ? r.location : cityOf(r.location ?? ''),
    customer: { displayName: access.engaged ? r.customer?.fullName ?? 'Customer' : publicDisplayName(r.customer?.fullName) },
    attachments: (r.attachments ?? []).map((a) => ({ id: a.id, fileName: a.fileName, fileUrl: a.fileUrl, fileType: a.fileType })),
    invited: access.invited,
    engaged: access.engaged,
  };
}

/** Request as shown to its customer (their own data; private notes of others excluded). */
export function toCustomerView<T extends { id: number; notes?: Array<{ isPrivate: boolean }> }>(r: T) {
  return {
    ...r,
    reference: requestReference(r.id),
    notes: (r.notes ?? []).filter((n) => !n.isPrivate),
  };
}

/** Professional opens / reviews an invited request: PUBLISHED → PROVIDER_REVIEW (validated). */
export async function acknowledgeRequest(userId: string, providerProfileId: string, requirementId: number) {
  const access = await getProviderAccess(providerProfileId, requirementId);
  if (!access.allowed) throw new RequestError(403, 'You do not have access to this request.');
  const r = await db.requirement.findUnique({ where: { id: requirementId }, select: { status: true } });
  if (access.invited && r?.status === RequirementStatus.PUBLISHED) {
    await transitionRequirementStatus(requirementId, userId, RequirementStatus.PROVIDER_REVIEW, 'Professional is reviewing the request');
  }
  return access;
}

/** Professional opens (or reuses) the conversation with the request's customer. */
export async function contactCustomer(userId: string, providerProfileId: string, requirementId: number) {
  const access = await getProviderAccess(providerProfileId, requirementId);
  if (!access.allowed) throw new RequestError(403, 'You do not have access to this request.');
  const requirement = await db.requirement.findUnique({
    where: { id: requirementId },
    select: { id: true, title: true, customerId: true, customer: { select: { userId: true } } },
  });
  if (!requirement) throw new RequestError(404, 'Request not found');
  const existing = await db.conversation.findFirst({
    where: { requirementId, providerId: providerProfileId },
    orderBy: { createdAt: 'asc' },
  });
  if (existing) return existing;
  const conversation = await db.conversation.create({
    data: { customerId: requirement.customerId, providerId: providerProfileId, conversationType: CONTACT_CONVERSATION_TYPE, requirementId },
  });
  await notify(requirement.customer?.userId, 'A professional wants to discuss your request', `About ${requestReference(requirement.id)}: ${requirement.title}`);
  return conversation;
}
