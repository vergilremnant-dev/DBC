import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../auth/useAuth';
import { useAuthDispatch } from '../auth/useAuthStore';
import { profileService, type ProfileCompletionResponse } from '../../services/profile/profileService';
import { profilePatched } from '../../store/auth/authSlice';

export type OwnProfileStatus = 'loading' | 'ready' | 'missing' | 'error';

interface OwnProfileState<T> {
  /** The account this state belongs to. Data is never shown for any other account. */
  owner: string | null;
  status: OwnProfileStatus;
  profile: T | null;
  completion: ProfileCompletionResponse | null;
  error: string;
}

const initial = <T,>(owner: string | null): OwnProfileState<T> => ({ owner, status: 'loading', profile: null, completion: null, error: '' });

/** Field-level messages from a 400 { errors: [{ field, message }] } response, or a general message. */
export function profileSaveErrors(err: unknown): { fields: Record<string, string>; message: string } {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { errors?: { field: string; message: string }[]; message?: string } | undefined;
    const fields = Object.fromEntries((data?.errors ?? []).map((e) => [e.field, e.message]));
    return { fields, message: data?.message || (Object.keys(fields).length ? 'Please correct the highlighted fields.' : 'Could not save your profile. Please try again.') };
  }
  return { fields: {}, message: 'Could not save your profile. Please try again.' };
}

/**
 * The signed-in account's own profile and completion, from the same API the My Account page uses
 * (GET /api/profile and /api/profile/completion, both resolved server-side from the access token).
 *
 * - Keyed by the authenticated user id: switching accounts resets to "loading" (no stale data on screen).
 * - Late responses for a previous account are ignored.
 * - Errors are reported as errors; there is no placeholder or cached fallback profile.
 * - `save` writes through POST /api/profile and updates the signed-in user's display name.
 */
export function useOwnProfile<T extends { userId?: string; fullName?: string; phoneNumber?: string | null }>() {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useAuthDispatch();
  const userId = user?.id != null ? String(user.id) : null;

  const [state, setState] = useState<OwnProfileState<T>>(() => initial<T>(userId));
  // Account changed: drop everything from the previous account during render (before anything is painted).
  if (state.owner !== userId) setState(initial<T>(userId));

  const current = useRef(userId);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    current.current = userId;
    if (!userId || !isAuthenticated) return;
    let alive = true;
    const forThisAccount = () => alive && current.current === userId;
    Promise.all([profileService.getProfile(), profileService.getCompletion().catch(() => null)])
      .then(([res, completion]) => {
        if (!forThisAccount()) return;
        const profile = (res?.data ?? null) as T | null;
        // Defence in depth: never display a profile that belongs to another account.
        if (profile?.userId && profile.userId !== userId) {
          setState({ owner: userId, status: 'error', profile: null, completion: null, error: 'Your profile could not be loaded. Please sign in again.' });
          return;
        }
        setState({
          owner: userId,
          status: profile ? 'ready' : 'missing',
          profile,
          completion: completion?.success ? { ...completion, missingFields: completion.missingFields ?? [] } : null,
          error: '',
        });
      })
      .catch(() => {
        if (!forThisAccount()) return;
        setState({ owner: userId, status: 'error', profile: null, completion: null, error: 'Your profile could not be loaded. Please try again.' });
      });
    return () => {
      alive = false;
    };
  }, [userId, isAuthenticated, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  const save = useCallback(
    async (payload: Record<string, unknown>) => {
      const owner = userId;
      const res = await profileService.upsertProfile(payload);
      if (current.current !== owner) return res;
      const saved = (res?.data ?? {}) as Partial<T> & { profileImageUrl?: string | null; profileImage?: string | null };
      dispatch(
        profilePatched({
          fullName: saved.fullName ?? (payload.fullName as string | undefined),
          phone: saved.phoneNumber ?? undefined,
          profileImageUrl: saved.profileImageUrl ?? saved.profileImage ?? undefined,
        }),
      );
      reload();
      return res;
    },
    [userId, dispatch, reload],
  );

  return { userId, ...state, reload, save };
}
