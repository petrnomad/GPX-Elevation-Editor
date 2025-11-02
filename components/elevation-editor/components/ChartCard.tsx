/**
 * Chart card component containing the elevation profile and map
 */

import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TrackPoint } from '@/lib/gpx-parser';
import { ChartDataPoint, AnomalyRegion, ElevationStats, AnomalyButtonOffset, UnitSystem } from '../types';
import { ChartControls } from './ChartControls';
import { MobileWarning } from './MobileWarning';
import { ElevationChart } from './ElevationChart';

const ElevationMap = dynamic<{
  points: Array<{ lat: number; lon: number }>;
  hoveredPointIndex?: number | null;
}>(
  () => import('@/components/elevation-map').then((mod) => mod.ElevationMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 w-full rounded-md bg-slate-100 animate-pulse" aria-label="Loading map" />
    )
  }
);

interface ChartCardProps {
  // Data
  chartData: ChartDataPoint[];
  originalChartData: ChartDataPoint[];
  trackPoints: TrackPoint[];
  stats: ElevationStats;
  editedPoints: Set<number>;

  // State
  isMobile: boolean;
  unitSystem: UnitSystem;
  showOriginal: boolean;
  showAnomalies: boolean;
  showMap: boolean;
  showMobileWarning: boolean;
  zoomDomain: [number, number] | null;
  anomalyRegions: AnomalyRegion[];
  anomalyButtonOffsets: Record<number, AnomalyButtonOffset>;
  hoveredPointIndex: number | null;
  hoveredAnomalyIndex: number | null;
  mapKey: number;
  chartContainerRef: React.RefObject<HTMLDivElement | null>;

  // Unit conversion
  convertDistance: (meters: number) => number;
  convertElevation: (meters: number) => number;
  distanceUnitLabel: string;
  elevationUnitLabel: string;

  // Event handlers
  onUnitSystemChange: (system: UnitSystem) => void;
  onToggleOriginal: () => void;
  onToggleAnomalies: () => void;
  onToggleMap: () => void;
  onDismissMobileWarning: () => void;
  onChartMouseDown: (e: any) => void;
  onChartMouseMove: (e: any) => void;
  onChartMouseUp: () => void;
  onChartMouseLeave: () => void;
  onIgnoreAnomaly: (index: number) => void;
  onHoverAnomalyChange: (index: number | null) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onPanLeft: () => void;
  onPanRight: () => void;
}

/**
 * Complete chart card with controls, chart, and optional map
 */
export function ChartCard({
  chartData,
  originalChartData,
  trackPoints,
  stats,
  editedPoints,
  isMobile,
  unitSystem,
  showOriginal,
  showAnomalies,
  showMap,
  showMobileWarning,
  zoomDomain,
  anomalyRegions,
  anomalyButtonOffsets,
  hoveredPointIndex,
  hoveredAnomalyIndex,
  mapKey,
  chartContainerRef,
  convertDistance,
  convertElevation,
  distanceUnitLabel,
  elevationUnitLabel,
  onUnitSystemChange,
  onToggleOriginal,
  onToggleAnomalies,
  onToggleMap,
  onDismissMobileWarning,
  onChartMouseDown,
  onChartMouseMove,
  onChartMouseUp,
  onChartMouseLeave,
  onIgnoreAnomaly,
  onHoverAnomalyChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onPanLeft,
  onPanRight
}: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <ChartControls
          unitSystem={unitSystem}
          showOriginal={showOriginal}
          showAnomalies={showAnomalies}
          showMap={showMap}
          anomalyCount={anomalyRegions.length}
          editedCount={stats.editedCount}
          onUnitSystemChange={onUnitSystemChange}
          onToggleOriginal={onToggleOriginal}
          onToggleAnomalies={onToggleAnomalies}
          onToggleMap={onToggleMap}
        />
      </CardHeader>

      {isMobile && showMobileWarning && (
        <MobileWarning show={showMobileWarning} onDismiss={onDismissMobileWarning} />
      )}

      <CardContent>
        <div className={showMap ? 'grid gap-4 lg:grid-cols-2' : ''}>
          <ElevationChart
            chartData={chartData}
            originalChartData={originalChartData}
            trackPoints={trackPoints}
            stats={stats}
            editedPoints={editedPoints}
            isMobile={isMobile}
            zoomDomain={zoomDomain}
            showOriginal={showOriginal}
            showAnomalies={showAnomalies}
            anomalyRegions={anomalyRegions}
            anomalyButtonOffsets={anomalyButtonOffsets}
            hoveredAnomalyIndex={hoveredAnomalyIndex}
            chartContainerRef={chartContainerRef}
            convertDistance={convertDistance}
            convertElevation={convertElevation}
            distanceUnitLabel={distanceUnitLabel}
            elevationUnitLabel={elevationUnitLabel}
            onChartMouseDown={onChartMouseDown}
            onChartMouseMove={onChartMouseMove}
            onChartMouseUp={onChartMouseUp}
            onChartMouseLeave={onChartMouseLeave}
            onIgnoreAnomaly={onIgnoreAnomaly}
            onHoverAnomalyChange={onHoverAnomalyChange}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onResetZoom={onResetZoom}
            onPanLeft={onPanLeft}
            onPanRight={onPanRight}
          />

          {showMap && (
            <div
              className="flex flex-col gap-2"
              key={`map-container-${mapKey}`}
              style={{ isolation: 'isolate' }}
            >
              <ElevationMap
                key={`elevation-map-${mapKey}`}
                points={trackPoints}
                hoveredPointIndex={hoveredPointIndex}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
