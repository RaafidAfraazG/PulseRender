/**
 * PulseRender — Heatmap Canvas Renderer
 *
 * ── Data → Grid Mapping ──────────────────────────────────────────────────
 *
 *   Rows    = categories  (one row per data category, top to bottom)
 *   Columns = time buckets (windowMs divided into `columns` equal slices)
 *   Color   = average value of all points that fall in that [row × col] cell
 *
 * Example with windowMs=60_000 and columns=60:
 *   Each column represents 1 second of data.
 *   Column 0 = oldest second, column 59 = most recent second.
 *
 * ── Color Scale ──────────────────────────────────────────────────────────
 *
 *   0   → dark navy  (#0f1117)
 *   50  → cyan       (#22d3ee)
 *   100 → near-white (#f0fdf4)
 *
 * Empty cells (no data) are rendered in a slightly lighter dark tone.
 *
 * ── Performance note ─────────────────────────────────────────────────────
 *
 * Phase 2 uses fillRect() per cell. For 60×4 = 240 cells this is fast.
 * Phase 4 can optimise using ImageData for larger grids.
 */

import type { DataPoint } from '@/lib/types';
import type { ChartDimensions } from '../types';
import { computeChartArea } from '../coordinates';
import { clearCanvas } from '../canvas';

// ── Config ────────────────────────────────────────────────────────────────

export interface HeatmapRenderConfig {
  readonly columns:    number;
  readonly windowMs:   number;
  readonly categories: readonly string[];
  readonly cellGap:    number;
  readonly colorLow:   string;   // value = 0
  readonly colorMid:   string;   // value = 50
  readonly colorHigh:  string;   // value = 100
}

export const DEFAULT_HEATMAP_CONFIG: HeatmapRenderConfig = {
  columns:    60,
  windowMs:   60_000,
  categories: ['primary', 'secondary', 'tertiary', 'quaternary'],
  cellGap:    1,
  colorLow:   '#0f1117',
  colorMid:   '#22d3ee',
  colorHigh:  '#f0fdf4',
};

// ── Color interpolation ───────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = parseInt(hex.replace('#', ''), 16);
  return [(h >> 16) & 0xff, (h >> 8) & 0xff, h & 0xff];
}

function lerpRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function intensityToColor(
  intensity: number,  // 0–100
  low:  [number, number, number],
  mid:  [number, number, number],
  high: [number, number, number],
): string {
  const t = Math.max(0, Math.min(1, intensity / 100));
  if (t <= 0.5) return lerpRgb(low, mid, t * 2);
  return lerpRgb(mid, high, (t - 0.5) * 2);
}

// ── Renderer ──────────────────────────────────────────────────────────────

export function renderHeatmap(
  ctx:    CanvasRenderingContext2D,
  points: readonly DataPoint[],
  dims:   ChartDimensions,
  config: HeatmapRenderConfig,
): void {
  clearCanvas(ctx, dims);

  const area = computeChartArea(dims);
  if (area.width <= 0 || area.height <= 0) return;

  const { columns, windowMs, categories, cellGap } = config;
  const rows = categories.length;
  if (rows === 0 || columns === 0) return;

  const now         = Date.now();
  const windowStart = now - windowMs;
  const bucketMs    = windowMs / columns;

  // Pre-compute colour RGB tuples once per frame (not per cell)
  const rgbLow  = hexToRgb(config.colorLow);
  const rgbMid  = hexToRgb(config.colorMid);
  const rgbHigh = hexToRgb(config.colorHigh);

  // Build grid sums and counts
  // Using flat arrays instead of 2D arrays for cache efficiency
  const sums:   Float64Array = new Float64Array(rows * columns);
  const counts: Uint32Array  = new Uint32Array(rows * columns);

  for (const pt of points) {
    if (pt.timestamp < windowStart) continue;

    const rowIdx = categories.indexOf(pt.category);
    if (rowIdx < 0) continue;

    const col = Math.min(columns - 1, Math.floor((pt.timestamp - windowStart) / bucketMs));
    if (col < 0) continue;

    const idx = rowIdx * columns + col;
    sums[idx]  += pt.value;
    counts[idx] += 1;
  }

  // Precompute cell geometry
  const cellW = Math.max(1, (area.width  - cellGap * (columns - 1)) / columns);
  const cellH = Math.max(1, (area.height - cellGap * (rows    - 1)) / rows);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const idx    = row * columns + col;
      const count  = counts[idx];
      const avgVal = count > 0 ? sums[idx] / count : NaN;

      const x = Math.round(area.x + col * (cellW + cellGap));
      const y = Math.round(area.y + row * (cellH + cellGap));
      const w = Math.max(1, Math.round(cellW));
      const h = Math.max(1, Math.round(cellH));

      ctx.fillStyle = isNaN(avgVal)
        ? '#1a1d27'
        : intensityToColor(avgVal, rgbLow, rgbMid, rgbHigh);

      ctx.fillRect(x, y, w, h);
    }
  }
}
