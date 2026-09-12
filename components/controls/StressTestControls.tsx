'use client';

/**
 * PulseRender - Stress Test Workload Controls
 *
 * Populates the DataStore ring buffer with 10K, 25K, 50K, or 100K synthetic points
 * for performance profiling and benchmarking, or restores live SSE streaming.
 */

import { useState } from 'react';
import { useDataStore } from '@/components/providers/DataStreamProvider';
import { StreamStatus } from '@/components/ui/StreamStatus';
import type { StressTestLevel } from '@/lib/performance/types';
import styles from './StressTestControls.module.css';

const STRESS_LEVELS: readonly { id: Exclude<StressTestLevel, 'live'>; label: string; count: number }[] = [
  { id: '10k', label: '10K', count: 10_000 },
  { id: '25k', label: '25K', count: 25_000 },
  { id: '50k', label: '50K', count: 50_000 },
  { id: '100k', label: '100K', count: 100_000 },
];

export function StressTestControls(): React.JSX.Element {
  const store = useDataStore();
  const [activeLevel, setActiveLevel] = useState<StressTestLevel>('live');

  const handleSelectLevel = (level: Exclude<StressTestLevel, 'live'>, count: number) => {
    setActiveLevel(level);
    store.loadStressTest(count);
  };

  const handleReturnToLive = () => {
    setActiveLevel('live');
    store.clearStressTest();
  };

  return (
    <div className={styles.stressContainer} aria-label="Stress test controls">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div className={styles.label}>
          <span aria-hidden="true">⚡</span>
          <span>Stress Test</span>
        </div>

        <div className={styles.buttonGroup} role="radiogroup" aria-label="Workload size">
          {STRESS_LEVELS.map((lvl) => {
            const isActive = activeLevel === lvl.id;
            return (
              <button
                key={lvl.id}
                type="button"
                className={`${styles.btn} ${isActive ? styles.btnActive : ''}`}
                aria-checked={isActive}
                role="radio"
                onClick={() => handleSelectLevel(lvl.id, lvl.count)}
              >
                {lvl.label}
              </button>
            );
          })}
        </div>

        {activeLevel !== 'live' && (
          <button
            type="button"
            className={styles.liveBtn}
            onClick={handleReturnToLive}
          >
            <span>📡 Return to Live Stream</span>
          </button>
        )}
      </div>

      <StreamStatus />
    </div>
  );
}
