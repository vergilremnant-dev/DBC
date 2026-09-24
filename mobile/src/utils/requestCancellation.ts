/**
 * DBC Mobile Request Cancellation & Race Condition Prevention.
 * Cancels outdated in-flight search/filter requests to prevent stale data overwriting newer results.
 */

export class RequestCancellationTracker {
  private activeControllers = new Map<string, AbortController>();

  /**
   * Returns a new AbortSignal for the given scope key, automatically aborting any previous request with the same scope.
   */
  getSignal(scopeKey: string): AbortSignal {
    const existing = this.activeControllers.get(scopeKey);
    if (existing) {
      existing.abort();
    }

    const controller = new AbortController();
    this.activeControllers.set(scopeKey, controller);
    return controller.signal;
  }

  /**
   * Clears the controller for the given scope key after completion.
   */
  complete(scopeKey: string): void {
    this.activeControllers.delete(scopeKey);
  }

  /**
   * Aborts all active requests across all scope keys.
   */
  abortAll(): void {
    this.activeControllers.forEach((controller) => controller.abort());
    this.activeControllers.clear();
  }
}

export const requestCancellationTracker = new RequestCancellationTracker();
