/**
 * PulseRender — Viewport Domain & Interaction Math
 *
 * Provides pure functions for zooming and panning viewport domains in data space.
 * Enforces boundary safety: `xMin < xMax`, `yMin < yMax`, min range limits.
 */

import type { ViewportDomain, DataPoint } from '@/lib/types';

const MIN_X_SPAN_MS = 1_000;    // Min zoom: 1 second window
const MAX_X_SPAN_MS = 86_400_000; // Max zoom out: 24 hours

export interface DomainState {
  readonly customDomain: ViewportDomain | null; // null = auto-domain from live points
}

export function createInitialDomainState(): DomainState {
  return { customDomain: null };
}

/**
 * Computes default domain bounds from data points or fallback timestamp window.
 */
export function computeEffectiveDomain(
  points: readonly (DataPoint | { timestamp: number; value: number })[],
  customDomain: ViewportDomain | null,
  fallbackSpanMs: number = 60_000,
): ViewportDomain {
  if (customDomain) {
    return customDomain;
  }

  if (points.length === 0) {
    const now = Date.now();
    return {
      xMin: now - fallbackSpanMs,
      xMax: now,
      yMin: 0,
      yMax: 100,
    };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    if (pt.timestamp < minX) minX = pt.timestamp;
    if (pt.timestamp > maxX) maxX = pt.timestamp;
    if (pt.value < minY) minY = pt.value;
    if (pt.value > maxY) maxY = pt.value;
  }

  // Ensure non-zero spans
  if (minX === maxX) {
    minX -= fallbackSpanMs / 2;
    maxX += fallbackSpanMs / 2;
  }
  if (minY === maxY) {
    minY = 0;
    maxY = 100;
  } else {
    // Fixed Y range [0, 100] for standard metrics or auto-scaled
    minY = Math.max(0, minY - 5);
    maxY = Math.min(100, maxY + 5);
  }

  return { xMin: minX, xMax: maxX, yMin: 0, yMax: 100 };
}

/**
 * Apply zoom factor around focal ratio (0.0 = left edge, 1.0 = right edge).
 */
export function zoomDomain(
  current: ViewportDomain,
  factor: number, // < 1.0 = zoom in, > 1.0 = zoom out
  focalRatio: number = 0.5,
): ViewportDomain {
  const currentSpan = current.xMax - current.xMin;
  let newSpan = currentSpan * factor;

  // Enforce bounds limits
  if (newSpan < MIN_X_SPAN_MS) newSpan = MIN_X_SPAN_MS;
  if (newSpan > MAX_X_SPAN_MS) newSpan = MAX_X_SPAN_MS;

  const focalPoint = current.xMin + currentSpan * focalRatio;
  const newXMin = focalPoint - newSpan * focalRatio;
  const newXMax = focalPoint + newSpan * (1 - focalRatio);

  return {
    ...current,
    xMin: newXMin,
    xMax: newXMax,
  };
}

/**
 * Pan domain by shift amount in time milliseconds.
 */
export function panDomain(
  current: ViewportDomain,
  deltaMs: number,
): ViewportDomain {
  return {
    ...current,
    xMin: current.xMin + deltaMs,
    xMax: current.xMax + deltaMs,
  };
}
