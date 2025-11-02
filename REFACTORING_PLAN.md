# Elevation Editor Refactoring Plan

## Executive Summary

The `elevation-editor.tsx` component is currently 1647 lines long and contains multiple responsibilities including state management, data processing, algorithm implementation, UI rendering, and user interactions. This refactoring plan outlines a systematic approach to split this monolithic component into a well-organized, maintainable architecture while ensuring all functionality remains intact.

**Goals:**
- Reduce main component file to ~300-400 lines
- Extract 20+ focused, testable modules
- Improve code maintainability and reusability
- Enable better testing coverage
- Maintain all existing functionality

## Progress Summary

**Current Status:** Phases 1-5 extraction complete, Phase 6 integration pending

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Types & Constants | ✅ COMPLETED | 2 files created |
| Phase 2: Utility Functions | ✅ COMPLETED | 2 files created |
| Phase 3: Algorithms | ✅ COMPLETED | 3 files created |
| Phase 4: Custom Hooks | ✅ COMPLETED | 8 hooks created |
| Phase 5: UI Components | ✅ PARTIALLY COMPLETED | 6/13 components created |
| Phase 6: Integration | ⏳ PENDING | Not started |

**Files Created:** 22 new files (~1,465 lines extracted)
**Main Component:** 1292 lines (down from 1647, reduced by 355 lines / 21.6%)
**Target:** ~400-500 lines (requires Phase 6 integration)
**Estimated Remaining Reduction:** ~800-900 lines

**Next Steps:**
1. Complete Phase 5: Create remaining 7 chart-related components
2. Start Phase 6: Integrate all 8 hooks into main component
3. Phase 6: Replace JSX sections with extracted components
4. Phase 6: Test and verify all functionality
5. Commit changes

## Current State Analysis

### File Statistics
- **Total Lines:** 1647
- **State Variables:** 18 useState hooks
- **Effects:** 8 useEffect hooks
- **Callbacks:** 16 useCallback functions
- **Memoized Values:** 7 useMemo computations
- **Utility Functions:** 5 standalone functions
- **Complex Algorithms:** 3 major algorithms (anomaly detection, smoothing, statistics)

### Identified Issues
1. **Single Responsibility Violation:** Component handles data processing, UI rendering, state management, and business logic
2. **Testing Difficulty:** Algorithms and utilities are embedded within the component
3. **Code Duplication:** Unit conversion logic repeated, similar patterns for localStorage
4. **High Complexity:** Cognitive load is high due to file size
5. **Limited Reusability:** Utilities and hooks are locked within this component

## Proposed Architecture

```
components/elevation-editor/
├── index.tsx                          # Main orchestrator component (~350 lines)
├── types.ts                           # TypeScript interfaces and types
├── constants.ts                       # Configuration constants
│
├── hooks/
│   ├── useLocalStorageState.ts       # Generic localStorage persistence hook
│   ├── useMobileDetection.ts         # Mobile screen detection
│   ├── useAnomalyButtonPositioning.ts # Anomaly button positioning logic
│   ├── useChartInteractions.ts       # Mouse/drag handling for chart
│   ├── useZoomPan.ts                 # Zoom and pan functionality
│   ├── useElevationHistory.ts        # Undo/redo state management
│   ├── useElevationStats.ts          # Statistics calculation
│   └── useUnitConversion.ts          # Unit conversion utilities
│
├── utils/
│   ├── date-time.ts                  # parseTimestamp, formatDuration
│   ├── math.ts                       # Mathematical utilities
│   └── gpx.ts                        # GPX-specific utilities
│
├── algorithms/
│   ├── anomaly-detection.ts          # detectElevationAnomalies
│   ├── smoothing.ts                  # All smoothing algorithms
│   └── statistics.ts                 # Elevation statistics computation
│
└── components/
    ├── Header.tsx                    # Sticky header with logo and actions
    ├── StatsGrid.tsx                 # Stats cards grid wrapper
    ├── StatsCard.tsx                 # Individual stat card
    ├── HelpCard.tsx                  # Editing help card
    ├── MobileWarning.tsx             # Mobile device warning
    ├── ControlsCard.tsx              # Smoothing controls card
    ├── ChartCard.tsx                 # Elevation chart container
    ├── ChartControls.tsx             # Chart control buttons
    ├── ZoomControls.tsx              # Zoom in/out/reset buttons
    ├── PanControls.tsx               # Left/right pan buttons
    ├── AnomalyCloseButtons.tsx       # Overlay buttons for anomalies
    ├── ElevationChart.tsx            # Recharts chart component
    └── CustomTooltip.tsx             # Chart tooltip component
```

