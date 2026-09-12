'use client';

/**
 * PulseRender - Dashboard Header Component
 *
 * Professional application header featuring a custom vector pulse logo mark,
 * brand typography, performance monitor toggle, and live status indicator.
 */

import { useDashboard } from '@/components/providers/DashboardProvider';
import styles from './DashboardHeader.module.css';

interface DashboardHeaderProps {
  readonly title?: string;
  readonly subtitle?: string;
}

export function DashboardHeader({
  subtitle = 'High-Performance Real-Time Data Visualization',
}: DashboardHeaderProps): React.JSX.Element {
  const { ui, togglePerformanceMonitor } = useDashboard();

  return (
    <header className={styles.header} role="banner">
      <div className={styles.brand}>
        <div className={styles.logoContainer}>
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.logoSvg}
            aria-hidden="true"
          >
            <rect width="32" height="32" rx="8" fill="url(#pr_bg)" />
            <rect width="32" height="32" rx="8" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1" />
            <text
              x="16"
              y="21"
              textAnchor="middle"
              fontSize="14"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              letterSpacing="-0.03em"
            >
              <tspan fill="#ffffff">P</tspan>
              <tspan fill="#818cf8">R</tspan>
            </text>
            <defs>
              <linearGradient id="pr_bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0f172a" />
                <stop offset="1" stopColor="#1e1b4b" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className={styles.brandText}>
          <h1 className={styles.title}>
            <span className={styles.titlePulse}>Pulse</span>
            <span className={styles.titleRender}>Render</span>
            <span className={styles.brandTag}>ENGINE</span>
          </h1>
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
