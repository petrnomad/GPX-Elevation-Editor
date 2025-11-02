/**
 * Unit tests for smoothing algorithms
 */

import { applySmoothTransition, applyClickSmoothing } from '../smoothing';
import { TrackPoint } from '@/lib/gpx-parser';

// Helper to create mock track points
const createMockPoint = (ele: number, distance: number = 0): TrackPoint => ({
  lat: 0,
  lon: 0,
  ele,
  distance,
  originalIndex: 0
});

describe('applySmoothTransition', () => {
  it('should not modify points when radius is 0', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(110, 100),
      createMockPoint(120, 200)
    ];
    const result = applySmoothTransition(points, 1, 115, 0, 0.5);

    expect(result[0].ele).toBe(100);
    expect(result[1].ele).toBe(115); // Only target point changed
    expect(result[2].ele).toBe(120);
  });

  it('should not modify points when strength is 0', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(110, 100),
      createMockPoint(120, 200)
    ];
    const original = points.map(p => ({ ...p }));
    const result = applySmoothTransition(points, 1, 115, 1, 0);

    expect(result[0].ele).toBe(original[0].ele);
    expect(result[1].ele).toBe(115); // Target point still changes
    expect(result[2].ele).toBe(original[2].ele);
  });

  it('should apply full strength smoothing when strength is 1', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(100, 100),
      createMockPoint(100, 200),
      createMockPoint(100, 300),
      createMockPoint(100, 400)
    ];
    const result = applySmoothTransition(points, 2, 120, 1, 1.0);

    // Middle point should be 120
    expect(result[2].ele).toBe(120);
    // Adjacent points should be affected
    expect(result[1].ele).toBeGreaterThan(100);
    expect(result[3].ele).toBeGreaterThan(100);
    // Edge points less affected
    expect(result[0].ele).toBeGreaterThanOrEqual(100);
    expect(result[4].ele).toBeGreaterThanOrEqual(100);
  });

  it('should handle smoothing at array start', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(100, 100),
      createMockPoint(100, 200)
    ];
    const result = applySmoothTransition(points, 0, 120, 2, 0.5);

    expect(result[0].ele).toBe(120);
    expect(result.length).toBe(3);
  });

  it('should handle smoothing at array end', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(100, 100),
      createMockPoint(100, 200)
    ];
    const result = applySmoothTransition(points, 2, 120, 2, 0.5);

    expect(result[2].ele).toBe(120);
    expect(result.length).toBe(3);
  });

  it('should not create negative elevations', () => {
    const points: TrackPoint[] = [
      createMockPoint(10, 0),
      createMockPoint(10, 100),
      createMockPoint(10, 200)
    ];
    const result = applySmoothTransition(points, 1, 0, 5, 2.0);

    result.forEach(point => {
      expect(point.ele).toBeGreaterThanOrEqual(0);
    });
  });

  it('should preserve other point properties', () => {
    const points: TrackPoint[] = [
      { lat: 50.1, lon: 14.5, ele: 100, distance: 0, time: '2024-01-01', originalIndex: 0 },
      { lat: 50.2, lon: 14.6, ele: 110, distance: 100, time: '2024-01-02', originalIndex: 1 },
      { lat: 50.3, lon: 14.7, ele: 120, distance: 200, time: '2024-01-03', originalIndex: 2 }
    ];
    const result = applySmoothTransition(points, 1, 115, 1, 0.5);

    expect(result[1].lat).toBe(50.2);
    expect(result[1].lon).toBe(14.6);
    expect(result[1].distance).toBe(100);
    expect(result[1].time).toBe('2024-01-02');
    expect(result[1].originalIndex).toBe(1);
  });
});

describe('applyClickSmoothing', () => {
  it('should smooth point with radius 0', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(110, 100),
      createMockPoint(120, 200)
    ];
    const result = applyClickSmoothing(points, 1, 0, 0.5);

    // With radius 0, should just return the same point
    expect(result[1].ele).toBe(110);
  });

  it('should average with neighbors when radius is 1', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(150, 100),
      createMockPoint(100, 200)
    ];
    const result = applyClickSmoothing(points, 1, 1, 1.0);

    // Should average 100 + 150 + 100 with weights
    expect(result[1].ele).toBeLessThan(150);
    expect(result[1].ele).toBeGreaterThan(100);
  });

  it('should handle smoothing at array start', () => {
    const points: TrackPoint[] = [
      createMockPoint(120, 0),
      createMockPoint(100, 100),
      createMockPoint(100, 200)
    ];
    const result = applyClickSmoothing(points, 0, 1, 0.5);

    expect(result[0].ele).toBeLessThanOrEqual(120);
    expect(result.length).toBe(3);
  });

  it('should handle smoothing at array end', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(100, 100),
      createMockPoint(120, 200)
    ];
    const result = applyClickSmoothing(points, 2, 1, 0.5);

    expect(result[2].ele).toBeLessThanOrEqual(120);
    expect(result.length).toBe(3);
  });

  it('should not create negative elevations', () => {
    const points: TrackPoint[] = [
      createMockPoint(5, 0),
      createMockPoint(10, 100),
      createMockPoint(5, 200)
    ];
    const result = applyClickSmoothing(points, 1, 2, 2.0);

    result.forEach(point => {
      expect(point.ele).toBeGreaterThanOrEqual(0);
    });
  });

  it('should preserve other point properties', () => {
    const points: TrackPoint[] = [
      { lat: 50.1, lon: 14.5, ele: 100, distance: 0, time: '2024-01-01', originalIndex: 0 },
      { lat: 50.2, lon: 14.6, ele: 110, distance: 100, time: '2024-01-02', originalIndex: 1 },
      { lat: 50.3, lon: 14.7, ele: 120, distance: 200, time: '2024-01-03', originalIndex: 2 }
    ];
    const result = applyClickSmoothing(points, 1, 1, 0.5);

    expect(result[1].lat).toBe(50.2);
    expect(result[1].lon).toBe(14.6);
    expect(result[1].distance).toBe(100);
    expect(result[1].time).toBe('2024-01-02');
  });

  it('should apply strength parameter correctly', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(200, 100),
      createMockPoint(100, 200)
    ];

    const resultLowStrength = applyClickSmoothing(points, 1, 1, 0.1);
    const resultHighStrength = applyClickSmoothing(points, 1, 1, 0.9);

    // Higher strength should result in more smoothing (closer to neighbors)
    expect(Math.abs(resultHighStrength[1].ele - 200)).toBeGreaterThan(
      Math.abs(resultLowStrength[1].ele - 200)
    );
  });
});
