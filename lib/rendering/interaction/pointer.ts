/**
 * PulseRender — Reusable Pointer Event Handler
 *
 * Attaches pointer listeners (drag to pan, wheel to zoom) to a chart surface element.
 * Supports desktop mouse & touch events via unified PointerEvents API.
 */

import { monitor } from '@/lib/performance/monitor';

export interface InteractionCallbacks {
  readonly onZoom: (factor: number, focalRatio: number) => void;
  readonly onPan: (deltaPixelsX: number, chartWidth: number) => void;
}

/**
 * Attaches wheel and drag-pan interaction listeners to an element.
 * Returns a cleanup unbind function.
 */
export function attachChartInteractions(
  element: HTMLElement,
  callbacks: InteractionCallbacks,
): () => void {
  let isDragging = false;
  let startX = 0;

  const handlePointerDown = (e: PointerEvent) => {
    // Only primary button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    isDragging = true;
    startX = e.clientX;
    element.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging) return;
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const deltaX = e.clientX - startX;
    startX = e.clientX;
    const rect = element.getBoundingClientRect();
    if (rect.width > 0) {
      callbacks.onPan(deltaX, rect.width);
      const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
      monitor.recordInteractionLatency(end - start);
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!isDragging) return;
    isDragging = false;
    try {
      element.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if capture was already released
    }
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault(); // Prevent page scroll
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0) return;

    const focalRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    // Normalize wheel delta across browsers
    const zoomFactor = e.deltaY > 0 ? 1.15 : 0.85;
    callbacks.onZoom(zoomFactor, focalRatio);
    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    monitor.recordInteractionLatency(end - start);
  };

  element.addEventListener('pointerdown', handlePointerDown);
  element.addEventListener('pointermove', handlePointerMove);
  element.addEventListener('pointerup', handlePointerUp);
  element.addEventListener('pointercancel', handlePointerUp);
  element.addEventListener('wheel', handleWheel, { passive: false });

  return () => {
    element.removeEventListener('pointerdown', handlePointerDown);
    element.removeEventListener('pointermove', handlePointerMove);
    element.removeEventListener('pointerup', handlePointerUp);
    element.removeEventListener('pointercancel', handlePointerUp);
    element.removeEventListener('wheel', handleWheel);
  };
}