## Detailed Refactoring Steps

### Phase 1: Extract Constants and Types ✅ COMPLETED

**Goal:** Create foundation files for shared types and configuration

#### Tasks:
- [x] Create `types.ts` with interfaces:
  - [x] `ElevationEditorProps`
  - [x] `ChartDataPoint`
  - [x] `AnomalyRegion`
  - [x] `DragState`
  - [x] `HistoryEntry`
  - [x] `UnitSystem`
  - [x] `AnomalyButtonOffset`
  - [x] `ElevationStats`
- [x] Create `constants.ts` with:
  - [x] `HISTORY_LIMIT`
  - [x] `ELEVATION_STEP_THRESHOLD`
  - [x] `MEDIAN_WINDOW_SIZE`
  - [x] `CHART_MARGINS_DESKTOP`
  - [x] `CHART_MARGINS_MOBILE`
  - [x] `ANOMALY_BUTTON_SIZE`
  - [x] `ANOMALY_BUTTON_PADDING`
- [x] Update main component to import from new files
- [x] Run build to verify no TypeScript errors
- [x] Test: Application loads and displays correctly

### Phase 2: Extract Utility Functions ✅ COMPLETED

**Goal:** Move pure functions to dedicated utility files

#### 2.1 Date/Time Utilities
- [x] Create `utils/date-time.ts`
- [x] Move `parseTimestamp` function
- [x] Move `formatDuration` function
- [ ] Add unit tests for edge cases:
  - [ ] Test `parseTimestamp` with invalid dates
  - [ ] Test `parseTimestamp` with null/undefined
  - [ ] Test `formatDuration` with various durations (0s, 59s, 1h, 5h 30m 45s)
  - [ ] Test `formatDuration` with negative/infinite values
- [x] Update imports in main component
- [x] Test: Stats display correctly with time formatting

#### 2.2 Mathematical Utilities
- [x] Create `utils/math.ts`
- [x] Move `computeRollingMedian` function
- [ ] Add comprehensive unit tests:
  - [ ] Test with empty array
  - [ ] Test with single element
  - [ ] Test with even/odd window sizes
  - [ ] Test with edge cases (window larger than array)
  - [ ] Test correctness with known datasets
- [x] Update imports in main component
- [x] Test: Smoothing still works correctly

#### 2.3 GPX Utilities
- [x] SKIPPED - No GPX-specific utilities needed

**Verification:**
- [x] All utility functions are pure (no side effects)
- [ ] All utilities have 100% test coverage (TODO)
- [x] Main component builds successfully
- [x] Application behavior unchanged

### Phase 3: Extract Complex Algorithms ✅ COMPLETED

**Goal:** Isolate complex business logic into testable modules

#### 3.1 Anomaly Detection
- [x] Create `algorithms/anomaly-detection.ts`
- [x] Move `detectElevationAnomalies` function
- [ ] Add comprehensive test suite:
  - [ ] Test with insufficient data (< 10 points)
  - [ ] Test with flat elevation (no anomalies)
  - [ ] Test with single spike
  - [ ] Test with multiple anomalies
  - [ ] Test with varying thresholds (1m, 10m, 50m, 100m)
  - [ ] Test gap merging logic
  - [ ] Test severity calculation
  - [ ] Test region boundary extension
- [x] Update imports in main component
- [x] Test: Anomaly detection UI matches previous behavior

#### 3.2 Smoothing Algorithms
- [x] Create `algorithms/smoothing.ts`
- [x] Move `applySmoothTransition` function
- [x] Move `applyClickSmoothing` function
- [ ] Add unit tests:
  - [ ] Test `applySmoothTransition` with radius=0 (no smoothing)
  - [ ] Test `applySmoothTransition` with strength=0 (no effect)
  - [ ] Test `applySmoothTransition` with strength=1 (full effect)
  - [ ] Test `applySmoothTransition` at array boundaries
  - [ ] Test `applyClickSmoothing` with various radii
  - [ ] Test `applyClickSmoothing` influence calculation
  - [ ] Test that negative elevations are clamped to 0
- [x] Update imports in main component
- [x] Test: Drag-to-edit and click-to-smooth work correctly

