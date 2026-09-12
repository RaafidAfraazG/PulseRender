/**
 * PulseRender - Browser Heap Memory Reader
 *
 * Reads performance.memory JS heap statistics when supported by the browser engine (Chrome/Edge).
 * Gracefully returns null on engines without performance.memory support (Firefox/Safari).
 */

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export function readMemoryUsage(): { usedMb: number; totalMb: number } | null {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return null;
  }

  const perf = window.performance as unknown as { memory?: PerformanceMemory };
  if (!perf.memory || typeof perf.memory.usedJSHeapSize !== 'number') {
    return null;
  }

  return {
    usedMb: Number((perf.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1)),
    totalMb: Number((perf.memory.totalJSHeapSize / (1024 * 1024)).toFixed(1)),
  };
}
