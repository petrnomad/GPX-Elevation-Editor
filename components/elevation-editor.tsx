"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Download, RotateCcw, Info, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { GPXData, TrackPoint, exportGPX } from '@/lib/gpx-parser';

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
  const maxSmoothingRadius = useMemo(
    () => Math.max(0, Math.min(200, Math.floor(trackPoints.length / 8))),
    [trackPoints.length]
  );
  const canUndo = history.length > 0;

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
    const elevations = trackPoints.map(p => p.ele);
    const minEle = Math.min(...elevations);
    const maxEle = Math.max(...elevations);
    const totalGain = trackPoints.reduce((gain, point, index) => {
      if (index === 0) return 0;
      const diff = point.ele - trackPoints[index - 1].ele;
      return gain + (diff > 0 ? diff : 0);
    }, 0);

    return {
      minElevation: minEle,
      maxElevation: maxEle,
      totalGain: totalGain,
      totalDistance: gpxData.totalDistance,
      editedCount: editedPoints.size
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
          <Button variant="outline" onClick={handleUndo} disabled={!canUndo}>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-slate-600">Distance</div>
          <div className="text-lg font-bold">{(stats.totalDistance / 1000).toFixed(1)} km</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Min Elevation</div>
          <div className="text-lg font-bold">{stats.minElevation.toFixed(0)} m</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Max Elevation</div>
          <div className="text-lg font-bold">{stats.maxElevation.toFixed(0)} m</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Total Gain</div>
          <div className="text-lg font-bold">{stats.totalGain.toFixed(0)} m</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600">Edited Points</div>
          <div className="text-lg font-bold text-amber-600">{stats.editedCount}</div>
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
        <CardContent className="space-y-6">
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
              onValueChange={value => {
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
              onValueChange={value => {
                const next = (value[0] ?? 0) / 100;
                setSmoothingStrength(Math.min(Math.max(next, 0), 1));
              }}
            />
          </div>
          <p className="text-xs text-slate-500">
            Dragging uses these settings to blend the selected point with its neighbours. Clicking without
            moving applies a gentle average using the same radius and intensity.
          </p>
        </CardContent>
      </Card>

      {/* Elevation Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Elevation Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full select-none">
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
                  tickFormatter={(value) => `${(value / 1000).toFixed(1)}km`}
                  stroke="#64748b"
                />
                <YAxis 
                  tickFormatter={(value) => `${value}m`}
                  stroke="#64748b"
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}m`,
                    'Elevation'
                  ]}
                  labelFormatter={(value: number) => `Distance: ${(value / 1000).toFixed(2)}km`}
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
                  activeDot={{ 
                    r: 6, 
                    fill: '#f59e0b',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                    cursor: 'ns-resize'
                  }}
                />
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
        </CardContent>
      </Card>
    </div>
  );
}
