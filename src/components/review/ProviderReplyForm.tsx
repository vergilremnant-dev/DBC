import { useState } from 'react';

interface ProviderReplyFormProps {
  reviewId: string;
  onSubmit: (reviewId: string, responseText: string) => Promise<void>;
  onCancel: () => void;
}

export function ProviderReplyForm({ reviewId, onSubmit, onCancel }: ProviderReplyFormProps) {
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) {
      setError('Reply text cannot be empty');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(reviewId, replyText.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit reply');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-stone-200 bg-stone-50 p-4 rounded-xl space-y-3">
      <div>
        <label className="text-3xs font-bold uppercase tracking-wider text-stone-400">Your Response</label>
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Write your response to the review..."
          rows={3}
          required
          className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 focus:border-amber-600 focus:outline-none resize-y"
        />
      </div>

      {error && <p className="text-2xs text-red-600 font-semibold">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-stone-200 bg-white px-3 py-1.5 text-2xs font-bold text-stone-600 hover:bg-stone-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-amber-700 hover:bg-amber-850 text-white px-4 py-1.5 text-2xs font-bold disabled:opacity-50 cursor-pointer"
        >
          {submitting ? 'Submitting...' : 'Submit Reply'}
        </button>
      </div>
    </form>
  );
}
