"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Download, RotateCcw, Info, Undo2, Eye, EyeOff, Map as MapIcon } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { GPXData, TrackPoint, exportGPX } from '@/lib/gpx-parser';
const ElevationMap = dynamic<{ points: Array<{ lat: number; lon: number }> }>(
  () => import('@/components/elevation-map').then(mod => mod.ElevationMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 w-full rounded-md bg-slate-100 animate-pulse" aria-label="Loading map" />
    )
  }
);

interface ElevationEditorProps {
  gpxData: GPXData;
  originalContent: string;
  filename: string;
}

interface ChartDataPoint {
  distance: number;
  elevation: number;
  originalIndex: number;
  isEdited?: boolean;
}

const HISTORY_LIMIT = 100;
const ELEVATION_STEP_THRESHOLD = 2.5; // ignore sub-threshold steps when aggregating gain/loss
const MEDIAN_WINDOW_SIZE = 3; // 3-point rolling median (one neighbour each side)

const parseTimestamp = (value?: string): number | null => {
  if (!value) {
    return null;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
};

const formatDuration = (milliseconds: number): string => {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    return '—';
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds
      .toString()
      .padStart(2, '0')}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
};

const computeRollingMedian = (values: number[], windowSize: number): number[] => {
  if (values.length === 0) {
    return [];
  }

  const oddWindow = Math.max(1, windowSize % 2 === 0 ? windowSize + 1 : windowSize);
  const halfWindow = Math.floor(oddWindow / 2);

  return values.map((_, index) => {
    const start = Math.max(0, index - halfWindow);
    const end = Math.min(values.length - 1, index + halfWindow);
    const windowValues = values.slice(start, end + 1).slice().sort((a, b) => a - b);
    const mid = Math.floor(windowValues.length / 2);

    if (windowValues.length % 2 === 0) {
      return (windowValues[mid - 1] + windowValues[mid]) / 2;
    }

    return windowValues[mid];
  });
};

