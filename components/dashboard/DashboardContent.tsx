'use client';

/**
 * PulseRender - Dashboard Main Content Layout
 *
 * Enterprise data visualization dashboard layout composing analytical controls,
 * stress test triggers, real-time Canvas charts, virtualized data grid, and performance monitor.
 */

import { DashboardHeader } from '@/components/ui/DashboardHeader';
import { DashboardControls } from '@/components/controls/DashboardControls';
import { StressTestControls } from '@/components/controls/StressTestControls';
import { ChartGrid } from '@/components/dashboard/ChartGrid';
import { DataTable } from '@/components/table/DataTable';
import { PerformanceMonitor } from '@/components/ui/PerformanceMonitor';
import { useDashboard } from '@/components/providers/DashboardProvider';
import type { DashboardConfig } from '@/lib/types';
import styles from '@/app/dashboard/page.module.css';

interface DashboardContentProps {
  readonly config: DashboardConfig;
}

export function DashboardContent({ config }: DashboardContentProps): React.JSX.Element {
  const { ui, togglePerformanceMonitor } = useDashboard();

  return (
    <div className={styles.page}>
      {/* ── Application Header ────────────────────────────────────────────── */}
      <DashboardHeader
        title={config.title}
        subtitle={config.subtitle}
      />

      {/* ── Main Dashboard Workspace ──────────────────────────────────────── */}
      <main className={styles.main} id="main-content">

        {/* ── Dashboard Controls ──────────────────────────────────────────── */}
        <DashboardControls />

        {/* ── Stress Test Workloads & Live Status ──────────────────────────── */}
        <StressTestControls />

        {/* ── Visualization Charts Grid ───────────────────────────────────── */}
        <ChartGrid charts={config.charts} />

        {/* ── Virtualized Data Grid Table ────────────────────────────────── */}
        <DataTable />

      </main>

      {/* ── Performance Monitor Overlay Panel ─────────────────────────────── */}
      {ui.showPerformanceMonitor && (
        <PerformanceMonitor onClose={togglePerformanceMonitor} />
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <span>PulseRender Data Platform</span>
        <span className={styles.footerSep} aria-hidden="true">·</span>
        <span>Next.js · React · Canvas API</span>
        <span className={styles.footerSep} aria-hidden="true">·</span>
        <a href="/api/data" target="_blank" rel="noreferrer" className={styles.footerLink}>
          Live SSE Feed ↗
        </a>
      </footer>
    </div>
  );
}
