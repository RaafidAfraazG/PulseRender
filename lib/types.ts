/**
 * PulseRender — Core Domain Types
 *
 * This file is the single source of truth for all foundational domain types.
 * Business logic and rendering logic import from here, not from each other.
 *
 * PHASE 1: Type definitions only. No runtime logic.
 */

// ---------------------------------------------------------------------------
// Raw Data
// ---------------------------------------------------------------------------

/**
 * A single raw data point produced by the data source.
 *
 * `id`        — stable identity (useful for keyed rendering)
 * `timestamp` — Unix epoch milliseconds
 * `value`     — the primary numeric measurement
 * `category`  — logical grouping / series identifier
 * `metadata`  — optional bag of additional properties (sensor id, region, etc.)
 */
export interface DataPoint {
  readonly id: string;
  readonly timestamp: number;
  readonly value: number;
  readonly category: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Chart Types
// ---------------------------------------------------------------------------

/**
 * Discriminated union of all supported chart surface types.
 * Used as the `type` discriminant in ChartConfig.
 */
export type ChartType = 'line' | 'bar' | 'scatter' | 'heatmap';

// ---------------------------------------------------------------------------
// Chart Configuration
// ---------------------------------------------------------------------------

/**
 * Common configuration shared by all chart types.
 * Extended by chart-specific config interfaces below.
 */
interface BaseChartConfig {
  /** Stable identifier for this chart instance */
  readonly id: string;
  /** Human-readable label shown in the UI */
  readonly label: string;
  /** Which data category / series this chart displays */
  readonly dataKey: string;
  /** Whether this chart is currently visible */
  readonly visible: boolean;
  /** Primary render color (CSS color string) */
  readonly color: string;
  /** Optional explicit Y-axis domain [min, max]. Undefined means auto-scale. */
  readonly yDomain?: readonly [number, number];
  /** Optional explicit X-axis domain [min, max]. Undefined means full extent. */
  readonly xDomain?: readonly [number, number];
}

export interface LineChartConfig extends BaseChartConfig {
  readonly type: 'line';
  /** Pixel width of the line stroke */
  readonly strokeWidth?: number;
  /** Whether to render data point markers */
  readonly showDots?: boolean;
}

export interface BarChartConfig extends BaseChartConfig {
  readonly type: 'bar';
  /** Pixel gap between bars */
  readonly barGap?: number;
}

export interface ScatterChartConfig extends BaseChartConfig {
  readonly type: 'scatter';
  /** Radius of scatter points in pixels */
  readonly pointRadius?: number;
}

export interface HeatmapChartConfig extends BaseChartConfig {
  readonly type: 'heatmap';
  /** Number of columns in the heatmap grid */
  readonly columns?: number;
}

/**
 * Discriminated union of all chart configurations.
 * Use the `type` field to narrow to the specific variant.
 */
export type ChartConfig =
  | LineChartConfig
  | BarChartConfig
  | ScatterChartConfig
  | HeatmapChartConfig;

/**
 * An aggregated data point representing a summary over a time bucket.
 */
export interface AggregatedDataPoint {
  readonly id: string;
  readonly timestamp: number;
  readonly value: number;       // Average value in this bucket
  readonly category: string;
  readonly min: number;         // Minimum value in bucket
  readonly max: number;         // Maximum value in bucket
  readonly count: number;       // Number of raw points in bucket
}

/** Explicit viewport domain in data space */
export interface ViewportDomain {
  readonly xMin: number;
  readonly xMax: number;
  readonly yMin: number;
  readonly yMax: number;
}

// ---------------------------------------------------------------------------
// Time Ranges
// ---------------------------------------------------------------------------

/** Preset key for a named time range */
export type TimeRangePreset = '1m' | '5m' | '15m' | '1h' | 'all';

/** A named time range with a duration */
export interface TimeRange {
  readonly preset: TimeRangePreset;
  readonly label: string;
  /** Duration in milliseconds (Infinity for 'all') */
  readonly durationMs: number;
}

/** All supported time range presets, ordered from shortest to longest */
export const TIME_RANGES: Readonly<Record<TimeRangePreset, TimeRange>> = {
  '1m':  { preset: '1m',  label: '1 minute',   durationMs: 60_000 },
  '5m':  { preset: '5m',  label: '5 minutes',  durationMs: 300_000 },
  '15m': { preset: '15m', label: '15 minutes', durationMs: 900_000 },
  '1h':  { preset: '1h',  label: '1 hour',     durationMs: 3_600_000 },
  'all': { preset: 'all', label: 'All data',   durationMs: Infinity },
} as const;

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

/** Time-bucket aggregation mode */
export type AggregationMode = 'raw' | '1m' | '5m' | '1h';

/** Statistical method used when downsampling data for display */
export type AggregationMethod = 'none' | 'avg' | 'sum' | 'min' | 'max';

// ---------------------------------------------------------------------------
// Performance Metrics
// ---------------------------------------------------------------------------

/**
 * A snapshot of performance metrics at a given instant.
 * Populated by the performance monitoring subsystem (Phase 4+).
 */
export interface PerformanceMetrics {
  /** Frames per second measured over the last sample window */
  readonly fps: number;
  /** Heap memory used in megabytes (undefined if unavailable in this browser) */
  readonly memoryUsedMb: number | undefined;
  /** Time in milliseconds to complete one render pass */
  readonly renderTimeMs: number;
  /** Time in milliseconds to process/transform the raw data */
  readonly dataProcessingTimeMs: number;
  /** Unix epoch milliseconds when this snapshot was taken */
  readonly timestamp: number;
}

// ---------------------------------------------------------------------------
// Data Stream Configuration
// ---------------------------------------------------------------------------

/**
 * Configuration for the simulated data source.
 * Controls how the data stream will behave when implemented in Phase 2.
 */
export interface DataStreamConfig {
  /** Number of data points generated per tick */
  readonly pointsPerTick: number;
  /** Interval between ticks in milliseconds */
  readonly tickIntervalMs: number;
  /** Maximum number of data points to retain in the ring buffer */
  readonly maxBufferSize: number;
  /** Number of distinct categories in the stream */
  readonly categoryCount: number;
}

// ---------------------------------------------------------------------------
// Dashboard Configuration
// ---------------------------------------------------------------------------

/**
 * Root-level dashboard configuration resolved at the server/build time.
 * Passed from Server Components to Client Components as serialisable props.
 */
export interface DashboardConfig {
  /** Application title displayed in the header */
  readonly title: string;
  /** Application subtitle / tagline */
  readonly subtitle: string;
  /** Initial chart configurations */
  readonly charts: readonly ChartConfig[];
  /** Data stream configuration */
  readonly stream: DataStreamConfig;
  /** Default time range preset */
  readonly defaultTimeRange: TimeRangePreset;
}

// ---------------------------------------------------------------------------
// API Contract
// ---------------------------------------------------------------------------

/**
 * Standard envelope for all PulseRender API responses.
 * Ensures consistent success/error handling across all routes.
 */
export type ApiResponse<T> =
  | { readonly success: true;  readonly data: T;      readonly timestamp: number }
  | { readonly success: false; readonly error: string; readonly timestamp: number };
