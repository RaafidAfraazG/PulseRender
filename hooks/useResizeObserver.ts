'use client';

/**
 * PulseRender - useResizeObserver
 *
 * Tracks the CSS pixel dimensions of a DOM element using the ResizeObserver API.
 * Returns { width: 0, height: 0 } until the element is mounted and has size.
 *
 * Used by chart components to receive their current container dimensions so
 * the Canvas and SVG layers can be sized correctly.
 *
 * Cleanup: the ResizeObserver is disconnected when the target element unmounts
 * or when the hook is torn down.
 */

import { useState, useEffect, useRef, type RefObject } from 'react';

export interface ElementSize {
  readonly width: number;
  readonly height: number;
}

const ZERO: ElementSize = { width: 0, height: 0 };

export function useResizeObserver(
  ref: RefObject<HTMLElement | null>,
): ElementSize {
  const [size, setSize] = useState<ElementSize>(ZERO);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const target = ref.current;
    if (!target) return;

    // Disconnect any previous observer
    observerRef.current?.disconnect();

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      // Floor to integers - sub-pixel dimensions cause canvas thrashing
      setSize({ width: Math.floor(width), height: Math.floor(height) });
    });

    observer.observe(target);
    observerRef.current = observer;

    // Immediately read current size (ResizeObserver fires async, first call
    // may arrive after the initial rAF already ran)
    const { width, height } = target.getBoundingClientRect();
    if (width > 0 && height > 0) {
      setSize({ width: Math.floor(width), height: Math.floor(height) });
    }

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [ref]);

  return size;
}
