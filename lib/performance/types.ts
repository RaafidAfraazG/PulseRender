/**
 * PulseRender — Performance Subsystem Type Definitions
 */

export type StressTestLevel = 'live' | '10k' | '25k' | '50k' | '100k';

export type PerformanceStatus = 'healthy' | 'degraded' | 'poor';

export interface PerformanceSnapshot {
  readonly fps: number;
  readonly minFps: number;
  readonly avgFrameMs: number;
  readonly worstFrameMs: number;
  readonly renderTimeMs: number;
  readonly processingTimeMs: number;
  readonly interactionLatencyMs: number;
  readonly memoryUsedMb: number | null;
  readonly totalMemoryMb: number | null;
  readonly storedPointCount: number;
  readonly incomingPointsPerSec: number;
  readonly timestamp: number;
  readonly status: PerformanceStatus;
}

export interface BenchmarkResult {
  readonly workload: StressTestLevel;
  readonly pointCount: number;
  readonly durationMs: number;
  readonly avgFps: number;
  readonly minFps: number;
  readonly avgFrameMs: number;
  readonly worstFrameMs: number;
  readonly processingTimeMs: number;
  readonly renderTimeMs: number;
  readonly memoryUsedMb: number | null;
  readonly timestamp: number;
  readonly fpsTargetMet: boolean;
  readonly latencyTargetMet: boolean;
}
