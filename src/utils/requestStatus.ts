import type { RequirementStatus } from '../types/customer/RequirementTypes';

export type Tone = 'neutral' | 'info' | 'progress' | 'success' | 'warning' | 'danger';

/** Customer-facing labels for the existing requirement state machine. */
export const REQUEST_STATUS: Record<RequirementStatus, { label: string; tone: Tone; step: number }> = {
  DRAFT: { label: 'Draft', tone: 'neutral', step: 0 },
  SUBMITTED: { label: 'Submitted', tone: 'info', step: 1 },
  PUBLISHED: { label: 'Submitted', tone: 'info', step: 1 },
  PROVIDER_REVIEW: { label: 'Under review', tone: 'progress', step: 2 },
  QUOTATION_RECEIVED: { label: 'Quotation received', tone: 'progress', step: 3 },
  CUSTOMER_REVIEW: { label: 'Reviewing quotations', tone: 'progress', step: 3 },
  QUOTATION_ACCEPTED: { label: 'Accepted · project created', tone: 'success', step: 4 },
  ASSIGNED: { label: 'Project created', tone: 'success', step: 4 },
  IN_PROGRESS: { label: 'In progress', tone: 'success', step: 4 },
  COMPLETED: { label: 'Completed', tone: 'success', step: 4 },
  CLOSED: { label: 'Closed', tone: 'neutral', step: 4 },
  CANCELLED: { label: 'Cancelled', tone: 'danger', step: -1 },
  REJECTED: { label: 'Not accepted', tone: 'danger', step: -1 },
  EXPIRED: { label: 'Expired', tone: 'warning', step: -1 },
  ON_HOLD: { label: 'On hold', tone: 'warning', step: -1 },
};

export const REQUEST_STEPS = ['Submitted', 'Under review', 'Quotations', 'Project created'];

export const QUOTATION_STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  SUBMITTED: { label: 'New', tone: 'info' },
  VIEWED: { label: 'Viewed', tone: 'info' },
  UNDER_REVIEW: { label: 'Under review', tone: 'progress' },
  NEGOTIATION: { label: 'In negotiation', tone: 'progress' },
  REVISED: { label: 'Revised', tone: 'progress' },
  ACCEPTED: { label: 'Accepted', tone: 'success' },
  REJECTED: { label: 'Declined', tone: 'danger' },
  WITHDRAWN: { label: 'Withdrawn', tone: 'neutral' },
  EXPIRED: { label: 'Expired', tone: 'warning' },
  ARCHIVED: { label: 'Archived', tone: 'neutral' },
};

export const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-stone-100 text-stone-700',
  info: 'bg-sky-50 text-sky-800',
  progress: 'bg-amber-50 text-amber-800',
  success: 'bg-emerald-50 text-emerald-800',
  warning: 'bg-orange-50 text-orange-800',
  danger: 'bg-rose-50 text-rose-700',
};

export const requestReference = (id: number) => `DBC-REQ-${String(id).padStart(6, '0')}`;

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export const formatINR = (n: number) => inr.format(n);
export const formatBudget = (min: number, max: number) =>
  !min && !max ? 'Not specified' : min === max ? formatINR(max) : `${formatINR(min)} – ${formatINR(max)}`;
export const formatDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

/** Splits the stored description into the customer's text and the "Project details" answers. */
export function splitDescription(description: string): { text: string; details: Array<[string, string]> } {
  const marker = '\n\nProject details:\n';
  const i = description.indexOf(marker);
  if (i < 0) return { text: description, details: [] };
  const details = description
    .slice(i + marker.length)
    .split('\n')
    .map((l) => l.replace(/^- /, ''))
    .map((l) => { const j = l.indexOf(': '); return j > 0 ? ([l.slice(0, j), l.slice(j + 2)] as [string, string]) : null; })
    .filter((x): x is [string, string] => !!x);
  return { text: description.slice(0, i), details };
}
