/**
 * PulseRender - Placeholder Panel (Server Component)
 *
 * Displays a clearly labelled placeholder panel for chart/feature areas
 * that will be implemented in later phases. Renders as a server component -
 * no interactivity needed in Phase 1.
 */

import styles from './PlaceholderPanel.module.css';

interface PlaceholderPanelProps {
  /** Human-readable title for the panel */
  readonly title: string;
  /** Chart type or feature description */
  readonly description: string;
  /** Which phase will implement this feature */
  readonly implementationPhase: number;
  /** Icon character or emoji representing the chart type */
  readonly icon?: string;
  /** CSS class to allow sizing from parent */
  readonly className?: string;
}

export function PlaceholderPanel({
  title,
  description,
  implementationPhase,
  icon = '◻',
  className,
}: PlaceholderPanelProps): React.JSX.Element {
  return (
    <div
      className={`${styles.panel} ${className ?? ''}`}
      role="region"
      aria-label={`${title} - placeholder`}
    >
      <div className={styles.inner}>
        <div className={styles.iconWrapper} aria-hidden="true">
          <span className={styles.icon}>{icon}</span>
        </div>

        <div className={styles.content}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.description}>{description}</p>
        </div>

        <div className={styles.footer}>
          <span className={styles.phaseBadge}>
            Phase {implementationPhase}
          </span>
          <span className={styles.footerText}>Pending implementation</span>
        </div>
      </div>
    </div>
  );
}
