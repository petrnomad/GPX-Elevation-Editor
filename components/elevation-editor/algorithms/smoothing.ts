/**
 * Smoothing algorithms for elevation profile editing
 */

import { TrackPoint } from '@/lib/gpx-parser';

/**
 * Applies a smooth transition when dragging a point to change elevation
 *
 * This algorithm modifies the target point and applies a gradual blend effect
 * to neighboring points based on distance (radius) and strength parameters.
 *
 * @param sourcePoints - Original array of track points
 * @param targetIndex - Index of the point being edited
 * @param newElevation - New elevation value for the target point
 * @param radius - Number of points on each side to affect
 * @param strength - Strength of the smoothing effect (0-1)
 * @returns New array of track points with smoothed elevations
 */
export const applySmoothTransition = (
  sourcePoints: TrackPoint[],
  targetIndex: number,
  newElevation: number,
  radius: number,
  strength: number
): TrackPoint[] => {
  const effectiveRadius = Math.max(0, Math.round(radius));
  const clampedStrength = Math.min(Math.max(strength, 0), 1);
  const clampedElevation = Math.max(0, newElevation);
  const newPoints = sourcePoints.map((point, index) =>
    index === targetIndex ? { ...point, ele: clampedElevation } : { ...point }
  );

  if (effectiveRadius === 0 || clampedStrength === 0) {
    return newPoints;
  }

  const denominator = effectiveRadius + 1;

  for (let offset = 1; offset <= effectiveRadius; offset++) {
    const distanceFactor = Math.max(0, 1 - offset / denominator);
    const influence = clampedStrength * distanceFactor;
    if (influence <= 0) {
      continue;
    }

    const leftIndex = targetIndex - offset;
    if (leftIndex >= 0) {
      const baseline = sourcePoints[leftIndex].ele;
      const blended = baseline + (clampedElevation - baseline) * influence;
      newPoints[leftIndex] = { ...newPoints[leftIndex], ele: Math.max(0, blended) };
    }

    const rightIndex = targetIndex + offset;
    if (rightIndex < sourcePoints.length) {
      const baseline = sourcePoints[rightIndex].ele;
      const blended = baseline + (clampedElevation - baseline) * influence;
      newPoints[rightIndex] = { ...newPoints[rightIndex], ele: Math.max(0, blended) };
    }
  }

  return newPoints;
};

/**
 * Applies click-based smoothing by averaging elevations within a radius
 *
 * This algorithm computes the average elevation within the radius and blends
 * each point toward that average based on its distance from the target.
 *
 * @param sourcePoints - Original array of track points
 * @param targetIndex - Index of the clicked point
 * @param radius - Number of points on each side to affect
 * @param strength - Strength of the smoothing effect (0-1)
 * @returns New array of track points with smoothed elevations
 */
export const applyClickSmoothing = (
  sourcePoints: TrackPoint[],
  targetIndex: number,
  radius: number,
  strength: number
): TrackPoint[] => {
  const effectiveRadius = Math.max(0, Math.round(radius));
  const clampedStrength = Math.min(Math.max(strength, 0), 1);
  if (clampedStrength === 0) {
    return sourcePoints.map(point => ({ ...point }));
  }

  const start = Math.max(0, targetIndex - effectiveRadius);
  const end = Math.min(sourcePoints.length - 1, targetIndex + effectiveRadius);
  const window = sourcePoints.slice(start, end + 1);
  if (window.length === 0) {
    return sourcePoints.map(point => ({ ...point }));
  }

  const average = window.reduce((sum, point) => sum + point.ele, 0) / window.length;
  const newPoints = sourcePoints.map(point => ({ ...point }));

  for (let index = start; index <= end; index++) {
    const distance = Math.abs(index - targetIndex);
    let influence = 0;

    if (effectiveRadius === 0) {
      influence = distance === 0 ? clampedStrength : 0;
    } else {
      const distanceFactor = Math.max(0, 1 - distance / (effectiveRadius + 1));
      influence = clampedStrength * distanceFactor;
    }

    if (influence <= 0) {
      continue;
    }

    const currentEle = sourcePoints[index].ele;
    const smoothedEle = currentEle + (average - currentEle) * influence;
    newPoints[index] = { ...newPoints[index], ele: Math.max(0, smoothedEle) };
  }

  return newPoints;
};
