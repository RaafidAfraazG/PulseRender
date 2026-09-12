'use client';

/**
 * PulseRender - BarChart Component
 *
 * Renders vertical distribution bars using Canvas, driven by the shared rAF scheduler.
 * Consumes derived filtered/aggregated data from the DerivedDataPipeline.
 */

import { useEffect, useRef, useMemo } from 'react';

import type { BarChartConfig } from '@/lib/types';
import { useDataStore } from '@/components/providers/DataStreamProvider';
import { useDashboard } from '@/components/providers/DashboardProvider';
import { useResizeObserver } from '@/hooks/useResizeObserver';
import { registerRenderer } from '@/lib/rendering/scheduler';
import { setupCanvas, clearCanvas } from '@/lib/rendering/canvas';
import { renderBarChart, DEFAULT_BAR_CONFIG } from '@/lib/rendering/charts/bar';
import { DEFAULT_PADDING, type ChartDimensions } from '@/lib/rendering/types';
import { DerivedDataPipeline } from '@/lib/data/processing/derived';
import { attachChartInteractions } from '@/lib/rendering/interaction/pointer';
import { computeEffectiveDomain, zoomDomain, panDomain } from '@/lib/rendering/interaction/domain';

import styles from './chart.module.css';

interface BarChartProps {
  readonly config: BarChartConfig;
}

export function BarChart({ config }: BarChartProps): React.JSX.Element {
  const store = useDataStore();
  const { ui, activeCategories, aggregationMode, customDomain, setCustomDomain } = useDashboard();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = useResizeObserver(containerRef);

  const pipeline = useMemo(() => new DerivedDataPipeline(), []);

  const dims = useMemo<ChartDimensions>(() => ({
    width: Math.max(1, size.width),
    height: Math.max(1, size.height),
    dpr: typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1,
    padding: DEFAULT_PADDING,
  }), [size.width, size.height]);

  // Pointer interactions (zoom / pan)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const unbind = attachChartInteractions(container, {
      onZoom: (factor, focalRatio) => {
        setCustomDomain((prevDomain) => {
          const current = computeEffectiveDomain(store.getSnapshot(config.dataKey), prevDomain);
          return zoomDomain(current, factor, focalRatio);
        });
      },
      onPan: (deltaPxX, width) => {
        setCustomDomain((prevDomain) => {
          const current = computeEffectiveDomain(store.getSnapshot(config.dataKey), prevDomain);
          const domainSpan = current.xMax - current.xMin;
          const deltaMs = -(deltaPxX / width) * domainSpan;
          return panDomain(current, deltaMs);
        });
      },
    });

    return unbind;
  }, [config.dataKey, setCustomDomain, store]);

  // rAF Render registration
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dims.width <= 1 || dims.height <= 1) return;

    const ctx = setupCanvas(canvas, dims.width, dims.height, dims.dpr);
    if (!ctx) return;

    const renderConfig = {
      ...DEFAULT_BAR_CONFIG,
      color: config.color,
      barGap: config.barGap ?? DEFAULT_BAR_CONFIG.barGap,
    };

    const unregister = registerRenderer(config.id, () => {
      const allDerived = pipeline.getDerivedData(store, {
        timeRange: ui.timeRange,
        activeCategories,
        aggregation: aggregationMode,
      });

      const points = allDerived.filter((pt) => pt.category === config.dataKey);

      clearCanvas(ctx, dims);
      renderBarChart(ctx, points, dims, renderConfig);
    });

    return unregister;
  }, [config, dims, store, pipeline, ui.timeRange, activeCategories, aggregationMode]);

  return (
    <article className={styles.panel} aria-label={`${config.label} chart`}>
      <header className={styles.header}>
        <span className={styles.title}>{config.label}</span>
        <span className={styles.badge}>
          <span className={styles.liveDot} aria-hidden="true" />
          {customDomain ? 'PAUSED' : 'LIVE'}
        </span>
      </header>
      <div ref={containerRef} className={styles.surface} style={{ cursor: 'grab' }}>
        <canvas ref={canvasRef} className={styles.canvas} />
        {size.width === 0 && (
          <div className={styles.empty}>Initializing…</div>
        )}
      </div>
    </article>
  );
}
