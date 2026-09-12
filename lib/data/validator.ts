/**
 * PulseRender — SSE Payload Validator
 *
 * Runtime validation at the network boundary.
 * TypeScript types do not protect us from malformed network input.
 *
 * Lightweight by design — no schema library dependency.
 * Called for every incoming SSE datapoints event.
 */

import type { DataPoint } from '@/lib/types';

// ── Type guards ───────────────────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isValidDataPoint(v: unknown): v is DataPoint {
  if (!isObject(v)) return false;
  return (
    typeof v.id        === 'string'  &&
    typeof v.timestamp === 'number'  &&
    typeof v.value     === 'number'  &&
    typeof v.category  === 'string'  &&
    Number.isFinite(v.value)         &&
    Number.isFinite(v.timestamp)     &&
    v.timestamp > 0
  );
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Parse and validate a raw SSE event data string.
 *
 * Expected JSON shape:
 *   { points: DataPoint[], ts: number }
 *
 * @returns An array of valid DataPoints, or null if the payload is unusable.
 *          Individual invalid points are silently skipped.
 */
export function parseSSEPayload(raw: string): DataPoint[] | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isObject(parsed)) return null;
  if (!Array.isArray(parsed.points)) return null;

  const points: DataPoint[] = [];

  for (const item of parsed.points as unknown[]) {
    if (isValidDataPoint(item)) {
      points.push(item);
    }
    // Silently skip invalid items — malformed data must not crash the app
  }

  return points.length > 0 ? points : null;
}
