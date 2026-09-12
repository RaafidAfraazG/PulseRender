'use client';

/**
 * PulseRender - Lightweight Table Row Component
 *
 * Renders a single 36px table row for a ProcessedPoint.
 * Kept lightweight to minimize mounting overhead during virtual scrolling.
 */

import React from 'react';
import type { ProcessedPoint } from '@/lib/data/processing/derived';
import styles from './table.module.css';

const CATEGORY_COLORS: Record<string, string> = {
  primary: '#6366f1',
  secondary: '#22d3ee',
  tertiary: '#a78bfa',
  quaternary: '#34d399',
};

const CATEGORY_LABELS: Record<string, string> = {
  primary: 'Alpha',
  secondary: 'Beta',
  tertiary: 'Gamma',
  quaternary: 'Delta',
};

interface TableRowProps {
  readonly point: ProcessedPoint;
}

export function TableRow({ point }: TableRowProps): React.JSX.Element {
  const color = CATEGORY_COLORS[point.category] ?? '#9ca3af';
  const label = CATEGORY_LABELS[point.category] ?? point.category;

  const date = new Date(point.timestamp);
  const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date
      .getMilliseconds()
      .toString()
      .padStart(3, '0')}`;

  const isAggregated = 'count' in point;
  const valStr = point.value.toFixed(2);

  return (
    <tr className={styles.tr}>
      <td className={styles.td}>{timeStr}</td>
      <td className={styles.td}>
        <span
          className={styles.categoryDot}
          style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
          aria-hidden="true"
        />
        <span>{label}</span>
      </td>
      <td className={styles.td} style={{ color: '#0f172a', fontWeight: 600 }}>
        {valStr}
      </td>
      <td className={styles.td} style={{ color: 'var(--text-tertiary)' }}>
        {isAggregated ? `Avg (${(point as { count: number }).count} pts)` : point.id}
      </td>
    </tr>
  );
}
