/**
 * PulseRender - Scatter Plot Canvas Renderer
 *
 * Renders data points from ALL four categories as colored circles.
 * X-axis = timestamp, Y-axis = value.
 *
 * All categories are drawn in a single pass per category, batching
 * arc() calls before fill() for efficiency. This avoids the overhead of
 * switching fillStyle for every individual point.
 *
 * The scatter plot is the best chart for demonstrating multi-series data:
 * four distinct colored clouds reveal the different statistical behaviours
 * of each generated category.
 */

import type { ViewportDomain } from '@/lib/types';
import type { ChartDimensions } from '../types';
import {
  computeChartArea,
  computeDataBounds,
  dataToScreenX,
  dataToScreenY,
} from '../coordinates';
import { clearCanvas, clipToArea } from '../canvas';

// ── Config ────────────────────────────────────────────────────────────────

export interface ScatterRenderConfig {
  readonly categoryColors: Readonly<Record<string, string>>;
  readonly pointRadius: number;
  readonly pointOpacity: number;
  readonly yDomain: readonly [number, number];
  readonly overrideDomain?: ViewportDomain | null;
}

export const DEFAULT_SCATTER_CONFIG: ScatterRenderConfig = {
  categoryColors: {
    primary: '#6366f1',
    secondary: '#22d3ee',
    tertiary: '#a78bfa',
    quaternary: '#34d399',
  },
  pointRadius: 2.5,
  pointOpacity: 0.65,
  yDomain: [0, 100],
};

// ── Renderer ──────────────────────────────────────────────────────────────

export function renderScatterPlot(
  ctx: CanvasRenderingContext2D,
  points: readonly { timestamp: number; value: number; category: string }[],
  dims: ChartDimensions,
  config: ScatterRenderConfig,
): void {
  clearCanvas(ctx, dims);

  const area = computeChartArea(dims);
  if (area.width <= 0 || area.height <= 0 || points.length === 0) return;

  const bounds = computeDataBounds(points, {
    fixedYMin: config.yDomain[0],
    fixedYMax: config.yDomain[1],
    overrideDomain: config.overrideDomain,
  });

  clipToArea(ctx, area);
  ctx.globalAlpha = config.pointOpacity;

  const marginMs = (bounds.xMax - bounds.xMin) * 0.05;
  const clipMinX = bounds.xMin - marginMs;
  const clipMaxX = bounds.xMax + marginMs;

  type ScatterItem = { timestamp: number; value: number; category: string };
  const byCategory: Record<string, ScatterItem[]> = {
    primary: [],
    secondary: [],
    tertiary: [],
    quaternary: [],
  };

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    if (pt.timestamp >= clipMinX && pt.timestamp <= clipMaxX) {
      if (byCategory[pt.category]) {
        byCategory[pt.category].push(pt);
      } else {
        byCategory[pt.category] = [pt];
      }
    }
  }

  const r = config.pointRadius;

  for (const cat in byCategory) {
    const catPoints = byCategory[cat];
    if (catPoints.length === 0) continue;
    const color = config.categoryColors[cat] ?? '#888888';
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < catPoints.length; i++) {
      const pt = catPoints[i];
      const sx = dataToScreenX(pt.timestamp, bounds, area);
      const sy = dataToScreenY(pt.value, bounds, area);
      ctx.rect(sx - r, sy - r, r * 2, r * 2);
    }
    ctx.fill();
  }

  ctx.globalAlpha = 1;
  ctx.restore(); // pop clip
}
