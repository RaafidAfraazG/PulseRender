/**
 * PulseRender — Simulated Time-Series Data Generator
 *
 * Generates realistic-looking, multi-category time-series DataPoint objects.
 * SERVER-SIDE ONLY — imported by the SSE API route, never by client code.
 *
 * ── Mathematical Model ───────────────────────────────────────────────────
 *
 * Every category value is the sum of three layers:
 *
 *   value(t) = baseline
 *            + A_slow × sin(2π·t / T_slow + φ_slow)   [gradual trend]
 *            + A_fast × sin(2π·t / T_fast + φ_fast)   [rapid variation]
 *            + noise(σ)                                [Gaussian-like noise]
 *
 * All results are clamped to [2, 98] to keep them visually inside axes.
 *
 * Category parameters:
 *   primary    — baseline 50, slow 30s, fast 7s — represents primary metric
 *   secondary  — baseline 40, slow 20s, fast 3s — second metric, more volatile
 *   tertiary   — baseline 65, slow 45s, fast 5s + periodic pulse
 *   quaternary — baseline 35, slow 60s, mid 8s, fast 2s — compound signal
 */

import type { DataPoint } from '@/lib/types';

// ── Exported category list (shared with client for heatmap row ordering) ──

export const DATA_CATEGORIES = [
  'primary',
  'secondary',
  'tertiary',
  'quaternary',
] as const;

export type DataCategory = (typeof DATA_CATEGORIES)[number];

// ── Helpers ───────────────────────────────────────────────────────────────

/** Box-Muller–style bounded noise approximation */
function gaussianNoise(amplitude: number): number {
  // Average of 3 uniform randoms → central-limit approximation
  const u = Math.random() + Math.random() + Math.random() - 1.5;
  return u * amplitude;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

const TWO_PI = 2 * Math.PI;

// ── Per-category signal generators ───────────────────────────────────────

function generateValue(category: DataCategory, tMs: number): number {
  const t = tMs / 1000; // work in seconds

  switch (category) {
    case 'primary': {
      const base  = 50;
      const slow  = 20  * Math.sin(TWO_PI * t / 30);
      const fast  = 10  * Math.sin(TWO_PI * t / 7);
      const n     = gaussianNoise(3);
      return clamp(base + slow + fast + n, 2, 98);
    }

    case 'secondary': {
      const base  = 40;
      const slow  = 25  * Math.sin(TWO_PI * t / 20 + Math.PI / 3);
      const fast  =  8  * Math.cos(TWO_PI * t / 3);
      const n     = gaussianNoise(5);
      return clamp(base + slow + fast + n, 2, 98);
    }

    case 'tertiary': {
      const base  = 65;
      const slow  = 15  * Math.sin(TWO_PI * t / 45 + Math.PI);
      const fast  = 12  * Math.sin(TWO_PI * t / 5);
      // Periodic sharp pulse (every 12 s)
      const pulse =  8  * Math.max(0, Math.sin(TWO_PI * t / 12) ** 3);
      const n     = gaussianNoise(4);
      return clamp(base + slow + fast + pulse + n, 2, 98);
    }

    case 'quaternary': {
      const base  = 35;
      const slow  = 18  * Math.sin(TWO_PI * t / 60);
      const mid   = 15  * Math.cos(TWO_PI * t / 8  + Math.PI / 4);
      const fast  =  5  * Math.sin(TWO_PI * t / 2);
      const n     = gaussianNoise(6);
      return clamp(base + slow + mid + fast + n, 2, 98);
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────

let sequenceCounter = 0;

/**
 * Generate a batch of DataPoints for all four categories.
 *
 * Points within a single tick are spread evenly across the tick interval so
 * that consumers see a continuous time series rather than spikes at discrete
 * moments.
 *
 * @param pointsPerCategory  Number of points to generate per category.
 * @param baseTimestamp      Unix epoch ms of the start of this tick.
 * @param tickIntervalMs     Duration of the tick window (default 100ms).
 */
export function generateBatch(
  pointsPerCategory: number,
  baseTimestamp: number,
  tickIntervalMs = 100,
): DataPoint[] {
  const points: DataPoint[] = [];

  for (const category of DATA_CATEGORIES) {
    for (let i = 0; i < pointsPerCategory; i++) {
      const offset    = (i / pointsPerCategory) * tickIntervalMs;
      const timestamp = baseTimestamp + offset;

      points.push({
        id:        `${category}-${(++sequenceCounter).toString(36)}`,
        timestamp,
        value:     generateValue(category, timestamp),
        category,
      });
    }
  }

  return points;
}
