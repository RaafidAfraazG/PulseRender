/**
 * PulseRender — Deterministic Time-Bucket Aggregation
 *
 * Aggregates raw DataPoints into fixed time buckets (1m, 5m, 1h) per category.
 * Formula: `bucketStart = Math.floor(timestamp / bucketMs) * bucketMs`
 *
 * Category-aware: Each category gets its own independent aggregated series.
 */

import type { DataPoint, AggregatedDataPoint, AggregationMode } from '@/lib/types';

const BUCKET_DURATIONS: Record<Exclude<AggregationMode, 'raw'>, number> = {
  '1m': 60_000,
  '5m': 300_000,
  '1h': 3_600_000,
};

interface Accumulator {
  sum: number;
  min: number;
  max: number;
  count: number;
}

/**
 * Aggregate points by time bucket and category.
 *
 * @param points Raw or filtered data points
 * @param mode Aggregation mode ('raw' | '1m' | '5m' | '1h')
 * @returns Array of DataPoint or AggregatedDataPoint
 */
export function aggregateData(
  points: readonly DataPoint[],
  mode: AggregationMode,
): readonly DataPoint[] | readonly AggregatedDataPoint[] {
  if (mode === 'raw' || points.length === 0) {
    return points;
  }

  const bucketMs = BUCKET_DURATIONS[mode];
  if (!bucketMs) return points;

  // Key format: `${category}:${bucketStart}`
  const buckets = new Map<string, Accumulator & { category: string; bucketStart: number }>();

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const bucketStart = Math.floor(pt.timestamp / bucketMs) * bucketMs;
    const key = `${pt.category}:${bucketStart}`;

    let acc = buckets.get(key);
    if (!acc) {
      acc = {
        category: pt.category,
        bucketStart,
        sum: pt.value,
        min: pt.value,
        max: pt.value,
        count: 1,
      };
      buckets.set(key, acc);
    } else {
      acc.sum += pt.value;
      if (pt.value < acc.min) acc.min = pt.value;
      if (pt.value > acc.max) acc.max = pt.value;
      acc.count += 1;
    }
  }

  // Convert buckets to AggregatedDataPoint objects
  const result: AggregatedDataPoint[] = [];
  for (const acc of buckets.values()) {
    result.push({
      id: `${acc.category}-${acc.bucketStart}`,
      timestamp: acc.bucketStart,
      value: acc.sum / acc.count, // Average
      category: acc.category,
      min: acc.min,
      max: acc.max,
      count: acc.count,
    });
  }

  // Sort by timestamp ascending for chart polyline rendering
  result.sort((a, b) => a.timestamp - b.timestamp);
  return result;
}
