/**
 * Anomaly detection algorithm for elevation profiles
 */

import { TrackPoint } from '@/lib/gpx-parser';
import { AnomalyRegion } from '../types';

/**
 * Detects elevation anomalies in a GPX track based on gradient and elevation change thresholds
 *
 * This algorithm identifies regions with unusually steep gradients or large elevation changes
 * that may indicate GPS errors or data anomalies.
 *
 * @param trackPoints - Array of track points with elevation and distance data
 * @param threshold - Minimum elevation change (in meters) to consider as anomalous
 * @returns Array of anomaly regions with start/end distances and severity scores
 */
export const detectElevationAnomalies = (trackPoints: TrackPoint[], threshold: number): AnomalyRegion[] => {
  if (trackPoints.length < 10) {
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

  // Also check for absolute elevation changes (detect sudden jumps)
  const elevationChanges: number[] = [];
  for (let i = 1; i < elevations.length; i++) {
    elevationChanges.push(Math.abs(elevations[i] - elevations[i - 1]));
  }

  // Find steep sections
  // For high thresholds (>= 50m), only detect large elevation changes
  // For low thresholds (< 50m), also consider gradient (for detecting GPS errors on gentle slopes)
  const isSteep: boolean[] = [false]; // First point has no gradient
  const useGradientCheck = threshold < 50;

  for (let i = 0; i < gradients.length; i++) {
    const hasLargeElevationChange = elevationChanges[i] >= threshold;

    if (useGradientCheck) {
      // Low threshold: detect either high gradient OR large elevation change
      const hasHighGradient = gradients[i] > gradientThreshold;
      isSteep.push(hasHighGradient || hasLargeElevationChange);
    } else {
      // High threshold: only detect large elevation changes
      isSteep.push(hasLargeElevationChange);
    }
  }


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
        // Start new region - go back slightly to capture the full anomaly
        regionStart = Math.max(0, i - 1);
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
        // Gap too large, end the region - extend forward slightly to capture the full anomaly
        regionEnd = Math.min(trackPoints.length - 1, regionEnd! + 1);

        if (steepPointsInRegion >= 3) { // At least 3 steep points (increased from 2)
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
    regionEnd = Math.min(trackPoints.length - 1, regionEnd + 1);
    regions.push({
      startDistance: distances[regionStart],
      endDistance: distances[regionEnd],
      severity: maxSeverity
    });
  }

  return regions;
};
