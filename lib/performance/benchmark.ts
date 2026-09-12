/**
 * PulseRender - Automated Benchmark Runner
 *
 * Runs a controlled 5-second benchmark for a given workload size (10K, 25K, 50K, 100K).
 * Aggregates FPS, frame times, processing durations, and memory usage into a BenchmarkResult object.
 */

import type { BenchmarkResult, StressTestLevel } from './types';
import { monitor } from './monitor';

export function runBenchmark(
  workload: StressTestLevel,
  pointCount: number,
  durationMs: number = 5000,
): Promise<BenchmarkResult> {
  return new Promise((resolve) => {
    const samples: { fps: number; frameMs: number; renderMs: number; processingMs: number }[] = [];

    const startTime = Date.now();
    const interval = setInterval(() => {
      const snap = monitor.getSnapshot();
      samples.push({
        fps: snap.fps,
        frameMs: snap.avgFrameMs,
        renderMs: snap.renderTimeMs,
        processingMs: snap.processingTimeMs,
      });
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      const actualDuration = Date.now() - startTime;

      if (samples.length === 0) {
        const snap = monitor.getSnapshot();
        resolve({
          workload,
          pointCount,
          durationMs: actualDuration,
          avgFps: snap.fps,
          minFps: snap.minFps,
          avgFrameMs: snap.avgFrameMs,
          worstFrameMs: snap.worstFrameMs,
          processingTimeMs: snap.processingTimeMs,
          renderTimeMs: snap.renderTimeMs,
          memoryUsedMb: snap.memoryUsedMb,
          timestamp: Date.now(),
          fpsTargetMet: snap.fps >= 55,
          latencyTargetMet: snap.interactionLatencyMs < 100,
        });
        return;
      }

      let sumFps = 0;
      let minFps = Infinity;
      let sumFrameMs = 0;
      let worstFrameMs = 0;
      let sumRenderMs = 0;
      let sumProcMs = 0;

      for (const s of samples) {
        sumFps += s.fps;
        if (s.fps < minFps) minFps = s.fps;
        sumFrameMs += s.frameMs;
        if (s.frameMs > worstFrameMs) worstFrameMs = s.frameMs;
        sumRenderMs += s.renderMs;
        sumProcMs += s.processingMs;
      }

      const count = samples.length;
      const avgFps = Number((sumFps / count).toFixed(1));
      const avgFrameMs = Number((sumFrameMs / count).toFixed(1));
      const avgRenderMs = Number((sumRenderMs / count).toFixed(1));
      const avgProcMs = Number((sumProcMs / count).toFixed(1));
      const finalSnap = monitor.getSnapshot();

      resolve({
        workload,
        pointCount,
        durationMs: actualDuration,
        avgFps,
        minFps: Number(minFps.toFixed(1)),
        avgFrameMs,
        worstFrameMs: Number(worstFrameMs.toFixed(1)),
        processingTimeMs: avgProcMs,
        renderTimeMs: avgRenderMs,
        memoryUsedMb: finalSnap.memoryUsedMb,
        timestamp: Date.now(),
        fpsTargetMet: avgFps >= 55,
        latencyTargetMet: finalSnap.interactionLatencyMs < 100,
      });
    }, durationMs);
  });
}