export function ElevationEditor({ gpxData, originalContent, filename }: ElevationEditorProps) {
  const [trackPoints, setTrackPoints] = useState<TrackPoint[]>(gpxData.trackPoints);
  const [editedPoints, setEditedPoints] = useState<Set<number>>(new Set());
  const [dragState, setDragState] = useState<{
    index: number;
    startY: number;
    startElevation: number;
    hasMoved: boolean;
  } | null>(null);
  const dragSnapshotRef = useRef<TrackPoint[] | null>(null);
  const [smoothingRadius, setSmoothingRadius] = useState(5);
  const [smoothingStrength, setSmoothingStrength] = useState(0.4);
  const [history, setHistory] = useState<
    {
      points: TrackPoint[];
      editedIndices: number[];
    }[]
  >([]);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const maxSmoothingRadius = useMemo(
    () => Math.max(0, Math.min(200, Math.floor(trackPoints.length / 8))),
    [trackPoints.length]
  );
  const canUndo = history.length > 0;
  const metricVariant: ButtonProps['variant'] = unitSystem === 'metric' ? 'default' : 'ghost';
  const imperialVariant: ButtonProps['variant'] = unitSystem === 'imperial' ? 'default' : 'ghost';
  const ghostVariant: ButtonProps['variant'] = 'ghost';
  const outlineVariant: ButtonProps['variant'] = 'outline';

  useEffect(() => {
    setSmoothingRadius(prev => Math.max(0, Math.min(prev, maxSmoothingRadius)));
  }, [maxSmoothingRadius]);

  console.log('ElevationEditor rendered with', trackPoints.length, 'points');

  // Convert track points to chart data
  const chartData: ChartDataPoint[] = useMemo(() => {
    console.log('Converting track points to chart data');
    return trackPoints.map((point, index) => ({
      distance: point.distance || 0,
      elevation: point.ele,
      originalIndex: index,
      isEdited: editedPoints.has(index)
    }));
  }, [trackPoints, editedPoints]);

  const originalChartData = useMemo(() => {
    console.log('Preparing original chart data');
    return gpxData.trackPoints.map((point, index) => ({
      distance: point.distance || 0,
      elevation: point.ele,
      originalIndex: index
    }));
  }, [gpxData.trackPoints]);

  const distanceUnitLabel = unitSystem === 'metric' ? 'km' : 'mi';
  const elevationUnitLabel = unitSystem === 'metric' ? 'm' : 'ft';
  const speedUnitLabel = unitSystem === 'metric' ? 'km/h' : 'mph';

  const convertDistance = useCallback(
    (meters: number) => {
      if (unitSystem === 'metric') {
        return meters / 1000;
      }
      return meters / 1609.344;
    },
    [unitSystem]
  );

  const convertElevation = useCallback(
    (meters: number) => {
      if (unitSystem === 'metric') {
        return meters;
      }
      return meters * 3.28084;
    },
    [unitSystem]
  );

  const convertSpeed = useCallback(
    (metersPerSecond: number) => {
      if (unitSystem === 'metric') {
        return metersPerSecond * 3.6;
      }
      return metersPerSecond * 2.23693629;
    },
    [unitSystem]
  );

  // Smart smoothing algorithm used while dragging
  const applySmoothTransition = useCallback(
    (
      sourcePoints: TrackPoint[],
      targetIndex: number,
      newElevation: number,
      radius: number,
      strength: number
    ) => {
      const effectiveRadius = Math.max(0, Math.round(radius));
      const clampedStrength = Math.min(Math.max(strength, 0), 1);
      const clampedElevation = Math.max(0, newElevation);
      const newPoints = sourcePoints.map((point, index) =>
        index === targetIndex ? { ...point, ele: clampedElevation } : { ...point }
      );

      if (effectiveRadius === 0 || clampedStrength === 0) {
        return newPoints;
      }

      const denominator = effectiveRadius + 1;

      for (let offset = 1; offset <= effectiveRadius; offset++) {
        const distanceFactor = Math.max(0, 1 - offset / denominator);
        const influence = clampedStrength * distanceFactor;
        if (influence <= 0) {
          continue;
        }

        const leftIndex = targetIndex - offset;
        if (leftIndex >= 0) {
          const baseline = sourcePoints[leftIndex].ele;
          const blended = baseline + (clampedElevation - baseline) * influence;
          newPoints[leftIndex] = { ...newPoints[leftIndex], ele: Math.max(0, blended) };
        }

        const rightIndex = targetIndex + offset;
        if (rightIndex < sourcePoints.length) {
          const baseline = sourcePoints[rightIndex].ele;
          const blended = baseline + (clampedElevation - baseline) * influence;
          newPoints[rightIndex] = { ...newPoints[rightIndex], ele: Math.max(0, blended) };
        }
      }

      return newPoints;
    },
    []
  );

  const applyClickSmoothing = useCallback(
    (sourcePoints: TrackPoint[], targetIndex: number, radius: number, strength: number) => {
      const effectiveRadius = Math.max(0, Math.round(radius));
      const clampedStrength = Math.min(Math.max(strength, 0), 1);
      if (clampedStrength === 0) {
        return sourcePoints.map(point => ({ ...point }));
      }

      const start = Math.max(0, targetIndex - effectiveRadius);
      const end = Math.min(sourcePoints.length - 1, targetIndex + effectiveRadius);
      const window = sourcePoints.slice(start, end + 1);
      if (window.length === 0) {
        return sourcePoints.map(point => ({ ...point }));
      }

      const average = window.reduce((sum, point) => sum + point.ele, 0) / window.length;
      const newPoints = sourcePoints.map(point => ({ ...point }));

      for (let index = start; index <= end; index++) {
        const distance = Math.abs(index - targetIndex);
        let influence = 0;

        if (effectiveRadius === 0) {
          influence = distance === 0 ? clampedStrength : 0;
        } else {
          const distanceFactor = Math.max(0, 1 - distance / (effectiveRadius + 1));
          influence = clampedStrength * distanceFactor;
        }

        if (influence <= 0) {
          continue;
        }

        const currentEle = sourcePoints[index].ele;
        const smoothedEle = currentEle + (average - currentEle) * influence;
        newPoints[index] = { ...newPoints[index], ele: Math.max(0, smoothedEle) };
      }

      return newPoints;
    },
    []
  );

  const pushHistory = useCallback(() => {
    setHistory(prev => {
      const snapshot = {
        points: trackPoints.map(point => ({ ...point })),
        editedIndices: Array.from(editedPoints)
      };
      if (prev.length >= HISTORY_LIMIT) {
        return [...prev.slice(1), snapshot];
      }
      return [...prev, snapshot];
    });
  }, [trackPoints, editedPoints]);

  const handleUndo = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) {
        return prev;
      }
      const nextHistory = prev.slice(0, -1);
      const last = prev[prev.length - 1];
      setTrackPoints(last.points.map(point => ({ ...point })));
      setEditedPoints(new Set(last.editedIndices));
      dragSnapshotRef.current = null;
      setDragState(null);
      return nextHistory;
    });
  }, [setTrackPoints, setEditedPoints, setDragState]);

  const stats = useMemo(() => {
    console.log('Calculating stats for', trackPoints.length, 'points');
    const rawElevations = trackPoints.map(point => point.ele);
    const smoothedElevations = computeRollingMedian(rawElevations, MEDIAN_WINDOW_SIZE);

    const minEle = Math.min(...smoothedElevations);
    const maxEle = Math.max(...smoothedElevations);
    const totals = smoothedElevations.reduce(
      (acc, elevation, index) => {
        if (index === 0) {
          return acc;
        }
        const diff = elevation - smoothedElevations[index - 1];
        if (Math.abs(diff) < ELEVATION_STEP_THRESHOLD) {
          return acc;
        }
        if (diff > 0) {
          acc.ascent += diff;
        } else {
          acc.descent += Math.abs(diff);
        }
        return acc;
      },
      { ascent: 0, descent: 0 }
    );

    let startTime: number | null = null;
    let endTime: number | null = null;
    let totalDurationSeconds = 0;
    let maxSpeed = 0;
    let distanceForSpeed = 0;

    trackPoints.forEach((point, index) => {
      const currentTime = parseTimestamp(point.time);
      if (currentTime === null) {
        return;
      }

      if (startTime === null) {
        startTime = currentTime;
      }
      endTime = currentTime;

      if (index === 0) {
        return;
      }

      const prevPoint = trackPoints[index - 1];
      const prevTime = parseTimestamp(prevPoint.time);
      if (prevTime === null) {
        return;
      }

      const deltaSeconds = (currentTime - prevTime) / 1000;
      if (deltaSeconds <= 0) {
        return;
      }

      const prevDistance = prevPoint.distance ?? 0;
      const currentDistance = point.distance ?? prevDistance;
      const deltaDistance = Math.max(0, currentDistance - prevDistance);
      distanceForSpeed += deltaDistance;

      const speed = deltaDistance / deltaSeconds;
      if (speed > maxSpeed) {
        maxSpeed = speed;
      }

      totalDurationSeconds += deltaSeconds;
    });

    const totalDurationMs = totalDurationSeconds * 1000;
    const averageSpeed = totalDurationSeconds > 0 ? distanceForSpeed / totalDurationSeconds : null;
    const maxSegmentSpeed = maxSpeed > 0 ? maxSpeed : null;

    return {
      minElevation: minEle,
      maxElevation: maxEle,
      totalAscent: totals.ascent,
      totalDescent: totals.descent,
      totalDistance: gpxData.totalDistance,
      editedCount: editedPoints.size,
      totalDurationMs,
      averageSpeed,
      maxSpeed: maxSegmentSpeed
    };
  }, [trackPoints, gpxData.totalDistance, editedPoints]);

  const handleChartMouseDown = useCallback((e: any) => {
    const activePoint = e?.activePayload?.[0]?.payload;
    if (!activePoint) return;

    const targetIndex = activePoint.originalIndex;
    if (typeof targetIndex !== 'number' || targetIndex < 0 || targetIndex >= trackPoints.length) {
      return;
    }

    const startY = typeof e?.chartY === 'number' ? e.chartY : 0;
    const currentElevation = trackPoints[targetIndex]?.ele ?? activePoint.elevation ?? 0;

    if (typeof window !== 'undefined') {
      window.getSelection()?.removeAllRanges();
    }

    dragSnapshotRef.current = trackPoints.map(point => ({ ...point }));
    setDragState({
      index: targetIndex,
      startY,
      startElevation: currentElevation,
      hasMoved: false
    });
  }, [trackPoints]);

  const handleChartMouseMove = useCallback(
    (e: any) => {
      if (!dragState || !e || typeof e.chartY !== 'number') {
        return;
      }

      const pixelDelta = dragState.startY - e.chartY;
      if (!dragState.hasMoved && Math.abs(pixelDelta) < 2) {
        return;
      }

      if (!dragSnapshotRef.current) {
        dragSnapshotRef.current = trackPoints.map(point => ({ ...point }));
      }

      const snapshot = dragSnapshotRef.current;
      if (!snapshot) {
        return;
      }

      const chartHeight = e.chartHeight ?? 300;
      const elevationRange = Math.max(stats.maxElevation - stats.minElevation, 1);
      const metersPerPixel = elevationRange / Math.max(chartHeight, 1);
      const elevationChange = pixelDelta * metersPerPixel;

      const effectiveRadius = Math.max(0, Math.round(smoothingRadius));
      const newElevation = dragState.startElevation + elevationChange;

      if (!dragState.hasMoved) {
        pushHistory();
      }

      const updatedPoints = applySmoothTransition(
        snapshot,
        dragState.index,
        newElevation,
        effectiveRadius,
        smoothingStrength
      );

      setTrackPoints(updatedPoints);
      dragSnapshotRef.current = updatedPoints;
      setEditedPoints(prev => {
        const next = new Set(prev);
        for (let offset = -effectiveRadius; offset <= effectiveRadius; offset++) {
          const affectedIndex = dragState.index + offset;
          if (affectedIndex >= 0 && affectedIndex < updatedPoints.length) {
            next.add(affectedIndex);
          }
        }
        return next;
      });

      if (!dragState.hasMoved) {
        setDragState(prev => (prev ? { ...prev, hasMoved: true } : prev));
      }
    },
    [
      dragState,
      applySmoothTransition,
      stats,
      smoothingRadius,
      smoothingStrength,
      trackPoints,
      pushHistory
    ]
  );

  const completeDrag = useCallback(
    (allowClickSmoothing: boolean) => {
      if (!dragState) {
        return;
      }

      const effectiveRadius = Math.max(0, Math.round(smoothingRadius));

      if (!dragState.hasMoved && allowClickSmoothing && smoothingStrength > 0) {
        const snapshot = dragSnapshotRef.current ?? trackPoints;
        pushHistory();
        const smoothedPoints = applyClickSmoothing(
          snapshot,
          dragState.index,
          effectiveRadius,
          smoothingStrength
        );

        setTrackPoints(smoothedPoints);
        setEditedPoints(prev => {
          const next = new Set(prev);
          for (let offset = -effectiveRadius; offset <= effectiveRadius; offset++) {
            const affectedIndex = dragState.index + offset;
            if (affectedIndex >= 0 && affectedIndex < smoothedPoints.length) {
              next.add(affectedIndex);
            }
          }
          return next;
        });
      }

      setDragState(null);
      dragSnapshotRef.current = null;
    },
    [
      dragState,
      trackPoints,
      smoothingRadius,
      smoothingStrength,
      applyClickSmoothing,
      pushHistory
    ]
  );

  const handleChartMouseUp = useCallback(() => {
    completeDrag(true);
  }, [completeDrag]);

  const handleChartMouseLeave = useCallback(() => {
    completeDrag(false);
  }, [completeDrag]);

  const resetElevation = useCallback(() => {
    console.log('Resetting elevation to original');
    if (editedPoints.size > 0) {
      pushHistory();
    }
    setTrackPoints(gpxData.trackPoints);
    setEditedPoints(new Set());
    setDragState(null);
    dragSnapshotRef.current = null;
  }, [gpxData.trackPoints, editedPoints, pushHistory]);

  const downloadModifiedGPX = useCallback(() => {
    console.log('Downloading modified GPX');
    const modifiedGpxData = { ...gpxData, trackPoints };
    const gpxContent = exportGPX(modifiedGpxData, originalContent);
    
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace('.gpx', '_edited.gpx');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [gpxData, trackPoints, originalContent, filename]);

  return (
    <div className="w-full p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Elevation Profile Editor</h1>
          <p className="text-slate-600 mt-1">{filename}</p>
        </div>
        <div className="flex gap-2">
          <Button variant={outlineVariant} onClick={handleUndo} disabled={!canUndo}>
            <Undo2 className="h-4 w-4 mr-2" />
            Undo
          </Button>
          <Button variant="outline" onClick={resetElevation}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={downloadModifiedGPX}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-4">
        <Card className="p-4">
          <div className="text-sm text-slate-600">Distance</div>
          <div className="text-lg font-bold">
            {convertDistance(stats.totalDistance).toFixed(1)} {distanceUnitLabel}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Lowest Point</div>
          <div className="text-lg font-bold">
            {Math.round(convertElevation(stats.minElevation))} {elevationUnitLabel}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Highest Point</div>
          <div className="text-lg font-bold">
            {Math.round(convertElevation(stats.maxElevation))} {elevationUnitLabel}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Total Ascent</div>
          <div className="text-lg font-bold">
            {Math.round(convertElevation(stats.totalAscent))} {elevationUnitLabel}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Total Descent</div>
          <div className="text-lg font-bold">
            {Math.round(convertElevation(stats.totalDescent))} {elevationUnitLabel}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Edited Points</div>
          <div className="text-lg font-bold text-amber-600">{stats.editedCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Total Time</div>
          <div className="text-lg font-bold">
            {stats.totalDurationMs && stats.totalDurationMs > 0
              ? formatDuration(stats.totalDurationMs)
              : '—'}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Avg Speed</div>
          <div className="text-lg font-bold">
            {stats.averageSpeed != null
              ? `${convertSpeed(stats.averageSpeed).toFixed(1)} ${speedUnitLabel}`
              : '—'}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Max Speed</div>
          <div className="text-lg font-bold">
            {stats.maxSpeed != null
              ? `${convertSpeed(stats.maxSpeed).toFixed(1)} ${speedUnitLabel}`
              : '—'}
          </div>
        </Card>
      </div>

      {/* Help Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <strong>How to edit:</strong> Drag a point up or down to reshape the profile. Neighbouring samples adjust using the radius and intensity below. Click without dragging to apply a quick local smoothing. 
              {stats.editedCount > 0 && (
                <span className="ml-2">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    {stats.editedCount} points modified
                  </Badge>
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smoothing Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Smoothing Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="smoothing-radius" className="text-sm text-slate-600">
                  Affected points (each side)
                </Label>
                <span className="text-sm text-slate-600">{Math.round(smoothingRadius)} pts</span>
              </div>
              <Slider
                id="smoothing-radius"
                min={0}
                max={Math.max(0, maxSmoothingRadius)}
                step={1}
                value={[Math.max(0, Math.min(Math.round(smoothingRadius), maxSmoothingRadius))]}
                onValueChange={(value: number[]) => {
                  const raw = value[0] ?? 0;
                  setSmoothingRadius(Math.max(0, Math.min(raw, maxSmoothingRadius)));
                }}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="smoothing-strength" className="text-sm text-slate-600">
                  Smoothing intensity
                </Label>
                <span className="text-sm text-slate-600">{Math.round(smoothingStrength * 100)}%</span>
              </div>
              <Slider
                id="smoothing-strength"
                min={0}
                max={100}
                step={5}
                value={[Math.round(smoothingStrength * 100)]}
                onValueChange={(value: number[]) => {
                  const next = (value[0] ?? 0) / 100;
                  setSmoothingStrength(Math.min(Math.max(next, 0), 1));
                }}
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Dragging uses these settings to blend the selected point with its neighbours. Clicking without
            moving applies a gentle average using the same radius and intensity.
          </p>
        </CardContent>
      </Card>

      {/* Elevation Chart */}
      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <CardTitle>Elevation Profile</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-md border border-slate-200">
              <Button
                type="button"
                variant={metricVariant}
                size="sm"
                className="rounded-none"
                onClick={() => setUnitSystem('metric')}
              >
                Metric
              </Button>
              <Button
                type="button"
                variant={imperialVariant}
                size="sm"
                className="rounded-none"
                onClick={() => setUnitSystem('imperial')}
              >
                Imperial
              </Button>
            </div>
            <Button
              variant={ghostVariant}
              size="sm"
              className="text-slate-600 hover:text-slate-800"
              onClick={() => setShowOriginal(prev => !prev)}
            >
              {showOriginal ? (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Hide original
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Show original
                </>
              )}
            </Button>
            <Button
              variant={ghostVariant}
              size="sm"
              className="text-slate-600 hover:text-slate-800"
              onClick={() => setShowMap(prev => !prev)}
            >
              <MapIcon className="h-4 w-4 mr-2" />
              {showMap ? 'Hide map' : 'Show path on map'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className={showMap ? 'grid gap-4 lg:grid-cols-2' : ''}>
            <div className="select-none">
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    onMouseDown={handleChartMouseDown}
                    onMouseMove={handleChartMouseMove}
                    onMouseUp={handleChartMouseUp}
                    onMouseLeave={handleChartMouseLeave}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="distance"
                      type="number"
                      domain={[0, 'dataMax']}
                      tickCount={6}
                      interval="preserveStartEnd"
                      tickFormatter={(value) => {
                        const distance = convertDistance(value);
                        return distance >= 10 ? distance.toFixed(0) : distance.toFixed(1);
                      }}
                      stroke="#64748b"
                    />
                    <YAxis 
                      tickFormatter={(value) => {
                        const elevation = convertElevation(value);
                        return `${Math.round(elevation)}${elevationUnitLabel}`;
                      }}
                      stroke="#64748b"
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        const numericValue = typeof value === 'number' ? value : Number(value);
                        const formatted = convertElevation(numericValue);
                        const displayName = name === 'Original' ? 'Original' : 'Edited';
                        return [`${formatted.toFixed(1)} ${elevationUnitLabel}`, displayName];
                      }}
                      labelFormatter={(value: number) => {
                        const numericValue = typeof value === 'number' ? value : Number(value);
                        const formattedDistance = convertDistance(numericValue);
                        return `Distance: ${formattedDistance.toFixed(2)} ${distanceUnitLabel}`;
                      }}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="elevation"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                      name="Edited"
                      activeDot={{ 
                        r: 6, 
                        fill: '#f59e0b',
                        stroke: '#ffffff',
                        strokeWidth: 2,
                        cursor: 'ns-resize'
                      }}
                    />
                    {showOriginal && (
                      <Line
                        type="monotone"
                        data={originalChartData}
                        dataKey="elevation"
                        stroke="#94a3b8"
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                        strokeDasharray="4 4"
                        name="Original"
                      />
                    )}
                    {/* Reference lines for edited points */}
                    {Array.from(editedPoints).slice(0, 5).map(index => (
                      <ReferenceLine
                        key={index}
                        x={trackPoints[index]?.distance || 0}
                        stroke="#f59e0b"
                        strokeDasharray="2 2"
                        strokeOpacity={0.5}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-center text-xs text-slate-500">
                Distance ({distanceUnitLabel})
              </div>
            </div>
            {showMap && (
              <div className="flex flex-col gap-2">
                <ElevationMap points={trackPoints} />
                <div className="text-center text-xs text-slate-500">
                  Map data © OpenStreetMap contributors
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
