/**
 * PulseRender - Bar Chart Canvas Renderer
 *
 * Shows the last N data points as vertical bars, left to right in
 * chronological order. Each bar's height maps to the point's value.
 *
 * Bar width is calculated to fill the available chart area with configurable
 * gaps between bars. Bars have rounded top corners for visual polish.
 */

import type { ChartDimensions } from '../types';
import { computeChartArea } from '../coordinates';
import { clearCanvas } from '../canvas';

// ── Config ────────────────────────────────────────────────────────────────

export interface BarChartRenderConfig {
  readonly color: string;
  readonly barGap: number;   // CSS pixels between bars
  readonly maxBars: number;   // how many most-recent points to show
  readonly yDomain: readonly [number, number];
  readonly cornerRadius: number;   // top-corner rounding radius
}

export const DEFAULT_BAR_CONFIG: BarChartRenderConfig = {
  color: '#22d3ee',
  barGap: 2,
  maxBars: 60,
  yDomain: [0, 100],
  cornerRadius: 3,
};

// ── Renderer ──────────────────────────────────────────────────────────────

export function renderBarChart(
  ctx: CanvasRenderingContext2D,
  points: readonly { timestamp: number; value: number }[],
  dims: ChartDimensions,
  config: BarChartRenderConfig,
): void {
  clearCanvas(ctx, dims);

  const area = computeChartArea(dims);
  if (area.width <= 0 || area.height <= 0) return;

  const [yMin, yMax] = config.yDomain;
  const yRange = yMax - yMin || 1;

  // Take the most recent maxBars points (sorted ascending)
  let recent: readonly { timestamp: number; value: number }[];
  if (points.length > config.maxBars) {
    recent = points
      .slice(points.length - config.maxBars)
      .sort((a, b) => a.timestamp - b.timestamp);
  } else {
    recent = points.slice().sort((a, b) => a.timestamp - b.timestamp);
  }

  if (recent.length === 0) return;

  const count = recent.length;
  const totalGap = config.barGap * (count - 1);
  const barWidth = Math.max(1, (area.width - totalGap) / count);
  const r = Math.min(config.cornerRadius, barWidth / 2);

  for (let i = 0; i < count; i++) {
    const pt = recent[i];
    const normalised = Math.max(0, Math.min(1, (pt.value - yMin) / yRange));
    const barH = Math.max(2, normalised * area.height);
    const x = area.x + i * (barWidth + config.barGap);
    const y = area.y + area.height - barH;
    const w = barWidth;

    // Gradient: solid at top, faded at bottom
    const grad = ctx.createLinearGradient(x, y, x, y + barH);
    grad.addColorStop(0, config.color);
    grad.addColorStop(1, config.color + '44');
    ctx.fillStyle = grad;

    if (r > 0 && barH > r * 2) {
      // Rounded top corners only
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + barH);
      ctx.lineTo(x, y + barH);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(x, y, w, barH);
    }
  }
}
