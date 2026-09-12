/**
 * PulseRender - SSE Data Route
 *
 * Converts the Phase 1 placeholder into a proper Server-Sent Events stream.
 *
 * ── SSE Protocol ─────────────────────────────────────────────────────────
 *
 *   event: datapoints
 *   data: {"points":[...DataPoint[]],"ts":1234567890}
 *
 *   event: ping
 *   data: {"ts":1234567890}
 *
 * The browser connects using the native EventSource API.
 * `datapoints` events are emitted every 100 ms.
 * `ping` events are emitted every 30 s to keep the connection alive through
 * proxies that might close idle SSE streams.
 *
 * ── Cleanup ──────────────────────────────────────────────────────────────
 *
 * The ReadableStream cancel() callback fires when the client disconnects
 * (tab close, navigation, component unmount). All intervals are cleared there.
 *
 * ── Phase Note ───────────────────────────────────────────────────────────
 *
 * PHASE 2: Simulated data from lib/data/generator.ts
 * PHASE 6: Replace with a real backend or persisted time-series store.
 */

import { generateBatch } from '@/lib/data/generator';
import { DEFAULT_DASHBOARD_CONFIG } from '@/lib/config/dashboard';

const { pointsPerTick, tickIntervalMs, categoryCount } = DEFAULT_DASHBOARD_CONFIG.stream;
const POINTS_PER_CATEGORY = Math.floor(pointsPerTick / categoryCount);

const PING_INTERVAL_MS = 30_000;

const SSE_HEADERS: HeadersInit = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  'Connection': 'keep-alive',
  // Disable Nginx/Vercel proxy buffering so events reach the client immediately
  'X-Accel-Buffering': 'no',
};

function sseFrame(event: string, data: string): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${data}\n\n`);
}

export function GET(request: Request): Response {
  let dataInterval: ReturnType<typeof setInterval> | null = null;
  let pingInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller): void {
      // ── Data tick ───────────────────────────────────────────────────
      dataInterval = setInterval(() => {
        try {
          const points = generateBatch(POINTS_PER_CATEGORY, Date.now(), tickIntervalMs);
          const payload = JSON.stringify({ points, ts: Date.now() });
          controller.enqueue(sseFrame('datapoints', payload));
        } catch {
          // Generator errors must not crash the stream
        }
      }, tickIntervalMs);

      // ── Keep-alive ping ─────────────────────────────────────────────
      pingInterval = setInterval(() => {
        try {
          controller.enqueue(sseFrame('ping', `{"ts":${Date.now()}}`));
        } catch {
          // Client may have closed already
        }
      }, PING_INTERVAL_MS);

      // ── Client disconnect detection ──────────────────────────────────
      request.signal.addEventListener('abort', () => {
        if (dataInterval !== null) clearInterval(dataInterval);
        if (pingInterval !== null) clearInterval(pingInterval);
        try { controller.close(); } catch { /* already closed */ }
      });
    },

    cancel(): void {
      if (dataInterval !== null) clearInterval(dataInterval);
      if (pingInterval !== null) clearInterval(pingInterval);
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
