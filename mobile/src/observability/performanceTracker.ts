/**
 * Client-Side Performance Tracker for DBC Mobile Application.
 * Measures screen open, render latency, and API operation durations cleanly
 * without recording sensitive payload contents or blocking main looper thread.
 */

import { PerformanceMetric } from './observabilityTypes';
import { sanitizeObservabilityPayload } from './observabilitySanitizer';

const activeTimers = new Map<string, number>();
const performanceHistory: PerformanceMetric[] = [];
const MAX_METRICS_HISTORY = 50;

/**
 * Starts a performance timer for an operation name.
 */
export function startPerformanceTimer(operationName: string): void {
  if (!operationName) return;
  activeTimers.set(operationName, Date.now());
}

/**
 * Stops a performance timer, calculates duration, and records the metric.
 */
export function stopPerformanceTimer(
  operationName: string,
  success: boolean = true,
  category: string = 'general'
): PerformanceMetric | null {
  const startTime = activeTimers.get(operationName);
  if (!startTime) return null;

  activeTimers.delete(operationName);
  const durationMs = Date.now() - startTime;

  const metric: PerformanceMetric = {
    operationName,
    durationMs,
    success,
    category,
    timestamp: new Date().toISOString(),
  };

  performanceHistory.push(metric);
  if (performanceHistory.length > MAX_METRICS_HISTORY) {
    performanceHistory.shift();
  }

  return metric;
}

/**
 * Helper to measure execution duration of an async function.
 */
export async function measurePerformanceAsync<T>(
  operationName: string,
  asyncFn: () => Promise<T>,
  category: string = 'api'
): Promise<T> {
  startPerformanceTimer(operationName);
  let success = true;
  try {
    const result = await asyncFn();
    return result;
  } catch (err) {
    success = false;
    throw err;
  } finally {
    stopPerformanceTimer(operationName, success, category);
  }
}

/**
 * Returns recorded performance metrics history.
 */
export function getPerformanceMetricsHistory(): PerformanceMetric[] {
  return [...performanceHistory];
}

/**
 * Clears performance metrics history.
 */
export function clearPerformanceHistory(): void {
  performanceHistory.length = 0;
  activeTimers.clear();
}
