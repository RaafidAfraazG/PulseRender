/**
 * PulseRender - Time Range Processing Filter
 *
 * Pure function that selects points falling within the designated duration window
 * from `currentTime` (or the latest timestamp in the dataset if currentTime is omitted).
 *
 * Framework-independent, zero mutation, deterministic.
 */

import type { DataPoint } from '@/lib/types';

/**
 * Filter data points by duration window.
 *
 * @param points Raw or filtered data points
 * @param durationMs Time window duration in ms (Infinity for 'all')
 * @param currentTime Optional reference timestamp (defaults to Date.now())
 */
export function selectTimeRange(
  points: readonly DataPoint[],
  durationMs: number,
  currentTime: number = Date.now(),
): readonly DataPoint[] {
  if (points.length === 0 || durationMs === Infinity) {
    return points;
  }

  const startTime = currentTime - durationMs;
  // Efficient single-pass filter
  const result: DataPoint[] = [];
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    if (pt.timestamp >= startTime) {
      result.push(pt);
    }
  }
  return result;
}
