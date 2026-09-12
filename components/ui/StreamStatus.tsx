'use client';

/**
 * PulseRender — StreamStatus Component
 *
 * Displays live stream connection status (Live / Connecting / Error)
 * and buffered point count.
 * Uses `useDataStream()` so it re-renders when data count updates (every 2s).
 */

import { useDataStream } from '@/components/providers/DataStreamProvider';
import styles from './StreamStatus.module.css';

export function StreamStatus(): React.JSX.Element {
  const { status, dataCount } = useDataStream();

  const statusLabel =
    status === 'live'
      ? 'LIVE STREAM'
      : status === 'connecting'
      ? 'CONNECTING'
      : 'RECONNECTING';

  const dotClass =
    status === 'live'
      ? styles.live
      : status === 'connecting'
      ? styles.connecting
      : styles.error;

  return (
    <div className={styles.container} aria-label="Stream status indicator">
      <div className={styles.statusIndicator}>
        <span className={`${styles.dot} ${dotClass}`} aria-hidden="true" />
        <span>{statusLabel}</span>
      </div>
      <span aria-hidden="true">•</span>
      <div>
        Buffered Points: <span className={styles.count}>{dataCount.toLocaleString()}</span>
      </div>
    </div>
  );
}
