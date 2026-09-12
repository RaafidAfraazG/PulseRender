/**
 * PulseRender - Line Chart Canvas Renderer
 *
 * Draws a continuous polyline through DataPoints ordered by timestamp.
 * Optionally fills the area beneath the line and renders dot markers.
 *
 * Runs inside the shared rAF loop. Must not allocate large objects or
 * perform expensive computations - the rAF budget is ~16 ms total for
 * all four charts.
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

export interface LineChartRenderConfig {
  readonly color: string;
  readonly strokeWidth: number;
  readonly showDots: boolean;
  readonly dotRadius: number;
  readonly fillColor: string;   // empty string = no area fill
  readonly yDomain: readonly [number, number];
  readonly overrideDomain?: ViewportDomain | null;
}

export const DEFAULT_LINE_CONFIG: LineChartRenderConfig = {
  color: '#6366f1',
  strokeWidth: 2,
  showDots: false,
  dotRadius: 3,
  fillColor: 'rgba(99,102,241,0.10)',
  yDomain: [0, 100],
};

// ── Renderer ──────────────────────────────────────────────────────────────

export function renderLineChart(
  ctx: CanvasRenderingContext2D,
  points: readonly { timestamp: number; value: number }[],
  dims: ChartDimensions,
  config: LineChartRenderConfig,
): void {
  clearCanvas(ctx, dims);

  const area = computeChartArea(dims);
  if (area.width <= 0 || area.height <= 0 || points.length === 0) return;

  // Fast check if already sorted chronologically to avoid array allocation & sort cost
  let isSorted = true;
  for (let i = 1; i < points.length; i++) {
    if (points[i].timestamp < points[i - 1].timestamp) {
      isSorted = false;
      break;
    }
  }

  const sorted = isSorted ? points : points.slice().sort((a, b) => a.timestamp - b.timestamp);

  const bounds = computeDataBounds(sorted, {
    fixedYMin: config.yDomain[0],
    fixedYMax: config.yDomain[1],
    overrideDomain: config.overrideDomain,
  });

  clipToArea(ctx, area);

  if (sorted.length < 2) {
    ctx.restore();
    return;
  }

  // Viewport point clipping: filter points within bounds + margin
  const marginMs = (bounds.xMax - bounds.xMin) * 0.05;
  const clipMinX = bounds.xMin - marginMs;
  const clipMaxX = bounds.xMax + marginMs;

  const visible: { timestamp: number; value: number }[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const pt = sorted[i];
    if (pt.timestamp >= clipMinX && pt.timestamp <= clipMaxX) {
      visible.push(pt);
    }
  }

  if (visible.length < 2) {
    ctx.restore();
    return;
  }

  const first = visible[0];
  const last = visible[visible.length - 1];

  // ── Area fill ───────────────────────────────────────────────────────────
  if (config.fillColor) {
    ctx.beginPath();
    ctx.moveTo(
      dataToScreenX(first.timestamp, bounds, area),
      area.y + area.height,
    );
    for (let i = 0; i < visible.length; i++) {
      const pt = visible[i];
      ctx.lineTo(
        dataToScreenX(pt.timestamp, bounds, area),
        dataToScreenY(pt.value, bounds, area),
      );
    }
    ctx.lineTo(
      dataToScreenX(last.timestamp, bounds, area),
      area.y + area.height,
    );
    ctx.closePath();
    ctx.fillStyle = config.fillColor;
    ctx.fill();
  }

  // ── Line stroke ─────────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.strokeStyle = config.color;
  ctx.lineWidth = config.strokeWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  for (let i = 0; i < visible.length; i++) {
    const pt = visible[i];
    const sx = dataToScreenX(pt.timestamp, bounds, area);
    const sy = dataToScreenY(pt.value, bounds, area);
    if (i === 0) { ctx.moveTo(sx, sy); }
    else { ctx.lineTo(sx, sy); }
  }
  ctx.stroke();

  // ── Dot markers (only when visible density is low) ─────────────────────────
  if (config.showDots && visible.length <= 300) {
    ctx.fillStyle = config.color;
    for (let i = 0; i < visible.length; i++) {
      const pt = visible[i];
      ctx.beginPath();
      ctx.arc(
        dataToScreenX(pt.timestamp, bounds, area),
        dataToScreenY(pt.value, bounds, area),
        config.dotRadius, 0, Math.PI * 2,
      );
      ctx.fill();
    }
  }

  ctx.restore(); // pop the clip region
}
