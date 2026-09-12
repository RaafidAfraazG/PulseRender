'use client';

/**
 * PulseRender — Dashboard Main Content Layout
 *
 * Client Component inside DashboardProvider & DataStreamProvider.
 * Composes analytical controls, stress testing, live charts, virtualized data table,
 * and performance monitor overlay.
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
      {/* ── Header ──────────────────────────────────────────────── */}
      <DashboardHeader
        title={config.title}
        subtitle={config.subtitle}
        currentPhase={5}
      />

      {/* ── Main content ────────────────────────────────────────── */}
      <main className={styles.main} id="main-content">

        {/* ── Phase banner ────────────────────────────────────── */}
        <section className={styles.phaseBanner} aria-label="Phase status">
          <div className={styles.phaseBannerInner}>
            <div className={styles.phaseBannerIcon} aria-hidden="true">📋</div>
            <div className={styles.phaseBannerText}>
              <strong>Phase 5 — Virtualized Data Table &amp; Dashboard Completeness</strong>
              <span>
                Full interactive dashboard active. Custom virtual scrolling table browsing up to 100,000 rows with
                bounded DOM footprint (~30–50 mounted rows).
              </span>
            </div>
            <StreamStatus />
            <div className={styles.phaseBannerStats}>
              <Stat label="Target FPS"    value="60"     />
              <Stat label="Data Table"    value="Virtual"/>
              <Stat label="DOM Footprint" value="Bounded"/>
              <Stat label="Interactions"  value="Complete"/>
            </div>
          </div>
        </section>

        {/* ── Analytical Controls (Phase 3) ────────────────────── */}
        <DashboardControls />

        {/* ── Stress Test Controls (Phase 4) ──────────────────── */}
        <StressTestControls />

        {/* ── Live Chart Grid (Phase 2+3+4) ───────────────────── */}
        <ChartGrid charts={config.charts} />

        {/* ── Virtualized Data Table (Phase 5) ────────────────── */}
        <DataTable />

      </main>

      {/* ── Performance Monitor Overlay (Phase 4) ──────────────── */}
      {ui.showPerformanceMonitor && (
        <PerformanceMonitor onClose={togglePerformanceMonitor} />
      )}

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <span>PulseRender — Phase 5 Dashboard Completeness</span>
        <span className={styles.footerSep} aria-hidden="true">·</span>
        <span>Next.js {process.env.npm_package_dependencies_next ?? '16'} · React · Canvas API</span>
        <span className={styles.footerSep} aria-hidden="true">·</span>
        <a href="/api/data" target="_blank" rel="noreferrer" className={styles.footerLink}>
          Live SSE Stream ↗
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
