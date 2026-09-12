'use client';

/**
 * PulseRender - Custom Lightweight Virtualized Table Engine
 *
 * Virtualizes long data lists up to 100,000 rows.
 * Computes visible index range based on scrollTop, mounting only ~30–50 DOM rows
 * with top/bottom height spacers to preserve exact scrollbar geometry.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ProcessedPoint } from '@/lib/data/processing/derived';
import { TableRow } from './TableRow';
import styles from './table.module.css';

const ROW_HEIGHT = 36;
const OVERSCAN = 15;
const VIEWPORT_HEIGHT = 380;

interface VirtualizedTableProps {
  readonly points: readonly ProcessedPoint[];
  readonly onRenderCountChange?: (count: number) => void;
}

export function VirtualizedTable({
  points,
  onRenderCountChange,
}: VirtualizedTableProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  const totalCount = points.length;

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    totalCount,
    Math.ceil((scrollTop + VIEWPORT_HEIGHT) / ROW_HEIGHT) + OVERSCAN,
  );

  const visibleSlice = points.slice(startIndex, endIndex);
  const topSpacerHeight = startIndex * ROW_HEIGHT;
  const bottomSpacerHeight = Math.max(0, (totalCount - endIndex) * ROW_HEIGHT);

  useEffect(() => {
    onRenderCountChange?.(visibleSlice.length);
  }, [visibleSlice.length, onRenderCountChange]);

  return (
    <div
      ref={containerRef}
      className={styles.scrollViewport}
      role="region"
      aria-label="Virtualized data table viewport"
      tabIndex={0}
    >
      <table className={styles.tableElement} role="table">
        <thead className={styles.tableHeaderRow}>
          <tr>
            <th className={styles.th} style={{ width: '25%' }} scope="col">Timestamp</th>
            <th className={styles.th} style={{ width: '22%' }} scope="col">Category</th>
            <th className={styles.th} style={{ width: '23%' }} scope="col">Value</th>
            <th className={styles.th} style={{ width: '30%' }} scope="col">Metadata / ID</th>
          </tr>
        </thead>
        <tbody>
          {/* Top Virtual Spacer */}
          {topSpacerHeight > 0 && (
            <tr style={{ height: `${topSpacerHeight}px` }} aria-hidden="true">
              <td colSpan={4} style={{ padding: 0, border: 'none' }} />
            </tr>
          )}

          {/* Visible Virtual Window */}
          {visibleSlice.map((pt, idx) => (
            <TableRow key={pt.id || `pt-${startIndex + idx}`} point={pt} />
          ))}

          {/* Bottom Virtual Spacer */}
          {bottomSpacerHeight > 0 && (
            <tr style={{ height: `${bottomSpacerHeight}px` }} aria-hidden="true">
              <td colSpan={4} style={{ padding: 0, border: 'none' }} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
