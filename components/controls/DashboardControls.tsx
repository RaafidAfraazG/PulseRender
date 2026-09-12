'use client';

/**
 * PulseRender - Dashboard Controls Component
 *
 * Exposes time range selection, time-bucket aggregation mode, category filtering,
 * and view reset controls to the user.
 *
 * Changes to these controls update DashboardProvider state and trigger derived data
 * invalidation. Incoming streaming data ticks do NOT trigger React tree re-renders.
 */

import type { TimeRangePreset, AggregationMode } from '@/lib/types';
import { useDashboard } from '@/components/providers/DashboardProvider';
import styles from './DashboardControls.module.css';

const TIME_RANGE_OPTIONS: readonly { id: TimeRangePreset; label: string }[] = [
  { id: '1m', label: '1m' },
  { id: '5m', label: '5m' },
  { id: '15m', label: '15m' },
  { id: '1h', label: '1h' },
  { id: 'all', label: 'All' },
];

const AGGREGATION_OPTIONS: readonly { id: AggregationMode; label: string }[] = [
  { id: 'raw', label: 'Raw' },
  { id: '1m', label: '1m' },
  { id: '5m', label: '5m' },
  { id: '1h', label: '1h' },
];

const CATEGORY_META: readonly { id: string; label: string; color: string }[] = [
  { id: 'primary', label: 'Alpha', color: '#6366f1' },
  { id: 'secondary', label: 'Beta', color: '#22d3ee' },
  { id: 'tertiary', label: 'Gamma', color: '#a78bfa' },
  { id: 'quaternary', label: 'Delta', color: '#34d399' },
];

export function DashboardControls(): React.JSX.Element {
  const {
    ui,
    activeCategories,
    aggregationMode,
    customDomain,
    setTimeRange,
    setAggregationMode,
    toggleCategory,
    resetView,
  } = useDashboard();

  return (
    <section className={styles.controlsContainer} aria-label="Dashboard analytical controls">
      {/* ── Time Range Selector ────────────────────────────────────── */}
      <div className={styles.group}>
        <span className={styles.label}>Time Range</span>
        <div className={styles.buttonGroup} role="radiogroup" aria-label="Time range">
          {TIME_RANGE_OPTIONS.map((opt) => {
            const isActive = ui.timeRange === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`${styles.btn} ${isActive ? styles.btnActive : ''}`}
                aria-checked={isActive}
                role="radio"
                onClick={() => setTimeRange(opt.id)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Aggregation Mode ───────────────────────────────────────── */}
      <div className={styles.group}>
        <span className={styles.label}>Aggregation</span>
        <div className={styles.buttonGroup} role="radiogroup" aria-label="Aggregation mode">
          {AGGREGATION_OPTIONS.map((opt) => {
            const isActive = aggregationMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={`${styles.btn} ${isActive ? styles.btnActive : ''}`}
                aria-checked={isActive}
                role="radio"
                onClick={() => setAggregationMode(opt.id)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Category Filters ───────────────────────────────────────── */}
      <div className={styles.group}>
        <span className={styles.label}>Categories</span>
        <div className={styles.categoryToggles} role="group" aria-label="Category filters">
          {CATEGORY_META.map((cat) => {
            const isActive = activeCategories.has(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                className={`${styles.categoryChip} ${isActive ? styles.categoryChipActive : ''}`}
                aria-pressed={isActive}
                onClick={() => toggleCategory(cat.id)}
              >
                <span
                  className={styles.colorDot}
                  style={{
                    backgroundColor: isActive ? cat.color : '#4b5563',
                    boxShadow: isActive ? `0 0 6px ${cat.color}` : 'none',
                  }}
                  aria-hidden="true"
                />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Reset View / Resume Live ──────────────────────────────── */}
      <button
        type="button"
        className={`${styles.resetBtn} ${customDomain ? styles.resetBtnActive : ''}`}
        onClick={resetView}
        title="Resume live streaming and reset viewport"
      >
        <span>{customDomain ? '▶' : '↺'}</span>
        <span>{customDomain ? 'Resume Live' : 'Reset View'}</span>
      </button>
    </section>
  );
}
