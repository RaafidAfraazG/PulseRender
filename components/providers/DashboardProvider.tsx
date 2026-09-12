'use client';

/**
 * PulseRender — Dashboard UI Context Provider
 *
 * PHASE 3: Expanded provider handling:
 *   - Time range selection ('1m', '5m', '15m', '1h', 'all')
 *   - Aggregation mode ('raw', '1m', '5m', '1h')
 *   - Category filtering (Set of active category strings)
 *   - Viewport domain (zoom/pan custom domain & reset view action)
 *   - Performance monitor toggle
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

import type { UIState } from '@/lib/types/state';
import type { TimeRangePreset, AggregationMode, ViewportDomain } from '@/lib/types';
import { INITIAL_UI_STATE } from '@/lib/types/state';

const DEFAULT_CATEGORIES = new Set<string>(['primary', 'secondary', 'tertiary', 'quaternary']);

export interface DashboardContextValue {
  readonly ui: UIState;
  readonly activeCategories: ReadonlySet<string>;
  readonly aggregationMode: AggregationMode;
  readonly customDomain: ViewportDomain | null;
  readonly setSelectedChart: (chartId: string | null) => void;
  readonly setTimeRange: (preset: TimeRangePreset) => void;
  readonly setAggregationMode: (mode: AggregationMode) => void;
  readonly toggleCategory: (category: string) => void;
  readonly setCustomDomain: (domain: ViewportDomain | null | ((prev: ViewportDomain | null) => ViewportDomain | null)) => void;
  readonly resetView: () => void;
  readonly togglePerformanceMonitor: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

interface DashboardProviderProps {
  readonly children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps): React.JSX.Element {
  const [ui, setUi] = useState<UIState>(INITIAL_UI_STATE);
  const [activeCategories, setActiveCategories] = useState<ReadonlySet<string>>(DEFAULT_CATEGORIES);
  const [aggregationMode, setAggregationModeState] = useState<AggregationMode>('raw');
  const [customDomain, setCustomDomainState] = useState<ViewportDomain | null>(null);

  const setSelectedChart = useCallback((chartId: string | null) => {
    setUi((prev) => ({ ...prev, selectedChartId: chartId }));
  }, []);

  const setTimeRange = useCallback((preset: TimeRangePreset) => {
    setUi((prev) => ({ ...prev, timeRange: preset }));
    // Reset custom zoom/pan domain when explicit time range button is clicked
    setCustomDomainState(null);
  }, []);

  const setAggregationMode = useCallback((mode: AggregationMode) => {
    setAggregationModeState(mode);
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const setCustomDomain = useCallback((
    domain: ViewportDomain | null | ((prev: ViewportDomain | null) => ViewportDomain | null),
  ) => {
    setCustomDomainState(domain);
  }, []);

  const resetView = useCallback(() => {
    setCustomDomainState(null);
    setUi((prev) => ({ ...prev, timeRange: '1m' }));
    setAggregationModeState('raw');
    setActiveCategories(new Set(['primary', 'secondary', 'tertiary', 'quaternary']));
  }, []);

  const togglePerformanceMonitor = useCallback(() => {
    setUi((prev) => ({
      ...prev,
      showPerformanceMonitor: !prev.showPerformanceMonitor,
    }));
  }, []);

  const value = useMemo<DashboardContextValue>(() => ({
    ui,
    activeCategories,
    aggregationMode,
    customDomain,
    setSelectedChart,
    setTimeRange,
    setAggregationMode,
    toggleCategory,
    setCustomDomain,
    resetView,
    togglePerformanceMonitor,
  }), [
    ui,
    activeCategories,
    aggregationMode,
    customDomain,
    setSelectedChart,
    setTimeRange,
    setAggregationMode,
    toggleCategory,
    setCustomDomain,
    resetView,
    togglePerformanceMonitor,
  ]);

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (ctx === null) {
    throw new Error('useDashboard must be used within a <DashboardProvider>');
  }
  return ctx;
}
