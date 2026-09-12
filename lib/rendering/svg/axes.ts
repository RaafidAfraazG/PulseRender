/**
 * PulseRender — SVG Axes Renderer
 *
 * Imperatively builds SVG DOM elements for chart axes, gridlines, and labels.
 * Called from chart components when axes need updating.
 *
 * ── Why SVG for axes? ────────────────────────────────────────────────────
 *
 * • Axes rarely change (only when data bounds shift significantly).
 * • SVG text is accessible, selectable, and rendered by the browser's
 *   text engine — no font loading or Canvas text metrics needed.
 * • SVG allows precise coordinate positioning without DPR compensation.
 *
 * ── Why NOT D3? ──────────────────────────────────────────────────────────
 *
 * PulseRender uses no chart libraries. This file is ~80 lines of native
 * SVG DOM manipulation. Simple, transparent, zero dependencies.
 *
 * ── Update frequency ─────────────────────────────────────────────────────
 *
 * Axis updates are throttled by callers (every ~12 rAF frames = 5×/second)
 * to avoid expensive DOM thrashing at 60 fps.
 */

import type { DataBounds, ChartDimensions, ChartArea } from '../types';
import { dataToScreenY } from '../coordinates';

const SVG_NS = 'http://www.w3.org/2000/svg';

function el(tag: string, attrs: Record<string, string | number>): SVGElement {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

// ── Options ────────────────────────────────────────────────────────────────

export interface AxisOptions {
  readonly tickCount:        number;
  readonly gridColor:        string;
  readonly axisColor:        string;
  readonly labelColor:       string;
  readonly fontSize:         number;
  readonly showXLabels:      boolean;
  readonly xLabelFormatter: (ts: number) => string;
}

export const DEFAULT_AXIS_OPTIONS: AxisOptions = {
  tickCount:   5,
  gridColor:   'rgba(255,255,255,0.06)',
  axisColor:   'rgba(255,255,255,0.15)',
  labelColor:  '#6b7280',
  fontSize:    10,
  showXLabels: true,
  xLabelFormatter(ts: number): string {
    const d = new Date(ts);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    const ss = d.getSeconds().toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  },
};

// ── Renderer ─────────────────────────────────────────────────────────────

/**
 * Rebuild the axes SVG content for the given bounds and dimensions.
 * Clears and re-builds all SVG child elements.
 *
 * Phase 4 optimisation: diff existing elements rather than rebuilding.
 */
export function renderAxes(
  svg:     SVGSVGElement,
  bounds:  DataBounds,
  dims:    ChartDimensions,
  area:    ChartArea,
  options: AxisOptions = DEFAULT_AXIS_OPTIONS,
): void {
  // Size the SVG to overlay the canvas exactly
  svg.setAttribute('width',   String(dims.width));
  svg.setAttribute('height',  String(dims.height));
  svg.setAttribute('viewBox', `0 0 ${dims.width} ${dims.height}`);

  // Clear — rebuilding is simpler than diffing for Phase 2
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const { tickCount, gridColor, axisColor, labelColor, fontSize, showXLabels, xLabelFormatter } = options;

  // ── Y-axis line ─────────────────────────────────────────────────────────
  svg.appendChild(el('line', {
    x1: area.x, y1: area.y,
    x2: area.x, y2: area.y + area.height,
    stroke: axisColor, 'stroke-width': 1,
  }));

  // ── X-axis line ─────────────────────────────────────────────────────────
  svg.appendChild(el('line', {
    x1: area.x,              y1: area.y + area.height,
    x2: area.x + area.width, y2: area.y + area.height,
    stroke: axisColor, 'stroke-width': 1,
  }));

  // ── Y-axis ticks, gridlines, labels ─────────────────────────────────────
  for (let i = 0; i <= tickCount; i++) {
    const dataY = bounds.yMin + (i / tickCount) * (bounds.yMax - bounds.yMin);
    const sy    = dataToScreenY(dataY, bounds, area);

    // Horizontal gridline
    svg.appendChild(el('line', {
      x1: area.x, y1: sy, x2: area.x + area.width, y2: sy,
      stroke: gridColor, 'stroke-width': 1, 'stroke-dasharray': '4 5',
    }));

    // Tick mark
    svg.appendChild(el('line', {
      x1: area.x - 4, y1: sy, x2: area.x, y2: sy,
      stroke: axisColor, 'stroke-width': 1,
    }));

    // Y label
    const label = el('text', {
      x: area.x - 8, y: sy + fontSize * 0.38,
      'text-anchor': 'end', fill: labelColor,
      'font-size': fontSize, 'font-family': 'var(--font-sans, sans-serif)',
    });
    label.textContent = Math.round(dataY).toString();
    svg.appendChild(label);
  }

  // ── X-axis labels (start and end) ───────────────────────────────────────
  if (showXLabels && bounds.xMax > bounds.xMin) {
    for (const [dataX, anchor, xPos] of [
      [bounds.xMin, 'start', area.x]              as const,
      [bounds.xMax, 'end',   area.x + area.width] as const,
    ]) {
      const label = el('text', {
        x: xPos, y: area.y + area.height + fontSize + 5,
        'text-anchor': anchor, fill: labelColor,
        'font-size': fontSize - 1, 'font-family': 'var(--font-sans, sans-serif)',
      });
      label.textContent = xLabelFormatter(dataX);
      svg.appendChild(label);
    }
  }
}
