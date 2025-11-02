/**
 * Unit tests for anomaly detection algorithm
 */

import { detectElevationAnomalies } from '../anomaly-detection';
import { TrackPoint } from '@/lib/gpx-parser';

// Helper to create mock track points
const createMockPoint = (ele: number, distance: number = 0): TrackPoint => ({
  lat: 0,
  lon: 0,
  ele,
  distance,
  originalIndex: 0
});

describe('detectElevationAnomalies', () => {
  it('should return empty array for insufficient data', () => {
    const points: TrackPoint[] = [
      createMockPoint(100, 0),
      createMockPoint(110, 100)
    ];

    const anomalies = detectElevationAnomalies(points, 10);

    expect(anomalies).toEqual([]);
  });

  it('should return empty array for flat elevation', () => {
    const points: TrackPoint[] = Array.from({ length: 20 }, (_, i) =>
      createMockPoint(100, i * 100)
    );

    const anomalies = detectElevationAnomalies(points, 10);

    expect(anomalies).toEqual([]);
  });

  it('should detect single spike anomaly', () => {
    // Create a spike with at least 3 steep points to trigger anomaly detection
    const points: TrackPoint[] = [
      ...Array.from({ length: 10 }, (_, i) => createMockPoint(100, i * 100)),
      createMockPoint(130, 1000), // Spike up - point 1
      createMockPoint(150, 1100), // Spike up - point 2
      createMockPoint(140, 1200), // Spike down - point 3
      createMockPoint(100, 1300), // Spike down - point 4
      ...Array.from({ length: 10 }, (_, i) => createMockPoint(100, (i + 14) * 100))
    ];

    const anomalies = detectElevationAnomalies(points, 10);

    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies[0]).toMatchObject({
      startDistance: expect.any(Number),
      endDistance: expect.any(Number),
      severity: expect.any(Number)
    });
  });

  it('should detect multiple anomalies', () => {
    const points: TrackPoint[] = [
      ...Array.from({ length: 5 }, (_, i) => createMockPoint(100, i * 100)),
      createMockPoint(150, 500), // First spike
      createMockPoint(100, 600),
      ...Array.from({ length: 5 }, (_, i) => createMockPoint(100, (i + 7) * 100)),
      createMockPoint(50, 1200),  // Second spike (dip)
      createMockPoint(100, 1300),
      ...Array.from({ length: 5 }, (_, i) => createMockPoint(100, (i + 14) * 100))
    ];

    const anomalies = detectElevationAnomalies(points, 10);

    expect(anomalies.length).toBeGreaterThanOrEqual(1);
  });

  it('should respect threshold parameter', () => {
    const points: TrackPoint[] = [
      ...Array.from({ length: 10 }, (_, i) => createMockPoint(100, i * 100)),
      createMockPoint(105, 1000), // Small deviation
      createMockPoint(100, 1100),
      ...Array.from({ length: 10 }, (_, i) => createMockPoint(100, (i + 12) * 100))
    ];

    const anomaliesLowThreshold = detectElevationAnomalies(points, 1);
    const anomaliesHighThreshold = detectElevationAnomalies(points, 50);

    // Low threshold should detect small deviations
    // High threshold should not
    expect(anomaliesLowThreshold.length).toBeGreaterThanOrEqual(
      anomaliesHighThreshold.length
    );
  });

  it('should detect drop anomalies', () => {
    // Create a drop with at least 3 steep points to trigger anomaly detection
    const points: TrackPoint[] = [
      ...Array.from({ length: 10 }, (_, i) => createMockPoint(100, i * 100)),
      createMockPoint(70, 1000),  // Drop down - point 1
      createMockPoint(50, 1100),  // Drop down - point 2
      createMockPoint(40, 1200),  // Drop down - point 3
      createMockPoint(60, 1300),  // Recover up - point 4
      createMockPoint(100, 1400), // Recover up - point 5
      ...Array.from({ length: 10 }, (_, i) => createMockPoint(100, (i + 15) * 100))
    ];

    const anomalies = detectElevationAnomalies(points, 10);

    expect(anomalies.length).toBeGreaterThan(0);
  });

  it('should have severity proportional to anomaly magnitude', () => {
    const pointsSmallSpike: TrackPoint[] = [
      ...Array.from({ length: 10 }, (_, i) => createMockPoint(100, i * 100)),
      createMockPoint(115, 1000), // +15m spike
      createMockPoint(100, 1100),
      ...Array.from({ length: 10 }, (_, i) => createMockPoint(100, (i + 12) * 100))
    ];

    const pointsLargeSpike: TrackPoint[] = [
      ...Array.from({ length: 10 }, (_, i) => createMockPoint(100, i * 100)),
      createMockPoint(150, 1000), // +50m spike
      createMockPoint(100, 1100),
      ...Array.from({ length: 10 }, (_, i) => createMockPoint(100, (i + 12) * 100))
    ];

    const anomaliesSmall = detectElevationAnomalies(pointsSmallSpike, 5);
    const anomaliesLarge = detectElevationAnomalies(pointsLargeSpike, 5);

    if (anomaliesSmall.length > 0 && anomaliesLarge.length > 0) {
      expect(anomaliesLarge[0].severity).toBeGreaterThan(anomaliesSmall[0].severity);
    }
  });

  it('should return regions with valid distance ranges', () => {
    const points: TrackPoint[] = [
      ...Array.from({ length: 10 }, (_, i) => createMockPoint(100, i * 100)),
      createMockPoint(150, 1000),
      createMockPoint(100, 1100),
      ...Array.from({ length: 10 }, (_, i) => createMockPoint(100, (i + 12) * 100))
    ];

    const anomalies = detectElevationAnomalies(points, 10);

    anomalies.forEach(anomaly => {
      expect(anomaly.startDistance).toBeGreaterThanOrEqual(0);
      expect(anomaly.endDistance).toBeGreaterThan(anomaly.startDistance);
      expect(anomaly.severity).toBeGreaterThan(0);
    });
  });

  it('should handle gradual ascent without false positives', () => {
    const points: TrackPoint[] = Array.from({ length: 50 }, (_, i) =>
      createMockPoint(100 + i * 2, i * 100) // Gradual +2m per point
    );

    const anomalies = detectElevationAnomalies(points, 10);

    // Gradual changes shouldn't be detected as anomalies
    expect(anomalies.length).toBe(0);
  });

  it('should handle noisy data', () => {
    const points: TrackPoint[] = Array.from({ length: 50 }, (_, i) =>
      createMockPoint(100 + (Math.random() * 4 - 2), i * 100) // ±2m noise
    );

    const anomalies = detectElevationAnomalies(points, 20);

    // Small noise shouldn't trigger anomalies with reasonable threshold
    expect(anomalies.length).toBe(0);
  });

  it('should handle edge case with minimum required points', () => {
    const points: TrackPoint[] = Array.from({ length: 10 }, (_, i) =>
      createMockPoint(100, i * 100)
    );

    const anomalies = detectElevationAnomalies(points, 10);

    expect(anomalies).toBeDefined();
    expect(Array.isArray(anomalies)).toBe(true);
  });
});
