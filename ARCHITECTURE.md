# PulseRender — Architecture Documentation

> **Status:** Phase 5 — Virtualized Data Table & Dashboard Completeness Complete  
> **Last updated:** Phase 5 completion

---

## 1. Project Goal

**PulseRender** is a high-performance real-time data visualization dashboard built to demonstrate that a browser-based frontend can continuously process and render **10,000+ data points at 60 FPS** while remaining responsive, memory-efficient, and interactive.

The core performance problem PulseRender is designed to solve:

> "Standard React rendering and SVG-based charting cannot sustain 60 FPS when data volume exceeds a few thousand points updated at 10 Hz. The DOM is too slow for this workload."

PulseRender's architecture avoids this problem by:
1. Keeping React responsible only for orchestration and UI state — not for per-frame rendering.
2. Using HTML Canvas for high-throughput pixel rendering (bypasses DOM).
3. Using SVG only for static overlays (axes, labels, gridlines) that update cleanly without DOM thrashing.
4. Implementing a framework-independent analytical pipeline with versioned invalidation caching.
5. Implementing a lightweight custom virtualized data table for viewing 100,000+ records with a bounded DOM footprint (~26 rows).

---

## 2. System Architecture

The data flows through distinct, isolated layers:

```
┌─────────────────────────────────────────────────────────┐
│                     DATA SOURCE                         │
│   Simulated: 10k+ DataPoints at 100ms intervals (SSE)   │
└────────────────────┬────────────────────────────────────┘
                     │ raw DataPoint[]
                     ▼
┌─────────────────────────────────────────────────────────┐
│                   DATA STREAM LAYER                      │
│   DataStore ring buffer, version tracking               │
│   Implemented in: lib/data/                             │
└────────────────────┬────────────────────────────────────┘
                     │ raw DataPoint[] snapshot
                     ▼
┌─────────────────────────────────────────────────────────┐
│                 DATA PROCESSING LAYER                    │
│   Time Range → Category Filter → Aggregation → Derived  │
│   Versioned invalidation cache (DerivedDataPipeline)   │
│   Implemented in: lib/data/processing/                  │
└────────────────────┬────────────────────────────────────┘
                     │ derived ProcessedPoint[]
                     ├───► Canvas/SVG Renderers (via Shared rAF)
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              VIRTUALIZED DATA TABLE LAYER                │
│   Scroll top listener → Math.floor(scrollTop / 36)      │
│   Overscan Window calculation → Top/Bottom Spacers      │
│   Bounded DOM rows (~26 <tr> elements mounted)          │
│   Implemented in: components/table/                     │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Separation of Responsibilities

PulseRender maintains a strict separation of state:

### 3.1 Raw Data (`DataStore`)
- **What:** Unprocessed incoming streaming data points from SSE.
- **Location:** Pure TypeScript `DataStore` ring buffer.
- **Rule:** Never mutated by filters or controls.

### 3.2 Processing State & Derived Data Pipeline (`DerivedDataPipeline`)
- **What:** Active selections: `timeRange` (`1m`, `5m`, `15m`, `1h`, `All`), `activeCategories` (`Alpha`, `Beta`, `Gamma`, `Delta`), `aggregationMode` (`Raw`, `1m`, `5m`, `1h`).
- **Pipeline:**
  ```
  Raw DataStore → Category Filter → Time Range Window → Time-Bucket Aggregation → Derived Cache
  ```
- **Invalidation Strategy:** Checks cache key `(storeVersion, timeRange, activeCategories, aggregationMode)`. If unchanged, returns cached result instantly without recomputation.

### 3.3 Interactive Viewport Domain (`lib/rendering/interaction/`)
- **What:** Data-space bounding coordinates `(xMin, xMax, yMin, yMax)`.
- **Interactions:**
  - **Wheel Zoom**: Scales time span `(xMax - xMin)` centered around cursor ratio.
  - **Drag Pan**: Shifts time span by pixel deltas in data units.
  - **Reset View**: Clears custom domain and restores live auto-scrolling view.
- **Safety:** Enforces `minXSpanMs = 1000ms`, `maxXSpanMs = 24h`, `xMin < xMax`.

### 3.4 Virtualized Data Table (`components/table/`)
- **What:** Bounded DOM table viewer for 100,000+ data rows.
- **Mechanism:**
  - `scrollTop` passive event handler calculates visible `startIndex` and `endIndex` in $O(1)$ time based on fixed row height `36px`.
  - Maintains `OVERSCAN = 15` buffer rows above and below viewport to eliminate scroll blanking.
  - Places top and bottom spacer height blocks to preserve full native scrollbar geometry without mounting off-screen DOM nodes.
  - Listens to `DataStore` push events via decoupled subscriptions to refresh visible window rows when new data streams in.

### 3.5 UI & Control State (`DashboardProvider`)
- **What:** Ephemeral React UI state for buttons, radio toggles, and view reset.
- **Rule:** Control button clicks update React UI state; incoming 100ms SSE data ticks do NOT trigger React component re-renders.

---

## 4. Phase Roadmap & Boundaries

| Phase | Status | Scope |
|---|---|---|
| **Phase 1** | ✅ Complete | Foundation: types, state interfaces, dashboard shell, architecture docs |
| **Phase 2** | ✅ Complete | SSE real-time stream, `DataStore` ring buffer, shared rAF scheduler, 4 Canvas renderers & SVG axes |
| **Phase 3** | ✅ Complete | Analytical processing: time range, category filters, aggregation, interactive zoom/pan, controls UI |
| **Phase 4** | ✅ Complete | Performance engineering: real FPS & frame-time calculator, heap memory tracking, stress testing (10K-100K), automated benchmark suite, canvas renderer optimizations |
| **Phase 5** | ✅ Complete | Virtualized data table (10k-100k rows), bounded DOM rendering, full interactive controls polish, mobile responsive layout |
| **Phase 6** | ⬜ Planned | Production deployment, Lighthouse audit, final submission checklist |
ucket Aggregation → Derived Cache
  ```
