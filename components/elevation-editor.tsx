"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { Download, RotateCcw, Info, Undo2, Eye, EyeOff, Map as MapIcon, ZoomIn, ZoomOut, ArrowLeft, ArrowRight, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { GPXData, TrackPoint, exportGPX } from '@/lib/gpx-parser';
const ElevationMap = dynamic<{ points: Array<{ lat: number; lon: number }>; hoveredPointIndex?: number | null }>(
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
  onLoadNewFile?: (content: string, filename: string) => void;
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

interface AnomalyRegion {
  startDistance: number;
  endDistance: number;
  severity: number;
}

const detectElevationAnomalies = (trackPoints: TrackPoint[]): AnomalyRegion[] => {
  if (trackPoints.length < 10) {
    console.log('Not enough points for anomaly detection:', trackPoints.length);
    return [];
  }

  const elevations = trackPoints.map(p => p.ele);
  const distances = trackPoints.map(p => p.distance || 0);

  // Calculate elevation changes (gradient) between consecutive points
  const gradients: number[] = [];
  for (let i = 1; i < elevations.length; i++) {
    const elevChange = elevations[i] - elevations[i - 1];
    const distChange = (distances[i] - distances[i - 1]) || 1;
    // Gradient in meters per meter
    gradients.push(Math.abs(elevChange / distChange));
  }

  // Calculate average gradient
  const avgGradient = gradients.reduce((sum, g) => sum + g, 0) / gradients.length;
  const gradientThreshold = Math.max(avgGradient * 3, 0.05); // 3x average or minimum 5% grade

  console.log(`Average gradient: ${(avgGradient * 100).toFixed(2)}%, threshold: ${(gradientThreshold * 100).toFixed(2)}%`);

  // Also check for absolute elevation changes (detect sudden jumps)
  const elevationChanges: number[] = [];
  for (let i = 1; i < elevations.length; i++) {
    elevationChanges.push(Math.abs(elevations[i] - elevations[i - 1]));
  }

  // Find steep sections - either high gradient OR large absolute elevation change
  const isSteep: boolean[] = [false]; // First point has no gradient
  for (let i = 0; i < gradients.length; i++) {
    const hasHighGradient = gradients[i] > gradientThreshold;
    const hasLargeElevationChange = elevationChanges[i] >= 10; // 10+ meters absolute change (increased from 8)
    isSteep.push(hasHighGradient || hasLargeElevationChange);
  }

  const steepCount = isSteep.filter(s => s).length;
  console.log(`Found ${steepCount} steep points out of ${trackPoints.length} total points`);

  // Log steep points
  isSteep.forEach((steep, i) => {
    if (steep && i > 0) {
      const elevChange = i - 1 < elevationChanges.length ? elevationChanges[i - 1] : 0;
      console.log(`Steep section at index ${i}, distance: ${(distances[i] / 1000).toFixed(3)}km, elevation: ${elevations[i]}m, gradient: ${(gradients[i - 1] * 100).toFixed(2)}%, elev change: ${elevChange.toFixed(1)}m`);
    }
  });

  // Group steep sections into anomaly regions
  const regions: AnomalyRegion[] = [];
  const maxGap = 5; // Allow up to 5 non-steep points between steep sections (reduced from 7)
  let regionStart: number | null = null;
  let regionEnd: number | null = null;
  let maxSeverity = 0;
  let gapCounter = 0;
  let steepPointsInRegion = 0;

  for (let i = 0; i < isSteep.length; i++) {
    if (isSteep[i]) {
      if (regionStart === null) {
        // Start new region - go back to capture the full anomaly
        regionStart = Math.max(0, i - 5);
        regionEnd = i;
        const severity = i > 0 ? gradients[i - 1] / gradientThreshold : 1;
        maxSeverity = severity;
        steepPointsInRegion = 1;
        gapCounter = 0;
      } else {
        // Continue region
        regionEnd = i;
        const severity = i > 0 ? gradients[i - 1] / gradientThreshold : 1;
        maxSeverity = Math.max(maxSeverity, severity);
        steepPointsInRegion++;
        gapCounter = 0;
      }
    } else if (regionStart !== null) {
      // We're in a gap
      gapCounter++;

      if (gapCounter > maxGap) {
        // Gap too large, end the region - extend forward to capture the full anomaly
        regionEnd = Math.min(trackPoints.length - 1, regionEnd! + 3);

        if (steepPointsInRegion >= 3) { // At least 3 steep points (increased from 2)
          const region = {
            startDistance: distances[regionStart] / 1000,
            endDistance: distances[regionEnd] / 1000,
            severity: maxSeverity
          };
          console.log(`Steep region: ${region.startDistance.toFixed(2)}km - ${region.endDistance.toFixed(2)}km, severity: ${region.severity.toFixed(2)}, points: ${steepPointsInRegion}`);
          regions.push({
            startDistance: distances[regionStart],
            endDistance: distances[regionEnd],
            severity: maxSeverity
          });
        }
        regionStart = null;
        regionEnd = null;
        maxSeverity = 0;
        steepPointsInRegion = 0;
        gapCounter = 0;
      }
    }
  }

  // Handle final region
  if (regionStart !== null && regionEnd !== null && steepPointsInRegion >= 3) {
    regionEnd = Math.min(trackPoints.length - 1, regionEnd + 5);
    const region = {
      startDistance: distances[regionStart] / 1000,
      endDistance: distances[regionEnd] / 1000,
      severity: maxSeverity
    };
    console.log(`Steep region (end): ${region.startDistance.toFixed(2)}km - ${region.endDistance.toFixed(2)}km, severity: ${region.severity.toFixed(2)}, points: ${steepPointsInRegion}`);
    regions.push({
      startDistance: distances[regionStart],
      endDistance: distances[regionEnd],
      severity: maxSeverity
    });
  }

  console.log(`Total anomaly regions detected: ${regions.length}`);
  return regions;
};

export function ElevationEditor({ gpxData, originalContent, filename, onLoadNewFile }: ElevationEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [showMap, setShowMap] = useState(true);
  const [mapKey, setMapKey] = useState(0);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const [ignoredAnomalies, setIgnoredAnomalies] = useState<Set<number>>(new Set());
  const animationFrameRef = useRef<number | null>(null);
  const maxSmoothingRadius = useMemo(
    () => Math.max(0, Math.min(200, Math.floor(trackPoints.length / 8))),
    [trackPoints.length]
  );
  const canUndo = history.length > 0;
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSmoothingRadius(prev => Math.max(0, Math.min(prev, maxSmoothingRadius)));
  }, [maxSmoothingRadius]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);


  // Convert track points to chart data
  const chartData: ChartDataPoint[] = useMemo(() => {
    return trackPoints.map((point, index) => ({
      distance: point.distance || 0,
      elevation: point.ele,
      originalIndex: index,
      isEdited: editedPoints.has(index)
    }));
  }, [trackPoints, editedPoints]);

  const originalChartData = useMemo(() => {
    return gpxData.trackPoints.map((point, index) => ({
      distance: point.distance || 0,
      elevation: point.ele,
      originalIndex: index
    }));
  }, [gpxData.trackPoints]);

  // Detect elevation anomalies
  const allAnomalyRegions = useMemo(() => {
    const regions = detectElevationAnomalies(trackPoints);
    console.log('Detected anomaly regions:', regions);
    console.log('Total track points:', trackPoints.length);
    if (regions.length > 0) {
      console.log('First region for rendering check:', {
        startDistance: regions[0].startDistance,
        endDistance: regions[0].endDistance,
        severity: regions[0].severity
      });
    }
    return regions;
  }, [trackPoints]);

  // Filter out ignored anomalies
  const anomalyRegions = useMemo(() => {
    return allAnomalyRegions.filter((_, index) => !ignoredAnomalies.has(index));
  }, [allAnomalyRegions, ignoredAnomalies]);

  const handleIgnoreAnomaly = useCallback((anomalyIndex: number) => {
    setIgnoredAnomalies(prev => {
      const next = new Set(prev);
      // Find the actual index in allAnomalyRegions
      let currentVisibleIndex = 0;
      for (let i = 0; i < allAnomalyRegions.length; i++) {
        if (!prev.has(i)) {
          if (currentVisibleIndex === anomalyIndex) {
            next.add(i);
            break;
          }
          currentVisibleIndex++;
        }
      }
      return next;
    });
  }, [allAnomalyRegions]);

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

    if (!activePoint) {
      return;
    }

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
      // Track hovered point for map marker (even when not dragging)
      const activePoint = e?.activePayload?.[0]?.payload;
      if (activePoint && typeof activePoint.originalIndex === 'number') {
        setHoveredPointIndex(activePoint.originalIndex);
      }

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
    setHoveredPointIndex(null);
  }, [completeDrag]);

  const animatePan = useCallback((targetMin: number, targetMax: number, duration: number = 300) => {
    if (!zoomDomain) return;

    // Cancel any ongoing animation
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const startMin = zoomDomain[0];
    const startMax = zoomDomain[1];
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentMin = startMin + (targetMin - startMin) * eased;
      const currentMax = startMax + (targetMax - startMax) * eased;

      setZoomDomain([currentMin, currentMax]);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [zoomDomain]);

  const zoomIn = useCallback(() => {
    const currentDomain = zoomDomain || [0, stats.totalDistance];
    const [domainMin, domainMax] = currentDomain;
    const domainRange = domainMax - domainMin;
    const newRange = domainRange * 0.9; // Zoom in (90% of current range)

    const center = (domainMin + domainMax) / 2;
    const newMin = Math.max(0, center - newRange / 2);
    const newMax = Math.min(stats.totalDistance, center + newRange / 2);

    if (newMax - newMin > stats.totalDistance * 0.05) {
      if (zoomDomain) {
        animatePan(newMin, newMax);
      } else {
        setZoomDomain([newMin, newMax]);
      }
    }
  }, [zoomDomain, stats.totalDistance, animatePan]);

  const zoomOut = useCallback(() => {
    const currentDomain = zoomDomain || [0, stats.totalDistance];
    const [domainMin, domainMax] = currentDomain;
    const domainRange = domainMax - domainMin;
    const newRange = domainRange * 1.1; // Zoom out (110% of current range)

    const center = (domainMin + domainMax) / 2;
    const newMin = Math.max(0, center - newRange / 2);
    const newMax = Math.min(stats.totalDistance, center + newRange / 2);

    // Don't allow zooming out beyond original view
    if (newMax - newMin >= stats.totalDistance) {
      setZoomDomain(null);
    } else {
      if (zoomDomain) {
        animatePan(newMin, newMax);
      } else {
        setZoomDomain([newMin, newMax]);
      }
    }
  }, [zoomDomain, stats.totalDistance, animatePan]);

  const resetZoom = useCallback(() => {
    setZoomDomain(null);
  }, []);

  const panLeft = useCallback(() => {
    if (!zoomDomain) return;
    const [domainMin, domainMax] = zoomDomain;
    const domainRange = domainMax - domainMin;
    const panAmount = domainRange * 0.2; // Pan by 20% of visible range

    let newMin = domainMin - panAmount;
    let newMax = domainMax - panAmount;

    // Prevent over-panning
    if (newMin < 0) {
      newMin = 0;
      newMax = domainRange;
    }

    animatePan(newMin, newMax);
  }, [zoomDomain, animatePan]);

  const panRight = useCallback(() => {
    if (!zoomDomain) return;
    const [domainMin, domainMax] = zoomDomain;
    const domainRange = domainMax - domainMin;
    const panAmount = domainRange * 0.2; // Pan by 20% of visible range

    let newMin = domainMin + panAmount;
    let newMax = domainMax + panAmount;

    // Prevent over-panning
    if (newMax > stats.totalDistance) {
      newMax = stats.totalDistance;
      newMin = stats.totalDistance - domainRange;
    }

    animatePan(newMin, newMax);
  }, [zoomDomain, stats.totalDistance, animatePan]);

  const resetElevation = useCallback(() => {
    if (editedPoints.size > 0) {
      pushHistory();
    }
    setTrackPoints(gpxData.trackPoints);
    setEditedPoints(new Set());
    setDragState(null);
    dragSnapshotRef.current = null;
  }, [gpxData.trackPoints, editedPoints, pushHistory]);

  const downloadModifiedGPX = useCallback(() => {
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

  const handleLoadNewFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content && onLoadNewFile) {
        onLoadNewFile(content, file.name);
      }
    };
    reader.readAsText(file);

    // Reset input to allow loading the same file again
    event.target.value = '';
  }, [onLoadNewFile]);

  return (
    <div className="w-full p-6 space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".gpx"
        onChange={handleFileChange}
        className="hidden"
      />

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
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleLoadNewFile}>
            <Upload className="h-4 w-4 mr-2" />
            Load GPX
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
                  <Badge className="bg-amber-100 text-amber-800 border-transparent">
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
          <CardTitle>Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="smoothing-radius" className="text-sm text-slate-600">
                  Smoothing affected points (each side)
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
          <div className="flex items-center gap-2">
            <CardTitle>Elevation Profile</CardTitle>
            {anomalyRegions.length > 0 && (
              <Badge className="bg-red-100 text-red-800 border-transparent">
                {anomalyRegions.length} elevation {anomalyRegions.length === 1 ? 'anomaly' : 'anomalies'} detected
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-md border border-slate-200">
              <Button
                type="button"
                variant={unitSystem === 'metric' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none"
                onClick={() => setUnitSystem('metric')}
              >
                Metric
              </Button>
              <Button
                type="button"
                variant={unitSystem === 'imperial' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-none"
                onClick={() => setUnitSystem('imperial')}
              >
                Imperial
              </Button>
            </div>
            <Button
              variant="ghost"
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
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-800"
              onClick={() => {
                setShowMap(prev => {
                  if (!prev) {
                    // When showing the map, increment the key to force a fresh instance
                    setMapKey(k => k + 1);
                  }
                  return !prev;
                });
              }}
            >
              <MapIcon className="h-4 w-4 mr-2" />
              {showMap ? 'Hide map' : 'Show path on map'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className={showMap ? 'grid gap-4 lg:grid-cols-2' : ''}>
            <div className="select-none relative">
              {/* Zoom controls overlay - left top */}
              <div className="absolute z-10 flex flex-col gap-1 border border-slate-200 rounded-md p-1 shadow-lg" style={{ left: '80px', top: '15px', background: 'white' }}>
                <Button variant="ghost" size="icon" onClick={zoomIn} title="Zoom in" className="h-8 w-8 hover:bg-slate-100">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={zoomOut} title="Zoom out" className="h-8 w-8 hover:bg-slate-100">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                {zoomDomain && (
                  <Button variant="ghost" size="icon" onClick={resetZoom} title="Reset zoom" className="h-8 w-8 hover:bg-slate-100">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Pan controls overlay - right top */}
              {zoomDomain && (
                <div className="absolute top-4 right-4 z-10 flex gap-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-md p-1 shadow-lg">
                  <Button variant="ghost" size="icon" onClick={panLeft} title="Pan left" className="h-8 w-8 hover:bg-slate-100">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={panRight} title="Pan right" className="h-8 w-8 hover:bg-slate-100">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="h-96 w-full relative" style={{ minHeight: '384px' }} ref={chartContainerRef}>
                {/* Anomaly close buttons overlay */}
                {anomalyRegions.length > 0 && chartContainerRef.current && (
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                    {anomalyRegions.map((region, index) => {
                      const totalDistance = stats.totalDistance;
                      const domain = zoomDomain || [0, totalDistance];

                      // Calculate position as percentage (place at the end of anomaly region)
                      const leftPercent = ((region.endDistance - domain[0]) / (domain[1] - domain[0])) * 100;

                      // Only show if within visible range
                      if (leftPercent < 0 || leftPercent > 100) return null;

                      return (
                        <button
                          key={`close-${index}`}
                          onClick={() => handleIgnoreAnomaly(index)}
                          className="absolute pointer-events-auto bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md transition-colors"
                          style={{
                            left: `calc(${leftPercent}% + 12px)`,
                            top: '-4px',
                          }}
                          title="Ignore this anomaly"
                        >
                          ×
                        </button>
                      );
                    })}
                  </div>
                )}
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
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
                      domain={zoomDomain || [0, 'dataMax']}
                      allowDataOverflow={true}
                      tickCount={15}
                      interval="preserveStartEnd"
                      tickFormatter={(value) => {
                        const distance = convertDistance(value);
                        return distance >= 10 ? distance.toFixed(0) : distance.toFixed(1);
                      }}
                      stroke="#64748b"
                    />
                    <YAxis
                      allowDataOverflow={true}
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
                    {/* Anomaly regions - light red background (must come BEFORE Lines for proper z-order) */}
                    {anomalyRegions.length > 0 && console.log('Rendering', anomalyRegions.length, 'anomaly regions')}
                    {anomalyRegions.map((region, index) => {
                      console.log(`Rendering ReferenceArea ${index}:`, {
                        x1: region.startDistance,
                        x2: region.endDistance,
                        opacity: Math.min(0.4 + region.severity * 0.1, 0.8)
                      });
                      return (
                        <ReferenceArea
                          key={`anomaly-${index}`}
                          x1={region.startDistance}
                          x2={region.endDistance}
                          fill="#ff0000"
                          fillOpacity={0.2}
                          ifOverflow="visible"
                        />
                      );
                    })}
                    <Line
                      type="monotone"
                      dataKey="elevation"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                      name="Edited"
                      isAnimationActive={false}
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
              <div
                className="flex flex-col gap-2"
                key={`map-container-${mapKey}`}
                style={{ isolation: 'isolate' }}
              >
                <ElevationMap
                  key={`elevation-map-${mapKey}`}
                  points={trackPoints}
                  hoveredPointIndex={hoveredPointIndex}
                />
               
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
