'use client';

/**
 * PulseRender - Dashboard Header Component
 *
 * Compact professional application header displaying title, subtitle, performance monitor toggle,
 * and live system status indicator.
 */

import { useDashboard } from '@/components/providers/DashboardProvider';
import styles from './DashboardHeader.module.css';

interface DashboardHeaderProps {
  readonly title: string;
  readonly subtitle: string;
}

export function DashboardHeader({
  title,
  subtitle,
}: DashboardHeaderProps): React.JSX.Element {
  const { ui, togglePerformanceMonitor } = useDashboard();

  return (
    <header className={styles.header} role="banner">
      <div className={styles.brand}>
        <div className={styles.logoMark} aria-hidden="true">
          <span className={styles.logoPulse} />
        </div>
        <div className={styles.brandText}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>

      <div className={styles.meta}>
        <button
          type="button"
          onClick={togglePerformanceMonitor}
          className={`${styles.perfBtn} ${ui.showPerformanceMonitor ? styles.perfBtnActive : ''}`}
        >
          <span>⚡ Performance</span>
        </button>

        <div className={styles.liveIndicator}>
          <span className={styles.statusDot} aria-label="System status: live" />
          <span className={styles.statusLabel}>Live</span>
        </div>
      </div>
    </header>
  );
}

