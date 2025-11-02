/**
 * Custom hook for managing chart mouse interactions (drag, click, hover)
 */

import { useState, useCallback, useRef } from 'react';
import { TrackPoint } from '@/lib/gpx-parser';
import { DragState, ElevationStats } from '../types';
import { applySmoothTransition, applyClickSmoothing } from '../algorithms/smoothing';

export interface UseChartInteractionsResult {
  hoveredPointIndex: number | null;
  handleChartMouseDown: (e: any) => void;
  handleChartMouseMove: (e: any) => void;
  handleChartMouseUp: () => void;
  handleChartMouseLeave: () => void;
}

/**
 * Manages all mouse interactions with the elevation chart
 *
 * This hook handles drag-to-edit functionality, click-to-smooth, and
 * hover state for the map marker. It coordinates with the smoothing
 * algorithms and history management.
 *
 * @param trackPoints - Current track points
 * @param setTrackPoints - Function to update track points
 * @param editedPoints - Set of edited point indices
 * @param setEditedPoints - Function to update edited points
 * @param smoothingRadius - Smoothing radius setting
 * @param smoothingStrength - Smoothing strength setting
 * @param stats - Elevation statistics for elevation range calculation
 * @param pushHistory - Function to save current state to history
 * @param dragSnapshotRef - Ref to store snapshot during drag
 * @param setDragState - Function to update drag state (for external access)
 * @returns Object with event handlers and hover state
 */
export function useChartInteractions(
  trackPoints: TrackPoint[],
  setTrackPoints: (points: TrackPoint[]) => void,
  editedPoints: Set<number>,
  setEditedPoints: (setter: (prev: Set<number>) => Set<number>) => void,
  smoothingRadius: number,
  smoothingStrength: number,
  stats: ElevationStats,
  pushHistory: () => void,
  dragSnapshotRef: React.MutableRefObject<TrackPoint[] | null>,
  setDragState: (state: DragState | null) => void
): UseChartInteractionsResult {
  const [dragState, setDragStateInternal] = useState<DragState | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Wrapper to keep both internal and external drag state in sync
  const updateDragState = useCallback((state: DragState | null) => {
    setDragStateInternal(state);
    setDragState(state);
  }, [setDragState]);

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
    updateDragState({
      index: targetIndex,
      startY,
      startElevation: currentElevation,
      hasMoved: false
    });
  }, [trackPoints, dragSnapshotRef, updateDragState]);

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
        updateDragState({ ...dragState, hasMoved: true });
      }
    },
    [
      dragState,
      stats,
      smoothingRadius,
      smoothingStrength,
      trackPoints,
      pushHistory,
      dragSnapshotRef,
      setTrackPoints,
      setEditedPoints,
      updateDragState
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

      updateDragState(null);
      dragSnapshotRef.current = null;
    },
    [
      dragState,
      trackPoints,
      smoothingRadius,
      smoothingStrength,
      pushHistory,
      dragSnapshotRef,
      setTrackPoints,
      setEditedPoints,
      updateDragState
    ]
  );

  const handleChartMouseUp = useCallback(() => {
    completeDrag(true);
  }, [completeDrag]);

  const handleChartMouseLeave = useCallback(() => {
    completeDrag(false);
    setHoveredPointIndex(null);
  }, [completeDrag]);

  return {
    hoveredPointIndex,
    handleChartMouseDown,
    handleChartMouseMove,
    handleChartMouseUp,
    handleChartMouseLeave
  };
}
