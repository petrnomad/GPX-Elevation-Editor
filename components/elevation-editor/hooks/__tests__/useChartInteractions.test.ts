/**
 * Unit tests for useChartInteractions hook
 *
 * Note: This hook involves complex mouse event handling and DOM interactions.
 * These tests focus on basic state management and initialization.
 */

import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useChartInteractions } from '../useChartInteractions';
import { TrackPoint } from '@/lib/gpx-parser';
import { ElevationStats } from '../../types';

// Helper to create mock track points
const createMockPoint = (ele: number, distance: number = 0): TrackPoint => ({
  lat: 0,
  lon: 0,
  ele,
  distance,
  originalIndex: 0
});

const mockStats: ElevationStats = {
  minElevation: 100,
  maxElevation: 200,
  totalAscent: 50,
  totalDescent: 30,
  totalDistance: 10,
  editedCount: 0,
  duration: null,
  averageSpeed: null,
  maxSpeed: null
};

describe('useChartInteractions', () => {
  let mockTrackPoints: TrackPoint[];
  let setTrackPoints: ReturnType<typeof vi.fn>;
  let setEditedPoints: ReturnType<typeof vi.fn>;
  let pushHistory: ReturnType<typeof vi.fn>;
  let setDragState: ReturnType<typeof vi.fn>;
  let dragSnapshotRef: React.MutableRefObject<TrackPoint[] | null>;
  let editedPoints: Set<number>;

  beforeEach(() => {
    mockTrackPoints = [
      createMockPoint(100, 0),
      createMockPoint(150, 1000),
      createMockPoint(120, 2000)
    ];
    editedPoints = new Set<number>();
    setTrackPoints = vi.fn();
    setEditedPoints = vi.fn();
    pushHistory = vi.fn();
    setDragState = vi.fn();
    dragSnapshotRef = { current: null };
  });

  it('should initialize with null hovered point', () => {
    const { result } = renderHook(() =>
      useChartInteractions(
        mockTrackPoints,
        setTrackPoints,
        editedPoints,
        setEditedPoints,
        5,
        0.25,
        mockStats,
        pushHistory,
        dragSnapshotRef,
        setDragState
      )
    );

    expect(result.current.hoveredPointIndex).toBeNull();
  });

  it('should provide all required event handlers', () => {
    const { result } = renderHook(() =>
      useChartInteractions(
        mockTrackPoints,
        setTrackPoints,
        editedPoints,
        setEditedPoints,
        5,
        0.25,
        mockStats,
        pushHistory,
        dragSnapshotRef,
        setDragState
      )
    );

    expect(typeof result.current.handleChartMouseDown).toBe('function');
    expect(typeof result.current.handleChartMouseMove).toBe('function');
    expect(typeof result.current.handleChartMouseUp).toBe('function');
    expect(typeof result.current.handleChartMouseLeave).toBe('function');
  });

  it('should handle mouse down with invalid event', () => {
    const { result } = renderHook(() =>
      useChartInteractions(
        mockTrackPoints,
        setTrackPoints,
        editedPoints,
        setEditedPoints,
        5,
        0.25,
        mockStats,
        pushHistory,
        dragSnapshotRef,
        setDragState
      )
    );

    act(() => {
      result.current.handleChartMouseDown({});
    });

    expect(dragSnapshotRef.current).toBeNull();
  });

  it('should handle mouse down with valid event', () => {
    const { result } = renderHook(() =>
      useChartInteractions(
        mockTrackPoints,
        setTrackPoints,
        editedPoints,
        setEditedPoints,
        5,
        0.25,
        mockStats,
        pushHistory,
        dragSnapshotRef,
        setDragState
      )
    );

    const mockEvent = {
      activePayload: [{
        payload: {
          originalIndex: 1,
          elevation: 150
        }
      }],
      chartY: 100
    };

    act(() => {
      result.current.handleChartMouseDown(mockEvent);
    });

    expect(dragSnapshotRef.current).toEqual(expect.arrayContaining([
      expect.objectContaining({ ele: 100 }),
      expect.objectContaining({ ele: 150 }),
      expect.objectContaining({ ele: 120 })
    ]));
  });

  it('should call setDragState when mouse down occurs', () => {
    const { result } = renderHook(() =>
      useChartInteractions(
        mockTrackPoints,
        setTrackPoints,
        editedPoints,
        setEditedPoints,
        5,
        0.25,
        mockStats,
        pushHistory,
        dragSnapshotRef,
        setDragState
      )
    );

    const mockEvent = {
      activePayload: [{
        payload: {
          originalIndex: 1,
          elevation: 150
        }
      }],
      chartY: 100
    };

    act(() => {
      result.current.handleChartMouseDown(mockEvent);
    });

    expect(setDragState).toHaveBeenCalledWith(
      expect.objectContaining({
        index: 1,
        startY: 100
      })
    );
  });

  it('should clear drag state on mouse up', () => {
    const { result } = renderHook(() =>
      useChartInteractions(
        mockTrackPoints,
        setTrackPoints,
        editedPoints,
        setEditedPoints,
        5,
        0.25,
        mockStats,
        pushHistory,
        dragSnapshotRef,
        setDragState
      )
    );

    const mockEvent = {
      activePayload: [{
        payload: {
          originalIndex: 1,
          elevation: 150
        }
      }],
      chartY: 100
    };

    act(() => {
      result.current.handleChartMouseDown(mockEvent);
    });

    act(() => {
      result.current.handleChartMouseUp();
    });

    expect(setDragState).toHaveBeenLastCalledWith(null);
  });

  it('should clear hover state on mouse leave', () => {
    const { result } = renderHook(() =>
      useChartInteractions(
        mockTrackPoints,
        setTrackPoints,
        editedPoints,
        setEditedPoints,
        5,
        0.25,
        mockStats,
        pushHistory,
        dragSnapshotRef,
        setDragState
      )
    );

    act(() => {
      result.current.handleChartMouseLeave();
    });

    expect(result.current.hoveredPointIndex).toBeNull();
  });

  it('should not crash with out of bounds index', () => {
    const { result } = renderHook(() =>
      useChartInteractions(
        mockTrackPoints,
        setTrackPoints,
        editedPoints,
        setEditedPoints,
        5,
        0.25,
        mockStats,
        pushHistory,
        dragSnapshotRef,
        setDragState
      )
    );

    const mockEvent = {
      activePayload: [{
        payload: {
          originalIndex: 999, // Out of bounds
          elevation: 150
        }
      }],
      chartY: 100
    };

    act(() => {
      result.current.handleChartMouseDown(mockEvent);
    });

    expect(dragSnapshotRef.current).toBeNull();
  });

  it('should handle negative index gracefully', () => {
    const { result } = renderHook(() =>
      useChartInteractions(
        mockTrackPoints,
        setTrackPoints,
        editedPoints,
        setEditedPoints,
        5,
        0.25,
        mockStats,
        pushHistory,
        dragSnapshotRef,
        setDragState
      )
    );

    const mockEvent = {
      activePayload: [{
        payload: {
          originalIndex: -1,
          elevation: 150
        }
      }],
      chartY: 100
    };

    act(() => {
      result.current.handleChartMouseDown(mockEvent);
    });

    expect(dragSnapshotRef.current).toBeNull();
  });

  it('should accept different smoothing parameters', () => {
    const { result: result1 } = renderHook(() =>
      useChartInteractions(
        mockTrackPoints,
        setTrackPoints,
        editedPoints,
        setEditedPoints,
        5,
        0.25,
        mockStats,
        pushHistory,
        dragSnapshotRef,
        setDragState
      )
    );

    const { result: result2 } = renderHook(() =>
      useChartInteractions(
        mockTrackPoints,
        setTrackPoints,
        editedPoints,
        setEditedPoints,
        10,
        0.5,
        mockStats,
        pushHistory,
        dragSnapshotRef,
        setDragState
      )
    );

    expect(result1.current.handleChartMouseDown).toBeDefined();
    expect(result2.current.handleChartMouseDown).toBeDefined();
  });
});
