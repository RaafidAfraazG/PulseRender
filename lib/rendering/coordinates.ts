/**
 * PulseRender — Coordinate Transform Utilities
 *
 * Pure functions that convert between data-space and screen-space coordinates.
 * No React, no DOM access, no side effects.
 *
 * ── Coordinate spaces ────────────────────────────────────────────────────
 *
 *   data-space   : raw values from DataPoints (timestamp ms, value 0–100)
 *   screen-space : CSS pixels within the chart container
 *
 * Canvas drawing code works in CSS pixels and DPR-scales separately.
 * All functions here return CSS pixel coordinates.
 *
 * ── Y-axis convention ────────────────────────────────────────────────────
 *
 *   Data Y increases upward (value 0 at bottom, 100 at top).
 *   Screen Y increases downward (y=0 at top).
 *   dataToScreenY() handles this inversion.
 */

import type { ViewportDomain } from '@/lib/types';
import type { ChartDimensions, ChartArea, DataBounds } from './types';

// ── Chart area ────────────────────────────────────────────────────────────

/**
 * Compute the inner drawable area of a chart after subtracting padding.
 */
export function computeChartArea(dims: ChartDimensions): ChartArea {
  const { padding, width, height } = dims;
  return {
    x:      padding.left,
    y:      padding.top,
    width:  Math.max(0, width  - padding.left - padding.right),
    height: Math.max(0, height - padding.top  - padding.bottom),
  };
}

// ── Data bounds ───────────────────────────────────────────────────────────

/**
 * Compute data-space extent from a set of DataPoints or explicit ViewportDomain.
 */
export function computeDataBounds(
  points: readonly { timestamp: number; value: number }[],
  options?: { fixedYMin?: number; fixedYMax?: number; overrideDomain?: ViewportDomain | null },
): DataBounds {
  if (options?.overrideDomain) {
    return {
      xMin: options.overrideDomain.xMin,
      xMax: options.overrideDomain.xMax,
      yMin: options.overrideDomain.yMin,
      yMax: options.overrideDomain.yMax,
    };
  }

  const fixedYMin = options?.fixedYMin;
  const fixedYMax = options?.fixedYMax;

  if (points.length === 0) {
    const now = Date.now();
    return {
      xMin: now - 10_000,
      xMax: now,
      yMin: fixedYMin ?? 0,
      yMax: fixedYMax ?? 100,
    };
  }

  let xMin = Infinity, xMax = -Infinity;
  let yMin = Infinity, yMax = -Infinity;

  for (const p of points) {
    if (p.timestamp < xMin) xMin = p.timestamp;
    if (p.timestamp > xMax) xMax = p.timestamp;
    if (p.value     < yMin) yMin = p.value;
    if (p.value     > yMax) yMax = p.value;
  }

  if (fixedYMin !== undefined) yMin = fixedYMin;
  if (fixedYMax !== undefined) yMax = fixedYMax;

  // Ensure non-degenerate bounds
  if (xMin === xMax) xMax = xMin + 1000;
  if (yMin === yMax) { yMin -= 1; yMax += 1; }

  return { xMin, xMax, yMin, yMax };
}

// ── Coordinate transforms ─────────────────────────────────────────────────

/**
 * Map a data-space X value (Unix ms timestamp) to a CSS pixel X coordinate
 * within the chart area.
 */
export function dataToScreenX(
  dataX:  number,
  bounds: DataBounds,
  area:   ChartArea,
): number {
  const ratio = (dataX - bounds.xMin) / (bounds.xMax - bounds.xMin);
  return area.x + ratio * area.width;
}

/**
 * Map a data-space Y value to a CSS pixel Y coordinate within the chart area.
 * Inverts the Y axis: high data values → low screen Y (near top of chart).
 */
export function dataToScreenY(
  dataY:  number,
  bounds: DataBounds,
  area:   ChartArea,
): number {
  const ratio = (dataY - bounds.yMin) / (bounds.yMax - bounds.yMin);
  return area.y + area.height * (1 - ratio);
}
