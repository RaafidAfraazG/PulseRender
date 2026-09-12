/**
 * PulseRender — Canvas Setup & Utilities
 *
 * Handles the low-level canvas lifecycle:
 *   • Sizing the canvas at the correct device pixel ratio (no blur on HiDPI)
 *   • Clearing between frames
 *   • Clip region helpers
 *
 * ── DPR scaling ──────────────────────────────────────────────────────────
 *
 * A canvas's `width` and `height` attributes are its PHYSICAL pixel size.
 * Its CSS `width` / `height` are its displayed size.
 * On a 2× Retina display we need:
 *
 *   canvas.width  = cssWidth  × dpr   (physical)
 *   canvas.height = cssHeight × dpr   (physical)
 *   ctx.scale(dpr, dpr)               (so draw calls use CSS pixel units)
 *
 * setupCanvas() handles this. All downstream draw calls use CSS pixels.
 *
 * ── Frame lifecycle ──────────────────────────────────────────────────────
 *
 *   1. setupCanvas()  — once per dimension change
 *   2. clearCanvas()  — start of every rAF frame
 *   3. (draw calls)
 *   4. clipToArea() / ctx.restore()  — within a single frame as needed
 */

import type { ChartDimensions, ChartArea } from './types';

/**
 * Size the canvas to match CSS dimensions at the correct DPR.
 * Must be called when container dimensions change.
 *
 * @returns 2D context scaled to CSS pixels, or null if context unavailable.
 */
export function setupCanvas(
  canvas: HTMLCanvasElement,
  width:  number,
  height: number,
  dpr:    number,
): CanvasRenderingContext2D | null {
  const physW = Math.round(width  * dpr);
  const physH = Math.round(height * dpr);

  // Avoid redundant resets — changing canvas.width clears the context
  if (canvas.width !== physW || canvas.height !== physH) {
    canvas.width  = physW;
    canvas.height = physH;
  }

  canvas.style.width  = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Reset transform and apply DPR scale
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return ctx;
}

/**
 * Clear the entire canvas surface for a new frame.
 * Also resets the DPR transform in case it was modified.
 */
export function clearCanvas(
  ctx:  CanvasRenderingContext2D,
  dims: ChartDimensions,
): void {
  ctx.setTransform(dims.dpr, 0, 0, dims.dpr, 0, 0);
  ctx.clearRect(0, 0, dims.width, dims.height);
}

/**
 * Save context state and clip to the chart's drawable area.
 * Prevents data rendering from bleeding into the axis/label region.
 *
 * ⚠ Caller MUST call ctx.restore() when finished drawing within the clip.
 */
export function clipToArea(
  ctx:  CanvasRenderingContext2D,
  area: ChartArea,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(area.x, area.y, area.width, area.height);
  ctx.clip();
}
