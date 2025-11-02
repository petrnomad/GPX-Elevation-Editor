/**
 * Unit tests for statistics calculation
 */

import { calculateElevationStats } from '../statistics';
import { TrackPoint } from '@/lib/gpx-parser';

// Helper to create mock track points
const createMockPoint = (
  ele: number,
  distance: number,
  time?: string
): TrackPoint => ({
  lat: 0,
  lon: 0,
  ele,
  distance,
  time,
  originalIndex: 0
});

describe('calculateElevationStats', () => {
  it('should calculate min and max elevation correctly', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(150, 1000),
      createMockPoint(120, 2000),
      createMockPoint(180, 3000),
      createMockPoint(90, 4000)
    ];

    const stats = calculateElevationStats(points, 4000, 0);

    expect(stats.minElevation).toBe(90);
    expect(stats.maxElevation).toBe(180);
  });

  it('should calculate total ascent and descent', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(150, 1000), // +50
      createMockPoint(120, 2000), // -30
      createMockPoint(180, 3000), // +60
      createMockPoint(170, 4000)  // -10
    ];

    const stats = calculateElevationStats(points, 4000, 0);

    expect(stats.totalAscent).toBeGreaterThan(0);
    expect(stats.totalDescent).toBeGreaterThan(0);
  });

  it('should handle single point', () => {
    const points: TrackPoint[] = [createMockPoint(100, 0)];

    const stats = calculateElevationStats(points, 0, 0);

    expect(stats.minElevation).toBe(100);
    expect(stats.maxElevation).toBe(100);
    expect(stats.totalAscent).toBe(0);
    expect(stats.totalDescent).toBe(0);
  });

  it('should handle two points', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(150, 1000)
    ];

    const stats = calculateElevationStats(points, 1000, 0);

    expect(stats.minElevation).toBe(100);
    expect(stats.maxElevation).toBe(150);
  });

  it('should track edited count', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(150, 1000),
      createMockPoint(120, 2000)
    ];

    const stats = calculateElevationStats(points, 2000, 5);

    expect(stats.editedCount).toBe(5);
  });

  it('should calculate duration when time data is present', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0, '2024-01-01T10:00:00Z'),
      createMockPoint(150, 1000, '2024-01-01T10:15:00Z'), // +15 min
      createMockPoint(120, 2000, '2024-01-01T10:30:00Z')  // +15 min
    ];

    const stats = calculateElevationStats(points, 2000, 0);

    expect(stats.totalDurationMs).toBe(30 * 60 * 1000); // 30 minutes in ms
  });

  it('should calculate average speed when duration is available', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0, '2024-01-01T10:00:00Z'),
      createMockPoint(150, 1000, '2024-01-01T10:10:00Z') // 1000m in 10 minutes
    ];

    const stats = calculateElevationStats(points, 1000, 0);

    expect(stats.averageSpeed).not.toBeNull();
    if (stats.averageSpeed !== null) {
      // 1000m / 600s = 1.67 m/s approximately
      expect(stats.averageSpeed).toBeCloseTo(1.67, 1);
    }
  });

  it('should return null for average speed when no time data', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(150, 1000)
    ];

    const stats = calculateElevationStats(points, 1000, 0);

    expect(stats.averageSpeed).toBeNull();
    expect(stats.maxSpeed).toBeNull();
  });

  it('should calculate max speed correctly', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0, '2024-01-01T10:00:00Z'),
      createMockPoint(150, 100, '2024-01-01T10:01:00Z'),   // 100m in 60s = 1.67 m/s
      createMockPoint(120, 600, '2024-01-01T10:02:00Z'),   // 500m in 60s = 8.33 m/s
      createMockPoint(180, 800, '2024-01-01T10:04:00Z')    // 200m in 120s = 1.67 m/s
    ];

    const stats = calculateElevationStats(points, 800, 0);

    expect(stats.maxSpeed).not.toBeNull();
    if (stats.maxSpeed !== null) {
      // Max speed should be around 8.33 m/s
      expect(stats.maxSpeed).toBeGreaterThan(5);
    }
  });

  it('should handle invalid time data gracefully', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0, 'invalid'),
      createMockPoint(150, 1000, '2024-01-01T10:00:00Z')
    ];

    const stats = calculateElevationStats(points, 1000, 0);

    expect(stats).toBeDefined();
    expect(stats.minElevation).toBe(100);
    expect(stats.maxElevation).toBe(150);
  });

  it('should use total distance parameter', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(150, 1000)
    ];

    const stats = calculateElevationStats(points, 5000, 0);

    expect(stats.totalDistance).toBe(5000);
  });

  it('should handle flat elevation profile', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(100, 1000),
      createMockPoint(100, 2000),
      createMockPoint(100, 3000)
    ];

    const stats = calculateElevationStats(points, 3000, 0);

    expect(stats.minElevation).toBe(100);
    expect(stats.maxElevation).toBe(100);
    expect(stats.totalAscent).toBe(0);
    expect(stats.totalDescent).toBe(0);
  });

  it('should handle only ascending elevation', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(150, 1000),
      createMockPoint(200, 2000),
      createMockPoint(250, 3000)
    ];

    const stats = calculateElevationStats(points, 3000, 0);

    expect(stats.totalAscent).toBeGreaterThan(0);
    expect(stats.totalDescent).toBe(0);
  });

  it('should handle only descending elevation', () => {
    const points: TrackPoint[] = [
      createMockPoint(250, 0),
      createMockPoint(200, 1000),
      createMockPoint(150, 2000),
      createMockPoint(100, 3000)
    ];

    const stats = calculateElevationStats(points, 3000, 0);

    expect(stats.totalAscent).toBe(0);
    expect(stats.totalDescent).toBeGreaterThan(0);
  });
});
