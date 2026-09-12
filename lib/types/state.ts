/**
 * PulseRender — State Layer Interfaces
 *
 * These interfaces define the SHAPE of each state domain.
 * They are NOT implementations — no providers, reducers, or stores here.
 *
 * The separation exists so Phase 2+ can pick an implementation strategy
 * (React Context, Zustand, signals, etc.) without changing the type contract.
 *
 * PHASE 1: Interface definitions only.
 */

import type {
  DataPoint,
  ChartConfig,
  TimeRangePreset,
  AggregationMethod,
  PerformanceMetrics,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Raw Data State
// ---------------------------------------------------------------------------

/**
 * Holds the latest batch of unprocessed data points arriving from the stream.
 * This state must NEVER be directly consumed by renderers — it flows through
 * the processing pipeline first.
 *
 * Phase 2+ responsibility: data stream hook / worker message handler.
 */
export interface RawDataState {
  /** Ring buffer of the most recently received data points */
  readonly points: readonly DataPoint[];
  /** Unix epoch ms of the last successful data arrival */
  readonly lastUpdatedAt: number | null;
  /** Whether the data stream is currently active */
  readonly isStreaming: boolean;
  /** Total number of points received since stream start */
  readonly totalPointsReceived: number;
}

// ---------------------------------------------------------------------------
// Derived Data State
// ---------------------------------------------------------------------------

/**
 * Data that has been processed through the pipeline:
 *   Raw → Filter → Aggregate → Viewport → Derived
 *
 * This is what chart renderers consume.
 * Phase 3+ responsibility: processing pipeline.
 */
export interface DerivedDataState {
  /**
   * Per-chart derived data, keyed by ChartConfig.id.
   * Each entry contains only the points relevant to that chart,
   * already aggregated and viewport-clipped.
   */
  readonly chartData: Readonly<Record<string, readonly DataPoint[]>>;
  /** Whether the pipeline is currently processing */
  readonly isProcessing: boolean;
  /** Pipeline processing duration for the last cycle (ms) */
  readonly lastProcessingTimeMs: number | null;
}

// ---------------------------------------------------------------------------
// UI State
// ---------------------------------------------------------------------------

/**
 * All user-controlled interface state.
 * This state is ephemeral — it does not need to survive page reload.
 *
 * Phase 1: Defined here. Minimal provider established.
 * Phase 3+: Full implementation with zoom/pan/filter controls.
 */
export interface UIState {
  /** Currently focused chart id, or null if none */
  readonly selectedChartId: string | null;
  /** Active time range preset */
  readonly timeRange: TimeRangePreset;
  /** Aggregation method currently applied */
  readonly aggregation: AggregationMethod;
  /**
   * Visibility overrides per chart id.
   * If a chart id is absent, falls back to ChartConfig.visible.
   */
  readonly visibilityOverrides: Readonly<Record<string, boolean>>;
  /** Zoom level: 1.0 = 100%, no zoom. Phase 3+ */
  readonly zoomLevel: number;
  /**
   * Pan offset in data units (not pixels).
   * Phase 3+: will be used by the viewport calculation.
   */
  readonly panOffsetMs: number;
  /**
   * Active category filters.
   * Empty set means "show all categories".
   */
  readonly activeCategories: ReadonlySet<string>;
  /** Whether the performance monitor overlay is visible */
  readonly showPerformanceMonitor: boolean;
}

// ---------------------------------------------------------------------------
// Performance State
// ---------------------------------------------------------------------------

/**
 * Accumulated performance measurement history.
 * Phase 4+ responsibility: performance monitoring subsystem.
 */
export interface PerformanceState {
  /** Most recent metrics snapshot */
  readonly current: PerformanceMetrics | null;
  /**
   * Rolling history of the last N snapshots.
   * Used to render the FPS sparkline and detect degradation.
   */
  readonly history: readonly PerformanceMetrics[];
  /** Maximum history entries to keep in memory */
  readonly maxHistoryLength: number;
}

// ---------------------------------------------------------------------------
// Composed Dashboard State (root shape)
// ---------------------------------------------------------------------------

/**
 * The complete composed state of the PulseRender dashboard.
 * This is the shape of the root state container, however it is implemented.
 *
 * Individual slices are exposed through dedicated context hooks to minimise
 * unnecessary re-renders.
 */
export interface DashboardState {
  readonly rawData: RawDataState;
  readonly derivedData: DerivedDataState;
  readonly ui: UIState;
  readonly performance: PerformanceState;
  /** Resolved chart configurations (from server config, possibly user-mutated) */
  readonly charts: readonly ChartConfig[];
}

// ---------------------------------------------------------------------------
// Default initial values (used to seed providers in Phase 1+)
// ---------------------------------------------------------------------------

export const INITIAL_RAW_DATA_STATE: RawDataState = {
  points: [],
  lastUpdatedAt: null,
  isStreaming: false,
  totalPointsReceived: 0,
};

export const INITIAL_DERIVED_DATA_STATE: DerivedDataState = {
  chartData: {},
  isProcessing: false,
  lastProcessingTimeMs: null,
};

export const INITIAL_UI_STATE: UIState = {
  selectedChartId: null,
  timeRange: '1m',
  aggregation: 'none',
  visibilityOverrides: {},
  zoomLevel: 1.0,
  panOffsetMs: 0,
  activeCategories: new Set<string>(),
  showPerformanceMonitor: false,
};

export const INITIAL_PERFORMANCE_STATE: PerformanceState = {
  current: null,
  history: [],
  maxHistoryLength: 120, // 2 minutes at 1 snapshot/second
};
