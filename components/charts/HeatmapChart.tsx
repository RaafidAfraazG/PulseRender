'use client';

/**
 * PulseRender - HeatmapChart Component
 *
 * Renders category × time-bucket 2D grid heatmap using Canvas, driven by shared rAF.
 * Consumes derived filtered/aggregated data across active categories.
 */

import { useEffect, useRef, useMemo } from 'react';

import type { HeatmapChartConfig } from '@/lib/types';
import { useDataStore } from '@/components/providers/DataStreamProvider';
import { useDashboard } from '@/components/providers/DashboardProvider';
import { useResizeObserver } from '@/hooks/useResizeObserver';
import { registerRenderer } from '@/lib/rendering/scheduler';
import { setupCanvas, clearCanvas } from '@/lib/rendering/canvas';
import { computeChartArea, computeDataBounds } from '@/lib/rendering/coordinates';
import { renderHeatmap, DEFAULT_HEATMAP_CONFIG } from '@/lib/rendering/charts/heatmap';
import { renderAxes, DEFAULT_AXIS_OPTIONS } from '@/lib/rendering/svg/axes';
import { DEFAULT_PADDING, type ChartDimensions } from '@/lib/rendering/types';
import { DerivedDataPipeline } from '@/lib/data/processing/derived';
import { attachChartInteractions } from '@/lib/rendering/interaction/pointer';
import { computeEffectiveDomain, zoomDomain, panDomain } from '@/lib/rendering/interaction/domain';

import styles from './chart.module.css';

interface HeatmapChartProps {
  readonly config: HeatmapChartConfig;
}

export function HeatmapChart({ config }: HeatmapChartProps): React.JSX.Element {
  const store = useDataStore();
  const { ui, activeCategories, aggregationMode, customDomain, setCustomDomain } = useDashboard();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
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
          const current = computeEffectiveDomain(store.getAllSnapshot(), prevDomain);
          return zoomDomain(current, factor, focalRatio);
        });
      },
      onPan: (deltaPxX, width) => {
        setCustomDomain((prevDomain) => {
          const current = computeEffectiveDomain(store.getAllSnapshot(), prevDomain);
          const domainSpan = current.xMax - current.xMin;
          const deltaMs = -(deltaPxX / width) * domainSpan;
          return panDomain(current, deltaMs);
        });
      },
    });

    return unbind;
  }, [setCustomDomain, store]);

  // rAF Render registration
  useEffect(() => {
    const canvas = canvasRef.current;
    const svg = svgRef.current;
    if (!canvas || !svg || dims.width <= 1 || dims.height <= 1) return;

    const ctx = setupCanvas(canvas, dims.width, dims.height, dims.dpr);
    if (!ctx) return;

    const renderConfig = {
      ...DEFAULT_HEATMAP_CONFIG,
      columns: config.columns ?? DEFAULT_HEATMAP_CONFIG.columns,
      categories: Array.from(activeCategories),
    };

    let axisFrame = 0;

    const unregister = registerRenderer(config.id, () => {
      const points = pipeline.getDerivedData(store, {
        timeRange: ui.timeRange,
        activeCategories,
        aggregation: aggregationMode,
      });

      clearCanvas(ctx, dims);
      renderHeatmap(ctx, points, dims, renderConfig);

      if (axisFrame % 12 === 0) {
        const bounds = computeDataBounds(points, {
          fixedYMin: 0,
          fixedYMax: 100,
          overrideDomain: customDomain,
        });
        const area = computeChartArea(dims);
        renderAxes(svg, bounds, dims, area, DEFAULT_AXIS_OPTIONS);
      }
      axisFrame++;
    });

    return unregister;
  }, [config, dims, store, pipeline, ui.timeRange, activeCategories, aggregationMode, customDomain]);

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
        <svg
          ref={svgRef}
          className={styles.svg}
          aria-hidden="true"
        />
        {size.width === 0 && (
          <div className={styles.empty}>Initializing…</div>
        )}
      </div>
    </article>
  );
}
