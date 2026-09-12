/**
 * PulseRender - DataStore
 *
 * A plain TypeScript class (NO React dependency) that manages the client-side
 * ring buffer of incoming DataPoints.
 *
 * ── Architecture ─────────────────────────────────────────────────────────
 *
 * • One DataStore instance per dashboard session (created inside
 *   DataStreamProvider, provided via React Context as a stable ref).
 *
 * • Per-category ring buffers. Each category holds at most
 *   floor(maxTotalSize / categoryCount) points. When the buffer is full,
 *   the oldest entries are evicted with a single splice.
 *
 * • Chart renderers call getSnapshot(category) inside their rAF callbacks.
 *   This is the only read path - no React state involved.
 *
 * • subscribe() / notify pattern lets the DataStreamProvider update a
 *   throttled React state (data count) without coupling to React.
 *
 * ── Thread Safety ────────────────────────────────────────────────────────
 *
 * The browser is single-threaded (no Web Workers yet). All mutations happen
 * on the main thread in response to SSE events. rAF callbacks only read.
 * No locks needed in Phase 2.
 */

import type { DataPoint } from '@/lib/types';
import { monitor } from '@/lib/performance/monitor';

export class DataStore {
  private readonly buffers = new Map<string, DataPoint[]>();
  private readonly maxPerCategory: number;
  private totalStoredCount = 0;
  private totalReceivedCount = 0;
  private version = 0;
  private isStressTesting = false;
  private readonly subscribers = new Set<() => void>();

  constructor(maxTotalSize: number, categoryCount: number) {
    // Guard against divide-by-zero
    this.maxPerCategory = Math.max(100, Math.floor(maxTotalSize / Math.max(1, categoryCount)));
  }

  // ── Write ───────────────────────────────────────────────────────────────

  push(points: readonly DataPoint[]): void {
    if (points.length === 0 || this.isStressTesting) return;
    this.version++;
    for (const point of points) {
      let buf = this.buffers.get(point.category);
      if (!buf) {
        buf = [];
        this.buffers.set(point.category, buf);
      }

      buf.push(point);

      // Evict oldest when over capacity to maintain strict ring buffer ceiling
      if (buf.length > this.maxPerCategory) {
        const evict = buf.length - this.maxPerCategory;
        buf.splice(0, evict);
      }
    }

    this.totalReceivedCount += points.length;
    monitor.setStoredPointCount(this.getStoredCount());
    this.notifySubscribers();
  }

  /**
   * Populates the store with a fixed target count of synthetic points for stress testing.
   */
  loadStressTest(targetCount: number): void {
    this.isStressTesting = true;
    this.buffers.clear();
    this.totalStoredCount = 0;
    this.version++;

    const categories = ['primary', 'secondary', 'tertiary', 'quaternary'];
    const pointsPerCategory = Math.floor(targetCount / categories.length);
    const now = Date.now();
    const spanMs = 300_000; // 5 minutes span

    for (const cat of categories) {
      const buf: DataPoint[] = [];
      for (let i = 0; i < pointsPerCategory; i++) {
        const ts = now - spanMs + (i / pointsPerCategory) * spanMs;
        const val = 30 + Math.sin(i / 10) * 30 + Math.random() * 15;
        buf.push({
          id: `stress-${cat}-${i}`,
          timestamp: ts,
          value: Math.max(0, Math.min(100, val)),
          category: cat,
        });
      }
      this.buffers.set(cat, buf);
    }

    this.totalStoredCount = targetCount;
    monitor.setStoredPointCount(targetCount);
    this.notifySubscribers();
  }

  /** Clears stress test dataset. */
  clearStressTest(): void {
    this.isStressTesting = false;
    this.buffers.clear();
    this.totalStoredCount = 0;
    this.version++;
    monitor.setStoredPointCount(0);
    this.notifySubscribers();
  }

  /** Monotonically increasing version tag for cache invalidation. */
  getVersion(): number {
    return this.version;
  }

  // ── Read ────────────────────────────────────────────────────────────────

  /** Returns the current buffer for a specific category. O(1). */
  getSnapshot(category: string): readonly DataPoint[] {
    return this.buffers.get(category) ?? EMPTY;
  }

  /**
   * Returns all points from all categories combined.
   * Creates a new array - use sparingly (scatter/heatmap only).
   */
  getAllSnapshot(): readonly DataPoint[] {
    if (this.buffers.size === 0) return EMPTY;
    const all: DataPoint[] = [];
    for (const buf of this.buffers.values()) {
      for (const pt of buf) all.push(pt);
    }
    return all;
  }

  /** Count of points currently stored across all categories. */
  getStoredCount(): number {
    // Recount from buffers (totalStoredCount can drift if eviction logic changes)
    let n = 0;
    for (const buf of this.buffers.values()) n += buf.length;
    return n;
  }

  /** Total cumulative points received since stream start. */
  getTotalReceived(): number {
    return this.totalReceivedCount;
  }

  getCategories(): readonly string[] {
    return Array.from(this.buffers.keys());
  }

  // ── Subscriptions ────────────────────────────────────────────────────────

  /**
   * Register a callback invoked after each push().
   * @returns A cleanup function that removes the subscription.
   */
  subscribe(fn: () => void): () => void {
    this.subscribers.add(fn);
    return () => { this.subscribers.delete(fn); };
  }

  private notifySubscribers(): void {
    for (const fn of this.subscribers) fn();
  }
}

// Shared empty array sentinel - avoids allocations for empty reads
const EMPTY: readonly DataPoint[] = Object.freeze([]);
