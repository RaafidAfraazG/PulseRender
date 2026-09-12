/**
 * PulseRender - High-Precision Performance Timing Utilities
 *
 * Wraps performance.now() to measure processing, rendering, and interaction latency.
 */

export class TimingTracker {
  private processingMs = 0;
  private renderMs = 0;
  private lastInteractionLatencyMs = 0;

  recordProcessingTime(ms: number): void {
    this.processingMs = Number(ms.toFixed(2));
  }

  recordRenderTime(ms: number): void {
    this.renderMs = Number(ms.toFixed(2));
  }

  recordInteractionLatency(ms: number): void {
    this.lastInteractionLatencyMs = Number(ms.toFixed(2));
  }

  getMetrics(): { processingTimeMs: number; renderTimeMs: number; interactionLatencyMs: number } {
    return {
      processingTimeMs: this.processingMs,
      renderTimeMs: this.renderMs,
      interactionLatencyMs: this.lastInteractionLatencyMs,
    };
  }
}

/** Measures execution duration of a function in milliseconds */
export function measureTime<T>(fn: () => T): { result: T; durationMs: number } {
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const result = fn();
  const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
  return { result, durationMs: end - start };
}
