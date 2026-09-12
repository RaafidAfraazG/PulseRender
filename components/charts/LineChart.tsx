'use client';

/**
 * PulseRender - LineChart Component
 *
 * Renders a continuous time-series line using Canvas, driven by the shared rAF scheduler.
 * Consumes derived filtered/aggregated data from the DerivedDataPipeline and supports
 * interactive zoom & pan.
 */

import { useEffect, useRef, useMemo } from 'react';

import type { LineChartConfig } from '@/lib/types';
import { useDataStore } from '@/components/providers/DataStreamProvider';
import { useDashboard } from '@/components/providers/DashboardProvider';
import { useResizeObserver } from '@/hooks/useResizeObserver';
import { registerRenderer } from '@/lib/rendering/scheduler';
import { setupCanvas, clearCanvas } from '@/lib/rendering/canvas';
import { computeChartArea, computeDataBounds } from '@/lib/rendering/coordinates';
import { renderLineChart, DEFAULT_LINE_CONFIG } from '@/lib/rendering/charts/line';
import { renderAxes, DEFAULT_AXIS_OPTIONS } from '@/lib/rendering/svg/axes';
import { DEFAULT_PADDING, type ChartDimensions } from '@/lib/rendering/types';
import { DerivedDataPipeline } from '@/lib/data/processing/derived';
import { attachChartInteractions } from '@/lib/rendering/interaction/pointer';
import { computeEffectiveDomain, zoomDomain, panDomain } from '@/lib/rendering/interaction/domain';

import styles from './chart.module.css';

interface LineChartProps {
  readonly config: LineChartConfig;
}

export function LineChart({ config }: LineChartProps): React.JSX.Element {
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
    const svg = svgRef.current;
    if (!canvas || !svg || dims.width <= 1 || dims.height <= 1) return;

    const ctx = setupCanvas(canvas, dims.width, dims.height, dims.dpr);
    if (!ctx) return;

    const renderConfig = {
      ...DEFAULT_LINE_CONFIG,
      color: config.color,
      strokeWidth: config.strokeWidth ?? DEFAULT_LINE_CONFIG.strokeWidth,
      showDots: config.showDots ?? DEFAULT_LINE_CONFIG.showDots,
      overrideDomain: customDomain,
    };

    let axisFrame = 0;

    const unregister = registerRenderer(config.id, () => {
      // Process derived pipeline
      const allDerived = pipeline.getDerivedData(store, {
        timeRange: ui.timeRange,
        activeCategories,
        aggregation: aggregationMode,
      });

      // Narrow to chart category if matching
      const points = allDerived.filter((pt) => pt.category === config.dataKey);

      // Canvas render
      clearCanvas(ctx, dims);
      renderLineChart(ctx, points, dims, renderConfig);

      // SVG axes render
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
        {customDomain ? (
          <button
            type="button"
            className={styles.resumeBtn}
            onClick={() => setCustomDomain(null)}
            title="Resume live streaming and reset viewport"
          >
            <span>▶ Resume Live</span>
          </button>
        ) : (
          <span className={styles.badge}>
            <span className={styles.liveDot} aria-hidden="true" />
            LIVE
          </span>
        )}
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
