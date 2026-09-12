'use client';

/**
 * PulseRender — ChartGrid Component
 *
 * Client Component that maps chart configurations to their respective
 * high-performance Canvas chart components.
 */

import type { ChartConfig } from '@/lib/types';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { ScatterPlot } from '@/components/charts/ScatterPlot';
import { HeatmapChart } from '@/components/charts/HeatmapChart';
import styles from '@/app/dashboard/page.module.css';

interface ChartGridProps {
  readonly charts: readonly ChartConfig[];
}

export function ChartGrid({ charts }: ChartGridProps): React.JSX.Element {
  return (
    <div className={styles.chartGrid}>
      {charts.map((chart) => {
        if (!chart.visible) return null;

        switch (chart.type) {
          case 'line':
            return <LineChart key={chart.id} config={chart} />;
          case 'bar':
            return <BarChart key={chart.id} config={chart} />;
          case 'scatter':
            return <ScatterPlot key={chart.id} config={chart} />;
          case 'heatmap':
            return <HeatmapChart key={chart.id} config={chart} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
