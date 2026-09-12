'use client';

/**
 * PulseRender - Performance Monitor Overlay Panel
 *
 * Real-time performance dashboard displaying measured FPS, frame timing, processing duration,
 * chart render duration, interaction latency, and heap memory usage.
 * Includes automated benchmark runner button.
 */

import { useEffect, useState } from 'react';
import { monitor } from '@/lib/performance/monitor';
import { runBenchmark } from '@/lib/performance/benchmark';
import type { PerformanceSnapshot, BenchmarkResult } from '@/lib/performance/types';
import styles from './PerformanceMonitor.module.css';

interface PerformanceMonitorProps {
  readonly onClose: () => void;
}

export function PerformanceMonitor({ onClose }: PerformanceMonitorProps): React.JSX.Element {
  const [metrics, setMetrics] = useState<PerformanceSnapshot>(() => monitor.getSnapshot());
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [lastBenchmark, setLastBenchmark] = useState<BenchmarkResult | null>(null);

  useEffect(() => {
    const unbind = monitor.subscribe(setMetrics);
    return unbind;
  }, []);

  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    try {
      const result = await runBenchmark('10k', metrics.storedPointCount || 10_000, 5000);
      setLastBenchmark(result);
    } finally {
      setIsBenchmarking(false);
    }
  };

  const statusClass =
    metrics.status === 'healthy'
      ? styles.healthy
      : metrics.status === 'degraded'
        ? styles.degraded
        : styles.poor;

  return (
    <aside className={styles.overlay} aria-label="Performance metrics monitor">
      {/* ── Header ────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <span aria-hidden="true">⚡</span>
          <span>Performance Monitor</span>
        </div>
        <div className={styles.titleGroup}>
          <span className={`${styles.statusBadge} ${statusClass}`}>
            {metrics.status}
          </span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close performance monitor"
          >
            ✕
          </button>
        </div>
      </header>

      {/* ── Metrics Grid ──────────────────────────────────────────── */}
      <div className={styles.content}>
        <div className={styles.grid}>
          {/* FPS */}
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Frame Rate</span>
            <span className={styles.metricValue}>{metrics.fps} FPS</span>
            <span className={styles.subText}>Min: {metrics.minFps} FPS</span>
          </div>

          {/* Frame Duration */}
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Frame Time</span>
            <span className={styles.metricValue}>{metrics.avgFrameMs} ms</span>
            <span className={styles.subText}>Worst: {metrics.worstFrameMs} ms</span>
          </div>

          {/* Processing Time */}
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Processing</span>
            <span className={styles.metricValue}>{metrics.processingTimeMs} ms</span>
            <span className={styles.subText}>Pipeline filter/agg</span>
          </div>

          {/* Render Time */}
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Canvas Render Time</span>
            <span className={styles.metricValue}>{metrics.renderTimeMs} ms</span>
            <span className={styles.subText}>Total draw time (4 charts/frame)</span>
          </div>

          {/* Data Points */}
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Data Points</span>
            <span className={styles.metricValue}>{metrics.storedPointCount.toLocaleString()}</span>
            <span className={styles.subText}>{metrics.incomingPointsPerSec}/sec stream</span>
          </div>

          {/* Memory */}
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>JS Heap Memory</span>
            <span className={styles.metricValue}>
              {metrics.memoryUsedMb !== null ? `${metrics.memoryUsedMb} MB` : 'Unavailable'}
            </span>
            <span className={styles.subText}>
              {metrics.totalMemoryMb !== null ? `Total: ${metrics.totalMemoryMb} MB` : 'Browser fallback'}
            </span>
          </div>
        </div>

        {/* Interaction Latency */}
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Interaction Response Latency</span>
          <span className={styles.metricValue}>
            {metrics.interactionLatencyMs > 0 ? `${metrics.interactionLatencyMs} ms` : '< 1 ms'}
          </span>
          <span className={styles.subText}>Target: &lt; 100ms (RAIL model)</span>
        </div>

        {/* Benchmark Action */}
        <div className={styles.benchmarkBar}>
          <button
            type="button"
            className={styles.benchmarkBtn}
            onClick={handleRunBenchmark}
            disabled={isBenchmarking}
          >
            {isBenchmarking ? '⏱ Running 5s Benchmark…' : '▶ Run 5s Benchmark Suite'}
          </button>
        </div>

        {/* Benchmark Result Display */}
        {lastBenchmark && (
          <div className={styles.benchmarkResult}>
            <div><strong>BENCHMARK REPORT ({lastBenchmark.pointCount.toLocaleString()} PTS)</strong></div>
            <div>Avg FPS: {lastBenchmark.avgFps} FPS (Min: {lastBenchmark.minFps} FPS)</div>
            <div>Avg Frame: {lastBenchmark.avgFrameMs} ms (Worst: {lastBenchmark.worstFrameMs} ms)</div>
            <div>Pipeline Processing: {lastBenchmark.processingTimeMs} ms</div>
            <div>Canvas Render Time: {lastBenchmark.renderTimeMs} ms (4 charts combined)</div>
            <div>FPS Target: {lastBenchmark.fpsTargetMet ? '✅ PASS' : '❌ NEEDS OPTIMIZATION'}</div>
          </div>
        )}
      </div>
    </aside>
  );
}
