/**
 * PulseRender — Category Filtering Module
 *
 * Pure function that filters data points matching the active category set.
 * Framework-independent, zero mutation.
 */

import type { DataPoint } from '@/lib/types';

/**
 * Filter data points by category membership.
 *
 * @param points Input data points
 * @param activeCategories Set of active category keys. If empty, returns empty array.
 */
export function filterByCategory(
  points: readonly DataPoint[],
  activeCategories: ReadonlySet<string>,
): readonly DataPoint[] {
  if (points.length === 0 || activeCategories.size === 0) {
    return EMPTY;
  }

  const result: DataPoint[] = [];
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    if (activeCategories.has(pt.category)) {
      result.push(pt);
    }
  }
  return result;
}

const EMPTY: readonly DataPoint[] = Object.freeze([]);
