/**
 * Custom hook for managing elevation editing history (undo/redo)
 */

import { useState, useCallback, useEffect } from 'react';
import { TrackPoint } from '@/lib/gpx-parser';
import { HistoryEntry } from '../types';
import { HISTORY_LIMIT } from '../constants';

export interface UseElevationHistoryResult {
  canUndo: boolean;
  pushHistory: () => void;
  handleUndo: () => void;
}

/**
 * Manages undo/redo history for elevation edits
 *
 * This hook maintains a stack of previous states and provides functions
 * to push new history entries and undo changes. It also sets up a keyboard
 * shortcut for Ctrl+Z / Cmd+Z.
 *
 * @param trackPoints - Current track points state
 * @param editedPoints - Set of edited point indices
 * @param setTrackPoints - Function to update track points
 * @param setEditedPoints - Function to update edited points set
 * @param setDragState - Function to reset drag state
 * @param dragSnapshotRef - Ref to current drag snapshot
 * @returns Object with undo capability flag and history manipulation functions
 */
export function useElevationHistory(
  trackPoints: TrackPoint[],
  editedPoints: Set<number>,
  setTrackPoints: (points: TrackPoint[]) => void,
  setEditedPoints: (points: Set<number>) => void,
  setDragState: (state: any) => void,
  dragSnapshotRef: React.MutableRefObject<TrackPoint[] | null>
): UseElevationHistoryResult {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const pushHistory = useCallback(() => {
    setHistory(prev => {
      const snapshot: HistoryEntry = {
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
  }, [setTrackPoints, setEditedPoints, setDragState, dragSnapshotRef]);

  // Keyboard shortcut for undo (Ctrl+Z / Cmd+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo]);

  return {
    canUndo: history.length > 0,
    pushHistory,
    handleUndo
  };
}
