/**
 * PulseRender — Central Performance Monitor Subsystem
 *
 * Module-level singleton managing frame timing, FPS rolling averages, memory metrics,
 * processing durations, and interaction latency.
 *
 * Published throttled snapshots to UI listeners without triggering 60 FPS React re-renders.
 */

import { FpsCalculator } from './fps';
import { readMemoryUsage } from './memory';
import { TimingTracker } from './timing';
import type { PerformanceSnapshot, PerformanceStatus } from './types';

class PerformanceMonitor {
  private static instance: PerformanceMonitor;

  private fpsCalc = new FpsCalculator();
  private timing = new TimingTracker();
  private storedCount = 0;
  private listeners = new Set<(snapshot: PerformanceSnapshot) => void>();
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private currentSnapshot: PerformanceSnapshot;

  private constructor() {
    this.currentSnapshot = this.buildSnapshot();
    if (typeof window !== 'undefined') {
      // Publish UI metrics at 4 Hz (every 250ms) to keep UI responsive without thrashing
      this.updateInterval = setInterval(() => {
        this.currentSnapshot = this.buildSnapshot();
        this.notifyListeners();
      }, 250);
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // ── Imperative Measurement APIs (Called in rAF / pipeline) ──────────────

  recordFrame(now: number): void {
    this.fpsCalc.recordFrame(now);
  }

  recordProcessingTime(ms: number): void {
    this.timing.recordProcessingTime(ms);
  }

  recordRenderTime(ms: number): void {
    this.timing.recordRenderTime(ms);
  }

  recordInteractionLatency(ms: number): void {
    this.timing.recordInteractionLatency(ms);
  }

  setStoredPointCount(count: number): void {
    this.storedCount = count;
  }

  getSnapshot(): PerformanceSnapshot {
    return this.currentSnapshot;
  }

  subscribe(listener: (snapshot: PerformanceSnapshot) => void): () => void {
    this.listeners.add(listener);
    // Initial emit
    listener(this.currentSnapshot);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private buildSnapshot(): PerformanceSnapshot {
    const fpsMetrics = this.fpsCalc.getMetrics();
    const timingMetrics = this.timing.getMetrics();
    const mem = readMemoryUsage();

    let status: PerformanceStatus = 'healthy';
    if (fpsMetrics.fps < 45) {
      status = 'poor';
    } else if (fpsMetrics.fps < 55) {
      status = 'degraded';
    }

    return {
      fps: fpsMetrics.fps,
      minFps: fpsMetrics.minFps,
      avgFrameMs: fpsMetrics.avgFrameMs,
      worstFrameMs: fpsMetrics.worstFrameMs,
      renderTimeMs: timingMetrics.renderTimeMs,
      processingTimeMs: timingMetrics.processingTimeMs,
      interactionLatencyMs: timingMetrics.interactionLatencyMs,
      memoryUsedMb: mem?.usedMb ?? null,
      totalMemoryMb: mem?.totalMb ?? null,
      storedPointCount: this.storedCount,
      incomingPointsPerSec: 100, // 10 points / 100ms
      timestamp: Date.now(),
      status,
    };
  }

  private notifyListeners(): void {
    for (const fn of this.listeners) {
      fn(this.currentSnapshot);
    }
  }
}

export const monitor = PerformanceMonitor.getInstance();
