/**
 * DBC Mobile Mutation Safety & Duplicate Submission Protection.
 * Prevents accidental double-clicks or concurrent duplicate API calls for unsafe actions.
 */

import type { MobileApiError } from '../types/mobileApiErrorTypes.js';

const activeMutations = new Map<string, Promise<any>>();

export class MutationSafetyController {
  /**
   * Executes a mutation function wrapped in a lock for the specified key.
   * If a mutation with the same key is already in-flight, it blocks duplicate submission.
   */
  static async execute<T>(key: string, mutationFn: () => Promise<T>): Promise<T> {
    if (activeMutations.has(key)) {
      const duplicateError: MobileApiError = {
        code: 'DUPLICATE_SUBMISSION',
        message: 'An operation is already in progress. Please wait for it to complete.',
        status: 409,
        category: 'CONFLICT',
        retryable: false,
      };
      throw duplicateError;
    }

    const promise = (async () => {
      try {
        return await mutationFn();
      } finally {
        activeMutations.delete(key);
      }
    })();

    activeMutations.set(key, promise);
    return promise;
  }

  /**
   * Checks whether a mutation key is currently in-flight.
   */
  static isPending(key: string): boolean {
    return activeMutations.has(key);
  }

  /**
   * Resets active mutation lock state.
   */
  static clear(): void {
    activeMutations.clear();
  }
}
