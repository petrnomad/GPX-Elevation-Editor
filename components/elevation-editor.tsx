"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { GPXData, TrackPoint, exportGPX } from '@/lib/gpx-parser';
import { ElevationEditorProps, ChartDataPoint, DragState } from './elevation-editor/types';
import { detectElevationAnomalies } from './elevation-editor/algorithms/anomaly-detection';
import { applySmoothTransition, applyClickSmoothing } from './elevation-editor/algorithms/smoothing';

// Import custom hooks
import { useLocalStorageState } from './elevation-editor/hooks/useLocalStorageState';
import { useMobileDetection } from './elevation-editor/hooks/useMobileDetection';
import { useUnitConversion } from './elevation-editor/hooks/useUnitConversion';
import { useElevationHistory } from './elevation-editor/hooks/useElevationHistory';
import { useZoomPan } from './elevation-editor/hooks/useZoomPan';
import { useElevationStats } from './elevation-editor/hooks/useElevationStats';
import { useChartInteractions } from './elevation-editor/hooks/useChartInteractions';
import { useAnomalyButtonPositioning } from './elevation-editor/hooks/useAnomalyButtonPositioning';

// Import UI components
import {
  Header,
  StatsGrid,
  HelpCard,
  ControlsCard,
  ChartCard,
  KeyboardShortcutsCard
} from './elevation-editor/components';

