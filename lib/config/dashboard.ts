/**
 * PulseRender - Default Dashboard Configuration
 *
 * This module exports the server-side default configuration for the dashboard.
 * It is consumed by Server Components and passed as serialisable props to
 * Client Components.
 *
 * PHASE 1: Static configuration only. No runtime data generation.
 * PHASE 2+: The `stream` config will be read by the data stream engine.
 */

import type { DashboardConfig } from '@/lib/types';

/**
 * Default dashboard configuration.
 * Safe to import in Server Components - no browser APIs used here.
 */
export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  title: 'PulseRender',
  subtitle: 'High-Performance Real-Time Data Visualization',

  charts: [
    {
      id: 'chart-line-primary',
      type: 'line',
      label: 'Time Series - Line',
      dataKey: 'primary',
      visible: true,
      color: '#4f46e5',
      strokeWidth: 2,
      showDots: false,
    },
    {
      id: 'chart-bar-primary',
      type: 'bar',
      label: 'Distribution - Bar',
      dataKey: 'primary',
      visible: true,
      color: '#0284c7',
      barGap: 2,
    },
    {
      id: 'chart-scatter-primary',
      type: 'scatter',
      label: 'Correlation - Scatter',
      dataKey: 'secondary',
      visible: true,
      color: '#7c3aed',
      pointRadius: 3,
    },
    {
      id: 'chart-heatmap-primary',
      type: 'heatmap',
      label: 'Density - Heatmap',
      dataKey: 'primary',
      visible: true,
      color: '#059669',
      columns: 60,
    },
  ],

  stream: {
    pointsPerTick: 100,        // 100 points × 100 ticks/second → 10k+/s
    tickIntervalMs: 100,       // 10 Hz update rate
    maxBufferSize: 10_240,     // ring buffer ceiling (capped at 10K target for 60 FPS)
    categoryCount: 4,          // number of distinct data series
  },

  defaultTimeRange: '1m',
};
