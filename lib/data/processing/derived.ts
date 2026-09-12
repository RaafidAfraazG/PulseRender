/**
 * PulseRender — Derived Data Processing Pipeline & Invalidation Cache
 *
 * Combines raw data, time range selection, category filtering, and time-bucket aggregation.
 * Maintains an internal versioned cache so that chart renderers calling getDerivedData()
 * inside their 60 FPS rAF callback receive instant cached results if the inputs have not changed.
 */

import type { DataPoint, AggregatedDataPoint, TimeRangePreset, AggregationMode } from '@/lib/types';
import { TIME_RANGES } from '@/lib/types';
import type { DataStore } from '@/lib/data/store';
import { monitor } from '@/lib/performance/monitor';
import { selectTimeRange } from './timeRange';
import { filterByCategory } from './filter';
import { aggregateData } from './aggregate';

export interface ProcessingConfig {
  readonly timeRange: TimeRangePreset;
  readonly activeCategories: ReadonlySet<string>;
  readonly aggregation: AggregationMode;
}

export type ProcessedPoint = DataPoint | AggregatedDataPoint;

export class DerivedDataPipeline {
  private lastVersion = -1;
  private lastTimeRange: TimeRangePreset | null = null;
  private lastCategoriesKey = '';
  private lastAggregation: AggregationMode | null = null;

  private cachedResult: readonly ProcessedPoint[] = Object.freeze([]);

  /**
   * Returns derived data for rendering, using cache if invalidation keys match.
   */
  getDerivedData(
    store: DataStore,
    config: ProcessingConfig,
    currentTime: number = Date.now(),
  ): readonly ProcessedPoint[] {
    const storeVersion = store.getVersion();
    const categoriesKey = Array.from(config.activeCategories).sort().join(',');

    const isCacheValid =
      storeVersion === this.lastVersion &&
      config.timeRange === this.lastTimeRange &&
      categoriesKey === this.lastCategoriesKey &&
      config.aggregation === this.lastAggregation;

    if (isCacheValid) {
      return this.cachedResult;
    }

    const start = typeof performance !== 'undefined' ? performance.now() : Date.now();

    // 1. Fetch raw data snapshot
    const rawPoints = store.getAllSnapshot();

    // 2. Category filtering
    const categoryFiltered = filterByCategory(rawPoints, config.activeCategories);

    // 3. Time range selection
    const timeRangeInfo = TIME_RANGES[config.timeRange] ?? TIME_RANGES['1m'];
    const timeFiltered = selectTimeRange(categoryFiltered, timeRangeInfo.durationMs, currentTime);

    // 4. Time-bucket aggregation
    const aggregated = aggregateData(timeFiltered, config.aggregation);

    const end = typeof performance !== 'undefined' ? performance.now() : Date.now();
    monitor.recordProcessingTime(end - start);

    // Update cache
    this.lastVersion = storeVersion;
    this.lastTimeRange = config.timeRange;
    this.lastCategoriesKey = categoriesKey;
    this.lastAggregation = config.aggregation;
    this.cachedResult = aggregated;

    return this.cachedResult;
  }
}
