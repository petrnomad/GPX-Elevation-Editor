/**
 * Statistics calculation for elevation profiles
 */

import { TrackPoint } from '@/lib/gpx-parser';
import { ElevationStats } from '../types';
import { computeRollingMedian } from '../utils/math';
import { parseTimestamp } from '../utils/date-time';
import { MEDIAN_WINDOW_SIZE, ELEVATION_STEP_THRESHOLD } from '../constants';

/**
 * Calculates comprehensive statistics for an elevation profile
 *
 * Computes min/max elevation, total ascent/descent (with median smoothing to reduce GPS noise),
 * duration, average speed, and max speed from the track points.
 *
 * @param trackPoints - Array of track points with elevation, distance, and time data
 * @param totalDistance - Total distance of the route (from GPX metadata)
 * @param editedCount - Number of points that have been manually edited
 * @returns Complete elevation statistics
 */
export const calculateElevationStats = (
  trackPoints: TrackPoint[],
  totalDistance: number,
  editedCount: number
): ElevationStats => {
  const rawElevations = trackPoints.map(point => point.ele);
  const smoothedElevations = computeRollingMedian(rawElevations, MEDIAN_WINDOW_SIZE);

  const minEle = Math.min(...rawElevations);
  const maxEle = Math.max(...rawElevations);
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
    totalDistance,
    editedCount,
    totalDurationMs,
    averageSpeed,
    maxSpeed: maxSegmentSpeed
  };
};
