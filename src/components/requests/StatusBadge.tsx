import { TONE_CLASS, type Tone } from '../../utils/requestStatus';

export function StatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASS[tone]}`}>{label}</span>;
}
