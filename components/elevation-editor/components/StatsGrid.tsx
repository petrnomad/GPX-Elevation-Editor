/**
 * Statistics grid component
 */

import { ElevationStats } from '../types';
import { formatDuration } from '../utils/date-time';
import { StatsCard } from './StatsCard';

interface StatsGridProps {
  stats: ElevationStats;
  convertDistance: (meters: number) => number;
  convertElevation: (meters: number) => number;
  convertSpeed: (metersPerSecond: number) => number;
  distanceUnitLabel: string;
  elevationUnitLabel: string;
  speedUnitLabel: string;
}

/**
 * Grid of statistics cards displaying GPX data metrics
 */
export function StatsGrid({
  stats,
  convertDistance,
  convertElevation,
  convertSpeed,
  distanceUnitLabel,
  elevationUnitLabel,
  speedUnitLabel
}: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 md:gap-4">
      <StatsCard
        label="Distance"
        value={`${convertDistance(stats.totalDistance).toFixed(1)} ${distanceUnitLabel}`}
      />
      <StatsCard
        label="Lowest Point"
        value={`${Math.round(convertElevation(stats.minElevation))} ${elevationUnitLabel}`}
      />
      <StatsCard
        label="Highest Point"
        value={`${Math.round(convertElevation(stats.maxElevation))} ${elevationUnitLabel}`}
      />
      <StatsCard
        label="Total Ascent"
        value={`${Math.round(convertElevation(stats.totalAscent))} ${elevationUnitLabel}`}
      />
      <StatsCard
        label="Total Descent"
        value={`${Math.round(convertElevation(stats.totalDescent))} ${elevationUnitLabel}`}
      />
      <StatsCard
        label="Total Time"
        value={
          stats.totalDurationMs && stats.totalDurationMs > 0
            ? formatDuration(stats.totalDurationMs)
            : '—'
        }
      />
      <StatsCard
        label="Avg Speed"
        value={
          stats.averageSpeed != null
            ? `${convertSpeed(stats.averageSpeed).toFixed(1)} ${speedUnitLabel}`
            : '—'
        }
      />
      <StatsCard
        label="Max Speed"
        value={
          stats.maxSpeed != null
            ? `${convertSpeed(stats.maxSpeed).toFixed(1)} ${speedUnitLabel}`
            : '—'
        }
      />
    </div>
  );
}
