'use client';

/**
 * PulseRender — DataStreamProvider
 *
 * Owns the SSE connection, the DataStore, and exposes them to the component tree
 * through two separate React Contexts:
 *
 *   DataStoreContext  — provides the DataStore instance (stable ref, no re-renders)
 *   DataStreamContext — provides { status, dataCount } (React state, rare re-renders)
 *
 * ── Architecture ─────────────────────────────────────────────────────────
 *
 *   DataStreamProvider
 *     creates  → DataStore (ring buffer)
 *     creates  → EventSource (/api/data)
 *     on event → store.push(validatedPoints)          [no React setState]
 *     on tick  → setDataCount(store.getStoredCount()) [throttled, every 2s]
 *     on open  → setStatus('live')                    [once per connection]
 *     on error → setStatus('error')                   [retry handled by browser]
 *     on unmount → source.close()  [critical — prevents SSE leak]
 *
 * ── Why two contexts? ────────────────────────────────────────────────────
 *
 * Chart renderers need the DataStore — a stable object that never changes.
 * Putting it in a context whose value NEVER changes means chart components
 * will never re-render due to this context changing.
 *
 * Stream status (live/connecting/error) and data count DO change and DO need
 * to trigger React re-renders — but only for the StreamStatus UI component,
 * not for the charts. Keeping them in a separate context isolates those
 * re-renders.
 *
 * ── Single connection guarantee ──────────────────────────────────────────
 *
 * The EventSource is created inside useEffect with no dependencies (runs once
 * after mount). React StrictMode double-invokes effects in development; the
 * cleanup function (source.close()) ensures only one live connection exists.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from 'react';

import { DataStore } from '@/lib/data/store';
import { parseSSEPayload } from '@/lib/data/validator';
import type { DataStreamConfig } from '@/lib/types';

// ── Types ─────────────────────────────────────────────────────────────────

export type StreamStatus = 'connecting' | 'live' | 'error';

export interface DataStreamContextValue {
  readonly status:    StreamStatus;
  readonly dataCount: number;
}

// ── Contexts ──────────────────────────────────────────────────────────────

// DataStore context: stable value, never triggers re-renders in consumers
export const DataStoreContext = createContext<DataStore | null>(null);

// Stream status context: changes status/count → re-renders StreamStatus UI only
export const DataStreamContext = createContext<DataStreamContextValue | null>(null);

// ── Hooks ─────────────────────────────────────────────────────────────────

/**
 * Access the DataStore instance.
 * Stable — calling this hook in a chart component does NOT cause re-renders
 * when data arrives.
 */
export function useDataStore(): DataStore {
  const store = useContext(DataStoreContext);
  if (!store) throw new Error('useDataStore must be used within <DataStreamProvider>');
  return store;
}

/**
 * Access stream connection status and current data count.
 * Re-renders when status or count changes. Use only in UI components
 * that display this information (e.g. StreamStatus).
 */
export function useDataStream(): DataStreamContextValue {
  const ctx = useContext(DataStreamContext);
  if (!ctx) throw new Error('useDataStream must be used within <DataStreamProvider>');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────

interface DataStreamProviderProps {
  readonly children:     ReactNode;
  readonly streamConfig: DataStreamConfig;
}

const COUNT_UPDATE_INTERVAL_MS = 2_000; // update the data count display every 2s
const SSE_ENDPOINT             = '/api/data';

export function DataStreamProvider({
  children,
  streamConfig,
}: DataStreamProviderProps): React.JSX.Element {
  // DataStore: created once via lazy state initializer, never replaced
  const [store] = useState(
    () => new DataStore(streamConfig.maxBufferSize, streamConfig.categoryCount),
  );

  // React state: only for UI indicators
  const [status,    setStatus]    = useState<StreamStatus>('connecting');
  const [dataCount, setDataCount] = useState(0);

  useEffect(() => {
    const source = new EventSource(SSE_ENDPOINT);

    // ── SSE event handlers ────────────────────────────────────────────────
    source.addEventListener('open', () => {
      setStatus('live');
    });

    source.addEventListener('datapoints', (event: MessageEvent<string>) => {
      const points = parseSSEPayload(event.data);
      if (points) {
        store.push(points);
        // Data count is NOT updated here — throttled below
      }
    });

    source.addEventListener('error', () => {
      // EventSource auto-reconnects on error; we just surface the status
      setStatus('error');
      // Reset to 'connecting' after a brief delay to show reconnect state
      setTimeout(() => setStatus('connecting'), 2_000);
    });

    // ── Throttled data count update ───────────────────────────────────────
    const countTimer = setInterval(() => {
      setDataCount(store.getStoredCount());
    }, COUNT_UPDATE_INTERVAL_MS);

    // ── Cleanup: CRITICAL — must close EventSource on unmount ─────────────
    return () => {
      source.close();
      clearInterval(countTimer);
    };
  }, [store]); // store ref is stable, effect runs once

  // Stable stream context value — only recreated when status/count changes
  const streamValue = useMemo<DataStreamContextValue>(
    () => ({ status, dataCount }),
    [status, dataCount],
  );

  return (
    <DataStoreContext.Provider value={store}>
      <DataStreamContext.Provider value={streamValue}>
        {children}
      </DataStreamContext.Provider>
    </DataStoreContext.Provider>
  );
}
