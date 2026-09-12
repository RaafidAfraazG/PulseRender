'use client';

/**
 * PulseRender - StreamStatus Component
 *
 * Displays live stream connection status (Live / Connecting / Error)
 * and buffered point count, with interactive incremental buffer expansion (10K -> 20K -> 30K -> 50K -> 100K).
 */

import { useDataStream, useDataStore } from '@/components/providers/DataStreamProvider';
import styles from './StreamStatus.module.css';

export function StreamStatus(): React.JSX.Element {
  const { status, dataCount } = useDataStream();
  const store = useDataStore();

  const currentMax = store.getMaxBufferSize();

  // Next milestone calculation: 10K -> 20K -> 30K -> 50K -> 100K
  let nextMilestone: { label: string; count: number } | null = null;
  if (currentMax <= 10_240) nextMilestone = { label: '20K', count: 20_000 };
  else if (currentMax <= 20_000) nextMilestone = { label: '30K', count: 30_000 };
  else if (currentMax <= 30_000) nextMilestone = { label: '50K', count: 50_000 };
  else if (currentMax <= 50_000) nextMilestone = { label: '100K', count: 100_000 };

  const isAtCapacity = dataCount >= currentMax * 0.9;
  const isStreamingToTarget = dataCount < currentMax && currentMax > 10_240;

  const handleExpand = () => {
    if (nextMilestone) {
      store.setMaxBufferSize(nextMilestone.count);
    }
  };

  const handleReset = () => {
    store.setMaxBufferSize(10_240);
  };

  const statusLabel =
    isStreamingToTarget
      ? `STREAMING TO ${(currentMax / 1000).toFixed(0)}K`
      : status === 'live'
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

      {/* Show Expand Button when current level is filled */}
      {isAtCapacity && nextMilestone && (
        <button
          type="button"
          className={styles.expandBtn}
          onClick={handleExpand}
          title={`Expand live buffer capacity to ${nextMilestone.label}`}
        >
          <span>Expand to {nextMilestone.label} →</span>
        </button>
      )}

      {/* Show Reset to 10K if expanded */}
      {currentMax > 10_240 && (
        <button
          type="button"
          className={styles.resetBtn}
          onClick={handleReset}
          title="Reset buffer capacity to 10K target"
        >
          <span>↺ 10K</span>
        </button>
      )}
    </div>
  );
}