- **Invalidation Strategy:** Checks cache key `(storeVersion, timeRange, activeCategories, aggregationMode)`. If unchanged, returns cached result instantly without recomputation.

### 3.3 Interactive Viewport Domain (`lib/rendering/interaction/`)
- **What:** Data-space bounding coordinates `(xMin, xMax, yMin, yMax)`.
- **Interactions:**
  - **Wheel Zoom**: Scales time span `(xMax - xMin)` centered around cursor ratio.
  - **Drag Pan**: Shifts time span by pixel deltas in data units.
  - **Reset View**: Clears custom domain and restores live auto-scrolling view.
- **Safety:** Enforces `minXSpanMs = 1000ms`, `maxXSpanMs = 24h`, `xMin < xMax`.

### 3.4 UI & Control State (`DashboardProvider`)
- **What:** Ephemeral React UI state for buttons, radio toggles, and view reset.
- **Rule:** Control button clicks update React UI state; incoming 100ms SSE data ticks do NOT trigger React component re-renders.

---

## 4. Phase Roadmap & Boundaries

| Phase | Status | Scope |
|---|---|---|
| **Phase 1** | ✅ Complete | Foundation: types, state interfaces, dashboard shell, architecture docs |
| **Phase 2** | ✅ Complete | SSE real-time stream, `DataStore` ring buffer, shared rAF scheduler, 4 Canvas renderers & SVG axes |
| **Phase 3** | ✅ Complete | Analytical processing: time range, category filters, aggregation, interactive zoom/pan, controls UI |
| **Phase 4** | ✅ Complete | Performance engineering: real FPS & frame-time calculator, heap memory tracking, stress testing (10K-100K), automated benchmark suite, canvas renderer optimizations |
| **Phase 5** | ⬜ Planned | Virtualized data table (10k+ rows), sorting, filtering, column management |
| **Phase 6** | ⬜ Planned | Production deployment, Lighthouse audit, final benchmark documentation |