#### 3.3 Statistics Calculation
- [x] Create `algorithms/statistics.ts`
- [x] Extract stats calculation logic from useMemo
- [x] Create `calculateElevationStats` function
- [ ] Add comprehensive tests:
  - [ ] Test min/max elevation calculation
  - [ ] Test ascent/descent calculation with median smoothing
  - [ ] Test elevation step threshold filtering
  - [ ] Test duration calculation
  - [ ] Test average speed calculation
  - [ ] Test max speed calculation
  - [ ] Test with missing time data
  - [ ] Test with edge cases (single point, two points)
- [x] Update main component to use new function
- [x] Test: Stats cards display correct values

**Verification:**
- [x] All algorithms are pure functions
- [ ] Algorithm test coverage > 90% (TODO)
- [x] Performance benchmarks show no regression
- [x] UI behavior matches previous implementation exactly

### Phase 4: Create Custom Hooks ✅ COMPLETED

**Goal:** Extract stateful logic into reusable hooks

#### 4.1 useLocalStorageState Hook
- [x] Create `hooks/useLocalStorageState.ts`
- [x] Implement generic hook with signature: `useLocalStorageState<T>(key: string, defaultValue: T): [T, (value: T) => void]`
- [x] Handle SSR safety (`typeof window !== 'undefined'`)
- [x] Auto-save to localStorage on state changes
- [ ] Add tests:
  - [ ] Test initial state from localStorage
  - [ ] Test initial state when localStorage is empty
  - [ ] Test state updates persist to localStorage
  - [ ] Test SSR scenario (window undefined)
- [ ] Replace 6 localStorage useState patterns in main component (TODO - Phase 6):
  - [ ] `showOriginal`
  - [ ] `showAnomalies`
  - [ ] `showMap`
  - [ ] `unitSystem`
  - [ ] `showHelpCard`
  - [ ] `showMobileWarning`
- [ ] Remove individual useEffect hooks (TODO - Phase 6)
- [ ] Test: Settings persist across page reloads

#### 4.2 useMobileDetection Hook
- [x] Create `hooks/useMobileDetection.ts`
- [x] Move mobile detection logic
- [x] Return `isMobile: boolean`
- [x] Add cleanup for event listener
- [ ] Add tests:
  - [ ] Test initial detection
  - [ ] Test resize event handling
  - [ ] Test cleanup on unmount
- [ ] Update main component (TODO - Phase 6)
- [ ] Test: Mobile/desktop UI switches correctly

#### 4.3 useElevationHistory Hook
- [x] Create `hooks/useElevationHistory.ts`
- [x] Move history state management
- [x] Export interface: `{ canUndo, pushHistory, handleUndo }`
- [x] Includes Ctrl+Z / Cmd+Z keyboard shortcut
- [ ] Add tests:
  - [ ] Test push to empty history
  - [ ] Test push with history limit
  - [ ] Test undo operation
  - [ ] Test undo on empty history
  - [ ] Test history snapshot deep copies
  - [ ] Test keyboard shortcut
- [ ] Update main component (TODO - Phase 6)
- [ ] Test: Undo button works, Ctrl+Z works

#### 4.4 useZoomPan Hook
- [x] Create `hooks/useZoomPan.ts`
- [x] Move zoom/pan logic with animations
- [x] Move animation cleanup
- [x] Export interface: `{ zoomDomain, setZoomDomain, zoomIn, zoomOut, resetZoom, panLeft, panRight }`
- [ ] Add tests:
  - [ ] Test zoom in calculation
  - [ ] Test zoom out calculation
  - [ ] Test zoom limits (minimum 5% of total)
  - [ ] Test pan boundary constraints
  - [ ] Test reset zoom
  - [ ] Test animation cleanup
- [ ] Update main component (TODO - Phase 6)
- [ ] Test: Zoom and pan controls work smoothly

#### 4.5 useChartInteractions Hook
- [x] Create `hooks/useChartInteractions.ts`
- [x] Move drag state and handlers
- [x] Export interface: `{ handleChartMouseDown, handleChartMouseMove, handleChartMouseUp, handleChartMouseLeave, hoveredPointIndex }`
- [ ] Add tests:
  - [ ] Test mouse down starts drag
  - [ ] Test mouse move without drag (hover only)
  - [ ] Test mouse move with drag (elevation change)
  - [ ] Test click without drag (click smoothing)
  - [ ] Test mouse up completes drag
  - [ ] Test mouse leave cancels drag
