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
  ChartCard
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
  const [ignoredAnomalies, setIgnoredAnomalies] = useState<Set<number>>(new Set());
  const [mapKey, setMapKey] = useState(0);

  // ============================================================================
  // Custom hooks
  // ============================================================================
  const isMobile = useMobileDetection();

  const [showOriginal, setShowOriginal] = useLocalStorageState('elevationEditor.showOriginal', false);
  const [showAnomalies, setShowAnomalies] = useLocalStorageState('elevationEditor.showAnomalies', true);
  const [showMap, setShowMap] = useLocalStorageState('elevationEditor.showMap', true);
  const [showHelpCard, setShowHelpCard] = useLocalStorageState('elevationEditor.showHelpCard', true);
  const [showMobileWarning, setShowMobileWarning] = useLocalStorageState('elevationEditor.showMobileWarning', true);

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

  const { zoomDomain, zoomIn, zoomOut, resetZoom, panLeft, panRight } = useZoomPan(
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

  const anomalyRegions = useMemo(() => {
    const regions = detectElevationAnomalies(trackPoints, anomalyThreshold);
    return regions.filter((_, index) => !ignoredAnomalies.has(index));
  }, [trackPoints, anomalyThreshold, ignoredAnomalies]);

  const { chartContainerRef, anomalyButtonOffsets } = useAnomalyButtonPositioning(
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
  const handleIgnoreAnomaly = useCallback((index: number) => {
    setIgnoredAnomalies((prev) => new Set(prev).add(index));
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
        hoveredPointIndex={hoveredPointIndex}
        hoveredAnomalyIndex={null}
        mapKey={mapKey}
        chartContainerRef={chartContainerRef}
        convertDistance={convertDistance}
        convertElevation={convertElevation}
        distanceUnitLabel={distanceUnitLabel}
        elevationUnitLabel={elevationUnitLabel}
        onUnitSystemChange={setUnitSystem}
        onToggleOriginal={() => setShowOriginal((prev) => !prev)}
        onToggleAnomalies={() => setShowAnomalies((prev) => !prev)}
        onToggleMap={handleToggleMap}
        onDismissMobileWarning={() => setShowMobileWarning(false)}
        onChartMouseDown={handleChartMouseDown}
        onChartMouseMove={handleChartMouseMove}
        onChartMouseUp={handleChartMouseUp}
        onChartMouseLeave={handleChartMouseLeave}
        onIgnoreAnomaly={handleIgnoreAnomaly}
        onHoverAnomalyChange={() => {}}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onPanLeft={panLeft}
        onPanRight={panRight}
      />
    </div>
  );
}
