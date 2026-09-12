/**
 * PulseRender - Rendering Layer Type Definitions
 *
 * Pure TypeScript types for the rendering subsystem.
 * No React dependencies, no DOM references.
 *
 * These types define the contract between:
 *   • Chart components (React) → provide dimensions, refs
 *   • Chart renderers (plain TS) → consume dimensions, produce Canvas draw calls
 *   • Scheduler → invokes RenderCallback with a timestamp
 */

// ── Dimensions & Layout ───────────────────────────────────────────────────

/**
 * The outer bounding box of a chart surface in CSS pixels.
 * Canvas physical pixels = width × dpr, height × dpr.
 */
export interface ChartDimensions {
  /** Outer width in CSS pixels */
  readonly width: number;
  /** Outer height in CSS pixels */
  readonly height: number;
  /** Window device pixel ratio (1 on standard, 2 on Retina, etc.) */
  readonly dpr: number;
  /** Inner padding separating data area from chart edges */
  readonly padding: ChartPadding;
}

export interface ChartPadding {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/** The drawable chart area after subtracting padding from ChartDimensions */
export interface ChartArea {
  /** Left edge in CSS pixels */
  readonly x: number;
  /** Top edge in CSS pixels */
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

// ── Data Bounds ───────────────────────────────────────────────────────────

/**
 * The extent of the data in data-space coordinates.
 * Used by the coordinate transform functions in coordinates.ts.
 */
export interface DataBounds {
  readonly xMin: number;
  readonly xMax: number;
  readonly yMin: number;
  readonly yMax: number;
}

// ── Scheduler ─────────────────────────────────────────────────────────────

/**
 * Callback signature for registered chart renderers.
 * Receives the rAF high-resolution timestamp (same as DOMHighResTimeStamp).
 */
export type RenderCallback = (timestamp: number) => void;

// ── Defaults ──────────────────────────────────────────────────────────────

/**
 * Default padding values that leave room for Y-axis labels (left)
 * and X-axis labels (bottom).
 */
export const DEFAULT_PADDING: ChartPadding = {
  top: 16,
  right: 16,
  bottom: 36,
  left: 52,
} as const;