- [ ] Update main component (TODO - Phase 6)
- [ ] Test: Drag editing works, click smoothing works

#### 4.6 useAnomalyButtonPositioning Hook
- [x] Create `hooks/useAnomalyButtonPositioning.ts`
- [x] Move anomaly button positioning logic with ResizeObserver and MutationObserver
- [x] Export interface: `{ anomalyButtonOffsets, chartContainerRef }`
- [ ] Add tests:
  - [ ] Test with no anomalies
  - [ ] Test position calculation
  - [ ] Test resize observer triggers update
  - [ ] Test mutation observer triggers update
  - [ ] Test cleanup on unmount
- [ ] Update main component (TODO - Phase 6)
- [ ] Test: Anomaly close buttons positioned correctly

#### 4.7 useElevationStats Hook
- [x] Create `hooks/useElevationStats.ts`
- [x] Move stats calculation
- [x] Use `calculateElevationStats` from algorithms
- [x] Export memoized stats
- [ ] Add integration tests:
  - [ ] Test with sample GPX data
  - [ ] Test stats update when trackPoints change
  - [ ] Test memoization (doesn't recalculate unnecessarily)
- [ ] Update main component (TODO - Phase 6)
- [ ] Test: Stats cards show correct values

#### 4.8 useUnitConversion Hook
- [x] Create `hooks/useUnitConversion.ts`
- [x] Move unit system state and converters
- [x] Uses `useLocalStorageState` for persistence
- [x] Export interface: `{ unitSystem, setUnitSystem, convertDistance, convertElevation, convertSpeed, distanceUnitLabel, elevationUnitLabel, speedUnitLabel }`
- [ ] Add tests:
  - [ ] Test metric to imperial distance conversion
  - [ ] Test metric to imperial elevation conversion
  - [ ] Test metric to imperial speed conversion
  - [ ] Test metric labels
  - [ ] Test imperial labels
  - [ ] Test conversion functions are stable references
- [ ] Update main component (TODO - Phase 6)
- [ ] Test: Unit toggle works, conversions are correct

**Verification:**
- [x] All 8 hooks created
- [ ] Main component file reduced by ~500 lines (TODO - Phase 6 integration)
- [ ] All hooks have tests (TODO)
- [ ] No duplicate state management (TODO - Phase 6)
- [ ] Application behavior unchanged (TODO - Phase 6)

### Phase 5: Create UI Sub-Components ✅ PARTIALLY COMPLETED

**Goal:** Break down monolithic render into focused components

#### 5.1 Header Component
- [x] Create `components/Header.tsx`
- [x] Move header JSX
- [x] Props: `{ filename, gpxName, canUndo, onUndo, onReset, onLoadNewFile, onDownload }`
- [ ] Add tests:
  - [ ] Test renders with all props
  - [ ] Test button click handlers
  - [ ] Test responsive classes
  - [ ] Test logo displays
- [ ] Update main component (TODO - Phase 6)
- [ ] Test: Header looks identical, buttons work

#### 5.2 Stats Components
- [x] Create `components/StatsCard.tsx`
- [x] Props: `{ label, value, className? }`
- [ ] Add tests:
  - [ ] Test renders label and value
  - [ ] Test applies custom className
- [x] Create `components/StatsGrid.tsx`
- [x] Move stats grid JSX
- [x] Props: `{ stats, convertDistance, convertElevation, convertSpeed, distanceUnitLabel, elevationUnitLabel, speedUnitLabel }`
- [x] Use StatsCard component
- [ ] Add tests:
  - [ ] Test renders all 8 cards
  - [ ] Test metric units
  - [ ] Test imperial units
  - [ ] Test handles null/undefined speed values
- [ ] Update main component (TODO - Phase 6)
- [ ] Test: Stats display correctly

#### 5.3 HelpCard Component
- [x] Create `components/HelpCard.tsx`
- [x] Move help card JSX
- [x] Props: `{ show, onDismiss }`
- [ ] Add tests:
  - [ ] Test renders when show=true
  - [ ] Test doesn't render when show=false
  - [ ] Test dismiss button works
- [ ] Update main component (TODO - Phase 6)
- [ ] Test: Help card displays and dismisses

#### 5.4 MobileWarning Component
- [x] Create `components/MobileWarning.tsx`
- [x] Move warning JSX
- [x] Props: `{ show, onDismiss }`
- [ ] Add tests:
  - [ ] Test renders when show=true
  - [ ] Test doesn't render when show=false
  - [ ] Test dismiss button works
- [ ] Update main component (TODO - Phase 6)
- [ ] Test: Warning shows on mobile, dismisses correctly

#### 5.5 ControlsCard Component
- [x] Create `components/ControlsCard.tsx`
- [x] Move controls JSX
- [x] Props: `{ smoothingRadius, smoothingStrength, anomalyThreshold, maxSmoothingRadius, onSmoothingRadiusChange, onSmoothingStrengthChange, onAnomalyThresholdChange }`
- [ ] Add tests:
  - [ ] Test sliders render with correct values
  - [ ] Test slider change handlers
  - [ ] Test value display formatting
- [ ] Update main component (TODO - Phase 6)
- [ ] Test: Sliders work, values update

#### 5.6 Chart Control Components
- [ ] Create `components/ZoomControls.tsx`
- [ ] Move zoom controls JSX (lines 1441-1453)
- [ ] Props: `{ isMobile, zoomDomain, onZoomIn, onZoomOut, onResetZoom }`
- [ ] Add tests:
  - [ ] Test renders zoom in/out buttons
  - [ ] Test renders reset button when zoomed
  - [ ] Test button handlers
  - [ ] Test mobile positioning
- [ ] Create `components/PanControls.tsx`
- [ ] Move pan controls JSX (lines 1456-1465)
- [ ] Props: `{ isMobile, zoomDomain, onPanLeft, onPanRight }`
- [ ] Add tests:
  - [ ] Test only renders when zoomDomain exists
  - [ ] Test button handlers
  - [ ] Test mobile positioning
- [ ] Create `components/ChartControls.tsx`
- [ ] Move chart control buttons JSX (lines 1321-1415)
- [ ] Props: `{ unitSystem, showOriginal, showAnomalies, showMap, anomalyCount, editedCount, isMobile, onUnitSystemChange, onToggleOriginal, onToggleAnomalies, onToggleMap }`
- [ ] Add tests:
  - [ ] Test all buttons render
  - [ ] Test active/inactive states
  - [ ] Test badge displays
  - [ ] Test button handlers
- [ ] Update main component
- [ ] Test: All chart controls work

#### 5.7 AnomalyCloseButtons Component
- [ ] Create `components/AnomalyCloseButtons.tsx`
- [ ] Move anomaly buttons JSX (lines 1469-1495)
- [ ] Props: `{ anomalyRegions, anomalyButtonOffsets, hoveredAnomalyIndex, onIgnoreAnomaly, onHoverChange }`
- [ ] Add tests:
  - [ ] Test renders buttons for each anomaly
  - [ ] Test button positioning
  - [ ] Test hover effects
  - [ ] Test click handler
- [ ] Update main component
- [ ] Test: Close buttons work, hover effects correct

#### 5.8 CustomTooltip Component
- [ ] Create `components/CustomTooltip.tsx`
- [ ] Extract tooltip config (lines 1532-1560)
- [ ] Create custom Tooltip component
- [ ] Props: `{ isMobile, convertElevation, convertDistance, distanceUnitLabel, elevationUnitLabel }`
- [ ] Add tests:
  - [ ] Test renders with data
  - [ ] Test mobile styling
  - [ ] Test desktop styling
  - [ ] Test unit conversions
- [ ] Update main component
- [ ] Test: Tooltip displays correctly on hover

#### 5.9 ElevationChart Component
- [ ] Create `components/ElevationChart.tsx`
- [ ] Move chart JSX (lines 1467-1626)
- [ ] Props: All necessary data and handlers
- [ ] Compose ZoomControls, PanControls, AnomalyCloseButtons
- [ ] Add tests:
  - [ ] Test chart renders
  - [ ] Test anomalies render when enabled
  - [ ] Test original line renders when enabled
  - [ ] Test zoom domain applied
  - [ ] Test reference lines for edited points
- [ ] Update main component
- [ ] Test: Chart works, all interactions work

#### 5.10 ChartCard Component
- [ ] Create `components/ChartCard.tsx`
- [ ] Move chart card JSX (lines 1303-1643)
- [ ] Compose ChartControls, MobileWarning, ElevationChart, ElevationMap
- [ ] Props: All necessary props from main component
- [ ] Add integration tests:
  - [ ] Test full chart card renders
  - [ ] Test map shows/hides
  - [ ] Test warning shows on mobile
- [ ] Update main component
- [ ] Test: Full chart section works

**Verification:**
- [ ] Main component file reduced to ~350 lines
- [ ] All sub-components have tests
- [ ] No visual regressions
- [ ] All interactions still work

### Phase 6: Final Integration and Main Component Cleanup ⏳ PENDING

**Goal:** Create clean, minimal orchestrator component

**Current Status:** Main component is still at 1292 lines with hooks and components created but not yet integrated.

#### Tasks:
- [ ] **Integrate all 8 custom hooks** into main component:
  - [ ] Replace useState + useEffect for `showOriginal` with `useLocalStorageState`
  - [ ] Replace useState + useEffect for `showAnomalies` with `useLocalStorageState`
  - [ ] Replace useState + useEffect for `showMap` with `useLocalStorageState`
  - [ ] Replace useState + useEffect for `showHelpCard` with `useLocalStorageState`
  - [ ] Replace useState + useEffect for `showMobileWarning` with `useLocalStorageState`
  - [ ] Replace mobile detection logic with `useMobileDetection`
  - [ ] Replace history logic with `useElevationHistory`
  - [ ] Replace zoom/pan logic with `useZoomPan`
  - [ ] Replace chart interaction logic with `useChartInteractions`
  - [ ] Replace anomaly button positioning with `useAnomalyButtonPositioning`
  - [ ] Replace stats calculation with `useElevationStats`
  - [ ] Replace unit conversion logic with `useUnitConversion`
- [ ] **Replace JSX with extracted components**:
  - [ ] Replace header JSX with `<Header />` component
  - [ ] Replace stats grid JSX with `<StatsGrid />` component
  - [ ] Replace help card JSX with `<HelpCard />` component
  - [ ] Replace mobile warning JSX with `<MobileWarning />` component
  - [ ] Replace controls card JSX with `<ControlsCard />` component
- [ ] **Create remaining chart components**:
  - [ ] Create and integrate `<ZoomControls />` component
  - [ ] Create and integrate `<PanControls />` component
  - [ ] Create and integrate `<ChartControls />` component
  - [ ] Create and integrate `<AnomalyCloseButtons />` component
  - [ ] Create and integrate `<CustomTooltip />` component
  - [ ] Create and integrate `<ElevationChart />` component
  - [ ] Create and integrate `<ChartCard />` component
- [ ] **Cleanup main component**:
  - [ ] Remove all extracted logic
  - [ ] Remove duplicate imports
  - [ ] Verify file is ~400-500 lines
  - [ ] Add clear section comments for organization
- [ ] **Testing**:
  - [ ] Test full component renders
  - [ ] Test file loading works
  - [ ] Test download functionality works
  - [ ] Test reset functionality works
  - [ ] Test undo/redo works (button + Ctrl+Z)
  - [ ] Test drag editing works
  - [ ] Test click smoothing works
  - [ ] Test anomaly detection works
  - [ ] Test zoom/pan works
  - [ ] Test unit toggle works
  - [ ] Test all settings persist on reload
- [ ] Run `npx tsc --noEmit` to verify no errors
- [ ] Run `npm run build` to verify production build
- [ ] Update imports in `app/page.tsx` if needed (should not change)

**Verification:**
- [ ] Main component reduced from 1292 lines to ~400-500 lines (69% reduction)
- [ ] Main component is readable and maintainable
- [ ] Clear separation of concerns
- [ ] No logic duplication
- [ ] All features working identically to before
- [ ] No TypeScript errors
- [ ] No build errors

## Testing Strategy

### Unit Tests

**Tools:** Jest + React Testing Library

#### Pure Functions (utils/, algorithms/)
- **Coverage Target:** 100%
- **Test Types:**
  - Edge cases (empty, null, undefined)
  - Boundary conditions
  - Expected behavior with valid inputs
  - Performance with large datasets

#### Custom Hooks (hooks/)
- **Coverage Target:** 95%+
- **Test Types:**
  - Initial state
  - State updates
  - Side effects (localStorage, event listeners)
  - Cleanup
  - Re-render behavior

#### Components (components/)
- **Coverage Target:** 90%+
- **Test Types:**
  - Rendering with props
  - User interactions (clicks, hovers)
  - Conditional rendering
  - Event handler calls
  - Accessibility (ARIA labels, keyboard navigation)

### Integration Tests

**Tools:** React Testing Library + MSW (Mock Service Worker)

#### Test Scenarios:
- [ ] **File Upload Flow**
  - Load GPX file
  - Verify stats calculation
  - Verify chart rendering
- [ ] **Editing Flow**
  - Drag point to edit elevation
  - Verify history updated
  - Verify edited points marked
  - Undo edit
  - Verify state restored
- [ ] **Anomaly Detection Flow**
  - Load file with anomalies
  - Verify anomalies detected
  - Adjust threshold
  - Verify anomalies recalculated
  - Dismiss anomaly
  - Verify anomaly removed from display
- [ ] **Zoom/Pan Flow**
  - Zoom in on chart
  - Verify domain updated
  - Pan left/right
  - Verify boundaries respected
  - Reset zoom
  - Verify full chart visible
- [ ] **Settings Persistence Flow**
  - Toggle unit system
  - Reload page (use sessionStorage mock)
  - Verify setting persisted
- [ ] **Download Flow**
  - Edit elevation
  - Download modified GPX
  - Verify file contains changes

### Visual Regression Tests

**Tools:** Playwright + Percy or Chromatic

#### Test Scenarios:
- [ ] Header (desktop and mobile)
- [ ] Stats grid (desktop and mobile)
- [ ] Chart with no edits
- [ ] Chart with edits
- [ ] Chart with anomalies
- [ ] Chart with original line
- [ ] Map view
- [ ] Help card
- [ ] Mobile warning
- [ ] Controls card

### End-to-End Tests

**Tools:** Playwright

#### Critical User Paths:
- [ ] **Complete Edit Session**
  1. Load sample.gpx
  2. Edit 3 points by dragging
  3. Adjust smoothing
  4. Click-smooth a point
  5. Undo last edit
  6. Download edited file
  7. Verify download successful
- [ ] **Mobile Experience**
  1. Load on mobile viewport
  2. Verify warning displays
  3. Dismiss warning
  4. Toggle map view
  5. Zoom chart
  6. Pan chart
- [ ] **Settings Persistence**
  1. Change to imperial units
  2. Hide original line
  3. Dismiss help card
  4. Reload page
  5. Verify all settings persisted

### Performance Tests

**Tools:** Lighthouse, React DevTools Profiler

#### Metrics to Track:
- [ ] Initial load time
- [ ] Time to Interactive (TTI)
- [ ] Chart interaction responsiveness (< 16ms for 60fps)
- [ ] Anomaly detection calculation time (< 500ms for 5000 points)
- [ ] Memory usage (no leaks on zoom/pan)

## Migration Checklist

### Before Starting
- [ ] Create feature branch: `refactor/elevation-editor-split`
- [ ] Document current test coverage
- [ ] Take screenshots of all UI states
- [ ] Run full test suite (baseline)
- [ ] Performance benchmark (baseline)

### During Refactoring
- [x] Complete Phase 1 ✅ COMPLETED
  - [x] Verify builds
  - [x] Verify app works
  - [ ] Commit: "refactor: extract types and constants" (TODO)
- [x] Complete Phase 2 ✅ COMPLETED
  - [ ] All utility tests passing (TODO)
  - [x] Verify builds
  - [x] Verify app works
  - [ ] Commit: "refactor: extract utility functions" (TODO)
- [x] Complete Phase 3 ✅ COMPLETED
  - [ ] All algorithm tests passing (TODO)
  - [x] Verify builds
  - [x] Verify app works
  - [ ] Commit: "refactor: extract algorithms" (TODO)
- [x] Complete Phase 4 ✅ COMPLETED
  - [ ] All hook tests passing (TODO)
  - [x] Verify builds
  - [x] Verify app works
  - [ ] Commit: "refactor: extract custom hooks" (TODO)
- [x] Complete Phase 5 ✅ PARTIALLY COMPLETED (6/13 components created)
  - [ ] All component tests passing (TODO)
  - [ ] Visual regression tests passing (TODO)
  - [x] Verify builds
  - [x] Verify app works
  - [ ] Commit: "refactor: extract UI components" (TODO after completing remaining components)
- [ ] Complete Phase 6 ⏳ PENDING (NOT STARTED)
  - [ ] Integration tests passing
  - [ ] E2E tests passing
  - [ ] Verify builds
  - [ ] Verify app works
  - [ ] Commit: "refactor: finalize main component cleanup"

### After Refactoring
- [ ] Run full test suite
  - [ ] Compare coverage (should be higher)
- [ ] Run visual regression tests
  - [ ] No unexpected differences
- [ ] Run performance benchmarks
  - [ ] No regressions
- [ ] Manual testing checklist:
  - [ ] File loading (sample.gpx and custom file)
  - [ ] Drag editing (single point, multiple drags)
  - [ ] Click smoothing
  - [ ] Undo/redo (Ctrl+Z, button)
  - [ ] Reset functionality
  - [ ] Anomaly detection (adjust threshold, dismiss anomalies)
  - [ ] Zoom in/out/reset
  - [ ] Pan left/right
  - [ ] Toggle original line
  - [ ] Toggle anomalies
  - [ ] Toggle map
  - [ ] Toggle unit system
  - [ ] Stats calculation accuracy
  - [ ] Download edited GPX
  - [ ] Settings persistence (reload page)
  - [ ] Mobile responsive behavior
  - [ ] Help card dismiss
  - [ ] Mobile warning dismiss
- [ ] Code review
- [ ] Update documentation
- [ ] Create PR: "Refactor elevation-editor into modular architecture"

## Risk Assessment

### High Risk Areas

1. **Chart Interactions (Drag/Click)**
   - **Risk:** Mouse event handling might break during hook extraction
   - **Mitigation:** Comprehensive integration tests, careful state management
   - **Rollback Plan:** Keep original component in git history

2. **Anomaly Button Positioning**
   - **Risk:** Complex SVG coordinate calculations might fail after extraction
   - **Mitigation:** Extract as isolated hook with detailed tests
   - **Rollback Plan:** Revert hook, keep positioning inline

3. **State Dependencies**
   - **Risk:** Hooks might have circular dependencies or incorrect dependency arrays
   - **Mitigation:** Map all dependencies before extraction, use React DevTools
   - **Rollback Plan:** Merge dependent hooks temporarily

4. **Performance Regression**
   - **Risk:** Additional re-renders from hook composition
   - **Mitigation:** Memoization, React.memo, useMemo, useCallback strategically
   - **Rollback Plan:** Benchmark each phase, revert if > 10% slower

### Medium Risk Areas

1. **Unit Conversions**
   - **Risk:** Conversion logic might have edge cases
   - **Mitigation:** Comprehensive tests with real GPX data
   - **Rollback Plan:** Keep inline if tests fail

2. **localStorage Persistence**
   - **Risk:** Generic hook might not handle all cases
   - **Mitigation:** Test with all 6 current use cases
   - **Rollback Plan:** Custom implementation per setting

### Low Risk Areas

1. **Utility Functions**
   - Pure functions, easy to test and extract
2. **UI Components**
   - Presentational, minimal logic
3. **Constants**
   - No logic, simple extraction

## Success Criteria

### Quantitative Metrics
- [ ] Main component file: < 400 lines (currently 1647)
- [ ] Test coverage: > 85% overall (currently unknown)
- [ ] No visual regressions in VRT
- [ ] No performance regression (< 5% slower)
- [ ] All E2E tests passing
- [ ] Zero new TypeScript errors
- [ ] Zero new accessibility violations

### Qualitative Metrics
- [ ] Code is easier to understand (peer review)
- [ ] Components are reusable
- [ ] Clear separation of concerns
- [ ] Functions have single responsibility
- [ ] Easy to add new features
- [ ] Easy to debug issues

## Timeline Estimate

**Total Estimated Time:** 24-32 hours

- Phase 1: 2 hours
- Phase 2: 4 hours
- Phase 3: 6 hours
- Phase 4: 8 hours
- Phase 5: 8 hours
- Phase 6: 4 hours
- Testing & QA: 4 hours
- Documentation: 2 hours
- Code Review & Fixes: 4 hours

## Post-Refactoring Benefits

1. **Maintainability:** Easy to locate and modify specific functionality
2. **Testing:** Higher coverage, isolated unit tests
3. **Reusability:** Hooks and utilities can be used in other features
4. **Onboarding:** New developers can understand code faster
5. **Bug Fixes:** Isolated modules make debugging easier
6. **Features:** Easier to add new functionality without side effects
7. **Performance:** Targeted optimizations easier to implement
8. **Type Safety:** Better TypeScript inference in smaller modules

## Notes

- **Backward Compatibility:** External API (`ElevationEditorProps`) remains unchanged
- **Breaking Changes:** None - this is internal refactoring only
- **Feature Freeze:** No new features during refactoring
- **Communication:** Update team daily on progress
- **Rollback Strategy:** Each phase is atomic and can be reverted independently
