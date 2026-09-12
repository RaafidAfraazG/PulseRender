'use client';

/**
 * PulseRender — Dashboard Header Component
 *
 * Renders top brand navigation bar, phase status, and Performance Monitor toggle button.
 */

import { useDashboard } from '@/components/providers/DashboardProvider';
import styles from './DashboardHeader.module.css';

interface DashboardHeaderProps {
  readonly title: string;
  readonly subtitle: string;
  readonly currentPhase?: number;
}

export function DashboardHeader({
  title,
  subtitle,
  currentPhase = 4,
}: DashboardHeaderProps): React.JSX.Element {
  const { ui, togglePerformanceMonitor } = useDashboard();

  const buttonStyle: React.CSSProperties = {
    background: ui.showPerformanceMonitor ? 'var(--accent-primary)' : 'var(--surface-ground)',
    border: '1px solid var(--border-subtle)',
    color: '#ffffff',
    padding: '4px 12px',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 150ms ease',
  };

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
          style={buttonStyle}
        >
          <span>⚡ Performance</span>
        </button>

        <span className={styles.phaseBadge} title={`Currently in Phase ${currentPhase}`}>
          Phase {currentPhase}
        </span>
        <span className={styles.statusDot} aria-label="System status: live" />
        <span className={styles.statusLabel}>Performance Engine</span>
      </div>
    </header>
  );
}
