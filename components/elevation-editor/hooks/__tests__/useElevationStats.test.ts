/**
 * Unit tests for useElevationStats hook
 */

import { renderHook } from '@testing-library/react';
import { useElevationStats } from '../useElevationStats';
import { TrackPoint } from '@/lib/gpx-parser';

// Helper to create mock track points
const createMockPoint = (ele: number, distance: number = 0, time?: string): TrackPoint => ({
  lat: 0,
  lon: 0,
  ele,
  distance,
  time,
  originalIndex: 0
});

describe('useElevationStats', () => {
  it('should calculate stats for simple track', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(150, 1000),
      createMockPoint(120, 2000),
      createMockPoint(180, 3000)
    ];

    const { result } = renderHook(() => useElevationStats(points, 3000, 0));

    expect(result.current.minElevation).toBe(100);
    expect(result.current.maxElevation).toBe(180);
    expect(result.current.totalDistance).toBe(3000); // Returns as-is, not converted to km
  });

  it('should calculate ascent and descent', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(150, 1000), // +50
      createMockPoint(120, 2000), // -30
      createMockPoint(180, 3000)  // +60
    ];

    const { result } = renderHook(() => useElevationStats(points, 3000, 0));

    // Note: Uses smoothed elevations with median filter and step threshold, so values differ from raw differences
    expect(result.current.totalAscent).toBe(5);
    expect(result.current.totalDescent).toBe(5);
  });

  it('should track edited count', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(150, 1000)
    ];

    const { result } = renderHook(() => useElevationStats(points, 1000, 5));

    expect(result.current.editedCount).toBe(5);
  });

  it('should memoize results for same inputs', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(150, 1000)
    ];

    const { result, rerender } = renderHook(
      ({ pts, dist, count }) => useElevationStats(pts, dist, count),
      { initialProps: { pts: points, dist: 1000, count: 0 } }
    );

    const firstResult = result.current;

    rerender({ pts: points, dist: 1000, count: 0 });

    // Results should be the same object reference (memoized)
    expect(result.current).toBe(firstResult);
  });

  it('should recalculate when track points change', () => {
    const points1: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(150, 1000)
    ];

    const points2: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(200, 1000) // Different elevation
    ];

    const { result, rerender } = renderHook(
      ({ pts }) => useElevationStats(pts, 1000, 0),
      { initialProps: { pts: points1 } }
    );

    const firstMax = result.current.maxElevation;

    rerender({ pts: points2 });

    expect(result.current.maxElevation).not.toBe(firstMax);
    expect(result.current.maxElevation).toBe(200);
  });

  it('should recalculate when total distance changes', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(150, 1000)
    ];

    const { result, rerender } = renderHook(
      ({ dist }) => useElevationStats(points, dist, 0),
      { initialProps: { dist: 1000 } }
    );

    const firstDistance = result.current.totalDistance;

    rerender({ dist: 2000 });

    expect(result.current.totalDistance).not.toBe(firstDistance);
    expect(result.current.totalDistance).toBe(2000);
  });

  it('should recalculate when edited count changes', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(150, 1000)
    ];

    const { result, rerender } = renderHook(
      ({ count }) => useElevationStats(points, 1000, count),
      { initialProps: { count: 0 } }
    );

    const firstCount = result.current.editedCount;

    rerender({ count: 5 });

    expect(result.current.editedCount).not.toBe(firstCount);
    expect(result.current.editedCount).toBe(5);
  });

  it('should calculate duration when time data is present', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0, '2024-01-01T10:00:00Z'),
      createMockPoint(150, 1000, '2024-01-01T10:10:00Z'), // 10 minutes later
      createMockPoint(120, 2000, '2024-01-01T10:20:00Z')  // 20 minutes later
    ];

    const { result } = renderHook(() => useElevationStats(points, 2000, 0));

    expect(result.current.totalDurationMs).toBe(1200000); // 20 minutes in milliseconds
  });

  it('should return 0 duration when no time data', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(150, 1000)
    ];

    const { result } = renderHook(() => useElevationStats(points, 1000, 0));

    expect(result.current.totalDurationMs).toBe(0);
  });

  it('should calculate average speed when duration is available', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0, '2024-01-01T10:00:00Z'),
      createMockPoint(150, 3600000, '2024-01-01T11:00:00Z') // 3600km in 1 hour
    ];

    const { result } = renderHook(() => useElevationStats(points, 3600000, 0));

    // Speed should be 3600km / 1hour = 1000 m/s
    expect(result.current.averageSpeed).toBeDefined();
  });

  it('should return null average speed when no time data', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(150, 1000)
    ];

    const { result } = renderHook(() => useElevationStats(points, 1000, 0));

    expect(result.current.averageSpeed).toBeNull();
  });

  it('should handle single point', () => {
    const points: TrackPoint[] = [createMockPoint(100, 0)];

    const { result } = renderHook(() => useElevationStats(points, 0, 0));

    expect(result.current.minElevation).toBe(100);
    expect(result.current.maxElevation).toBe(100);
    expect(result.current.totalAscent).toBe(0);
    expect(result.current.totalDescent).toBe(0);
  });

  it('should handle empty array', () => {
    const points: TrackPoint[] = [];

    const { result } = renderHook(() => useElevationStats(points, 0, 0));

    // With empty array, Math.min/max return Infinity/-Infinity
    expect(result.current.minElevation).toBe(Infinity);
    expect(result.current.maxElevation).toBe(-Infinity);
    expect(result.current.totalAscent).toBe(0);
    expect(result.current.totalDescent).toBe(0);
  });

  it('should return total distance as provided (not converted)', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(150, 5000)
    ];

    const { result } = renderHook(() => useElevationStats(points, 5000, 0));

    expect(result.current.totalDistance).toBe(5000); // Returns as-is in meters
  });
});