export function ElevationEditor({
  gpxData,
  originalContent,
  filename,
  onLoadNewFile
}: ElevationEditorProps) {
  // ============================================================================
  // Refs
  // ============================================================================
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragSnapshotRef = useRef<TrackPoint[] | null>(null);

  // ============================================================================
  // Local state
  // ============================================================================
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>(gpxData.trackPoints);
  const [editedPoints, setEditedPoints] = useState<Set<number>>(new Set());
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [smoothingRadius, setSmoothingRadius] = useState(5);
  const [smoothingStrength, setSmoothingStrength] = useState(0.25);
  const [anomalyThreshold, setAnomalyThreshold] = useState(10);
  const [ignoredAnomalies, setIgnoredAnomalies] = useState<Set<string>>(new Set());
  const [mapKey, setMapKey] = useState(0);
  const [hoveredAnomalyKey, setHoveredAnomalyKey] = useState<string | null>(null);
  const [isPanningMode, setIsPanningMode] = useState(false);
  const [panDragState, setPanDragState] = useState<{ startX: number; startDomain: [number, number] } | null>(null);

  // ============================================================================
  // Custom hooks
  // ============================================================================
  const isMobile = useMobileDetection();

  const [showOriginal, setShowOriginal] = useLocalStorageState('elevationEditor.showOriginal', false);
  const [showAnomalies, setShowAnomalies] = useLocalStorageState('elevationEditor.showAnomalies', true);
  const [showMap, setShowMap] = useLocalStorageState('elevationEditor.showMap', true);
  const [showHelpCard, setShowHelpCard] = useLocalStorageState('elevationEditor.showHelpCard', true);
  const [showMobileWarning, setShowMobileWarning] = useLocalStorageState('elevationEditor.showMobileWarning', true);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(true);

  const {
    unitSystem,
    setUnitSystem,
    convertDistance,
    convertElevation,
    convertSpeed,
    distanceUnitLabel,
    elevationUnitLabel,
    speedUnitLabel
  } = useUnitConversion();

  const { canUndo, pushHistory, handleUndo } = useElevationHistory(
    trackPoints,
    editedPoints,
    setTrackPoints,
    setEditedPoints,
    setDragState,
    dragSnapshotRef
  );

  const { zoomDomain, setZoomDomain, zoomIn, zoomOut, resetZoom, panLeft, panRight } = useZoomPan(
    gpxData.totalDistance
  );

  const stats = useElevationStats(trackPoints, gpxData.totalDistance, editedPoints.size);

  // Clear ignored anomalies when threshold changes
  useEffect(() => {
    setIgnoredAnomalies(new Set());
  }, [anomalyThreshold]);

  // ============================================================================
  // Computed values
  // ============================================================================
  const maxSmoothingRadius = useMemo(
    () => Math.max(0, Math.min(200, Math.floor(trackPoints.length / 8))),
    [trackPoints.length]
  );

  const chartData: ChartDataPoint[] = useMemo(
    () =>
      trackPoints.map((point, index) => ({
        distance: point.distance || 0,
        elevation: point.ele,
        originalIndex: index,
        isEdited: editedPoints.has(index)
      })),
    [trackPoints, editedPoints]
  );

  const originalChartData: ChartDataPoint[] = useMemo(
    () =>
      gpxData.trackPoints.map((point, index) => ({
        distance: point.distance || 0,
        elevation: point.ele,
        originalIndex: index
      })),
    [gpxData.trackPoints]
  );

  // Helper function to create unique key for anomaly region
  const getAnomalyKey = useCallback((region: { startDistance: number; endDistance: number }) => {
    return `${region.startDistance.toFixed(3)}-${region.endDistance.toFixed(3)}`;
  }, []);

  const anomalyRegions = useMemo(() => {
    const regions = detectElevationAnomalies(trackPoints, anomalyThreshold);
    return regions.filter((region) => !ignoredAnomalies.has(getAnomalyKey(region)));
  }, [trackPoints, anomalyThreshold, ignoredAnomalies, getAnomalyKey]);

  const { chartContainerRef, anomalyButtonOffsets, gridBounds } = useAnomalyButtonPositioning(
    anomalyRegions,
    zoomDomain,
    chartData
  );

  const { hoveredPointIndex, handleChartMouseDown, handleChartMouseMove, handleChartMouseUp, handleChartMouseLeave } =
    useChartInteractions(
      trackPoints,
      setTrackPoints,
      editedPoints,
      setEditedPoints,
      smoothingRadius,
      smoothingStrength,
      stats,
      pushHistory,
      dragSnapshotRef,
      setDragState
    );

  // Handle Ctrl/Cmd key press for panning mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && zoomDomain) {
        setIsPanningMode(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) {
        setIsPanningMode(false);
        setPanDragState(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [zoomDomain]);

  // Handle Ctrl/Cmd + mouse wheel zoom
  useEffect(() => {
    const chartElement = chartContainerRef.current;
    if (!chartElement) return;

    const handleWheel = (e: WheelEvent) => {
      // Check if Ctrl (Windows/Linux) or Meta/Cmd (Mac) is pressed
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();

        // deltaY > 0 means scroll down (zoom out)
        // deltaY < 0 means scroll up (zoom in)
        if (e.deltaY < 0) {
          zoomIn();
        } else if (e.deltaY > 0) {
          zoomOut();
        }
      }
    };

    // Use passive: false to allow preventDefault()
    chartElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      chartElement.removeEventListener('wheel', handleWheel);
    };
  }, [chartContainerRef, zoomIn, zoomOut]);

  // ============================================================================
  // Panning handlers
  // ============================================================================
  const handlePanMouseDown = useCallback((e: any) => {
    if (!isPanningMode || !zoomDomain) return;

    const chartX = e?.chartX;
    if (typeof chartX !== 'number') return;

    setPanDragState({
      startX: chartX,
      startDomain: [zoomDomain[0], zoomDomain[1]]
    });
  }, [isPanningMode, zoomDomain]);

  const handlePanMouseMove = useCallback((e: any) => {
    if (!isPanningMode || !panDragState || !zoomDomain) return;

    const chartX = e?.chartX;
    if (typeof chartX !== 'number') return;

    const chartWidth = e?.chartWidth ?? 800;
    const pixelDelta = panDragState.startX - chartX;
    const domainRange = panDragState.startDomain[1] - panDragState.startDomain[0];
    const distancePerPixel = domainRange / chartWidth;
    const distanceDelta = pixelDelta * distancePerPixel;

    let newMin = panDragState.startDomain[0] + distanceDelta;
    let newMax = panDragState.startDomain[1] + distanceDelta;

    // Prevent over-panning
    if (newMin < 0) {
      newMin = 0;
      newMax = domainRange;
    }
    if (newMax > gpxData.totalDistance) {
      newMax = gpxData.totalDistance;
      newMin = gpxData.totalDistance - domainRange;
    }

    setZoomDomain([newMin, newMax]);
  }, [isPanningMode, panDragState, zoomDomain, gpxData.totalDistance, setZoomDomain]);

  const handlePanMouseUp = useCallback(() => {
    setPanDragState(null);
  }, []);

  const handlePanMouseLeave = useCallback(() => {
    setPanDragState(null);
  }, []);

  // ============================================================================
  // File operations
  // ============================================================================
  const handleLoadNewFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content && onLoadNewFile) {
          onLoadNewFile(content, file.name);
        }
      };
      reader.readAsText(file);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onLoadNewFile]
  );

  const handleDownload = useCallback(() => {
    const modifiedGPXData: GPXData = {
      ...gpxData,
      trackPoints: trackPoints
    };
    const modifiedGPX = exportGPX(modifiedGPXData, originalContent);
    const blob = new Blob([modifiedGPX], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace(/\.gpx$/i, '_modified.gpx');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [trackPoints, gpxData, originalContent, filename]);

  const handleReset = useCallback(() => {
    if (window.confirm('Reset all changes? This cannot be undone.')) {
      setTrackPoints(gpxData.trackPoints);
      setEditedPoints(new Set());
    }
  }, [gpxData.trackPoints]);

  // ============================================================================
  // Other handlers
  // ============================================================================
  const handleIgnoreAnomaly = useCallback((key: string) => {
    setIgnoredAnomalies((prev) => new Set(prev).add(key));
  }, []);

  const handleToggleMap = useCallback(() => {
    setShowMap((prev) => {
      if (!prev) {
        setMapKey((k) => k + 1);
      }
      return !prev;
    });
  }, [setShowMap]);

  // ============================================================================
  // Global keyboard shortcuts
  // ============================================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global shortcuts (CMD/CTRL + key)
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            if (canUndo) {
              e.preventDefault();
              handleUndo();
            }
            break;
          case 'o':
            e.preventDefault();
            handleLoadNewFile();
            break;
          case 's':
            e.preventDefault();
            setShowOriginal(prev => !prev);
            break;
          case 'm':
            e.preventDefault();
            handleToggleMap();
            break;
          case 'a':
            e.preventDefault();
            setShowAnomalies(prev => !prev);
            break;
          case 'i':
            e.preventDefault();
            setUnitSystem(unitSystem === 'metric' ? 'imperial' : 'metric');
            break;
          case 'd':
            e.preventDefault();
            handleDownload();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [canUndo, handleUndo, handleLoadNewFile, handleToggleMap, setShowOriginal, setShowAnomalies, unitSystem, setUnitSystem, handleDownload]);

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <div className="w-full space-y-4 md:space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".gpx"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload GPX file"
      />

      <Header
        filename={filename}
        gpxName={gpxData.name}
        canUndo={canUndo}
        onUndo={handleUndo}
        onReset={handleReset}
        onLoadNewFile={handleLoadNewFile}
        onDownload={handleDownload}
      />

      <StatsGrid
        stats={stats}
        convertDistance={convertDistance}
        convertElevation={convertElevation}
        convertSpeed={convertSpeed}
        distanceUnitLabel={distanceUnitLabel}
        elevationUnitLabel={elevationUnitLabel}
        speedUnitLabel={speedUnitLabel}
      />

      <HelpCard show={showHelpCard} onDismiss={() => setShowHelpCard(false)} />

      <ControlsCard
        smoothingRadius={smoothingRadius}
        smoothingStrength={smoothingStrength}
        anomalyThreshold={anomalyThreshold}
        maxSmoothingRadius={maxSmoothingRadius}
        onSmoothingRadiusChange={setSmoothingRadius}
        onSmoothingStrengthChange={setSmoothingStrength}
        onAnomalyThresholdChange={setAnomalyThreshold}
      />

      <ChartCard
        chartData={chartData}
        originalChartData={originalChartData}
        trackPoints={trackPoints}
        stats={stats}
        editedPoints={editedPoints}
        isMobile={isMobile}
        unitSystem={unitSystem}
        showOriginal={showOriginal}
        showAnomalies={showAnomalies}
        showMap={showMap}
        showMobileWarning={showMobileWarning}
        zoomDomain={zoomDomain}
        anomalyRegions={anomalyRegions}
        anomalyButtonOffsets={anomalyButtonOffsets}
        gridBounds={gridBounds}
        hoveredPointIndex={hoveredPointIndex}
        hoveredAnomalyKey={hoveredAnomalyKey}
        mapKey={mapKey}
        chartContainerRef={chartContainerRef}
        isPanningMode={isPanningMode}
        convertDistance={convertDistance}
        convertElevation={convertElevation}
        distanceUnitLabel={distanceUnitLabel}
        elevationUnitLabel={elevationUnitLabel}
        getAnomalyKey={getAnomalyKey}
        onUnitSystemChange={setUnitSystem}
        onToggleOriginal={() => setShowOriginal((prev) => !prev)}
        onToggleAnomalies={() => setShowAnomalies((prev) => !prev)}
        onToggleMap={handleToggleMap}
        onDismissMobileWarning={() => setShowMobileWarning(false)}
        onChartMouseDown={isPanningMode ? handlePanMouseDown : handleChartMouseDown}
        onChartMouseMove={isPanningMode ? handlePanMouseMove : handleChartMouseMove}
        onChartMouseUp={isPanningMode ? handlePanMouseUp : handleChartMouseUp}
        onChartMouseLeave={isPanningMode ? handlePanMouseLeave : handleChartMouseLeave}
        onIgnoreAnomaly={handleIgnoreAnomaly}
        onHoverAnomalyChange={setHoveredAnomalyKey}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onPanLeft={panLeft}
        onPanRight={panRight}
      />

      <KeyboardShortcutsCard
        show={showKeyboardShortcuts}
        onDismiss={() => setShowKeyboardShortcuts(false)}
      />
    </div>
  );
}
