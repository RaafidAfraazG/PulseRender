'use client';

/**
 * PulseRender - Data Table Container Panel
 *
 * Wraps VirtualizedTable, connecting it to the DataStore & DerivedDataPipeline.
 * Displays dataset metrics, row count badges, and empty/loading states.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useDataStore } from '@/components/providers/DataStreamProvider';
import { useDashboard } from '@/components/providers/DashboardProvider';
import { DerivedDataPipeline } from '@/lib/data/processing/derived';
import { VirtualizedTable } from './VirtualizedTable';
import styles from './table.module.css';

export function DataTable(): React.JSX.Element {
  const store = useDataStore();
  const { ui, activeCategories, aggregationMode } = useDashboard();
  const pipeline = useMemo(() => new DerivedDataPipeline(), []);

  const [storeVersion, setStoreVersion] = useState(() => store.getVersion());
  const [mountedCount, setMountedCount] = useState(0);

  // Subscribe to DataStore pushes
  useEffect(() => {
    const unbind = store.subscribe(() => {
      setStoreVersion(store.getVersion());
    });
    return unbind;
  }, [store]);

  const derivedPoints = useMemo(() => {
    // Re-evaluates on storeVersion, timeRange, categories, aggregation
    return pipeline.getDerivedData(
      store,
      {
        timeRange: ui.timeRange,
        activeCategories,
        aggregation: aggregationMode,
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, pipeline, storeVersion, ui.timeRange, activeCategories, aggregationMode]);

  const handleRenderCountChange = useCallback((count: number) => {
    setMountedCount(count);
  }, []);

  const totalRows = derivedPoints.length;

  return (
    <section className={styles.tablePanel} aria-label="Virtualized data table panel">
      {/* ── Header ────────────────────────────────────────────────── */}
      <header className={styles.panelHeader}>
        <div className={styles.titleGroup}>
          <span className={styles.titleIcon} aria-hidden="true">📋</span>
          <span className={styles.titleText}>Virtualized Data Table</span>
        </div>

        <div className={styles.badgeGroup}>
          <span className={styles.countBadge}>
            <strong>{totalRows.toLocaleString()}</strong> rows ·{' '}
            <span className={styles.renderedBadge}>{mountedCount} mounted</span> (Virtual Scroll)
          </span>
        </div>
      </header>

      {/* ── Content / Viewport ────────────────────────────────────── */}
      {totalRows > 0 ? (
        <VirtualizedTable
          points={derivedPoints}
          onRenderCountChange={handleRenderCountChange}
        />
      ) : (
        <div className={styles.emptyState}>
          No data points match the current category filter or time range.
        </div>
      )}
    </section>
  );
}
