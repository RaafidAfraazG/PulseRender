'use client';

/**
 * PulseRender - Dashboard Main Content Layout
 *
 * Enterprise data visualization dashboard layout composing system summary, controls,
 * stress test triggers, real-time Canvas charts, virtualized data grid, and performance monitor.
 */

import { DashboardHeader } from '@/components/ui/DashboardHeader';
import { StreamStatus } from '@/components/ui/StreamStatus';
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

        {/* ── System Overview Bar ──────────────────────────────────────────── */}
        <section className={styles.summaryBar} aria-label="System overview">
          <div className={styles.summaryInner}>
            <div className={styles.summaryText}>
              <strong>Real-Time Analytics Engine</strong>
              <span>Continuously ingesting, processing, and rendering high-frequency metric streams at 60 FPS.</span>
            </div>
            <StreamStatus />
            <div className={styles.summaryStats}>
              <Stat label="Target Frame Rate" value="60 FPS" />
              <Stat label="Rendering Surface" value="Canvas 2D" />
              <Stat label="Table Engine" value="Virtualized" />
              <Stat label="Data Pipeline" value="Zero-Copy" />
            </div>
          </div>
        </section>

        {/* ── Dashboard Controls ──────────────────────────────────────────── */}
        <DashboardControls />

        {/* ── Stress Test Workloads ────────────────────────────────────────── */}
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

function Stat({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
