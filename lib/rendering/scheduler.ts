/**
 * PulseRender — Shared requestAnimationFrame Scheduler
 *
 * ONE rAF loop drives ALL chart renderers in the application.
 *
 * ── Why a shared scheduler? ──────────────────────────────────────────────
 *
 * N charts × 1 rAF loop each = N competing loops, each calling
 * requestAnimationFrame independently. This can cause multiple callbacks
 * per vsync frame, wasted budget, and inconsistent rendering.
 *
 * A single shared loop calls every renderer exactly once per vsync frame,
 * in a deterministic order.
 *
 * ── Lifecycle ────────────────────────────────────────────────────────────
 *
 *   registerRenderer(id, cb)
 *     → adds callback to the Map
 *     → starts the rAF loop if it wasn't running
 *     → returns a cleanup function
 *
 *   cleanup()
 *     → removes callback from the Map
 *     → stops the loop if the Map is now empty
 *
 * ── Error isolation ───────────────────────────────────────────────────────
 *
 * Errors in individual renderer callbacks are caught and logged so that one
 * failing chart never kills the loop for all other charts.
 *
 * ── Browser-only ─────────────────────────────────────────────────────────
 *
 * This module uses requestAnimationFrame — it must never be imported by
 * server-side code. All importers are 'use client' chart components.
 */

import type { RenderCallback } from './types';
import { monitor } from '@/lib/performance/monitor';

// ── Module-level state ────────────────────────────────────────────────────

const callbacks = new Map<string, RenderCallback>();
let rafId: number | null = null;

// ── Internal tick ─────────────────────────────────────────────────────────

function tick(timestamp: number): void {
  if (callbacks.size === 0) {
    rafId = null;
    return;
  }

  monitor.recordFrame(timestamp);
  const start = typeof performance !== 'undefined' ? performance.now() : timestamp;

  for (const [id, cb] of callbacks) {
    try {
      cb(timestamp);
    } catch (err) {
      console.error(`[RenderScheduler] Renderer "${id}" threw:`, err);
    }
  }

  const end = typeof performance !== 'undefined' ? performance.now() : timestamp;
  monitor.recordRenderTime(end - start);

  rafId = requestAnimationFrame(tick);
}

function startIfNeeded(): void {
  if (rafId === null && callbacks.size > 0) {
    rafId = requestAnimationFrame(tick);
  }
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Register a render callback with the shared scheduler.
 *
 * @param id  Stable identifier (e.g. chart config id). If the same id is
 *            registered twice, the second call replaces the first.
 * @param cb  Callback invoked once per animation frame with the rAF timestamp.
 * @returns   A cleanup function. Call it in useEffect's return to unregister.
 */
export function registerRenderer(id: string, cb: RenderCallback): () => void {
  callbacks.set(id, cb);
  startIfNeeded();

  return () => {
    callbacks.delete(id);
    if (callbacks.size === 0 && rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}

/**
 * Exposed for diagnostics / testing only.
 * Do not use in production rendering paths.
 */
export function getSchedulerDiagnostics(): {
  activeRenderers: number;
  rendererIds: string[];
  isRunning: boolean;
} {
  return {
    activeRenderers: callbacks.size,
    rendererIds: Array.from(callbacks.keys()),
    isRunning: rafId !== null,
  };
}
