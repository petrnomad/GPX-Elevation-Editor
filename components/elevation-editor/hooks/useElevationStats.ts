/**
 * Custom hook for calculating elevation statistics
 */

import { useMemo } from 'react';
import { TrackPoint } from '@/lib/gpx-parser';
import { ElevationStats } from '../types';
import { calculateElevationStats } from '../algorithms/statistics';

/**
 * Calculates elevation statistics from track points
 *
 * This hook memoizes the statistics calculation to avoid recomputing
 * on every render. It recalculates only when track points, total distance,
 * or edited points count changes.
 *
 * @param trackPoints - Array of track points with elevation data
 * @param totalDistance - Total distance of the route
 * @param editedCount - Number of points that have been edited
 * @returns Elevation statistics object
 */
export function useElevationStats(
  trackPoints: TrackPoint[],
  totalDistance: number,
  editedCount: number
): ElevationStats {
  return useMemo(
    () => calculateElevationStats(trackPoints, totalDistance, editedCount),
    [trackPoints, totalDistance, editedCount]
  );
}
